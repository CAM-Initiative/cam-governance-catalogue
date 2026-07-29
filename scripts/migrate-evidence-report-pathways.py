#!/usr/bin/env python3
from pathlib import Path

path = Path('src/pages/evidence-chain-report.tsx')
text = path.read_text(encoding='utf-8')

def replace_once(old: str, new: str, label: str):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    text = text.replace(old, new)

replace_once('''type SourceEvidence = {
  title: string;
  description?: string;
  publisher?: string;
  date?: string;
  url?: string;
  sourceType?: string;
  accessStatus?: string;
};''', '''type SourceEvidence = {
  title: string;
  description?: string;
  publisher?: string;
  date?: string;
  url?: string;
  sourceType?: string;
  accessStatus?: string;
  sourceResidence?: string;
  sourceRole?: string;
};''', 'SourceEvidence type')

replace_once('''const caelestisArchiveCitation: SourceEvidence = {
  title: "O'Rourke, M. (2026). Caelestis Architecture Model — Public Archive (Version 1.1.0) [Computer software]. Zenodo.",
  url: "https://doi.org/10.5281/zenodo.20686316",
};

''', '', 'hard-coded Caelestis citation')

replace_once('''function chainState(chain: ReportChain, learnById: Map<string, LearnRecord>) {
  const hasCompleteLearningClosure = chain.learns.some((id) => learnById.get(id)?.chainState?.toLocaleLowerCase() === "complete");
  return hasCompleteLearningClosure && chain.failureModes.length > 0 && chain.proposals.length > 0 && chain.patches.length > 0
    ? "Complete"
    : "Incomplete";
}''', '''function hasDeclaredLearning(records: VigilIndexRecord[], learnRecords: LearnRecord[]) {
  if (learnRecords.some((record) => Boolean(record.abstractedLearning))) return true;
  return records.some((record) => [
    "lessons_learned",
    "learning_statement",
    "lesson_learned",
    "transferable_lesson",
    "governance_lesson",
    "reusable_governance_pattern",
    "future_design_implications",
    "future_design_implication",
    "feedback_into_future_design",
  ].some((key) => Boolean(displayText(record.raw[key]))));
}

function reportSectionAvailability(records: VigilIndexRecord[], learnRecords: LearnRecord[], chain: ReportChain) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const evidenceRecords = chain.observations.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record));
  const failureRecords = chain.failureModes.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record));
  const section01 = [...evidenceRecords, ...failureRecords].some((record) => externalSourceEvidenceFor(record).length > 0);
  return {
    "01": section01,
    "02": chainIds(chain).length > 0,
    "03": failureRecords.length > 0,
    "04": chain.proposals.some((id) => byId.has(id)),
    "05": chain.patches.some((id) => byId.has(id)),
    "06": hasDeclaredLearning(records, learnRecords),
  };
}

function chainState(records: VigilIndexRecord[], learnRecords: LearnRecord[], chain: ReportChain) {
  const availability = reportSectionAvailability(records, learnRecords, chain);
  return Object.values(availability).every(Boolean) ? "Complete" : "Incomplete";
}''', 'section-based completion')

replace_once('''      sourceType: displayText(item.source_type ?? item.type),
      accessStatus,
    }];''', '''      sourceType: displayText(item.source_type ?? item.type),
      accessStatus,
      sourceResidence: displayText(item.source_residence),
      sourceRole: displayText(item.source_role),
    }];''', 'source provenance mapping')

replace_once('''function externalSourceEvidenceFor(record: VigilIndexRecord): SourceEvidence[] {
  return sourceEvidenceFor(record).filter((source) => !isVigilRecordCitationSource(source));
}''', '''function externalSourceEvidenceFor(record: VigilIndexRecord): SourceEvidence[] {
  return sourceEvidenceFor(record).filter((source) => source.sourceResidence?.toLocaleLowerCase() === "external" && !isVigilRecordCitationSource(source));
}''', 'external source authority')

replace_once('''function collectCitations(records: VigilIndexRecord[], learnRecords: LearnRecord[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];''', '''function corpusProvenanceEvidenceFor(record: VigilIndexRecord): SourceEvidence[] {
  if (record.record_type !== "patch" && record.record_type !== "patch_note") return [];
  const provenance = isObject(record.raw.corpus_release_provenance) ? record.raw.corpus_release_provenance : undefined;
  if (!provenance) return [];
  const sources: SourceEvidence[] = [];
  for (const [label, key] of [["Implementation corpus state", "implementation_corpus_state"], ["Canonical corpus state", "canonical_corpus_state"]] as const) {
    const state = isObject(provenance[key]) ? provenance[key] : undefined;
    const commit = displayText(state?.commit);
    if (!commit) continue;
    sources.push({
      title: `Caelestis ${label.toLocaleLowerCase()} — ${commit}`,
      description: displayText(state?.relationship),
      publisher: "CAM Initiative",
      date: displayText(state?.date),
      url: `https://github.com/CAM-Initiative/Caelestis/commit/${commit}`,
      sourceType: "repository-source",
      sourceResidence: "cam-internal",
      sourceRole: key === "implementation_corpus_state" ? "implementation-evidence" : "verification-evidence",
    });
  }
  const release = isObject(provenance.published_release_at_implementation) ? provenance.published_release_at_implementation : undefined;
  if (displayText(release?.status)?.toLocaleLowerCase() === "verified") {
    const citation = displayText(release?.citation);
    const doi = displayText(release?.doi);
    if (citation) sources.push({ title: citation, publisher: "Zenodo", url: doi ? `https://doi.org/${doi}` : undefined, sourceType: "published-corpus-release", sourceResidence: "cam-internal", sourceRole: "verification-evidence" });
  }
  return sources;
}

function collectCitations(records: VigilIndexRecord[], learnRecords: LearnRecord[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];''', 'corpus provenance citations')

replace_once('''  citations.push({ ...caelestisArchiveCitation, number: citations.length + 1, kind: "source" });
  return citations;''', '''  for (const record of records) for (const source of corpusProvenanceEvidenceFor(record)) {
    const key = `source|${sourceKey(source)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ ...source, number: citations.length + 1, kind: "source" });
  }
  return citations;''', 'remove unconditional archive citation')

replace_once('''function RecordLedger({ records, learnRecords, chain, byId, learnById, citations }: { records: VigilIndexRecord[]; learnRecords: LearnRecord[]; chain: ReportChain; byId: Map<string, VigilIndexRecord>; learnById: Map<string, LearnRecord>; citations: Citation[] }) {
  const ordered = chainStages.flatMap((stage) => chain[stage.key].map((id) => ({ id, label: stage.label })));
  return <div className="overflow-hidden rounded-lg border border-border/70 bg-white/55">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/60 bg-white/45 px-4 py-2.5 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground"><span>Linked evidence-to-repair-and-learning record</span><span>Status</span></div>''', '''function failureClassification(record: VigilIndexRecord) {
  const classification = isObject(record.raw.failure_classification) ? record.raw.failure_classification : undefined;
  const group = displayText(classification?.canonical_failure_group);
  const code = displayText(classification?.failure_code ?? classification?.failure_family_code) ?? (group ? `FF.${group.replace(/[^A-Za-z0-9]+/g, "_").toLocaleUpperCase()}` : undefined);
  return {
    name: record.title,
    code,
    subtype: displayText(classification?.failure_subtype),
    taxonomy: displayText(classification?.taxonomy_reference),
  };
}

function RecordLedger({ records, learnRecords, chain, byId, learnById, citations }: { records: VigilIndexRecord[]; learnRecords: LearnRecord[]; chain: ReportChain; byId: Map<string, VigilIndexRecord>; learnById: Map<string, LearnRecord>; citations: Citation[] }) {
  const ordered = chainStages.flatMap((stage) => chain[stage.key].map((id) => ({ id, label: stage.label })));
  const failures = chain.failureModes.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record));
  return <div className="space-y-4">
    {failures.length > 0 && <section className="rounded-lg border border-cam-gold/35 bg-white/55 p-4"><p className="report-label">Authoritative failure classification{failures.length > 1 ? "s" : ""}</p><div className="mt-3 space-y-3">{failures.map((record) => { const failure = failureClassification(record); return <article key={record.id} className="border-l-2 border-cam-gold/45 pl-4"><h3 className="font-serif text-xl leading-snug text-foreground">{failure.name}</h3><p className="mt-1 font-mono text-sm text-cam-gold">{[failure.code, record.id].filter(Boolean).join(" · ")}</p>{failure.subtype && <p className="mt-1 text-sm text-muted-foreground">Subtype: {failure.subtype}</p>}{failure.taxonomy && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{failure.taxonomy}</p>}</article>; })}</div></section>}
    <div className="overflow-hidden rounded-lg border border-border/70 bg-white/55">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/60 bg-white/45 px-4 py-2.5 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground"><span>Authoritative evidence-to-repair-and-learning chain</span><span>Status</span></div>''', 'failure heading and ledger title')

# close the new outer wrapper at the end of RecordLedger
needle = '''    }) : <p className="px-4 py-5 text-base text-muted-foreground">No linked VIGIL records were found for this report.</p>}
  </div>;
}'''
replacement = '''    }) : <p className="px-4 py-5 text-base text-muted-foreground">No linked VIGIL records were found for this report.</p>}
    </div>
  </div>;
}'''
replace_once(needle, replacement, 'RecordLedger wrapper closure')

# Add corpus provenance panel to RepairStage before each PATCH provision table.
replace_once('''function RepairStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><p className="text-base leading-relaxed text-foreground/85">{summary(record)}</p><FieldGrid entries={[["Repair outcome", record.publicDisplay.patch?.outcome], ["Repair summary", record.publicDisplay.patch?.repairSummary], ["Implementation date", record.publicDisplay.patch?.implementationDate], ["Verification", record.publicDisplay.patch?.verificationStatus], ["Verified against", record.publicDisplay.patch?.verifiedAgainst], ["Patch type", record.patch_type], ["Change scope", record.change_scope], ["Implementation mode", record.implementation_mode]]} />{displayText(record.publicDisplay.patch?.residualMonitoring) && <div className="mt-4 border-t border-border/60 pt-3"><Narrative label="Residual monitoring" value={record.publicDisplay.patch?.residualMonitoring} /></div>}<ProvisionTable provisions={record.publicDisplay.corpusProvisions} /></article>) : <Incomplete text="No PATCH is linked yet. A repair may still be in development — check back later." availabilityNote={false} />}</div>;
}''', '''function CorpusReleaseProvenance({ record }: { record: VigilIndexRecord }) {
  const provenance = isObject(record.raw.corpus_release_provenance) ? record.raw.corpus_release_provenance : undefined;
  if (!provenance) return null;
  const implementation = isObject(provenance.implementation_corpus_state) ? provenance.implementation_corpus_state : undefined;
  const canonical = isObject(provenance.canonical_corpus_state) ? provenance.canonical_corpus_state : undefined;
  const release = isObject(provenance.published_release_at_implementation) ? provenance.published_release_at_implementation : undefined;
  return <section className="mt-4 rounded-lg border border-cam-gold/30 bg-white/50 p-4"><p className="report-label">Caelestis corpus provenance</p><FieldGrid entries={[["Provenance mode", provenance.provenance_mode], ["Implementation ref", implementation?.ref], ["Implementation commit", implementation?.commit], ["Implementation date", implementation?.date], ["Canonical ref", canonical?.ref], ["Canonical commit", canonical?.commit], ["Canonical date", canonical?.date], ["Published release at implementation", release?.status], ["Published version", release?.version]]} />{Array.isArray(provenance.limitations) && provenance.limitations.length > 0 && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{provenance.limitations.map(String).join(" ")}</p>}</section>;
}

function RepairStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><p className="text-base leading-relaxed text-foreground/85">{summary(record)}</p><FieldGrid entries={[["Repair outcome", record.publicDisplay.patch?.outcome], ["Repair summary", record.publicDisplay.patch?.repairSummary], ["Implementation date", record.publicDisplay.patch?.implementationDate], ["Verification", record.publicDisplay.patch?.verificationStatus], ["Verified against", record.publicDisplay.patch?.verifiedAgainst], ["Patch type", record.patch_type], ["Change scope", record.change_scope], ["Implementation mode", record.implementation_mode]]} />{displayText(record.publicDisplay.patch?.residualMonitoring) && <div className="mt-4 border-t border-border/60 pt-3"><Narrative label="Residual monitoring" value={record.publicDisplay.patch?.residualMonitoring} /></div>}<CorpusReleaseProvenance record={record} /><ProvisionTable provisions={record.publicDisplay.corpusProvisions} /></article>) : <Incomplete text="No PATCH is linked yet. A repair may still be in development — check back later." availabilityNote={false} />}</div>;
}''', 'PATCH provenance display')

replace_once('''<p className="mt-1 font-serif text-xl text-foreground">{chainState(state.chain, learnById)}</p>''', '''<p className="mt-1 font-serif text-xl text-foreground">{chainState(state.records, state.learnRecords, state.chain)}</p>''', 'render section-based completion')

path.write_text(text, encoding='utf-8')
print('Evidence report pathway and corpus provenance UX migration applied.')
