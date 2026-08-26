import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);

async function caseFileSource() {
  return readFile(resolve(repoRoot, "src/pages/vigil-case-file.tsx"), "utf8");
}

test("Case File References remain bibliographic and do not republish evidence commentary", async () => {
  const source = await caseFileSource();
  const evidenceMapper = source.match(/function externalEvidenceFor[\s\S]*?function dedupeEvidence/)?.[0] ?? "";
  const referencesRenderer = source.match(/if \(stageId === "references"\)[\s\S]*?return null;/)?.[0] ?? "";

  assert.ok(evidenceMapper, "externalEvidenceFor() must remain present");
  assert.ok(referencesRenderer, "References renderer must remain present");

  assert.match(evidenceMapper, /publisher:/);
  assert.match(evidenceMapper, /date:/);
  assert.match(evidenceMapper, /url:/);
  assert.doesNotMatch(evidenceMapper, /source_context|relevance_note|source\.description/);
  assert.doesNotMatch(referencesRenderer, /source\.description/);
});

test("Observation retains evidence context and VIGIL interpretation", async () => {
  const source = await caseFileSource();
  const observationRenderer = source.match(/if \(stageId === "observe"\)[\s\S]*?if \(stageId === "classify"\)/)?.[0] ?? "";

  assert.ok(observationRenderer, "Observation renderer must remain present");
  assert.match(observationRenderer, /publicDisplay\.observation\?\.context/);
  assert.match(observationRenderer, /publicDisplay\.observation\?\.interpretation/);
  assert.match(observationRenderer, /VIGIL interpretation/);
});
