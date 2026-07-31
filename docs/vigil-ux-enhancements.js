(() => {
  "use strict";

  const STYLE_ID = "vigil-ux-readability-styles";
  const COMPLETE_CHAIN_BADGE = "data-vigil-complete-chain-badge";
  const TAXONOMY_CLONE = "data-vigil-taxonomy-clone";
  const TAXONOMY_ORIGINAL = "data-vigil-taxonomy-original";
  const CARD_SUMMARY = "data-vigil-card-summary";
  const DETAIL_CARD = "data-vigil-learn-detail-card";
  const LEARN_STAGE = "data-vigil-learn-stage";
  const RECORD_ID_PATTERN = /VIGIL-\d{4}-(?:OBS|FM|PROP|PATCH|RESEARCH)-\d{4}/gi;
  const LEARN_ID_PATTERN = /VIGIL-\d{4}-LEARN-\d{4}/i;
  const LEARN_REGISTRY_URL = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Learn.Index.json";

  let learnMapPromise;
  let animationFrame = 0;

  function text(value) { return typeof value === "string" ? value.trim() : ""; }
  function valueAt(record, path) { return path.split(".").reduce((current, part) => Array.isArray(current) && /^\d+$/.test(part) ? current[Number(part)] : current && typeof current === "object" ? current[part] : undefined, record); }
  function firstValue(record, paths) { for (const path of paths) { const value = valueAt(record, path); if (value !== undefined && value !== null && value !== "") return value; } }
  function idsFrom(value) { if (typeof value === "string") return value.match(RECORD_ID_PATTERN) ?? []; if (Array.isArray(value)) return value.flatMap(idsFrom); if (value && typeof value === "object") return Object.values(value).flatMap(idsFrom); return []; }
  function registryRecords(payload) { if (Array.isArray(payload)) return payload; for (const key of ["records", "learn_records", "items"]) if (Array.isArray(payload?.[key])) return payload[key]; return []; }

  async function fetchRegistry(url) {
    const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`VIGIL registry returned ${response.status}`);
    return response.json();
  }

  function buildLearnMap(records) {
    const byChainId = new Map();
    const byLearnId = new Map();
    for (const record of records) {
      const learnId = text(firstValue(record, ["id", "record_id", "record_identity.record_id"])).toUpperCase();
      if (!LEARN_ID_PATTERN.test(learnId)) continue;
      const taxonomy = Array.isArray(record.failure_taxonomy_links) ? record.failure_taxonomy_links[0] : undefined;
      const entry = {
        id: learnId,
        title: text(firstValue(record, ["report_title", "record_identity.title", "title"])),
        summary: text(record.summary),
        chainState: text(firstValue(record, ["chain_state", "chain_completion.overall_status"])).toLowerCase(),
        taxonomy,
      };
      byLearnId.set(learnId, entry);
      const fields = [record.learning_basis, record.linked_records, record.failure_taxonomy_links, record.primary_failure_mode, record.establishing_patch_id];
      for (const id of fields.flatMap(idsFrom)) byChainId.set(id.toUpperCase(), entry);
    }
    return { byChainId, byLearnId };
  }

  function loadLearnMap() {
    if (!learnMapPromise) {
      const fallback = `${document.baseURI.replace(/[^/]*$/, "")}data/vigil-registry-fallback.json`;
      learnMapPromise = fetchRegistry(LEARN_REGISTRY_URL).catch(() => fetchRegistry(fallback)).then((payload) => buildLearnMap(registryRecords(payload))).catch(() => ({ byChainId: new Map(), byLearnId: new Map() }));
    }
    return learnMapPromise;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      main[data-vigil-learn-readable] .report-label,
      main[data-vigil-learn-readable] [class~="text-xs"],
      main[data-vigil-learn-readable] [class*="text-[11px]"] { font-size:.875rem!important; line-height:1.35rem!important; letter-spacing:.08em!important; }
      main[data-vigil-learn-readable] aside [class~="text-sm"], main[data-vigil-learn-readable] aside input, main[data-vigil-learn-readable] aside select, main[data-vigil-learn-readable] aside button { font-size:1rem!important; line-height:1.5rem!important; }
      main[data-vigil-learn-readable] article [class~="text-base"], main[data-vigil-learn-readable] section.cam-parchment-card>div[class*="text-base"] { font-size:1.0625rem!important; line-height:1.75rem!important; }
      [${COMPLETE_CHAIN_BADGE}] { font-family:Inter,system-ui,sans-serif; font-size:.8125rem; line-height:1.15rem; position:absolute; right:1rem; top:.65rem; z-index:2; }
      [${DETAIL_CARD}] { overflow:hidden; border:1px solid hsl(38 30% 78%); border-radius:1.5rem; background:hsl(40 48% 97%); box-shadow:0 12px 28px rgb(63 42 20 / .08); }
      [${DETAIL_CARD}]>header { padding:1.75rem 2rem; border-bottom:1px solid hsl(38 25% 82%); }
      [${DETAIL_CARD}]>section.cam-parchment-card { margin:0; border:0; border-top:1px solid hsl(38 25% 84%); border-radius:0; background:transparent; box-shadow:none; padding:1.6rem 2rem; }
      [${DETAIL_CARD}]>[data-vigil-detail-actions] { padding:0 2rem 1.75rem; }
      [${DETAIL_CARD}] [${TAXONOMY_CLONE}] { margin-top:1.25rem!important; padding:1rem 1.1rem!important; border-radius:1rem!important; background:hsl(38 48% 94%)!important; }
      article[data-vigil-condensed-card] .mt-6.space-y-6, article[data-vigil-condensed-card]>div>div.mt-5.flex.flex-wrap.gap-2 { display:none!important; }
      article[data-vigil-condensed-card] [${CARD_SUMMARY}] { margin-top:1rem; font-size:1rem; line-height:1.65rem; color:hsl(var(--foreground)/.78); }
      article[data-vigil-condensed-card] [${TAXONOMY_CLONE}] { margin-top:1rem!important; padding:.85rem 1rem!important; }
      [${LEARN_STAGE}] a { text-decoration:none; }
    `;
    document.head.appendChild(style);
  }

  function labelText(element) { return text(element?.textContent).toLowerCase(); }
  function cloneTaxonomyBlock(source) {
    const clone = source.cloneNode(true);
    clone.setAttribute(TAXONOMY_CLONE, "true");
    clone.removeAttribute(TAXONOMY_ORIGINAL);
    clone.hidden = false;
    clone.style.display = "";
    clone.classList.remove("mt-6");
    clone.classList.add("mt-4");
    return clone;
  }

  function placeCardTaxonomy(card) {
    if (card.querySelector(`[${TAXONOMY_CLONE}]`)) return;
    const label = [...card.querySelectorAll(".report-label")].find((node) => labelText(node) === "failure taxonomy" || labelText(node) === "failure class");
    const source = label?.parentElement;
    const title = card.querySelector("h3");
    if (!source || !title) return;
    const clone = cloneTaxonomyBlock(source);
    const subtitle = title.nextElementSibling?.tagName === "P" ? title.nextElementSibling : title;
    subtitle.insertAdjacentElement("afterend", clone);
    source.setAttribute(TAXONOMY_ORIGINAL, "true");
    source.hidden = true;
  }

  function condenseKnowledgeCards(main, map) {
    main.querySelectorAll('section[aria-label="Published VIGIL lessons"] article').forEach((card) => {
      card.setAttribute("data-vigil-condensed-card", "true");
      placeCardTaxonomy(card);
      if (card.querySelector(`[${CARD_SUMMARY}]`)) return;
      const id = card.textContent?.match(LEARN_ID_PATTERN)?.[0]?.toUpperCase();
      const summary = id ? map.byLearnId.get(id)?.summary : "";
      const title = card.querySelector("h3");
      const subtitle = title?.nextElementSibling?.tagName === "P" ? title.nextElementSibling : title;
      if (summary && subtitle) {
        const paragraph = document.createElement("p");
        paragraph.setAttribute(CARD_SUMMARY, "true");
        paragraph.textContent = summary;
        const taxonomy = card.querySelector(`[${TAXONOMY_CLONE}]`);
        (taxonomy ?? subtitle).insertAdjacentElement("afterend", paragraph);
      }
    });
  }

  function buildDetailCard(main) {
    if (main.querySelector(`[${DETAIL_CARD}]`)) return;
    const inner = [...main.querySelectorAll("div.space-y-6")].find((node) => node.querySelector(":scope > header"));
    if (!inner) return;
    const header = inner.querySelector(":scope > header");
    if (!header) return;
    const article = document.createElement("article");
    article.setAttribute(DETAIL_CARD, "true");
    header.parentElement.insertBefore(article, header);
    let node = header;
    while (node) {
      const next = node.nextElementSibling;
      article.appendChild(node);
      node = next;
    }
    const actions = header.querySelector("div.mt-6.flex, div[class*='mt-6'][class*='flex']");
    if (actions) actions.setAttribute("data-vigil-detail-actions", "true");
  }

  function placeDetailTaxonomy(main) {
    const article = main.querySelector(`[${DETAIL_CARD}]`);
    const header = article?.querySelector(":scope > header");
    if (!header || header.querySelector(`[${TAXONOMY_CLONE}]`)) return;
    const heading = [...article.querySelectorAll("section h2")].find((node) => ["failure taxonomy", "failure class"].includes(labelText(node)));
    const source = heading?.closest("section");
    if (!source) return;
    const clone = cloneTaxonomyBlock(source);
    const actions = header.querySelector("[data-vigil-detail-actions]");
    if (actions) header.insertBefore(clone, actions); else header.appendChild(clone);
    source.setAttribute(TAXONOMY_ORIGINAL, "true");
    source.hidden = true;
  }

  async function enhanceKnowledgeBase() {
    if (!location.pathname.includes("/observatory/knowledge-base")) return;
    const main = document.querySelector("#root main");
    if (!main) return;
    main.setAttribute("data-vigil-learn-readable", "true");
    injectStyles();
    const map = await loadLearnMap();
    const listing = main.querySelector('section[aria-label="Published VIGIL lessons"]');
    if (listing) condenseKnowledgeCards(main, map);
    else { buildDetailCard(main); placeDetailTaxonomy(main); }
  }

  function removeEmbeddedPolicyViewers() {
    if (!location.pathname.includes("/policy")) return;
    document.querySelectorAll('iframe[src*="/publications/"], iframe[title*="CAM Initiative"]').forEach((iframe) => iframe.parentElement?.remove());
  }

  function makeCompleteBadge() {
    const row = document.createElement("div");
    row.setAttribute(COMPLETE_CHAIN_BADGE, "true");
    const badge = document.createElement("span");
    badge.className = "inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 font-semibold text-blue-950";
    badge.title = "This record belongs to a completed evidence-to-repair-and-learning chain.";
    badge.innerHTML = '<span aria-hidden="true">✓</span><span>Complete evidence chain</span>';
    row.appendChild(badge);
    return row;
  }

  async function markCompleteCollapsedChains() {
    if (!location.pathname.includes("/observatory") || location.pathname.includes("/knowledge-base") || location.pathname.includes("/reports/")) return;
    const map = await loadLearnMap();
    for (const card of document.querySelectorAll("article.vigil-record-card")) {
      if (card.querySelector(".vigil-detail-surface")) continue;
      const id = card.id.replace(/^vigil-record-/, "").toUpperCase();
      const collapsed = card.querySelector(':scope > div[role="button"]');
      const existing = card.querySelector(`[${COMPLETE_CHAIN_BADGE}]`);
      const complete = map.byChainId.get(id)?.chainState === "complete";
      if (complete && collapsed && !existing) { collapsed.style.position = "relative"; collapsed.appendChild(makeCompleteBadge()); }
      if (!complete && existing) existing.remove();
    }
  }

  async function appendLearnStage() {
    if (!location.pathname.includes("/observatory") || location.pathname.includes("/knowledge-base") || location.pathname.includes("/reports/")) return;
    const map = await loadLearnMap();
    const chainLabels = [...document.querySelectorAll("p")].filter((node) => labelText(node) === "evidence-to-repair record chain");
    for (const label of chainLabels) {
      const container = label.closest("div.rounded-xl");
      const grid = container?.querySelector("div.mt-3.grid");
      if (!grid || grid.querySelector(`[${LEARN_STAGE}]`)) continue;
      const currentId = container.closest("article")?.id.replace(/^vigil-record-/, "").toUpperCase();
      const learn = currentId ? map.byChainId.get(currentId) : undefined;
      if (!learn) continue;
      grid.style.gridTemplateColumns = "repeat(5,minmax(0,1fr))";
      const stage = document.createElement("div");
      stage.setAttribute(LEARN_STAGE, "true");
      stage.className = "relative rounded-lg border border-blue-300 bg-blue-50 p-3 shadow-sm";
      stage.innerHTML = `<p class="font-mono text-[10px] uppercase tracking-[0.14em] text-blue-900">Learn</p><a class="mt-2 block font-serif text-sm leading-snug text-blue-950 hover:underline" href="/observatory/knowledge-base/${encodeURIComponent(learn.id)}">${learn.id}</a>${learn.title ? `<p class="mt-1 text-xs leading-relaxed text-blue-900">${learn.title}</p>` : ""}`;
      grid.appendChild(stage);
    }
  }

  function enhance() {
    injectStyles();
    removeEmbeddedPolicyViewers();
    void enhanceKnowledgeBase();
    void markCompleteCollapsedChains();
    void appendLearnStage();
  }

  function scheduleEnhancement() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => { animationFrame = 0; enhance(); });
  }

  new MutationObserver(scheduleEnhancement).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener("popstate", scheduleEnhancement);
  document.addEventListener("DOMContentLoaded", scheduleEnhancement, { once:true });
  scheduleEnhancement();
})();
