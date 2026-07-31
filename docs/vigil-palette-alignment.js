(() => {
  "use strict";

  const COMPLETE_BADGE = "data-vigil-complete-chain-badge";
  const LEARN_STAGE = "data-vigil-learn-stage";
  const ALIGNED_BADGE = "data-vigil-aligned-chain-badge";

  function cleanDomainSuffix(row) {
    for (const node of [...row.childNodes]) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const value = node.textContent ?? "";
      if (!value.includes("·")) continue;
      node.textContent = value.replace(/\s*·\s*(?:ETHICS|AEON|ARBITRATION|SECURITY|OPERATIONS|RELATION|IDENTITY|RUNTIME|GOVERNANCE)(?:\s*;[^]*)?$/i, "");
    }
  }

  function alignCompletionBadge(card) {
    const existingWrapper = card.querySelector(`[${COMPLETE_BADGE}]`);
    const complete = Boolean(existingWrapper);
    if (!complete) return;

    const failureModeLabel = [...card.querySelectorAll("span")]
      .find((node) => node.textContent?.trim().toLowerCase() === "failure mode");
    const metadataRow = failureModeLabel?.parentElement;
    if (!metadataRow) return;

    existingWrapper.remove();
    cleanDomainSuffix(metadataRow);

    if (metadataRow.querySelector(`[${ALIGNED_BADGE}]`)) return;
    const badge = document.createElement("span");
    badge.setAttribute(ALIGNED_BADGE, "true");
    badge.className = "inline-flex items-center gap-1.5 rounded-full border border-cam-gold/55 bg-[hsl(38_48%_92%)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-[hsl(32_62%_25%)]";
    badge.title = "This record belongs to a completed evidence-to-repair-and-learning chain.";
    badge.innerHTML = '<span aria-hidden="true">✓</span><span>Complete evidence chain</span>';
    metadataRow.appendChild(badge);
  }

  function alignLearnStage(stage) {
    stage.className = "relative rounded-lg border border-[hsl(38_25%_80%)] bg-[hsl(40_48%_97%)] p-3";
    const label = stage.querySelector("p:first-child");
    if (label) label.className = "font-mono text-[10px] uppercase tracking-[0.14em] text-cam-gold";
    const link = stage.querySelector("a");
    if (link) link.className = "mt-2 block font-serif text-sm leading-snug text-foreground hover:text-cam-gold hover:underline";
    const title = link?.nextElementSibling;
    if (title) title.className = "mt-1 text-xs leading-relaxed text-muted-foreground";
  }

  function apply() {
    if (!location.pathname.includes("/observatory") || location.pathname.includes("/knowledge-base") || location.pathname.includes("/reports/")) return;
    document.querySelectorAll("article.vigil-record-card").forEach(alignCompletionBadge);
    document.querySelectorAll(`[${LEARN_STAGE}]`).forEach(alignLearnStage);
  }

  let frame = 0;
  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      apply();
    });
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", schedule);
  document.addEventListener("DOMContentLoaded", schedule, { once: true });
  schedule();
})();
