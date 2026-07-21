(() => {
  const oldFooter = "Governance infrastructure for artificial intelligence, synthetic agents, and runtime governance systems";
  const newFooter = "Governance architecture, evidence-led repair, and public policy for artificial intelligence and synthetic agents.";

  const applyPublishedPolish = () => {
    const footerLine = Array.from(document.querySelectorAll("footer p")).find(
      (node) => node.textContent?.trim() === oldFooter,
    );
    if (footerLine) footerLine.textContent = newFooter;

    const cards = document.querySelectorAll(
      'section[aria-labelledby="evidence-repair-heading"] > .overflow-x-auto article',
    );
    cards.forEach((card) => {
      card.style.height = "13.5rem";
      card.style.minHeight = "13.5rem";
    });

    const connectors = document.querySelectorAll(
      'section[aria-labelledby="evidence-repair-heading"] > .overflow-x-auto article + div[aria-hidden="true"]',
    );
    connectors.forEach((connector) => {
      connector.style.height = "13.5rem";
    });

    return Boolean(footerLine) && cards.length > 0;
  };

  if (!applyPublishedPolish()) {
    const observer = new MutationObserver(() => {
      if (applyPublishedPolish()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("load", applyPublishedPolish, { once: true });
  }
})();
