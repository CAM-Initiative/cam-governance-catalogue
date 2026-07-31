(() => {
  "use strict";

  const LEARN_INDEX_URL = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Learn.Index.json";
  const LEARN_FALLBACK_URL = "/data/vigil-registry-fallback.json";
  const CAM_CITATION = {
    label: "O’Rourke, M. V. (2026). Caelestis Architecture Model (Version 1.1.0). Zenodo.",
    doi: "https://doi.org/10.5281/zenodo.20686316",
    version: "1.1.0",
  };

  let taxonomyByLearnIdPromise;

  function isKnowledgeBaseRoute() { return location.pathname.startsWith("/observatory/knowledge-base"); }
  function learnIdFromText(value) { return value?.match(/VIGIL-\d{4}-LEARN-\d{4}/i)?.[0]?.toUpperCase(); }
  function firstTaxonomyLink(record) { return Array.isArray(record?.failure_taxonomy_links) && record.failure_taxonomy_links[0] ? record.failure_taxonomy_links[0] : undefined; }
  function collectLearnRecords(payload) { if (Array.isArray(payload)) return payload; if (Array.isArray(payload?.records)) return payload.records; if (Array.isArray(payload?.learn_records)) return payload.learn_records; return []; }

  async function fetchJson(url) {
    const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${url}: ${response.status}`);
    return response.json();
  }

  function taxonomyMap() {
    if (!taxonomyByLearnIdPromise) {
      taxonomyByLearnIdPromise = (async () => {
        let payload;
        try { payload = await fetchJson(LEARN_INDEX_URL); }
        catch { payload = await fetchJson(LEARN_FALLBACK_URL); }
        const map = new Map();
        for (const record of collectLearnRecords(payload)) {
          const id = String(record?.id ?? record?.record_id ?? record?.record_identity?.record_id ?? "").toUpperCase();
          const taxonomy = firstTaxonomyLink(record);
          if (!id || !taxonomy) continue;
          map.set(id, {
            canonicalFailureName: taxonomy.canonical_failure_name,
            failureFamilyCode: taxonomy.primary_failure_family_code,
            taxonomyReference: taxonomy.taxonomy_reference,
          });
        }
        return map;
      })();
    }
    return taxonomyByLearnIdPromise;
  }

  function findRecordId(block) {
    const cardId = learnIdFromText(block.closest("article")?.textContent);
    if (cardId) return cardId;
    return learnIdFromText((block.closest("main") ?? document.querySelector("main"))?.textContent);
  }

  function makeDefinition(label, value, className = "") {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const definition = document.createElement("dd");
    term.className = "report-label";
    term.textContent = label;
    definition.className = `mt-1 ${className}`.trim();
    definition.textContent = value;
    wrapper.append(term, definition);
    return wrapper;
  }

  function renderTaxonomy(block, taxonomy) {
    if (block.dataset.camTaxonomyCitation === "1") return;
    const heading = [...block.querySelectorAll("p, h2, h3")].find((node) => ["failure taxonomy", "failure class"].includes(node.textContent?.trim().toLowerCase()));
    if (!heading) return;
    const specificClass = taxonomy.canonicalFailureName?.trim();
    const corpusReference = taxonomy.taxonomyReference?.trim();
    const familyCode = taxonomy.failureFamilyCode?.trim();
    if (!specificClass && !corpusReference) return;

    heading.textContent = "Failure class";
    const existingName = heading.nextElementSibling;
    if (specificClass && existingName instanceof HTMLElement) {
      existingName.textContent = specificClass;
      existingName.className = "mt-1.5 font-serif text-lg leading-snug text-foreground";
    }

    for (const child of [...block.children]) {
      if (child === heading || child === existingName) continue;
      if (child.matches("dl") || child.hasAttribute("data-cam-taxonomy-detail")) child.remove();
    }

    const details = document.createElement("dl");
    details.dataset.camTaxonomyDetail = "1";
    details.className = "mt-4 space-y-3 border-t border-border/70 pt-4";
    if (corpusReference) details.append(makeDefinition("Corpus reference", corpusReference));
    if (familyCode) details.append(makeDefinition("Failure family", familyCode, "font-mono text-sm"));

    const citation = document.createElement("div");
    const term = document.createElement("dt");
    const definition = document.createElement("dd");
    const link = document.createElement("a");
    term.className = "report-label";
    term.textContent = `Corpus citation · v${CAM_CITATION.version}`;
    definition.className = "mt-1 text-sm leading-relaxed text-muted-foreground";
    link.href = CAM_CITATION.doi;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.className = "underline decoration-cam-gold/50 underline-offset-4 hover:text-foreground";
    link.textContent = `${CAM_CITATION.label} DOI: 10.5281/zenodo.20686316`;
    definition.append(link);
    citation.append(term, definition);
    details.append(citation);
    block.append(details);
    block.dataset.camTaxonomyCitation = "1";
  }

  async function enhanceTaxonomy() {
    if (!isKnowledgeBaseRoute()) return;
    const map = await taxonomyMap();
    const headings = [...document.querySelectorAll("p, h2, h3")].filter((node) => ["failure taxonomy", "failure class"].includes(node.textContent?.trim().toLowerCase()));
    for (const heading of headings) {
      const block = heading.closest("section, div");
      if (!block) continue;
      const taxonomy = map.get(findRecordId(block));
      if (taxonomy) renderTaxonomy(block, taxonomy);
    }
  }

  let scheduled = false;
  function scheduleEnhancement() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; enhanceTaxonomy().catch(() => undefined); });
  }

  scheduleEnhancement();
  addEventListener("popstate", scheduleEnhancement);
  new MutationObserver(scheduleEnhancement).observe(document.documentElement, { childList: true, subtree: true });
})();
