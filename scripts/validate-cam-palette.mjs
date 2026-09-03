import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), "utf8");

const [indexCss, darkAppearance, constitutionCatalogueUx, main, report] = await Promise.all([
  read("src/index.css"),
  read("src/dark-appearance.css"),
  read("src/constitution-catalogue-ux.css"),
  read("src/main.tsx"),
  read("src/pages/evidence-chain-report-deterministic.tsx"),
]);

const failures = [];
const requireText = (content, text, description) => {
  if (!content.includes(text)) failures.push(description);
};

// Scope: this validator protects the shared CAM colour system and theme closures.
// Content, navigation, layout, typography and VIGIL information architecture belong
// in their dedicated component / Observatory tests rather than in the palette contract.

// Shared CAM Corpus surfaces.
requireText(indexCss, "--cam-corpus-selected: 38 34% 82%;", "Missing CAM Corpus selected-surface token.");
requireText(indexCss, "--cam-corpus-selected-foreground: 32 62% 25%;", "Missing CAM Corpus selected-text token.");
requireText(indexCss, "--cam-corpus-selected-border: 38 62% 40%;", "Missing CAM Corpus selected-border token.");
requireText(indexCss, "--cam-corpus-heading: var(--cam-corpus-selected);", "Corpus report heading must reuse the selected CAM Corpus surface.");
requireText(indexCss, "--cam-corpus-heading-foreground: var(--cam-corpus-selected-foreground);", "Corpus report heading must use the selected-surface foreground token.");
requireText(indexCss, "--cam-corpus-metadata: var(--secondary);", "Corpus report metadata must use the shared secondary surface.");
requireText(indexCss, "--cam-corpus-metadata-foreground: var(--secondary-foreground);", "Corpus report metadata must use the shared secondary foreground.");
if (/--cam-corpus-(?:heading|metadata):\s*var\(--(?:foreground|card-foreground|primary-foreground|secondary-foreground|cam-corpus-selected-foreground)\)/u.test(indexCss)) {
  failures.push("Corpus report backgrounds must use surface tokens, never foreground/text tokens.");
}

// Shared light/dark appearance tokens.
requireText(indexCss, "--background: 40 33% 98%;", "Light appearance must use the approved CAM canvas.");
requireText(indexCss, 'html[data-theme="dark"]', "Missing CAM dark-theme token scope.");
requireText(darkAppearance, "--background: 0 0% 4%;", "Dark canvas must remain neutral near-black rather than absolute black.");
requireText(darkAppearance, "--foreground: 0 0% 90%;", "Dark reading text must remain neutral rather than gold-tinted.");
requireText(darkAppearance, "--card: 0 0% 7%;", "Dark cards must retain the raised charcoal surface.");
requireText(darkAppearance, "--popover: 0 0% 7%;", "Dark popovers must retain the raised charcoal surface.");
requireText(darkAppearance, "--secondary: 0 0% 10%;", "Dark interactive surfaces must retain a distinct charcoal level.");
requireText(darkAppearance, "--muted-foreground: 0 0% 68%;", "Dark secondary reading text must remain neutral.");
requireText(main, 'import "./dark-appearance.css";', "The shared dark-appearance layer must be loaded by the application entry point.");

// CAM/VIGIL palette inheritance: VIGIL may alias the shared system but must not
// introduce a parallel literal brand palette.
requireText(indexCss, "--cam-surface-canvas: var(--background);", "CAM canvas alias must resolve to the shared background token.");
requireText(indexCss, "--vigil-nav-active: var(--cam-corpus-selected);", "VIGIL active navigation must resolve to the shared CAM selected surface.");
requireText(indexCss, "--vigil-surface: var(--cam-surface-raised);", "VIGIL surfaces must resolve to CAM surface tokens.");
requireText(indexCss, "--vigil-accent: var(--cam-accent);", "VIGIL accent must resolve to the CAM accent token.");
for (const match of indexCss.matchAll(/--vigil-(?:nav-active|surface|surface-muted|accent):\s*([^;]+);/gu)) {
  if (!/^var\(--(?:cam-|background|card|secondary|primary)/u.test(match[1].trim())) {
    failures.push("VIGIL palette aliases must resolve to shared CAM/theme tokens rather than literal colours.");
  }
}

// Dark-mode closure for known literal parchment surfaces. Light-only literals may
// remain in component markup, but the dark appearance must close them back onto
// the shared neutral theme surfaces.
requireText(main, 'import "./constitution-catalogue-ux.css";', "The Constitution/Catalogue theme-closure layer must be loaded by the application entry point.");
requireText(constitutionCatalogueUx, 'section[aria-labelledby="governance-stack-heading"] [class~="bg-[hsl(36_35%_96%)]"]', "Governance Stack parchment panels need a dark-mode surface override.");
requireText(constitutionCatalogueUx, "background-color: hsl(var(--background)) !important;", "Constitution dark-mode closures must follow the shared canvas token.");
requireText(constitutionCatalogueUx, '#runtime-model .pointer-events-none.absolute.right-0.top-0.bottom-0.w-16', "Runtime edge fade must remain theme-aware in dark mode.");
requireText(constitutionCatalogueUx, 'article[aria-controls^="catalogue-details-"]:hover', "Catalogue hover surfaces need a dark-mode override.");
requireText(constitutionCatalogueUx, 'article[aria-controls^="catalogue-details-"][aria-expanded="true"]', "Expanded Catalogue cards need a dark selected surface.");
requireText(constitutionCatalogueUx, '[role="dialog"] > [class~="bg-[hsl(36_48%_95%)]"]', "Catalogue source dialogs need a dark-mode parchment override.");

// Decorative green/cyan is not part of the CAM report palette. Semantic status
// colours elsewhere are deliberately outside this validator's scope.
if (/hsl\(1(?:[0-7]\d|8[0-9]|9[0-9])_/u.test(report)) {
  failures.push("Evidence report contains a hard-coded green/cyan hue; use a CAM palette token instead.");
}

if (failures.length) {
  console.error("CAM website palette/theme validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("CAM website palette/theme validation passed.");
