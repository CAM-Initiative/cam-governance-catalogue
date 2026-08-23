import { readFile, writeFile } from "node:fs/promises";

const CASE_FILE = "src/pages/vigil-case-file.tsx";
const REPORT_FILE = "src/pages/evidence-chain-report.tsx";
const CSS_FILE = "src/vigil-ux-v4.css";
const UX_FILE = "src/public/vigil-ux-enhancements.js";
const TEST_FILE = "scripts/test-vigil-observatory.mjs";

function replaceExact(source, before, after, label) {
  if (!source.includes(before)) {
    if (source.includes(after)) return source;
    throw new Error(`Migration pattern not found: ${label}`);
  }
  return source.replace(before, after);
}

async function migrateCaseFile() {
  let source = await readFile(CASE_FILE, "utf8");
  source = replaceExact(
    source,
    'import { VIGIL_EVIDENCE_REPAIR_SECTIONS } from "@/lib/vigilEvidenceRepair";',
    'import { VIGIL_PUBLIC_REPORT_SECTIONS } from "@/lib/vigilEvidenceRepair";',
    "Case File shared-section import",
  );
  source = replaceExact(
    source,
    `const PROVENANCE_VIEW = {
  id: "provenance",
  number: "",
  label: "Sources & provenance",
  description: "External bibliography and governance-corpus implementation provenance supporting the Case File.",
} as const;

const CASE_VIEWS = [...VIGIL_EVIDENCE_REPAIR_SECTIONS, PROVENANCE_VIEW] as const;`,
    `const CASE_VIEWS = VIGIL_PUBLIC_REPORT_SECTIONS;`,
    "Case File References definition",
  );
  source = source.replaceAll('stageId === "provenance"', 'stageId === "references"');
  source = source.replaceAll('activeStage === "provenance"', 'activeStage === "references"');
  source = source.replaceAll('setActiveStage("provenance")', 'setActiveStage("references")');
  source = source.replaceAll('case-panel-provenance', 'case-panel-references');
  source = source.replaceAll('Sources &amp; provenance', 'References');
  source = source.replaceAll('Sources & provenance', 'References');
  source = replaceExact(
    source,
    `    <nav className="vigil-case-stage-nav" aria-label="Case File evidence-to-repair sections">
      <div className="vigil-case-stage-tabs" role="tablist">
        {VIGIL_EVIDENCE_REPAIR_SECTIONS.map((stage) => <button
          key={stage.id}
          type="button"
          role="tab"
          aria-selected={activeStage === stage.id}
          aria-controls={\`case-panel-\${stage.id}\`}
          className={activeStage === stage.id ? "is-active" : undefined}
          onClick={() => setActiveStage(stage.id)}
        ><span>{stage.number}</span>{stage.label}</button>)}
      </div>
      <button
        type="button"
        aria-pressed={activeStage === "references"}
        className={\`mt-2 inline-flex min-h-10 items-center rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.1em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring \${activeStage === "references" ? "border-primary/55 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"}\`}
        onClick={() => setActiveStage("references")}
      >
        References
      </button>
    </nav>`,
    `    <nav className="vigil-case-stage-nav" aria-label="Case File sections">
      <div className="vigil-case-stage-tabs" role="tablist">
        {CASE_VIEWS.map((stage) => <button
          key={stage.id}
          type="button"
          role="tab"
          aria-selected={activeStage === stage.id}
          aria-controls={\`case-panel-\${stage.id}\`}
          className={activeStage === stage.id ? "is-active" : undefined}
          onClick={() => setActiveStage(stage.id)}
        ><span>{stage.number}</span>{stage.label}</button>)}
      </div>
    </nav>`,
    "Case File seven-tab navigation",
  );
  await writeFile(CASE_FILE, source);
}

async function migrateReport() {
  let source = await readFile(REPORT_FILE, "utf8");
  source = replaceExact(
    source,
    'import type { CorpusProvision, RecordChain } from "@/lib/vigilPublicDisplay";',
    'import type { CorpusProvision, RecordChain } from "@/lib/vigilPublicDisplay";\nimport { VIGIL_PUBLIC_REPORT_SECTIONS } from "@/lib/vigilEvidenceRepair";',
    "Report shared-section import",
  );
  const reportStepsStart = source.indexOf("const reportSteps = [");
  const reportStepsEnd = source.indexOf("] as const;", reportStepsStart);
  if (reportStepsStart >= 0 && reportStepsEnd >= 0) {
    source = `${source.slice(0, reportStepsStart)}const reportSteps = VIGIL_PUBLIC_REPORT_SECTIONS;${source.slice(reportStepsEnd + "] as const;".length)}`;
  } else if (!source.includes("const reportSteps = VIGIL_PUBLIC_REPORT_SECTIONS;")) {
    throw new Error("Migration pattern not found: reportSteps");
  }

  const citationsStart = source.indexOf("function Citations({ citations }");
  const citationsEnd = source.indexOf("\n\nfunction normalizeReportRecord", citationsStart);
  if (citationsStart >= 0 && citationsEnd >= 0) {
    const replacement = `function Citations({ citations }: { citations: Citation[] }) {
  if (!citations.length) return <Incomplete text="No references are currently available in the public projection." availabilityNote={false} />;
  return <ol className="report-citations space-y-3">{citations.map((citation) => <li key={citation.number} className="flex gap-3 text-base leading-relaxed text-foreground/85">
    <span className="font-mono text-sm text-cam-gold">[{citation.number}]</span>
    <span className="min-w-0">
      {citation.kind === "vigil"
        ? <cite className="not-italic"><span className="font-medium">{citation.recordId} — {citation.recordTitle}</span><span className="text-muted-foreground"> — VIGIL Observatory{citation.recordLastUpdated ? \` · \${citation.recordLastUpdated}\` : ""}{citation.recordVersion ? \`, Version \${citation.recordVersion}\` : ""}{citation.url ? "," : "."}</span></cite>
        : <><span className="font-medium">{citation.title}</span>{[citation.publisher, citation.date].filter(Boolean).length ? <span className="text-muted-foreground"> — {[citation.publisher, citation.date].filter(Boolean).join(" · ")}</span> : null}</>}
      {citation.url ? <><br /><a href={citation.url} target="_blank" rel="noreferrer" className="break-all text-[hsl(32_62%_25%)] underline decoration-cam-gold/50 underline-offset-4">{citation.url}</a></> : null}
    </span>
  </li>)}</ol>;
}`;
    source = `${source.slice(0, citationsStart)}${replacement}${source.slice(citationsEnd)}`;
  } else if (!source.includes('className="report-citations space-y-3"')) {
    throw new Error("Migration pattern not found: Citations component");
  }

  source = replaceExact(
    source,
    `      <StepSection {...reportSteps[5]} included={includedSections[reportSteps[5].number] !== false} onToggle={() => toggleSection(reportSteps[5].number)}><LearnStage records={state.learnRecords} fallbackRecords={state.records} /></StepSection>
      <Citations citations={citations} />`,
    `      <StepSection {...reportSteps[5]} included={includedSections[reportSteps[5].number] !== false} onToggle={() => toggleSection(reportSteps[5].number)}><LearnStage records={state.learnRecords} fallbackRecords={state.records} /></StepSection>
      <StepSection {...reportSteps[6]} included={includedSections[reportSteps[6].number] !== false} onToggle={() => toggleSection(reportSteps[6].number)}><Citations citations={citations} /></StepSection>`,
    "Report Section 07 rendering",
  );
  await writeFile(REPORT_FILE, source);
}

async function migrateCss() {
  let source = await readFile(CSS_FILE, "utf8");
  source = replaceExact(source, "grid-template-columns: repeat(6, minmax(0, 1fr));", "grid-template-columns: repeat(7, minmax(0, 1fr));", "Case File seven-column tab grid");
  await writeFile(CSS_FILE, source);
}

async function removeRuntimeReferencesShim() {
  let source = await readFile(UX_FILE, "utf8");
  source = source.replace('  const REFERENCES_SECTION = "data-vigil-references-section";\n', "");
  source = source.replace('      .vigil-case-stage-tabs { grid-template-columns:repeat(7,minmax(0,1fr)) !important; }\n      [${REFERENCES_SECTION}].report-section-excluded { opacity:.58; }\n      @media print { [${REFERENCES_SECTION}].report-section-excluded { display:none !important; }\n', "");
  for (const [startMarker, endMarker] of [
    ["  function normalizeCaseReferences() {", "\n\n  function normalizeReportReferences() {"],
    ["  function normalizeReportReferences() {", "\n\n  function fixReportNavigation() {"],
  ]) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);
    if (start >= 0 && end >= 0) source = `${source.slice(0, start)}${source.slice(end + 2)}`;
  }
  source = source.replace("    normalizeCaseReferences();\n", "");
  source = source.replace("    normalizeReportReferences();\n", "");
  await writeFile(UX_FILE, source);
}

async function addRegressionTest() {
  let source = await readFile(TEST_FILE, "utf8");
  const marker = 'test("Case Files and generated reports expose References as public section 07"';
  if (source.includes(marker)) return;
  source += `\n\ntest("Case Files and generated reports expose References as public section 07", async () => {
  const shared = await readFile(resolve(repoRoot, "src/lib/vigilEvidenceRepair.ts"), "utf8");
  const casePage = await readFile(resolve(repoRoot, "src/pages/vigil-case-file.tsx"), "utf8");
  const report = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report.tsx"), "utf8");
  const css = await readFile(resolve(repoRoot, "src/vigil-ux-v4.css"), "utf8");
  assert.match(shared, /id: "references"/);
  assert.match(shared, /number: "07"/);
  assert.match(shared, /label: "References"/);
  assert.match(casePage, /const CASE_VIEWS = VIGIL_PUBLIC_REPORT_SECTIONS/);
  assert.match(casePage, /CASE_VIEWS\.map/);
  assert.doesNotMatch(casePage, /Sources & provenance/);
  assert.match(report, /const reportSteps = VIGIL_PUBLIC_REPORT_SECTIONS/);
  assert.match(report, /reportSteps\[6\]/);
  assert.match(css, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\);/);
});\n`;
  await writeFile(TEST_FILE, source);
}

await migrateCaseFile();
await migrateReport();
await migrateCss();
await removeRuntimeReferencesShim();
await addRegressionTest();
console.log("VIGIL References v7 source migration complete.");
