import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (name) => readFile(resolve(root, name), "utf8");

test("Alignment Taxonomy renders canonical class invariants and distinct success/failure evidence", async () => {
  const [page, loader] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/lib/vigilFailureTaxonomy.ts"),
  ]);
  assert.match(loader, /success_condition\?: string/);
  assert.match(loader, /failure_condition\?: string/);
  assert.match(loader, /success_recognition\?: FailureTaxonomyRecognition/);
  assert.match(loader, /failure_recognition\?: FailureTaxonomyRecognition/);
  assert.match(page, /<blockquote>\{item\.invariant\}<\/blockquote>/);
  assert.match(page, /<h4>Success condition<\/h4>/);
  assert.match(page, /item\.success_recognition\?\.required_conditions/);
  assert.match(page, /<h4>Failure condition<\/h4>/);
  assert.match(page, /item\.failure_recognition\?\.required_conditions/);
  assert.match(page, /item\.failure_recognition\?\.indicators\?\.length/);
  assert.match(page, /Exclusions from failure recognition/);
  assert.match(page, /Missing failure evidence does not establish success/);
  assert.doesNotMatch(page, /<h4>Recognition criteria<\/h4>/);
});

test("Family/class navigation displays immutable IDs rather than renumbering by position", async () => {
  const [page, styles] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/vigil-failure-taxonomy-refinements.css"),
  ]);
  assert.match(page, /function shortTaxonomyId\(id: string\)/);
  assert.match(page, /return id\.replace\(\/\^VIGIL-\//);
  assert.match(page, /shortTaxonomyId\(familyId\)/);
  assert.match(page, /shortTaxonomyId\(item\.class_id\)/);
  assert.match(page, /shortTaxonomyId\(family\.family_id\)/);
  assert.match(styles, /\.vigil-taxonomy-manual-reference-number/);
  assert.match(page, /state\.data\.index\.families\.reduce\(\(sum, family\) => sum \+ family\.class_count, 0\)/);
});

test("Family pages are family-only entry points; individual class detail is never embedded", async () => {
  const [page, publisher] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("scripts/prepare-github-pages.js"),
  ]);
  const family = page.split("function FamilyManualSection(")[1]?.split("export default function VigilFailureTaxonomy()")[0] ?? "";
  assert.ok(family, "Family manual component is present");
  assert.doesNotMatch(family, /<ClassManualCard|document\.classes\.map|allowed_class_ids/);
  assert.match(family, /Contents navigation/);
  assert.match(page, /<ClassManualCard item=\{item\}/);
  const staticFamily = publisher.split("const familyBody = `")[1]?.split("  </main>`;")[0] ?? "";
  assert.ok(staticFamily, "Static family fallback is present");
  assert.doesNotMatch(staticFamily, /<h2>Fidelity classes<\/h2>|familyClasses\.map/);
  assert.match(publisher, /for \(const item of familyClasses\)/);
});

test("Class detail keeps canonical evidence while disclosing technical sections on its own route", async () => {
  const page = await read("src/pages/vigil-failure-taxonomy.tsx");
  assert.match(page, /<details className="vigil-taxonomy-class-disclosure">/);
  assert.match(page, /Recognition tests and exclusions/);
  assert.match(page, /Case Files and observed outcomes/);
  assert.match(page, /Technical definition, relationships and sources/);
  assert.match(page, /<blockquote>\{item\.invariant\}<\/blockquote>/);
  assert.match(page, /<h4>Success condition<\/h4>/);
  assert.match(page, /<h4>Failure condition<\/h4>/);
  assert.match(page, /<SupportingEvidence item=\{item\} \/>/);
  assert.doesNotMatch(page, /showSupportingEvidence/);
});
