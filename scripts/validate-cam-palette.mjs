import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), "utf8");

const [indexCss, report, home, shell, themeToggle, observatoryNav] = await Promise.all([
  read("src/index.css"),
  read("src/pages/evidence-chain-report.tsx"),
  read("src/pages/home.tsx"),
  read("src/components/layout/Shell.tsx"),
  read("src/components/ThemeToggle.tsx"),
  read("src/components/vigil/VigilObservatoryNav.tsx"),
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
