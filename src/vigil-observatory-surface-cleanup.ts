function makeOfficialSourceIconOnly(anchor: HTMLAnchorElement, extraClass?: string) {
  if (anchor.dataset.iconOnlySourceLink === "true") return;
  const label = anchor.getAttribute("aria-label") || anchor.textContent?.trim() || "Open official source";
  anchor.setAttribute("aria-label", label);
  anchor.setAttribute("title", label);
  anchor.dataset.iconOnlySourceLink = "true";
  if (extraClass) anchor.classList.add(extraClass);
  for (const node of Array.from(anchor.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) node.remove();
  }
}

function polishCaseFilesKicker() {
  const kicker = document.querySelector<HTMLElement>(".vigil-case-library-page .vigil-library-header .vigil-library-kicker");
  if (kicker && kicker.textContent?.trim() !== "VIGIL Observatory") kicker.textContent = "VIGIL Observatory";
}

function polishOfficialSourceLinks() {
  document.querySelectorAll<HTMLAnchorElement>(".vigil-baseline-clause-actions a").forEach((anchor) => {
    if (anchor.textContent?.includes("Open official source")) makeOfficialSourceIconOnly(anchor);
  });
}

function makeOverviewSourcesCollapsible() {
  const heading = Array.from(document.querySelectorAll<HTMLHeadingElement>("h2"))
    .find((item) => item.textContent?.trim() === "Sources without public clause records");
  const section = heading?.closest("section");
  if (!section) return;

  const list = section.querySelector<HTMLElement>(".space-y-4");
  if (!list) return;

  Array.from(list.children).forEach((child, index) => {
    const article = child as HTMLElement;
    if (article.dataset.overviewCollapseReady === "true") return;
    const header = article.firstElementChild as HTMLElement | null;
    const body = article.children.item(1) as HTMLElement | null;
    if (!header || !body) return;

    article.dataset.overviewCollapseReady = "true";
    article.classList.add("vigil-source-overview-collapsible", "is-collapsed");
    body.classList.add("vigil-source-overview-body");

    const existingSourceLink = Array.from(header.querySelectorAll<HTMLAnchorElement>("a"))
      .find((anchor) => anchor.textContent?.includes("Open official source"));

    const actions = document.createElement("div");
    actions.className = "vigil-source-overview-actions";
    if (existingSourceLink) {
      makeOfficialSourceIconOnly(existingSourceLink, "vigil-source-overview-official");
      actions.append(existingSourceLink);
    }

    const bodyId = `vigil-source-overview-${index}-${Math.random().toString(36).slice(2, 8)}`;
    body.id = bodyId;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "vigil-source-overview-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", bodyId);
    toggle.setAttribute("aria-label", "Expand source overview");
    toggle.textContent = "⌄";
    toggle.addEventListener("click", () => {
      const collapsed = article.classList.toggle("is-collapsed");
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.setAttribute("aria-label", collapsed ? "Expand source overview" : "Collapse source overview");
      toggle.textContent = collapsed ? "⌄" : "⌃";
    });
    actions.append(toggle);
    header.append(actions);
  });
}

function applyObservatorySurfaceCleanup() {
  polishCaseFilesKicker();
  polishOfficialSourceLinks();
  makeOverviewSourcesCollapsible();
}

if (typeof document !== "undefined") {
  applyObservatorySurfaceCleanup();
  const observer = new MutationObserver(() => applyObservatorySurfaceCleanup());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
