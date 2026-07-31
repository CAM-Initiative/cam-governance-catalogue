(() => {
  "use strict";

  const STYLE_ID = "vigil-ux-readability-styles";
  const COMPLETE_CHAIN_BADGE = "data-vigil-complete-chain-badge";
  const TAXONOMY_CLONE = "data-vigil-taxonomy-clone";
  const TAXONOMY_ORIGINAL = "data-vigil-taxonomy-original";
  const RECORD_ID_PATTERN = /VIGIL-\d{4}-(?:OBS|FM|PROP|PATCH|RESEARCH)-\d{4}/gi;

  let completeChainIdsPromise;
  let animationFrame = 0;

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function valueAt(record, path) {
    return path.split(".").reduce((current, part) => {
      if (Array.isArray(current) && /^\d+$/.test(part)) return current[Number(part)];
      return current && typeof current === "object" ? current[part] : undefined;
    }, record);
  }

  function firstValue(record, paths) {
    for (const path of paths) {
      const value = valueAt(record, path);
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
  }

  function idsFrom(value) {
    if (typeof value === "string") return value.match(RECORD_ID_PATTERN) ?? [];
    if (Array.isArray(value)) return value.flatMap(idsFrom);
    if (value && typeof value === "object") return Object.values(value).flatMap(idsFrom);
    return [];
  }

  function registryRecords(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.records)) return payload.records;
    if (payload && Array.isArray(payload.items)) return payload.items;
    return [];
  }

  function completeChainRecordIds(records) {
    const ids = new Set();
    for (const record of records) {
      const recordId = text(firstValue(record, ["id", "record_id", "record_identity.record_id"]));
      const recordType = text(firstValue(record, ["record_type", "record_identity.record_type"])).toLowerCase();
      if (recordType !== "learn" && !/-LEARN-/i.test(recordId)) continue;

      const chainState = text(firstValue(record, ["chain_state", "chain_completion.overall_status"])).toLowerCase();
      if (chainState !== "complete") continue;

      const declaredChainFields = [
        record.primary_failure_mode,
        record.learning_basis?.primary_failure_mode,
        record.establishing_patch_id,
        record.linked_records?.related_observations,
        record.linked_records?.related_failure_modes,
        record.linked_records?.related_proposals,
        record.linked_records?.related_patch_notes,
        record.failure_taxonomy_links?.map((link) => ({
          failure_record_id: link?.failure_record_id,
          establishing_patch_id: link?.establishing_patch_id,
        })),
      ];

      for (const id of declaredChainFields.flatMap(idsFrom)) ids.add(id.toUpperCase());
    }
    return ids;
  }

  async function loadCompleteChainIds() {
    if (!completeChainIdsPromise) {
      completeChainIdsPromise = fetch(`${document.baseURI.replace(/[^/]*$/, "")}data/vigil-registry-fallback.json`, { cache: "no-cache" })
        .then((response) => {
          if (!response.ok) throw new Error(`VIGIL registry returned ${response.status}`);
          return response.json();
        })
        .then((payload) => completeChainRecordIds(registryRecords(payload)))
        .catch(() => new Set());
    }
    return completeChainIdsPromise;
  }

  function injectReadabilityStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      main[data-vigil-learn-readable] .report-label,
      main[data-vigil-learn-readable] [class~="text-xs"],
      main[data-vigil-learn-readable] [class*="text-[11px]"] {
        font-size: 0.875rem !important;
        line-height: 1.35rem !important;
        letter-spacing: 0.08em !important;
      }

      main[data-vigil-learn-readable] aside [class~="text-sm"],
      main[data-vigil-learn-readable] aside input,
      main[data-vigil-learn-readable] aside select,
      main[data-vigil-learn-readable] aside button {
        font-size: 1rem !important;
        line-height: 1.5rem !important;
      }

      main[data-vigil-learn-readable] article [class~="text-base"],
      main[data-vigil-learn-readable] section.cam-parchment-card > div[class*="text-base"] {
        font-size: 1.0625rem !important;
        line-height: 1.75rem !important;
      }

      main[data-vigil-learn-readable] [${TAXONOMY_CLONE}] {
        margin-top: 1rem !important;
      }

      [${COMPLETE_CHAIN_BADGE}] {
        font-family: Inter, system-ui, sans-serif;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }
    `;
    document.head.appendChild(style);
  }

  function labelText(element) {
    return text(element?.textContent).toLowerCase();
  }

  function cloneTaxonomyBlock(source, compactHeading = false) {
    const clone = source.cloneNode(true);
    clone.setAttribute(TAXONOMY_CLONE, "true");
    clone.removeAttribute(TAXONOMY_ORIGINAL);
    clone.hidden = false;
    clone.style.display = "";
    clone.classList.remove("mt-6");
    clone.classList.add("mt-4");

    if (compactHeading) {
      const heading = [...clone.querySelectorAll("h1, h2, h3, p")]
        .find((element) => labelText(element) === "failure taxonomy");
      if (heading) {
        heading.className = "font-mono text-sm font-semibold uppercase tracking-[0.1em] text-cam-gold";
      }
    }
    return clone;
  }

  function placeCardTaxonomy(card) {
    if (card.querySelector(`[${TAXONOMY_CLONE}]`)) return;
    const taxonomyLabel = [...card.querySelectorAll(".report-label")]
      .find((element) => labelText(element) === "failure taxonomy");
    const source = taxonomyLabel?.parentElement;
    const title = card.querySelector("h3");
    if (!source || !title) return;

    const clone = cloneTaxonomyBlock(source);
    const possibleSubtitle = title.nextElementSibling;
    const anchor = possibleSubtitle?.tagName === "P" ? possibleSubtitle : title;
    anchor.insertAdjacentElement("afterend", clone);
    source.setAttribute(TAXONOMY_ORIGINAL, "true");
    source.hidden = true;
  }

  function placeDetailTaxonomy(main) {
    const header = main.querySelector("header");
    if (!header || header.querySelector(`[${TAXONOMY_CLONE}]`)) return;

    const taxonomyHeading = [...main.querySelectorAll("section h2")]
      .find((element) => labelText(element) === "failure taxonomy");
    const source = taxonomyHeading?.closest("section");
    if (!source || header.contains(source)) return;

    const clone = cloneTaxonomyBlock(source, true);
    const actions = [...header.children].find((element) => element.matches("div.mt-6.flex, div[class*='mt-6'][class*='flex']"));
    if (actions) header.insertBefore(clone, actions);
    else header.appendChild(clone);
    source.setAttribute(TAXONOMY_ORIGINAL, "true");
    source.hidden = true;
  }

  function enhanceKnowledgeBase() {
    const isKnowledgeBase = location.pathname.includes("/observatory/knowledge-base");
    if (!isKnowledgeBase) return;

    const main = document.querySelector("#root main");
    if (!main) return;
    main.setAttribute("data-vigil-learn-readable", "true");
    injectReadabilityStyles();

    main.querySelectorAll('section[aria-label="Published VIGIL lessons"] article').forEach(placeCardTaxonomy);
    if (!main.querySelector('section[aria-label="Published VIGIL lessons"]')) placeDetailTaxonomy(main);
  }

  function removeEmbeddedPolicyViewers() {
    if (!location.pathname.includes("/policy")) return;
    document.querySelectorAll('iframe[src*="/publications/"], iframe[title*="CAM Initiative"]')
      .forEach((iframe) => iframe.parentElement?.remove());
  }

  function makeCompleteBadge() {
    const row = document.createElement("div");
    row.setAttribute(COMPLETE_CHAIN_BADGE, "true");
    row.className = "mb-3 flex justify-end";

    const badge = document.createElement("span");
    badge.className = "inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 font-semibold text-blue-950";
    badge.title = "This record belongs to a LEARN record whose declared evidence-chain state is Complete.";
    badge.innerHTML = '<span aria-hidden="true">✓</span><span>Complete evidence chain</span>';
    row.appendChild(badge);
    return row;
  }

  async function markCompleteCollapsedChains() {
    if (!location.pathname.includes("/observatory") || location.pathname.includes("/knowledge-base") || location.pathname.includes("/reports/")) return;
    const cards = [...document.querySelectorAll("article.vigil-record-card")];
    if (!cards.length) return;

    const completeIds = await loadCompleteChainIds();
    for (const card of cards) {
      if (card.querySelector(".vigil-detail-surface")) continue;
      const recordId = card.id.replace(/^vigil-record-/, "").toUpperCase();
      const collapsedSurface = card.querySelector(':scope > div[role="button"]');
      const existing = card.querySelector(`[${COMPLETE_CHAIN_BADGE}]`);

      if (completeIds.has(recordId) && collapsedSurface && !existing) {
        collapsedSurface.insertBefore(makeCompleteBadge(), collapsedSurface.firstChild);
      } else if (!completeIds.has(recordId) && existing) {
        existing.remove();
      }
    }
  }

  function enhance() {
    removeEmbeddedPolicyViewers();
    enhanceKnowledgeBase();
    void markCompleteCollapsedChains();
  }

  function scheduleEnhancement() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
      animationFrame = 0;
      enhance();
    });
  }

  const observer = new MutationObserver(scheduleEnhancement);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", scheduleEnhancement);
  document.addEventListener("DOMContentLoaded", scheduleEnhancement, { once: true });
  scheduleEnhancement();
})();
