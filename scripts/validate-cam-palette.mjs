import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), "utf8");

const [indexCss, report, home] = await Promise.all([
  read("src/index.css"),
  read("src/pages/evidence-chain-report.tsx"),
  read("src/pages/home.tsx"),
]);

const failures = [];
const requireText = (content, text, description) => {
  if (!content.includes(text)) failures.push(description);
};

// The selected Corpus surface is a shared design token, not a local colour choice.
requireText(indexCss, "--cam-corpus-selected: 38 34% 82%;", "Missing CAM Corpus selected-surface token.");
requireText(indexCss, "--cam-corpus-selected-foreground: 32 62% 25%;", "Missing CAM Corpus selected-text token.");
requireText(indexCss, "--cam-corpus-selected-border: 38 62% 40%;", "Missing CAM Corpus selected-border token.");
requireText(indexCss, "--cam-corpus-heading: var(--foreground);", "Missing CAM Corpus section-heading token.");
requireText(indexCss, "--cam-corpus-metadata: var(--cam-corpus-selected-foreground);", "Missing CAM Corpus metadata-surface token.");
requireText(indexCss, "background: hsl(var(--cam-corpus-selected)) !important;", "Constitutional Interfaces must use the shared CAM Corpus selected surface.");
requireText(report, "bg-[hsl(var(--cam-corpus-heading))]", "Evidence-to-Repair corpus section title must use the shared CAM heading surface.");
requireText(report, "bg-[hsl(var(--cam-corpus-metadata))]", "Evidence-to-Repair corpus metadata must use the shared CAM metadata surface.");
requireText(home, 'aria-labelledby="constitutional-interfaces-heading"', "Constitutional Interfaces landmark is missing.");

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
