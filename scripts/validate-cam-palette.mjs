import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), "utf8");

const [indexCss, darkAppearance, constitutionCatalogueUx, vigilReading, main, report, home, shell, themeToggle, observatoryNav, vigilAbout] = await Promise.all([
  read("src/index.css"),
  read("src/dark-appearance.css"),
  read("src/constitution-catalogue-ux.css"),
  read("src/vigil-reading-legibility.css"),
  read("src/main.tsx"),
  read("src/pages/evidence-chain-report.tsx"),
  read("src/pages/home.tsx"),
  read("src/components/layout/Shell.tsx"),
  read("src/components/ThemeToggle.tsx"),
  read("src/components/vigil/VigilObservatoryNav.tsx"),
  read("src/pages/vigil-about.tsx"),
]);

const failures = [];
const requireText = (content, text, description) => {
  if (!content.includes(text)) failures.push(description);
};

// The selected Corpus surface is a shared design token, not a local colour choice.
requireText(indexCss, "--cam-corpus-selected: 38 34% 82%;", "Missing CAM Corpus selected-surface token.");
requireText(indexCss, "--cam-corpus-selected-foreground: 32 62% 25%;", "Missing CAM Corpus selected-text token.");
requireText(indexCss, "--cam-corpus-selected-border: 38 62% 40%;", "Missing CAM Corpus selected-border token.");
requireText(indexCss, "--cam-corpus-heading: var(--cam-corpus-selected);", "Corpus report heading must reuse the active Constitutional Interfaces surface.");
requireText(indexCss, "--cam-corpus-heading-foreground: var(--cam-corpus-selected-foreground);", "Corpus report heading must use the selected-surface foreground token.");
requireText(indexCss, "--cam-corpus-metadata: var(--secondary);", "Corpus report metadata must use the approved softer surface token.");
requireText(indexCss, "--cam-corpus-metadata-foreground: var(--secondary-foreground);", "Corpus report metadata must use the approved softer-surface foreground token.");
requireText(indexCss, "background: hsl(var(--cam-corpus-selected)) !important;", "Constitutional Interfaces must use the shared CAM Corpus selected surface.");
requireText(report, "bg-[hsl(var(--cam-corpus-heading))]", "Evidence-to-Repair corpus section title must use the shared CAM heading surface.");
requireText(report, "bg-[hsl(var(--cam-corpus-metadata))]", "Evidence-to-Repair corpus metadata must use the shared CAM metadata surface.");
if (/--cam-corpus-(?:heading|metadata):\s*var\(--(?:foreground|card-foreground|primary-foreground|secondary-foreground|cam-corpus-selected-foreground)\)/u.test(indexCss)) {
  failures.push("Corpus report backgrounds must use approved surface tokens, never foreground/text tokens.");
}
requireText(home, 'aria-labelledby="constitutional-interfaces-heading"', "Constitutional Interfaces landmark is missing.");

// Appearance is a shared CAM capability. VIGIL aliases must resolve to CAM
// tokens rather than introducing a standalone brand palette.
requireText(indexCss, "--background: 40 33% 98%;", "Light appearance must use the approved clean CAM canvas.");
requireText(indexCss, 'html[data-theme="dark"]', "Missing deliberate CAM dark appearance token set.");
requireText(darkAppearance, "--background: 0 0% 4%;", "Dark appearance must use the approved neutral near-black canvas.");
requireText(darkAppearance, "--foreground: 0 0% 90%;", "Dark appearance reading text must remain neutral rather than collapsing into the gold accent family.");
requireText(darkAppearance, "--card: 0 0% 7%;", "Dark appearance must use the approved raised charcoal card surface.");
requireText(darkAppearance, "--popover: 0 0% 7%;", "Dark appearance must use the approved raised charcoal popover surface.");
requireText(darkAppearance, "--secondary: 0 0% 10%;", "Dark appearance must retain a distinct charcoal interaction surface.");
requireText(darkAppearance, "--muted-foreground: 0 0% 68%;", "Dark appearance secondary reading text must remain neutral.");
requireText(darkAppearance, 'html[data-theme="dark"] [class~="bg-[hsl(38_40%_93%)]"]', "Dark appearance must override the light-only landing hero surface.");
requireText(darkAppearance, 'html[data-theme="dark"] [class~="bg-[hsl(38_40%_94%)]"]', "Dark appearance must override light-only landing section surfaces.");
requireText(darkAppearance, "header {", "Shared navigation must declare an opaque header surface.");
requireText(darkAppearance, "background-color: hsl(var(--background)) !important;", "Shared header must resolve to an opaque CAM background token.");
requireText(main, 'import "./dark-appearance.css";', "The final dark appearance layer must be loaded by the application entry point.");
requireText(indexCss, "--cam-surface-canvas: var(--background);", "CAM canvas alias must resolve to the shared background token.");
requireText(indexCss, "--vigil-nav-active: var(--cam-corpus-selected);", "VIGIL active navigation must resolve to the shared CAM selected surface.");
requireText(indexCss, "--vigil-surface: var(--cam-surface-raised);", "VIGIL surfaces must resolve to CAM surface tokens.");
requireText(indexCss, "--vigil-accent: var(--cam-accent);", "VIGIL accent must resolve to the CAM accent token.");
requireText(themeToggle, 'window.localStorage.setItem(STORAGE_KEY, nextTheme)', "Theme preference must persist across navigation.");
requireText(shell, "<ThemeToggle />", "The appearance toggle must be present in the shared CAM header.");
requireText(observatoryNav, "vigil-local-nav-link", "The reusable VIGIL local navigation is missing.");
for (const match of indexCss.matchAll(/--vigil-(?:nav-active|surface|surface-muted|accent):\s*([^;]+);/gu)) {
  if (!/^var\(--(?:cam-|background|card|secondary|primary)/u.test(match[1].trim())) {
    failures.push("VIGIL aliases must resolve to approved CAM tokens rather than literal colour values.");
  }
}

// Homepage evidence-to-repair already communicates the six-stage method directly.
// Do not reintroduce the redundant split VIGIL/Constitution explainer block beneath it.
if (home.includes("Steps 01–03 · Evidence formation") || home.includes("Steps 04–06 · Governance response") || home.includes("Evidence ↔ repair")) {
  failures.push("Homepage must not reintroduce the redundant VIGIL/Constitution evidence-bridge explainer block.");
}

// Constitution and Catalogue dark-mode closure. Literal parchment utilities may
// remain valid in light mode, but they must never surface as pale panels in dark mode.
requireText(main, 'import "./constitution-catalogue-ux.css";', "The Constitution/Catalogue UX closure must be loaded last by the application entry point.");
requireText(constitutionCatalogueUx, 'section[aria-labelledby="governance-stack-heading"] [class~="bg-[hsl(36_35%_96%)]"]', "Governance Stack detail panels must have a dark-mode surface override.");
requireText(constitutionCatalogueUx, "background-color: hsl(var(--background)) !important;", "Constitution dark-mode closures must follow the shared near-black canvas token.");
requireText(constitutionCatalogueUx, '#runtime-model .pointer-events-none.absolute.right-0.top-0.bottom-0.w-16', "Runtime Constitutional Interface edge fade must be theme-aware in dark mode.");
requireText(constitutionCatalogueUx, 'article[aria-controls^="catalogue-details-"]:hover', "Catalogue cards must override the light-only hover surface in dark mode.");
requireText(constitutionCatalogueUx, 'article[aria-controls^="catalogue-details-"][aria-expanded="true"]', "Expanded Catalogue cards must retain a dark selected surface.");
requireText(constitutionCatalogueUx, '[role="dialog"] > [class~="bg-[hsl(36_48%_95%)]"]', "Catalogue source dialogs must not retain a light-only parchment surface in dark mode.");
requireText(constitutionCatalogueUx, 'grid-template-columns: minmax(0, 1fr) auto;', "Catalogue source/data actions must share the final desktop action row with Read instrument / Details.");

// Primary information architecture: VIGIL is a peer public product beside Home;
// Catalogue is a Constitution child; a single repository must not masquerade as
// the initiative-wide GitHub destination.
requireText(shell, '{ href: "/catalogue", label: "Catalogue" },', "Catalogue must remain in the Constitution dropdown.");
requireText(shell, 'const isConstitutionActive = location === "/catalogue"', "Catalogue must participate in the Constitution active navigation state.");
const desktopNavStart = shell.indexOf('<nav className="hidden md:flex');
const desktopNavEnd = shell.indexOf('</nav>', desktopNavStart);
const desktopNav = desktopNavStart >= 0 && desktopNavEnd > desktopNavStart ? shell.slice(desktopNavStart, desktopNavEnd) : "";
const vigilPosition = desktopNav.indexOf('href="/observatory/cases"');
const constitutionPosition = desktopNav.indexOf('href="/constitution"');
if (vigilPosition < 0 || constitutionPosition < 0 || vigilPosition > constitutionPosition) {
  failures.push("Desktop primary navigation must place VIGIL immediately after Home and before Constitution.");
}
if (shell.includes('href="https://github.com/CAM-Initiative/Caelestis"')) {
  failures.push("Shared top navigation must not expose one repository as the initiative-wide GitHub destination.");
}

// Footer navigation is intentionally not a duplicate of the persistent header.
// Keep only concise initiative text and the small responsive contact/social icon group.
requireText(shell, 'aria-label="Footer" className="flex w-full max-w-full flex-wrap', "Footer must retain the responsive compact contact/social icon group.");
requireText(shell, 'aria-label="Substack"', "Footer must expose a Substack icon link.");
if (shell.includes('const footerLinks =')) {
  failures.push("Footer must not duplicate the primary site navigation links.");
}
if (shell.includes('/about#citations') || shell.includes('aria-label="Citations"')) {
  failures.push("Footer must not retain the former Citations quick-link icon.");
}

// VIGIL public reading surfaces must not regress into dense ledger typography.
requireText(main, 'import "./vigil-reading-legibility.css";', "The final VIGIL reading-legibility layer must be loaded by the application entry point.");
requireText(vigilReading, ".vigil-case-file-page .vigil-case-section-body :where(p:not(.vigil-library-kicker), li)", "Case File substantive prose must have a final reading-size override.");
requireText(vigilReading, "font-size: 1.075rem;", "Case File substantive prose must remain above the old compact 1rem floor.");
requireText(vigilReading, ".vigil-about-flow p,", "About VIGIL explanatory cards must participate in the reading-size contract.");
requireText(vigilReading, "font-size: 1.0625rem;", "About VIGIL substantive card text must remain at least 17px-equivalent.");

// About VIGIL should explain canonical record roles directly. Do not use the
// record-type section to repeat the separate public-surface / Full Ledger explanation.
requireText(vigilAbout, "VIGIL record types", "About VIGIL must retain a dedicated record-type explanation section.");
for (const recordCode of ['["OBS",', '["RESEARCH",', '["FM",', '["PROP",', '["PATCH",', '["LEARN",']) {
  requireText(vigilAbout, recordCode, `About VIGIL is missing record-type explanation ${recordCode}.`);
}
if (vigilAbout.includes("The ledger remains more detailed than the public Case File")) {
  failures.push("About VIGIL must not duplicate the Full Ledger explanation inside the record-type section.");
}

// Decorative green is not part of the CAM palette. Semantic status colours are
// deliberately outside this check; this guard applies to the report header.
if (/hsl\(1(?:[0-7]\d|8[0-9]|9[0-9])_/u.test(report)) {
  failures.push("Evidence-to-Repair report contains a hard-coded green/cyan hue. Use a CAM palette token instead.");
}

if (failures.length) {
  console.error("CAM website palette validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("CAM website palette validation passed.");
