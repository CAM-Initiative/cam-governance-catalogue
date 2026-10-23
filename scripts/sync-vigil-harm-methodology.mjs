import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const upstream = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil";
const version = "1.1.0";
async function load(source) {
  if (!/^https?:\/\//.test(source)) return JSON.parse(await readFile(resolve(root, source), "utf8"));
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Cannot load harm methodology source: HTTP ${response.status}`);
  return response.json();
}

const methodology = await load(process.env.VIGIL_HARM_METHODOLOGY_SOURCE || `${upstream}/methodologies/VIGIL.HarmImpactMatrix.v${version}.json`);
const registry = await load(process.env.VIGIL_HARM_REFERENCES_SOURCE || `${upstream}/references/VIGIL.ObservatoryReferenceRegistry.json`);

// Public cache mirrors the canonical scoring contract, not internal maintainer
// working notes from older upstream snapshots. The canonical VIGIL release is
// updated separately; this boundary prevents a stale source reintroducing them.
for (const internalField of ["working_amendments", "adjudication_guidance", "dimension_quantification_policy"]) {
  delete methodology[internalField];
}
if (methodology.assessment_pathway_selection) {
  delete methodology.assessment_pathway_selection.screening_contract;
}
for (const dimension of methodology.dimensions ?? []) {
  if (typeof dimension.adaptation_note === "string") {
    dimension.adaptation_note = dimension.adaptation_note.replaceAll("epistemic_reliance_to_reputational_harm", "downstream reliance and resulting reputational harm");
  }
  if (typeof dimension.interpretive_note === "string") {
    dimension.interpretive_note = dimension.interpretive_note.replaceAll("INFORM adjudication", "inform interpretation");
  }
}
if (methodology.methodology_id !== "VIGIL-HIM" || methodology.version !== version || !methodology.dimensions?.length) {
  throw new Error("Invalid or unexpected VIGIL-HIM methodology release");
}
const seen = new Set();
for (const dimension of methodology.dimensions) {
  if (!dimension.dimension_id || seen.has(dimension.dimension_id)) throw new Error("Missing or duplicate harm dimension");
  seen.add(dimension.dimension_id);
  for (const band of ["S1", "S2", "S3", "S4", "S5"]) {
    if (!dimension.thresholds?.[band]?.criterion?.trim()) throw new Error(`Missing ${dimension.dimension_id}/${band} criterion`);
  }
  if (!Array.isArray(dimension.quantitative_indicators) || !dimension.quantification_note) throw new Error(`Missing ${dimension.dimension_id} quantification guidance`);
}
const references = methodology.reference_ids.map(id => {
  const reference = registry.references.find(item => item.reference_id === id);
  if (!reference?.url || !reference.title) throw new Error(`Missing methodology reference ${id}`);
  return reference;
});
// Validate both inputs before replacing either committed snapshot. Fetch errors fail the build.
await writeFile(resolve(root, "src/data/vigil-harm-methodology.json"), JSON.stringify(methodology, null, 2) + "\n");
await writeFile(resolve(root, "src/data/vigil-harm-references.json"), JSON.stringify(references, null, 2) + "\n");
console.log(`Synced VIGIL-HIM ${version}: ${seen.size} dimensions and ${references.length} methodology references.`);
