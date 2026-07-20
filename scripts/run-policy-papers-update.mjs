import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const sourcePath = "scripts/apply-policy-papers.mjs";
const generatedPath = "scripts/.apply-policy-papers-generated.mjs";
let source = readFileSync(sourcePath, "utf8");

source = source.replace(
  'const pdfHref = `${import.meta.env.BASE_URL}publications/CAM_Initiative_Australian_AI_Training_and_Contribution_Policy_Proposal.pdf`;' + "\n\n",
  "",
);

source = source.replace(
  '                    download\n                    href={pdfHref}',
  '                    href="#recommendations"',
);

source = source.replace(
  '                    <Download className="h-4 w-4" aria-hidden="true" />\n                    Download the policy paper',
  '                    Read the policy overview\n                    <ArrowRight className="h-4 w-4" aria-hidden="true" />',
);

source = source.replace(
  '                    href={pdfHref}\n                    rel="noreferrer"\n                    target="_blank"',
  '                    href="mailto:ethics@cam-initiative.org?subject=CAM%20Policy%20Proposal%2001%2F2026"',
);

source = source.replace(
  '                    Open PDF in browser\n                    <ExternalLink className="h-4 w-4" aria-hidden="true" />',
  '                    Discuss the proposal\n                    <ArrowRight className="h-4 w-4" aria-hidden="true" />',
);

const pdfAssemblyMarker = 'const partPaths = Array.from({ length: 7 }';
const markerIndex = source.indexOf(pdfAssemblyMarker);

if (markerIndex === -1) {
  throw new Error("Could not locate the staged PDF assembly block.");
}

source = `${source.slice(0, markerIndex)}console.log("Applied Policy Papers source, navigation, sitemap, and publication-page updates.");\n`;
writeFileSync(generatedPath, source);
await import(pathToFileURL(`${process.cwd()}/${generatedPath}`).href);
