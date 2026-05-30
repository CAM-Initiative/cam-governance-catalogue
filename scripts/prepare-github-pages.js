import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(repoRoot, "docs");
const indexPath = join(docsDir, "index.html");
const fallbackPath = join(docsDir, "404.html");
const nojekyllPath = join(docsDir, ".nojekyll");
const vigilSourcePath = join(repoRoot, "vigil", "VIGIL.Records.json");
const vigilOutputPath = join(docsDir, "vigil", "VIGIL.Records.json");

if (!existsSync(indexPath)) {
  throw new Error("GitHub Pages build did not produce docs/index.html");
}

mkdirSync(docsDir, { recursive: true });
copyFileSync(indexPath, fallbackPath);
writeFileSync(nojekyllPath, "");

if (existsSync(vigilSourcePath)) {
  mkdirSync(dirname(vigilOutputPath), { recursive: true });
  copyFileSync(vigilSourcePath, vigilOutputPath);
  console.log("Copied VIGIL records: docs/vigil/VIGIL.Records.json");
}

console.log("Prepared GitHub Pages SPA fallback: docs/404.html");
console.log("Ensured GitHub Pages bypasses Jekyll: docs/.nojekyll");
