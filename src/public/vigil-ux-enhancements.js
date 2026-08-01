(() => {
  "use strict";

  const STYLE_ID = "vigil-ux-readability-styles";
  const COMPLETE_CHAIN_BADGE = "data-vigil-complete-chain-badge";
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
    `;
    document.head.appendChild(style);
  }

  function removeEmbeddedPolicyViewers() {
    if (!location.pathname.includes("/policy")) return;
    document.querySelectorAll('iframe[src*="/publications/"], iframe[title*="CAM Initiative"]').forEach((iframe) => iframe.parentElement?.remove());
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
