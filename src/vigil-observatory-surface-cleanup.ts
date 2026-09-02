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

function alphabetizeTaxonomyContents() {
  const contents = document.querySelector<HTMLElement>("#taxonomy-contents");
  const familyList = contents?.querySelector<HTMLOListElement>(":scope > ol");
  if (!familyList) return;

  const sortChildrenByVisibleName = (list: HTMLOListElement | HTMLUListElement) => {
    const items = Array.from(list.children).filter((child): child is HTMLLIElement => child instanceof HTMLLIElement);
    const sorted = [...items].sort((left, right) => {
      const leftName = left.querySelector<HTMLAnchorElement>(":scope > .vigil-taxonomy-manual-family-link-row a, :scope > a")?.textContent?.trim() ?? "";
      const rightName = right.querySelector<HTMLAnchorElement>(":scope > .vigil-taxonomy-manual-family-link-row a, :scope > a")?.textContent?.trim() ?? "";
      return leftName.localeCompare(rightName, undefined, { sensitivity: "base", numeric: true });
    });
    if (items.some((item, index) => item !== sorted[index])) sorted.forEach((item) => list.append(item));
  };

  sortChildrenByVisibleName(familyList);
  familyList.querySelectorAll<HTMLUListElement>(":scope > li > ul").forEach((classList) => sortChildrenByVisibleName(classList));
}

function polishIncidentDiagnosisSeverity() {
  const diagnosis = document.querySelector<HTMLElement>(".vigil-case-file-page .vigil-diagnosis-mechanism");
  const metadataPanel = diagnosis?.querySelector<HTMLElement>(".vigil-diagnosis-metadata-panel");
  if (!diagnosis || !metadataPanel) return;

  const metadataHeading = metadataPanel.querySelector<HTMLElement>(":scope > .vigil-diagnostic-meta-label");
  if (metadataHeading && metadataHeading.textContent?.trim() !== "Diagnostic metadata") {
    metadataHeading.textContent = "Diagnostic metadata";
  }

  if (diagnosis.dataset.severityUxReady !== "true") {
    const layout = diagnosis.querySelector<HTMLElement>(".vigil-diagnosis-analysis-layout");
    const metadataList = metadataPanel.querySelector<HTMLDListElement>(".vigil-evidence-review-meta");
    const metadataFields = Array.from(metadataList?.children ?? []) as HTMLElement[];
    const severityFields = metadataFields.filter((field) => {
      const label = field.querySelector("dt")?.textContent?.trim();
      return label === "Severity" || label === "Severity basis";
    });

    if (layout && severityFields.length) {
      const section = document.createElement("section");
      section.className = "vigil-severity-assessment";
      section.setAttribute("aria-label", "Severity assessment");

      const heading = document.createElement("div");
      heading.className = "vigil-case-subheading";
      const kicker = document.createElement("p");
      kicker.className = "vigil-library-kicker";
      kicker.textContent = "Severity assessment";
      const title = document.createElement("h3");
      title.textContent = "Occurrence-level impact assessment";
      heading.append(kicker, title);

      const grid = document.createElement("div");
      grid.className = "vigil-severity-assessment-grid";
      severityFields.forEach((field) => grid.append(field));
      section.append(heading, grid);
      layout.before(section);
    }

    diagnosis.dataset.severityUxReady = "true";
  }

  document.querySelectorAll<HTMLElement>(".vigil-case-file-page .vigil-case-meta-panel .vigil-case-field").forEach((field) => {
    if (field.querySelector("dt")?.textContent?.trim() === "Severity") field.remove();
  });
}

function applyObservatorySurfaceCleanup() {
  polishCaseFilesKicker();
  polishOfficialSourceLinks();
  makeOverviewSourcesCollapsible();
  alphabetizeTaxonomyContents();
  polishIncidentDiagnosisSeverity();
}

if (typeof document !== "undefined") {
  applyObservatorySurfaceCleanup();
  const observer = new MutationObserver(() => applyObservatorySurfaceCleanup());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
