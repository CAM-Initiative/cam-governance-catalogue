import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const escape = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

test("interactive and static methodology preserve every canonical criterion and quantitative indicator", async () => {
  const methodology = JSON.parse(await read("src/data/vigil-harm-methodology.json"));
  const published = await read("docs/observatory/harm-impact-assessment/index.html");
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { HarmImpactMatrix } = await server.ssrLoadModule("/components/vigil/HarmImpactMatrix.tsx");
    const rendered = renderToStaticMarkup(React.createElement(HarmImpactMatrix));
    for (const dimension of methodology.dimensions) {
      for (const band of ["S1", "S2", "S3", "S4", "S5"]) {
        const criterion = dimension.thresholds[band].criterion;
        // Threshold emphasis can insert strong tags without altering canonical wording.
        assert.ok(rendered.replace(/<\/?strong[^>]*>/g, "").replaceAll("&#x27;", "&#39;").includes(escape(criterion)), `${dimension.dimension_id}/${band}: interactive criterion`);
        assert.ok(published.includes(escape(criterion)), `${dimension.dimension_id}/${band}: static criterion`);
        const aggregate = dimension.thresholds[band].aggregate_harm_threshold;
        if (aggregate) assert.ok(published.includes(escape(aggregate)), `${dimension.dimension_id}/${band}: static aggregate criterion`);
      }
      for (const indicator of dimension.quantitative_indicators) {
        const label = escape(indicator.replaceAll("_", " "));
        assert.ok(rendered.includes(label), `${dimension.dimension_id}: interactive indicator`);
        assert.ok(published.includes(label), `${dimension.dimension_id}: static indicator`);
      }
    }
    assert.ok(published.includes(methodology.version));
    assert.doesNotMatch(published, /reviews eleven harm dimensions|VIGIL-HIM 1\.0\.1/);
  } finally {
    await server.close();
  }
});

test("methodology source trail covers every registered reference and separates modelled aggregate assessments", async () => {
  const methodology = JSON.parse(await read("src/data/vigil-harm-methodology.json"));
  const references = JSON.parse(await read("src/data/vigil-harm-references.json"));
  const published = await read("docs/observatory/harm-impact-assessment/index.html");
  assert.deepEqual(references.map(item => item.reference_id), methodology.reference_ids);
  for (const reference of references) assert.ok(published.includes(escape(reference.url)), reference.reference_id);
  assert.match(published, /not a count of injured people/);
  assert.match(published, /Select the assessment pathway before scoring/);
  assert.match(published, /not externally validated clinical severity conversions/);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { HarmImpactMatrix } = await server.ssrLoadModule("/components/vigil/HarmImpactMatrix.tsx");
    const assessment = { assessment_pathway: "generic_deployed_evaluation", overall_severity: "SU", dimensions: [] };
    const html = renderToStaticMarkup(React.createElement(HarmImpactMatrix, { assessment }));
    assert.match(html, /Aggregate Harm — modelled from deployed evaluation/);
    assert.match(html, /not a count of injured people/);
    assert.doesNotMatch(html, /vigil-harm-methodology-table/);
  } finally {
    await server.close();
  }
});
