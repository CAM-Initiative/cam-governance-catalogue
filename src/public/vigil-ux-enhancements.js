(() => {
  "use strict";

  let animationFrame = 0;

  function labelText(element) {
    return typeof element?.textContent === "string" ? element.textContent.trim().toLowerCase() : "";
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
    if (location.pathname !== "/" && location.pathname !== "") return;
    const vigilCard = [...document.querySelectorAll('a.home-governance-card[href="/observatory"]')]
      .find((link) => labelText(link).includes("vigil observatory"));
    if (vigilCard) vigilCard.setAttribute("href", "/observatory/cases");
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

  function enhance() {
    removeEmbeddedPolicyViewers();
    normalizeReferenceBackNavigation();
    normalizePublicDestinations();
    fixReportNavigation();
  }

  function scheduleEnhancement() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
      animationFrame = 0;
      enhance();
    });
  }

  new MutationObserver(scheduleEnhancement).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", scheduleEnhancement);
  document.addEventListener("DOMContentLoaded", scheduleEnhancement, { once: true });
  scheduleEnhancement();
})();
