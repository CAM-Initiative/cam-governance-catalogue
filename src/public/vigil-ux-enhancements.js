(() => {
  "use strict";

  const STYLE_ID = "vigil-ux-readability-styles";
  const COMPLETE_CHAIN_BADGE = "data-vigil-complete-chain-badge";
  const LEARN_STAGE = "data-vigil-learn-stage";
  const REFERENCES_SECTION = "data-vigil-references-section";
  const RECORD_ID_PATTERN = /VIGIL-\d{4}-(?:OBS|FM|PROP|PATCH|RESEARCH)-\d{4}/gi;
  const LEARN_ID_PATTERN = /^VIGIL-\d{4}-LEARN-\d{4}$/i;
  const LEARN_REGISTRY_URL = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Learn.Index.json";

  let learnMapPromise;
  let animationFrame = 0;

  function text(value) { return typeof value === "string" ? value.trim() : ""; }
  function valueAt(record, path) { return path.split(".").reduce((current, part) => Array.isArray(current) && /^\d+$/.test(part) ? current[Number(part)] : current && typeof current === "object" ? current[part] : undefined, record); }
  function firstValue(record, paths) { for (const path of paths) { const value = valueAt(record, path); if (value !== undefined && value !== null && value !== "") return value; } }
  function idsFrom(value) { if (typeof value === "string") return value.match(RECORD_ID_PATTERN) ?? []; if (Array.isArray(value)) return value.flatMap(idsFrom); if (value && typeof value === "object") return Object.values(value).flatMap(idsFrom); return []; }
  function registryRecords(payload) { if (Array.isArray(payload)) return payload; for (const key of ["records", "learn_records", "items"]) if (Array.isArray(payload?.[key])) return payload[key]; return []; }
  function labelText(element) { return text(element?.textContent).toLowerCase(); }

  async function fetchRegistry(url) {
    const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`VIGIL registry returned ${response.status}`);
    return response.json();
  }

  function buildLearnMap(records) {
    const byChainId = new Map();
    for (const record of records) {
      const learnId = text(firstValue(record, ["id", "record_id", "record_identity.record_id"])).toUpperCase();
      if (!LEARN_ID_PATTERN.test(learnId)) continue;
      const entry = {
        id: learnId,
        title: text(firstValue(record, ["report_title", "record_identity.title", "title"])),
        chainState: text(firstValue(record, ["chain_state", "chain_completion.overall_status"])).toLowerCase(),
      };
      const fields = [record.learning_basis, record.linked_records, record.failure_taxonomy_links, record.primary_failure_mode, record.establishing_patch_id];
      for (const id of fields.flatMap(idsFrom)) byChainId.set(id.toUpperCase(), entry);
    }
    return byChainId;
  }

  function loadLearnMap() {
    if (!learnMapPromise) {
      const fallback = `${document.baseURI.replace(/[^/]*$/, "")}data/vigil-registry-fallback.json`;
      learnMapPromise = fetchRegistry(LEARN_REGISTRY_URL)
        .catch(() => fetchRegistry(fallback))
        .then((payload) => buildLearnMap(registryRecords(payload)))
        .catch(() => new Map());
    }
    return learnMapPromise;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      [${COMPLETE_CHAIN_BADGE}] { font-family:Inter,system-ui,sans-serif; }
      [${LEARN_STAGE}] a { text-decoration:none; }
      .vigil-case-stage-tabs { grid-template-columns:repeat(7,minmax(0,1fr)) !important; }
      [${REFERENCES_SECTION}].report-section-excluded { opacity:.58; }
      @media print { [${REFERENCES_SECTION}].report-section-excluded { display:none !important; } }
    `;
    document.head.appendChild(style);
  }

  function removeEmbeddedPolicyViewers() {
    if (!location.pathname.includes("/policy")) return;
    document.querySelectorAll('iframe[src*="/publications/"], iframe[title*="CAM Initiative"]').forEach((iframe) => iframe.parentElement?.remove());
  }

  function normalizeReferenceBackNavigation() {
    if (!location.pathname.includes("/observatory/knowledge-base/")) return;
    const page = document.querySelector(".vigil-reference-page");
    const hero = page?.querySelector(".vigil-reference-hero");
    const back = page?.querySelector(":scope > .container > .vigil-back-link");
    if (hero && back && back.parentElement !== hero) hero.prepend(back);
  }

  function normalizePublicDestinations() {
    if (location.pathname === "/" || location.pathname === "") {
      const vigilCard = [...document.querySelectorAll('a.home-governance-card[href="/observatory"]')]
        .find((link) => labelText(link).includes("vigil observatory"));
      if (vigilCard) vigilCard.setAttribute("href", "/observatory/cases");
    }
  }

  function normalizeCaseReferences() {
    const isCase = location.pathname.includes("/observatory/cases/") || location.pathname.includes("/observatory/failure-modes/") || /^\/vigil\//.test(location.pathname);
    if (!isCase) return;

    const nav = document.querySelector(".vigil-case-stage-nav");
    const tabs = nav?.querySelector(".vigil-case-stage-tabs");
    if (!nav || !tabs) return;

    const referenceButton = [...nav.querySelectorAll("button")].find((button) => {
      const label = labelText(button);
      return label === "sources & provenance" || label === "references" || label === "07references" || label === "07 references";
    });

    if (referenceButton) {
      const selected = referenceButton.getAttribute("aria-pressed") === "true" || referenceButton.getAttribute("aria-selected") === "true";
      referenceButton.className = selected ? "is-active" : "";
      referenceButton.setAttribute("role", "tab");
      referenceButton.setAttribute("aria-selected", selected ? "true" : "false");
      referenceButton.setAttribute("aria-controls", "case-panel-provenance");
      const currentLabel = labelText(referenceButton);
      if (currentLabel !== "07references" && currentLabel !== "07 references") referenceButton.innerHTML = "<span>07</span>References";
      if (referenceButton.parentElement !== tabs) tabs.appendChild(referenceButton);
    }

    for (const note of document.querySelectorAll(".vigil-case-empty")) {
      if (note.textContent?.includes("Sources & provenance")) note.textContent = note.textContent.replace("Sources & provenance", "References");
    }

    const panel = document.querySelector(".vigil-case-active-stage .vigil-case-section");
    const heading = panel?.querySelector("h2");
    if (heading && labelText(heading) === "sources & provenance") {
      heading.textContent = "References";
      const header = heading.closest("header");
      const headingBlock = heading.parentElement;
      if (header && headingBlock && !header.querySelector(":scope > span")) {
        const number = document.createElement("span");
        number.textContent = "07";
        header.insertBefore(number, headingBlock);
      }
      const description = headingBlock?.querySelector("p");
      if (description) description.textContent = "External evidence, canonical VIGIL record citations, and repair provenance supporting the Case File.";
    }
  }

  function normalizeReportReferences() {
    if (!location.pathname.includes("/observatory/reports/")) return;
    const citations = document.querySelector("section.report-citations");
    if (!citations || citations.hasAttribute(REFERENCES_SECTION)) return;

    const list = citations.querySelector("ol");
    const existingHeading = citations.querySelector("h2");
    if (!list) return;

    existingHeading?.remove();
    citations.setAttribute(REFERENCES_SECTION, "true");
    citations.className = "report-citations report-section report-break-inside-avoid rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-5 md:p-6";

    const header = document.createElement("div");
    header.className = "flex items-start justify-between gap-4 border-b border-[hsl(38_25%_80%)] pb-4";

    const left = document.createElement("div");
    left.className = "flex min-w-0 items-start gap-4";
    left.innerHTML = '<span class="font-mono text-base tracking-[0.12em] text-cam-gold">07</span><div><h2 id="report-section-07-heading" class="font-serif text-2xl text-foreground">References</h2><p class="mt-1 max-w-3xl text-base leading-relaxed text-muted-foreground">External evidence, canonical VIGIL record citations, and repair provenance supporting this report.</p></div>';

    const label = document.createElement("label");
    label.className = "print:hidden shrink-0 pt-1";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.className = "h-4 w-4 accent-[hsl(38_62%_40%)]";
    checkbox.setAttribute("aria-label", "Include References section in the printed PDF");
    checkbox.addEventListener("change", () => citations.classList.toggle("report-section-excluded", !checkbox.checked));
    label.appendChild(checkbox);

    header.append(left, label);
    const body = document.createElement("div");
    body.className = "mt-4";
    list.className = "space-y-3";
    body.appendChild(list);
    citations.append(header, body);
    citations.setAttribute("aria-labelledby", "report-section-07-heading");
  }

  function fixReportNavigation() {
    if (!location.pathname.includes("/observatory/reports/")) return;
    for (const link of document.querySelectorAll('a[href="/observatory"]')) {
      const label = labelText(link);
      if (label === "back to observatory") {
        link.setAttribute("href", "/observatory/cases");
        link.textContent = "Back to Case Files";
      } else if (label.startsWith("return to observatory")) {
        link.setAttribute("href", "/observatory/cases");
        link.textContent = "Return to Case Files →";
      }
    }
  }

  function makeCompleteBadge() {
    const badge = document.createElement("span");
    badge.setAttribute(COMPLETE_CHAIN_BADGE, "true");
    badge.className = "inline-flex items-center gap-1.5 rounded-full border border-cam-gold/55 bg-[hsl(38_48%_92%)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-[hsl(32_62%_25%)]";
    badge.title = "This record belongs to a completed evidence-to-repair-and-learning chain.";
    badge.innerHTML = '<span aria-hidden="true">✓</span><span>Complete evidence chain</span>';
    return badge;
  }

  function cleanDomainSuffix(row) {
    for (const node of [...row.childNodes]) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const value = node.textContent ?? "";
      if (!value.includes("·")) continue;
      node.textContent = value.replace(/\s*·\s*(?:ETHICS|AEON|ARBITRATION|SECURITY|OPERATIONS|RELATION|IDENTITY|RUNTIME|GOVERNANCE)(?:\s*;[^]*)?$/i, "");
    }
  }

  async function markCompleteCollapsedChains() {
    if (!location.pathname.includes("/observatory") || location.pathname.includes("/knowledge-base") || location.pathname.includes("/reports/")) return;
    const map = await loadLearnMap();
    for (const card of document.querySelectorAll("article.vigil-record-card")) {
      if (card.querySelector(".vigil-detail-surface")) continue;
      const id = card.id.replace(/^vigil-record-/, "").toUpperCase();
      const existing = card.querySelector(`[${COMPLETE_CHAIN_BADGE}]`);
      const complete = map.get(id)?.chainState === "complete";
      const failureModeLabel = [...card.querySelectorAll("span")].find((node) => labelText(node) === "failure mode");
      const metadataRow = failureModeLabel?.parentElement;
      if (complete && metadataRow && !existing) {
        cleanDomainSuffix(metadataRow);
        metadataRow.appendChild(makeCompleteBadge());
      }
      if (!complete && existing) existing.remove();
    }
  }

  function createLearnStage(learn) {
    const stage = document.createElement("div");
    stage.setAttribute(LEARN_STAGE, "true");
    stage.className = "relative rounded-lg border border-[hsl(38_25%_80%)] bg-[hsl(40_48%_97%)] p-3";
    const label = document.createElement("p");
    label.className = "font-mono text-[10px] uppercase tracking-[0.14em] text-cam-gold";
    label.textContent = "Learn";
    const link = document.createElement("a");
    link.className = "mt-2 block font-serif text-sm leading-snug text-foreground hover:text-cam-gold hover:underline";
    link.href = `/observatory/knowledge-base/${encodeURIComponent(learn.id)}`;
    link.textContent = learn.id;
    stage.append(label, link);
    if (learn.title) {
      const title = document.createElement("p");
      title.className = "mt-1 text-xs leading-relaxed text-muted-foreground";
      title.textContent = learn.title;
      stage.appendChild(title);
    }
    return stage;
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
      const learn = currentId ? map.get(currentId) : undefined;
      if (!learn) continue;
      grid.style.gridTemplateColumns = "repeat(5,minmax(0,1fr))";
      grid.appendChild(createLearnStage(learn));
    }
  }

  function enhance() {
    injectStyles();
    removeEmbeddedPolicyViewers();
    normalizeReferenceBackNavigation();
    normalizePublicDestinations();
    normalizeCaseReferences();
    normalizeReportReferences();
    fixReportNavigation();
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