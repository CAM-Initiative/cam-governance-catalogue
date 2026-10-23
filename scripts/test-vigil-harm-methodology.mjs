import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const escape = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const { aggregateHarmSections, aggregateHarmBandSummary, publicHarmIndicatorLabel, HARM_PATHWAY_STEPS } = await import("../src/lib/vigilHarmPublic.mjs");

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
        assert.ok(published.replace(/<\/?strong[^>]*>/g, "").includes(escape(criterion)), `${dimension.dimension_id}/${band}: static criterion`);
        const aggregate = dimension.thresholds[band].aggregate_harm_threshold;
        if (aggregate) {
          const sections = aggregateHarmSections(aggregate);
          assert.equal(sections.structured, true, `${dimension.dimension_id}/${band}: canonical aggregate criterion is decomposable`);
          assert.ok(published.replace(/<\\/?strong[^>]*>/g, "").includes(escape(aggregateHarmBandSummary(aggregate))), `${dimension.dimension_id}/${band}: public band threshold and outcome`);
          assert.ok(published.includes(escape(sections.mechanism)), `${dimension.dimension_id}/${band}: shared mechanism criterion`);
        }
      }
      for (const indicator of dimension.quantitative_indicators) {
        const label = escape(publicHarmIndicatorLabel(indicator));
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
  assert.match(published, /Choose the assessment pathway/);
  assert.equal(HARM_PATHWAY_STEPS.length, 5);
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


test("public harm methodology excludes maintainer workflow and repeated boilerplate", async () => {
  const methodology = JSON.parse(await read("src/data/vigil-harm-methodology.json"));
  const published = await read("docs/observatory/harm-impact-assessment/index.html");
  for (const key of ["working_amendments", "adjudication_guidance", "dimension_quantification_policy"]) {
    assert.equal(Object.hasOwn(methodology, key), false, `internal methodology key: ${key}`);
  }
  assert.equal(Object.hasOwn(methodology.assessment_pathway_selection, "screening_contract"), false);
  assert.doesNotMatch(published, /epistemic_reliance_to_reputational_harm|working_amendments|screening_contract|Severity display|generic_deployed_evaluation/);
  assert.doesNotMatch(published, /These are modelled aggregate effects, NOT|Only for generic deployed-model benchmark\/product-level Incidents/);
  assert.doesNotMatch(published, /Numerical durations, event counts and population measures are evidence-tested domain anchors/);
  assert.ok(published.includes("Evidence required for every band:"));
  const aggregates = methodology.dimensions.flatMap(dimension =>
    Object.values(dimension.thresholds).flatMap(item => item.aggregate_harm_threshold ? [item.aggregate_harm_threshold] : [])
  );
  assert.equal(aggregates.length, 25);
  assert.equal(methodology.dimensions.length, 12);
});

test("threshold emphasis preserves wording and highlights quantitative and outcome boundaries", async () => {
  const { harmThresholdParts } = await import("../src/lib/vigilHarmEmphasis.mjs");
  const methodology = JSON.parse(await read("src/data/vigil-harm-methodology.json"));
  for (const dimension of methodology.dimensions) {
    for (const threshold of Object.values(dimension.thresholds)) {
      for (const text of [threshold.criterion, threshold.aggregate_harm_threshold].filter(Boolean)) {
        assert.equal(harmThresholdParts(text).map(part => part.text).join(""), text);
      }
    }
  }
  for (const text of ["at least USD 1,000,000", "more than 5%", "approximately 7–30 days", "professional treatment", "major loss of livelihood, role or professional standing", "not an automatic S4"]) {
    assert.deepEqual(harmThresholdParts(text), [{ text, emphasis: true }]);
  }
});
