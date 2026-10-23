import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = resolve(new URL("..", import.meta.url).pathname);
const require = createRequire(import.meta.url);
const file = resolve(root, "src/components/vigil/IncidentContextSection.tsx");
const source = await readFile(file, "utf8");
const output = ts.transpileModule(source, {
  fileName: file,
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
  reportDiagnostics: true,
});
const diagnostics = output.diagnostics ?? [];
assert.equal(diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error).length, 0);
const exports = {};
new Function("exports", "require", output.outputText)(exports, require);
const { IncidentContextSection, IncidentContextLimitations } = exports;

const references = { "source_records[0]": 1, "source_records[1]": 2 };
function render(raw, affectedSystems = []) {
  return renderToStaticMarkup(React.createElement(IncidentContextSection, {
    raw, affectedSystems, sourceReferenceNumbers: references,
  }));
}
function renderLimits(raw) {
  return renderToStaticMarkup(React.createElement(IncidentContextLimitations, {
    raw, sourceReferenceNumbers: references,
  }));
}

test("Section 01 groups legacy context without competing numbers or one-line descriptions", () => {
  const raw = {
    system_context: {
      platform_or_vendor: "OpenAI",
      product_or_service: "Other",
      specific_model_or_runtime: "Internal evaluation model; precise runtime not established",
      interface_surface: ["Internal evaluation", "NSW Government mapping service"],
      component_role: ["evaluation", "external-service"],
      agent_context: {
        agentic_status: "unknown",
        evidence_basis: "Architecture and instance count were not disclosed.",
        source_record_refs: ["source_records[0]"],
      },
      occurrence_environment: {
        deployment_state: "pre-deployment",
        external_reach: "live-external",
        activity_contexts: ["training", "evaluation"],
        activity_actor: "provider-internal",
        environment_detail: "An internal training run reached a live public service.",
        evidence_basis: "OpenAI source explicitly describes evaluation.",
        source_record_refs: ["source_records[0]"],
      },
    },
    jurisdictional_context: {
      primary_jurisdiction: "Australia",
      secondary_jurisdictions: ["New South Wales"],
      cross_border_relevance: "Provider-internal model reached a live Australian service.",
      regulatory_surface: ["NSW cybersecurity", "public sector data governance"],
      sector: "Government digital services",
    },
  };
  const html = render(raw);
  const limits = renderLimits(raw);
  for (const heading of [
    "Incident Context", "Systems &amp; Technology", "Operational Environment",
    "Affected Parties &amp; Institutions", "Geographic &amp; Jurisdictional Context",
    "Regulatory Context",
  ]) assert.ok(html.includes(heading), heading);
  assert.match(html, /An internal training run reached a live public service/);
  assert.doesNotMatch(html, /Architecture and instance count were not disclosed/);
  assert.match(limits, /Architecture and instance count were not disclosed/);
  assert.match(html, /Provider-internal model reached a live Australian service/);
  assert.match(html, /An internal training run reached a live public service\.[\s\S]*?href="#vigil-evidence-reference-1"[\s\S]*?>\[1\]<\/a>/);
  assert.equal((html.match(/href="#vigil-evidence-reference-1"/g) ?? []).length, 1, "one unique operational source should create one citation");
  assert.doesNotMatch(html, /Source \[1\]|>Evidence<\/span>/);
  assert.doesNotMatch(html, /class="vigil-context-sources"/);
  assert.match(html, /#vigil-evidence-reference-1/);
  assert.doesNotMatch(html, /Geographic roles have not yet been structurally assessed/);
  assert.match(limits, /Geographic roles have not yet been structurally assessed/);
  assert.doesNotMatch(html, /vigil-context-group-number|Platforms, products, runtimes and architectural components|Occurrence metadata/);
  assert.doesNotMatch(html, /Affected systems — Platforms/);
});

test("reviewed entities and geographic relations retain roles, separate countries and attribution", () => {
  const html = render({
    system_context: { platform_or_vendor: "Multi Vendor" },
    affected_party_context: {
      entities: [{
        party_id: "PARTY-001", name: "Illustrative public agency",
        kind: "service", roles: ["affected-service"],
        evidence_state: "attributed",
        evidence_basis: "Publisher described the service affected.",
        source_record_refs: ["source_records[0]"],
      }],
    },
    jurisdictional_context: {
      primary_jurisdiction: "Australia / United States",
      normalized_geography: {
        scope: "cross-border",
        relations: [{
          relationship_id: "GEO-001",
          role: "affected-service-jurisdiction",
          evidence_state: "attributed",
          evidence_basis: "The public service was located in NSW.",
          source_record_refs: ["source_records[0]"],
          party_refs: ["PARTY-001"],
          locations: [{ country_code: "AU", subdivision_code: "AU-NSW" }],
        }, {
          relationship_id: "GEO-002",
          role: "provider-location",
          evidence_state: "disputed",
          evidence_basis: "Provider location remains contested in the source.",
          source_record_refs: ["source_records[1]"],
          locations: [{ country_code: "US" }],
        }],
      },
    },
  });
  assert.match(html, /Illustrative public agency/);
  assert.match(html, /Affected Service Jurisdiction/);
  assert.match(html, /Provider Location/);
  assert.match(html, /AU-NSW · Australia/);
  assert.match(html, /United States/);
  assert.match(html, /Attribution|Attributed/);
  assert.match(html, /Disputed/);
  assert.match(html, /Publisher described the service affected/);
  assert.match(html, /#vigil-evidence-reference-2/);
  assert.match(html, /Publisher described the service affected\.[\s\S]*?href="#vigil-evidence-reference-1"[\s\S]*?>\[1\]<\/a>/);
  assert.doesNotMatch(html, /Source \[|>Evidence<\/span>/);
  assert.doesNotMatch(html, /Geographic roles have not yet been structurally assessed/);
});

test("unresolved relationship must not receive an invented location, regulator outcome or link", () => {
  const raw = {
    jurisdictional_context: {
      primary_jurisdiction: "Not established",
      regulatory_surface: ["Example candidate regulatory context"],
      normalized_geography: {
        scope: "not-established",
        relations: [{
          relationship_id: "GEO-001",
          role: "occurrence-location",
          evidence_state: "unresolved",
          evidence_basis: "The source does not identify where the execution occurred.",
          source_record_refs: [],
          locations: [],
        }],
      },
    },
  };
  const html = render(raw);
  const limits = renderLimits(raw);
  assert.match(html, /aria-label="Location not recorded"/);
  assert.doesNotMatch(html, /No confirmed geographic location is recorded for this relationship/);
  assert.match(limits, /No confirmed geographic location is recorded for this relationship/);
  assert.doesNotMatch(html, /where the execution occurred/);
  assert.match(limits, /where the execution occurred/);
  assert.doesNotMatch(html, /Consult 04 Compliance/);
  assert.match(limits, /Consult 04 Compliance/);
  assert.doesNotMatch(html, /<a [^>]*href="#vigil-evidence-reference/);
});

test("the five subsection controls remain in their own Stage 01 renderer, not a top-level stage", async () => {
  const page = await readFile(resolve(root, "src/pages/vigil-case-file.tsx"), "utf8");
  assert.match(page, /if \(stageId === "observe"\)/);
  assert.match(page, /<IncidentContextSection raw=\{incident\.raw\}/);
  assert.match(page, /"case-observe": "Incident evidence and context"/);
  assert.doesNotMatch(page, /Affected systems — Platforms, products and runtimes named in the evidence/);
});

test("Both interactive Case File and print report consolidate Incident Context limits within 06 References", async () => {
  const [caseFile, report] = await Promise.all([
    readFile(resolve(root, "src/pages/vigil-case-file.tsx"), "utf8"),
    readFile(resolve(root, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
  ]);
  assert.match(caseFile, /if \(stageId === "references"\)[\s\S]*<IncidentContextLimitations raw=\{incident\.raw\}/);
  assert.match(caseFile, /Limits of the assessment/);
  assert.match(report, /<Stage number="06" label="References">[\s\S]*<IncidentContextLimitations raw=\{incident\.raw\}/);
  assert.match(report, /Limits of the assessment/);
  assert.match(report, /STANDARD_VIGIL_ASSESSMENT_LIMITS/);
  assert.match(report, /nonAssessedHarmDimensionLimitItems/);
});

test("reference formatting follows Section 02 throughout the Case File and print report", async () => {
  const [assessment, component, css, report] = await Promise.all([
    readFile(resolve(root, "src/components/vigil/HarmImpactMatrix.tsx"), "utf8"),
    readFile(resolve(root, "src/components/vigil/IncidentContextSection.tsx"), "utf8"),
    readFile(resolve(root, "src/vigil-case-file-dossier.css"), "utf8"),
    readFile(resolve(root, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
  ]);
  assert.match(assessment, /vigil-harm-inline-references/);
  assert.match(component, /function SourceCitations\(/);
  assert.match(component, /aria-label=\{`Evidence reference \$\{n\}`\}/);
  assert.doesNotMatch(component, /Source \[|<span>Evidence<\/span>|function SourceLinks\(/);
  assert.match(css, /\.vigil-case-file-page \.vigil-context-citations \{/);
  assert.match(report, /<IncidentContextSection raw=\{incident\.raw\}/);
  assert.match(report, /<IncidentContextLimitations raw=\{incident\.raw\}/);
});

test("unpublished source record refs never produce invented bibliography links", () => {
  const html = render({
    affected_party_context: {
      entities: [{
        party_id: "PARTY-UNLINKED",
        name: "Unlinked source",
        roles: ["affected-service"],
        evidence_basis: "Relationship described but not indexed.",
        source_record_refs: ["source_records[94]"],
      }],
    },
  });
  assert.doesNotMatch(html, /href="#vigil-evidence-reference-94"/);
  assert.match(html, /source reference unavailable/);
});
