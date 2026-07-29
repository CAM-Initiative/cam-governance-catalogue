import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { loadVigilRecordDetail, loadVigilRegistryRecords, type UnknownRecord } from "@/lib/vigilRegistry";
import { normalizeRecords, normalizeVigilRecord, type VigilIndexRecord } from "@/lib/vigilPresentation";
import type { CorpusProvision, RecordChain } from "@/lib/vigilPublicDisplay";

type ReportChain = RecordChain & { learns: string[] };

type LearnRecord = {
  raw: UnknownRecord;
  id: string;
  title: string;
  reportTitle: string;
  caseDescriptor?: string;
  summary: string;
  abstractedLearning: string;
  mustNotBeForgotten: string[];
  futureApplication: string[];
  generalisationBoundary?: string;
  primaryFailureMode?: string;
  primaryFailureFamilyCode?: string;
  canonicalFailureName?: string;
  taxonomyReference?: string;
  taxonomyStatus?: string;
  establishingPatchId?: string;
  relatedObservations: string[];
  relatedFailureModes: string[];
  relatedProposals: string[];
  relatedPatchNotes: string[];
  chainState?: string;
  monitoringRequired: boolean;
  incidentStatus?: string;
  camRepairStatus?: string;
  recordState?: string;
  recordVersion?: string;
  recordLastUpdated?: string;
  githubBlobUrl?: string;
  rawUrl?: string;
};

const chainStages: Array<{ key: keyof ReportChain; label: string; singular: string }> = [
  { key: "observations", label: "Observation / Research", singular: "Observation or research" },
  { key: "failureModes", label: "Failure Mode", singular: "Failure mode" },
  { key: "proposals", label: "Proposal", singular: "Proposal" },
  { key: "patches", label: "PATCH", singular: "PATCH" },
  { key: "learns", label: "LEARN", singular: "LEARN" },
];

const reportSteps = [
  { number: "01", label: "Observation", description: "The signal, incident, research basis, or source evidence that began the chain." },
  { number: "02", label: "Record", description: "The primary linked VIGIL records and the provenance preserved across the chain." },
  { number: "03", label: "Classification", description: "The repeatable failure mode or governance pattern identified from the evidence." },
  { number: "04", label: "Diagnosis", description: "The governance weakness, proposed response, and decision pathway." },
  { number: "05", label: "Repair", description: "The implemented corpus repair, relied-upon control, verification, and residual monitoring." },
  { number: "06", label: "Learn", description: "The durable, bounded governance knowledge produced by the completed evidence-to-repair chain." },
] as const;

type ReportState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; learnRecords: LearnRecord[]; chain: ReportChain; sourceId: string; generatedAt: string }
  | { status: "error"; message: string };

type SourceEvidence = {
  title: string;
  description?: string;
  publisher?: string;
  date?: string;
  url?: string;
  sourceType?: string;
  accessStatus?: string;
  sourceResidence?: string;
  sourceRole?: string;
};

type Citation =
  | (SourceEvidence & { number: number; kind: "source" })
  | {
      number: number;
      kind: "vigil";
      recordId: string;
      title: string;
      recordTitle: string;
      recordVersion?: string;
      recordLastUpdated?: string;
      url?: string;
    };

const LEARN_ID_PATTERN = /^VIGIL-\d{4}-LEARN-\d{4}$/i;

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAt(record: UnknownRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (Array.isArray(current) && /^\d+$/.test(part)) return current[Number(part)];
    return isObject(current) ? current[part] : undefined;
  }, record);
}

function firstValue(record: UnknownRecord, paths: string[]): unknown {
  for (const path of paths) {
    const value = valueAt(record, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function textValue(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function textList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const seen = new Set<string>();
  return values.flatMap((item) => {
    const itemText = textValue(item);
    return itemText ? [itemText] : [];
  }).filter((item) => {
    const key = item.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueIds(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function linkedIds(record: UnknownRecord, key: string) {
  return textList(valueAt(record, `linked_records.${key}`)).filter((id) => /^VIGIL-/i.test(id));
}

function taxonomyLink(record: UnknownRecord) {
  const links = record.failure_taxonomy_links;
  return Array.isArray(links) && isObject(links[0]) ? links[0] : undefined;
}

function normalizeLearnRecord(record: UnknownRecord): LearnRecord | undefined {
  const id = textValue(firstValue(record, ["id", "record_id", "record_identity.record_id"]));
  const recordType = textValue(firstValue(record, ["record_type", "record_identity.record_type"]));
  if (!id || !LEARN_ID_PATTERN.test(id) || (recordType && recordType.toLocaleLowerCase() !== "learn")) return undefined;
  const taxonomy = taxonomyLink(record);
  const title = textValue(firstValue(record, ["report_title", "title", "record_identity.title"])) ?? id;
  const summary = textValue(record.summary) ?? "No case summary is currently available.";
  const monitoringValue = firstValue(record, ["monitoring_required", "case_context.monitoring_required"]);
  return {
    raw: record,
    id,
    title,
    reportTitle: title,
    caseDescriptor: textValue(record.case_descriptor),
    summary,
    abstractedLearning: textValue(record.abstracted_learning) ?? summary,
    mustNotBeForgotten: textList(record.must_not_be_forgotten),
    futureApplication: textList(record.future_application),
    generalisationBoundary: textValue(record.generalisation_boundary),
    primaryFailureMode: textValue(firstValue(record, ["primary_failure_mode", "learning_basis.primary_failure_mode"]))
      ?? textValue(taxonomy?.failure_record_id)
      ?? linkedIds(record, "related_failure_modes")[0],
    primaryFailureFamilyCode: textValue(record.primary_failure_family_code) ?? textValue(taxonomy?.primary_failure_family_code),
    canonicalFailureName: textValue(record.canonical_failure_name) ?? textValue(taxonomy?.canonical_failure_name),
    taxonomyReference: textValue(record.taxonomy_reference) ?? textValue(taxonomy?.taxonomy_reference),
    taxonomyStatus: textValue(record.taxonomy_status) ?? textValue(taxonomy?.taxonomy_status),
    establishingPatchId: textValue(record.establishing_patch_id) ?? textValue(taxonomy?.establishing_patch_id),
    relatedObservations: linkedIds(record, "related_observations"),
    relatedFailureModes: linkedIds(record, "related_failure_modes"),
    relatedProposals: linkedIds(record, "related_proposals"),
    relatedPatchNotes: linkedIds(record, "related_patch_notes"),
    chainState: textValue(firstValue(record, ["chain_state", "chain_completion.overall_status"])),
    monitoringRequired: monitoringValue === true || String(monitoringValue ?? "").toLocaleLowerCase() === "true",
    incidentStatus: textValue(firstValue(record, ["incident_status", "case_context.incident_status"])),
    camRepairStatus: textValue(firstValue(record, ["cam_repair_status", "case_context.cam_repair_status"])),
    recordState: textValue(record.record_state),
    recordVersion: textValue(firstValue(record, ["record_version", "version", "record_identity.version"])),
    recordLastUpdated: textValue(firstValue(record, ["record_last_updated", "record_identity.updated"])),
    githubBlobUrl: textValue(record.github_blob_url),
    rawUrl: textValue(record.raw_url),
  };
}

function mergeLearnDetail(indexRecord: LearnRecord, detail: UnknownRecord) {
  return normalizeLearnRecord({
    ...indexRecord.raw,
    ...detail,
    path: detail.path ?? indexRecord.raw.path,
    github_blob_url: detail.github_blob_url ?? indexRecord.githubBlobUrl,
    raw_url: detail.raw_url ?? indexRecord.rawUrl,
  }) ?? indexRecord;
}

function chainFromLearn(record: LearnRecord): ReportChain {
  return {
    observations: [...record.relatedObservations],
    failureModes: uniqueIds([record.primaryFailureMode, ...record.relatedFailureModes].filter((id): id is string => Boolean(id))),
    proposals: [...record.relatedProposals],
    patches: uniqueIds([record.establishingPatchId, ...record.relatedPatchNotes].filter((id): id is string => Boolean(id))),
    learns: [record.id],
  };
}

function mergeChains(...chains: ReportChain[]): ReportChain {
  return {
    observations: uniqueIds(chains.flatMap((chain) => chain.observations)),
    failureModes: uniqueIds(chains.flatMap((chain) => chain.failureModes)),
    proposals: uniqueIds(chains.flatMap((chain) => chain.proposals)),
    patches: uniqueIds(chains.flatMap((chain) => chain.patches)),
    learns: uniqueIds(chains.flatMap((chain) => chain.learns)),
  };
}

function chainIds(chain: ReportChain) {
  return chainStages.flatMap(({ key }) => chain[key]);
}

function reportChainWithKnownRecords(chain: ReportChain, recordsById: Map<string, VigilIndexRecord>, learnById: Map<string, LearnRecord>): ReportChain {
  return {
    observations: chain.observations.filter((id) => recordsById.has(id)),
    failureModes: chain.failureModes.filter((id) => recordsById.has(id)),
    proposals: chain.proposals.filter((id) => recordsById.has(id)),
    patches: chain.patches.filter((id) => recordsById.has(id)),
    learns: chain.learns.filter((id) => learnById.has(id)),
  };
}

function hasDeclaredLearning(records: VigilIndexRecord[], learnRecords: LearnRecord[]) {
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
}

function displayText(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.filter(Boolean).join("; ");
  const text = String(value).trim();
  return text || undefined;
}

function field(record: VigilIndexRecord, keys: string[]) {
  for (const key of keys) {
    const value = record.raw[key];
    const text = displayText(value);
    if (text) return text;
  }
  return undefined;
}

function statusFor(record: VigilIndexRecord) {
  return record.publicDisplay.lifecycleLabel ?? record.record_state ?? "Status not specified";
}

function statusTone(label?: string) {
  const value = String(label ?? "").toLowerCase();
  if (value.includes("closed") || value.includes("implemented") || value.includes("complete")) return "border-blue-300 bg-blue-50 text-blue-950";
  if (value.includes("active") || value.includes("open") || value.includes("watching") || value.includes("monitoring")) return "border-rose-300 bg-rose-50 text-rose-950";
  if (value.includes("deferred") || value.includes("triage")) return "border-amber-300 bg-amber-50 text-amber-950";
  return "border-border bg-background/60 text-muted-foreground";
}

function summary(record: VigilIndexRecord) {
  return record.publicDisplay.finding || record.summary || "No public finding is currently available for this record.";
}

function normalizedNarrative(value: unknown) {
  return displayText(value)?.replace(/\s+/g, " ").trim().toLowerCase();
}

function distinctObservationPreamble(record: VigilIndexRecord) {
  const preamble = summary(record);
  const observed = record.publicDisplay.observation?.observed;
  return normalizedNarrative(preamble) === normalizedNarrative(observed) ? undefined : preamble;
}

function isExternalObservationEvidence(record: VigilIndexRecord) {
  if (record.record_type === "research") return true;
  if (record.record_type !== "observation") return false;
  const systemContext = record.raw.system_context as Record<string, unknown> | undefined;
  const observedVendor = String(record.observed_vendor ?? record.raw.observed_vendor ?? systemContext?.platform_or_vendor ?? "").toLowerCase();
  const observedProduct = String(record.observed_product ?? record.raw.observed_product ?? systemContext?.product_or_service ?? "").toLowerCase();
  return !observedVendor.includes("cam initiative") && !observedProduct.includes("caelestis");
}

function sourceEvidenceFor(record: VigilIndexRecord): SourceEvidence[] {
  const rawSources = record.raw.source_records ?? record.raw.sources ?? record.raw.evidence_sources;
  if (!Array.isArray(rawSources)) return [];
  return rawSources.flatMap((source) => {
    if (typeof source === "string") {
      const url = /^https?:\/\//i.test(source) ? source : undefined;
      return [{ title: source, url }];
    }
    if (!source || typeof source !== "object") return [];
    const item = source as Record<string, unknown>;
    const primaryArtefactAccess = item.primary_artefact_access;
    const accessStatus = displayText(item.source_url_status ?? item.access_status)
      ?? (primaryArtefactAccess && typeof primaryArtefactAccess === "object"
        ? displayText((primaryArtefactAccess as Record<string, unknown>).access_status)
        : undefined);
    const title = displayText(item.source_title ?? item.title ?? item.name);
    if (!title) return [];
    return [{
      title,
      description: displayText(item.source_context ?? item.description ?? item.relevance_note ?? item.summary),
      publisher: displayText(item.author_or_publisher ?? item.publisher ?? item.source_platform),
      date: displayText(item.source_date ?? item.date ?? item.published_date),
      url: displayText(item.source_url ?? item.url ?? item.archive_url),
      sourceType: displayText(item.source_type ?? item.type),
      accessStatus,
      sourceResidence: displayText(item.source_residence),
      sourceRole: displayText(item.source_role),
    }];
  });
}

function uniqueSourceEvidence(sources: SourceEvidence[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = sourceKey(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceKey(source: Pick<SourceEvidence, "title" | "url">) {
  return `${source.title.trim().toLocaleLowerCase()}|${(source.url ?? "").trim()}`;
}

function isVigilRecordCitationSource(source: SourceEvidence) {
  return /^VIGIL-\d{4}-(?:OBS|FM|PROP|PATCH|RESEARCH|LEARN)-\d{4}\b/i.test(source.title.trim());
}

function externalSourceEvidenceFor(record: VigilIndexRecord): SourceEvidence[] {
  return sourceEvidenceFor(record).filter((source) => source.sourceResidence?.toLocaleLowerCase() === "external" && !isVigilRecordCitationSource(source));
}

type SupportingSource = { source: SourceEvidence; records: VigilIndexRecord[] };

function supportingSourceEvidence(records: VigilIndexRecord[], primarySources: SourceEvidence[]): SupportingSource[] {
  const primaryKeys = new Set(primarySources.map(sourceKey));
  const grouped = new Map<string, SupportingSource>();
  for (const record of records) for (const source of externalSourceEvidenceFor(record)) {
    const key = sourceKey(source);
    if (primaryKeys.has(key)) continue;
    const existing = grouped.get(key);
    if (existing) {
      if (!existing.records.some((linkedRecord) => linkedRecord.id === record.id)) existing.records.push(record);
    } else {
      grouped.set(key, { source, records: [record] });
    }
  }
  return [...grouped.values()];
}

function corpusProvenanceEvidenceFor(record: VigilIndexRecord): SourceEvidence[] {
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
  const citations: Citation[] = [];
  for (const record of records) for (const source of externalSourceEvidenceFor(record)) {
    const key = `source|${sourceKey(source)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ ...source, number: citations.length + 1, kind: "source" });
  }
  for (const record of records) {
    const url = record.github_blob_url || record.raw_url || undefined;
    const key = `vigil|${record.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({
      number: citations.length + 1,
      kind: "vigil",
      recordId: record.id,
      title: `${record.id} — ${record.title}`,
      recordTitle: record.title,
      recordVersion: record.record_version,
      recordLastUpdated: record.record_last_updated,
      ...(url ? { url } : {}),
    });
  }
  for (const record of learnRecords) {
    const url = record.githubBlobUrl || record.rawUrl;
    const key = `vigil|${record.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({
      number: citations.length + 1,
      kind: "vigil",
      recordId: record.id,
      title: `${record.id} — ${record.title}`,
      recordTitle: record.title,
      recordVersion: record.recordVersion,
      recordLastUpdated: record.recordLastUpdated,
      ...(url ? { url } : {}),
    });
  }
  for (const record of records) for (const source of corpusProvenanceEvidenceFor(record)) {
    const key = `source|${sourceKey(source)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ ...source, number: citations.length + 1, kind: "source" });
  }
  return citations;
}

function citationNumber(source: SourceEvidence, citations: Citation[]) {
  return citations.find((citation) => citation.kind === "source" && sourceKey(citation) === sourceKey(source))?.number;
}

function vigilCitationNumber(recordId: string, citations: Citation[]) {
  return citations.find((citation) => citation.kind === "vigil" && citation.recordId === recordId)?.number;
}

function FieldGrid({ entries }: { entries: Array<[string, unknown]> }) {
  const visible = entries.map(([label, value]) => [label, displayText(value)] as const).filter((entry): entry is readonly [string, string] => Boolean(entry[1]));
  if (!visible.length) return null;
  return <dl className="grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-2">
    {visible.map(([label, value]) => <div key={label}><dt className="report-label">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-base leading-relaxed text-foreground/85">{value}</dd></div>)}
  </dl>;
}

function Narrative({ label, value }: { label: string; value?: unknown }) {
  const text = displayText(value);
  return text ? <div><p className="report-label">{label}</p><p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{text}</p></div> : null;
}

function SourceDetails({ source, citations }: { source: SourceEvidence; citations: Citation[] }) {
  const number = citationNumber(source, citations);
  return <div className="report-break-inside-avoid rounded-md border border-border/60 bg-white/55 p-3">
    <p className="font-serif text-lg font-semibold text-foreground">{source.title}{number ? <sup className="ml-1 font-mono text-xs text-cam-gold">[{number}]</sup> : null}</p>
    {(source.publisher || source.date || source.sourceType || source.accessStatus) && <p className="mt-1 font-mono text-sm uppercase tracking-[0.1em] text-muted-foreground">{[source.publisher, source.date, source.sourceType, source.accessStatus].filter(Boolean).join(" · ")}</p>}
    {source.description && <div className="mt-3"><Narrative label="Source context" value={source.description} /></div>}
  </div>;
}

function ObservationNarrative({ record }: { record: VigilIndexRecord }) {
  const preamble = distinctObservationPreamble(record);
  const isFailureEvidence = record.record_type === "failure_mode";
  return <div className="border-t border-border/60 pt-4">
    <p className="report-label">VIGIL Interpretation</p>
    {preamble && <div className="mt-3"><Narrative label={isFailureEvidence ? "Public finding" : "Public finding"} value={preamble} /></div>}
    {!isFailureEvidence && <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Narrative label="What was observed" value={record.publicDisplay.observation?.observed} />
      <Narrative label="Context" value={record.publicDisplay.observation?.context} />
      <div className="sm:col-span-2"><Narrative label="Interpretation" value={record.publicDisplay.observation?.interpretation} /></div>
    </div>}
    {isFailureEvidence && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Section 01 is populated from the Failure Mode’s declared external sources. A separate Observation record is not required for this complete chain.</p>}
  </div>;
}

function ObservationEvidenceRecord({ record, citations }: { record: VigilIndexRecord; citations: Citation[] }) {
  const sources = uniqueSourceEvidence(externalSourceEvidenceFor(record));
  return <article className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4">
    {sources.length ? <div className="space-y-3">{sources.map((source, index) => <SourceDetails key={`${sourceKey(source)}-${index}`} source={source} citations={citations} />)}</div> : <p className="report-label">No external source entry is declared for this record.</p>}
    <ObservationNarrative record={record} />
  </article>;
}

function SupportingEvidence({ sources, citations }: { sources: SupportingSource[]; citations: Citation[] }) {
  if (!sources.length) return null;
  return <article className="report-record report-break-inside-avoid rounded-lg border border-dashed border-[hsl(38_25%_80%)] bg-white/45 p-4">
    <div className="border-b border-border/60 pb-3"><p className="report-label">Supporting evidence</p></div>
    <div className="mt-4 space-y-3">{sources.map(({ source }, index) => <div key={`${sourceKey(source)}-${index}`} className="report-break-inside-avoid"><SourceDetails source={source} citations={citations} /></div>)}</div>
  </article>;
}

function failureClassification(record: VigilIndexRecord) {
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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/60 bg-white/45 px-4 py-2.5 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground"><span>Authoritative evidence-to-repair-and-learning chain</span><span>Status</span></div>
    {ordered.length ? ordered.map(({ id, label }) => {
      const record = byId.get(id);
      const learnRecord = learnById.get(id);
      const title = record?.title ?? learnRecord?.title ?? id;
      const status = record ? statusFor(record) : learnRecord?.recordState ?? learnRecord?.chainState ?? "Unavailable";
      const citation = vigilCitationNumber(id, citations);
      return <div key={`${label}-${id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/50 px-4 py-3 last:border-b-0">
        <div><p className="font-mono text-sm uppercase tracking-[0.1em] text-cam-gold">{label}</p><p className="mt-1 break-words font-serif text-lg text-foreground">{title}{citation ? <sup className="ml-1 font-mono text-sm text-cam-gold" aria-label={`Citation ${citation}`}>[{citation}]</sup> : null}</p><p className="mt-1 font-mono text-sm text-muted-foreground">{id}</p></div>
        <span className={`w-fit rounded-full border px-2 py-1 font-mono text-xs uppercase tracking-[0.08em] ${statusTone(status)}`}>{status}</span>
      </div>;
    }) : <p className="p-4 text-sm text-muted-foreground">No linked records are available yet. This report remains available while the evidence chain is incomplete.</p>}
    {!records.length && !learnRecords.length && <p className="border-t border-dashed border-border/60 p-3 text-sm text-muted-foreground">The linked record details are not currently available.</p>}
    </div>
  </div>;
}

function ObservationStage({ records, supportingRecords, citations }: { records: VigilIndexRecord[]; supportingRecords: VigilIndexRecord[]; citations: Citation[] }) {
  const primarySources = records.flatMap(externalSourceEvidenceFor);
  const supportingSources = supportingSourceEvidence(supportingRecords, primarySources);
  return <div className="space-y-4">
    {records.map((record) => <ObservationEvidenceRecord key={record.id} record={record} citations={citations} />)}
    <SupportingEvidence sources={supportingSources} citations={citations} />
    {!records.length && !supportingSources.length && <Incomplete text="No source evidence is yet available to populate Section 01." />}
  </div>;
}

function ClassificationStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><p className="text-base leading-relaxed text-foreground/85">{summary(record)}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Narrative label="Failure-mode definition" value={record.publicDisplay.failure?.definition} /><Narrative label="Why it matters" value={record.publicDisplay.failure?.significance} /><div className="sm:col-span-2"><Narrative label="Triggers" value={record.publicDisplay.failure?.triggers} /></div><Narrative label="Observed manifestations" value={record.publicDisplay.failure?.manifestations} /></div><FieldGrid entries={[["Failure family", record.failure_family], ["Failure subtype", record.failure_subtype], ["Severity", record.severity], ["Likelihood", record.likelihood]]} /></article>) : <Incomplete text="Failure mode not yet linked." />}</div>;
}

function DiagnoseStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4">
    <div><p className="report-label">Problem Diagnosed</p><p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{displayText(record.publicDisplay.proposal?.problem) ?? "Problem not specified in the linked VIGIL record."}</p></div>
    <div className="mt-5 border-t border-border/60 pt-4"><p className="report-label">VIGIL Proposal</p><p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{summary(record)}</p></div>
    <div className="mt-5 border-t border-border/60 pt-4"><div className="mt-4 grid gap-4 sm:grid-cols-2"><Narrative label="Proposed wording" value={record.publicDisplay.proposal?.proposedWording} /></div><FieldGrid entries={[["Target domains", record.target_domains], ["Drafting status", record.drafting_status], ["Resulting PATCH records", record.publicDisplay.proposal?.resultingPatches]]} /></div>
  </article>) : <Incomplete text="Proposal not yet linked." />}</div>;
}

function provisionActionLabel(action?: string) {
  const normalized = action?.trim().toLowerCase() ?? "";
  if (normalized.includes("relied-upon") || normalized.includes("pre-existing") || normalized.includes("coverage")) return "Existing control — no amendment required";
  if (normalized.includes("remov") || normalized.includes("repeal")) return "Removed";
  if (normalized.includes("add")) return "Added";
  if (normalized.includes("amend") || normalized.includes("modif") || normalized.includes("updat")) return "Amended";
  return action || "Implementation recorded";
}

function provisionWordingLabel(action?: string) {
  const normalized = action?.trim().toLowerCase() ?? "";
  if (normalized.includes("relied-upon") || normalized.includes("pre-existing") || normalized.includes("coverage")) return "Existing applicable wording";
  return normalized.includes("remov") || normalized.includes("repeal") ? "Literal wording removed" : "Final adopted wording";
}

function renderInlineMarkdown(value: string) {
  return value.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function CorpusWording({ value }: { value: string }) {
  return <div className="mt-1 space-y-2.5 text-base leading-relaxed text-foreground/85">{value.split("\n").map((line, index) => {
    if (!line.trim()) return <div key={index} className="h-1.5" aria-hidden="true" />;
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) return <h4 key={index} className="font-serif text-lg leading-snug text-foreground">{renderInlineMarkdown(heading[2])}</h4>;
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) return <p key={index} className="flex gap-2"><span aria-hidden="true">•</span><span>{renderInlineMarkdown(bullet[1])}</span></p>;
    const numbered = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (numbered) return <p key={index} className="flex gap-2"><span aria-hidden="true">{numbered[1]}.</span><span>{renderInlineMarkdown(numbered[2])}</span></p>;
    return <p key={index}>{renderInlineMarkdown(line)}</p>;
  })}</div>;
}

function ProvisionTable({ provisions }: { provisions: CorpusProvision[] }) {
  if (!provisions.length) return null;
  return <div className="mt-4 overflow-hidden rounded-lg border border-border/70 bg-white/55">
    <div className="border-b border-[hsl(var(--cam-corpus-metadata-border)/0.9)] bg-[hsl(var(--cam-corpus-heading))] px-4 py-2.5 font-mono text-sm uppercase tracking-[0.12em] text-[hsl(var(--cam-corpus-heading-foreground))]">Corpus implementation by instrument section</div>
    <div className="divide-y divide-border/50">{provisions.map((provision, index) => {
      const sourceUrl = provision.canonicalUrl ?? provision.implementationUrl;
      const wording = provision.finalWording ?? provision.previousWording ?? "Wording not supplied.";
      return <article key={`${provision.instrumentId ?? "provision"}-${provision.section ?? index}`} className="report-break-inside-avoid px-4 py-4">
        <header className="-mx-4 -mt-4 mb-4 border-b border-[hsl(var(--cam-corpus-metadata-border)/0.85)] bg-[hsl(var(--cam-corpus-metadata))] px-4 py-4 text-[hsl(var(--cam-corpus-metadata-foreground))] shadow-sm">
          <p className="font-mono text-sm text-[hsl(var(--cam-corpus-metadata-foreground))]">{provision.instrumentId ?? "Corpus provision"}{provision.section ? ` · ${provision.section}` : ""}</p>
          {provision.heading && <h3 className="mt-1 font-serif text-lg leading-snug text-[hsl(var(--cam-corpus-metadata-foreground))]">{provision.heading}</h3>}
          <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--cam-corpus-metadata-foreground))]/80"><span className="font-medium text-[hsl(var(--cam-corpus-metadata-foreground))]">{provisionActionLabel(provision.action)}</span>{provision.implementedDate ? ` · ${provision.implementedDate}` : ""}</p>
          {(provision.verificationStatus || provision.verifiedAgainst) && <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--cam-corpus-metadata-foreground))]/85"><span className="font-medium text-[hsl(var(--cam-corpus-metadata-foreground))]">Verification:</span>{provision.verificationStatus && ` ${provision.verificationStatus}`}{provision.verifiedAgainst && <>{provision.verificationStatus && " · "}{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer" className="font-mono text-cam-gold underline decoration-cam-gold/60 underline-offset-4">{provision.verifiedAgainst}</a> : provision.verifiedAgainst}</>}</p>}
        </header>
        <div><p className="report-label">{provisionWordingLabel(provision.action)}</p><CorpusWording value={wording} /></div>
      </article>;
    })}</div>
  </div>;
}

function CorpusReleaseProvenance({ record }: { record: VigilIndexRecord }) {
  const provenance = isObject(record.raw.corpus_release_provenance) ? record.raw.corpus_release_provenance : undefined;
  if (!provenance) return null;
  const implementation = isObject(provenance.implementation_corpus_state) ? provenance.implementation_corpus_state : undefined;
  const canonical = isObject(provenance.canonical_corpus_state) ? provenance.canonical_corpus_state : undefined;
  const release = isObject(provenance.published_release_at_implementation) ? provenance.published_release_at_implementation : undefined;
  return <section className="mt-4 rounded-lg border border-cam-gold/30 bg-white/50 p-4"><p className="report-label">Caelestis corpus provenance</p><FieldGrid entries={[["Provenance mode", provenance.provenance_mode], ["Implementation ref", implementation?.ref], ["Implementation commit", implementation?.commit], ["Implementation date", implementation?.date], ["Canonical ref", canonical?.ref], ["Canonical commit", canonical?.commit], ["Canonical date", canonical?.date], ["Published release at implementation", release?.status], ["Published version", release?.version]]} />{Array.isArray(provenance.limitations) && provenance.limitations.length > 0 && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{provenance.limitations.map(String).join(" ")}</p>}</section>;
}

function RepairStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><p className="text-base leading-relaxed text-foreground/85">{summary(record)}</p><FieldGrid entries={[["Repair outcome", record.publicDisplay.patch?.outcome], ["Repair summary", record.publicDisplay.patch?.repairSummary], ["Implementation date", record.publicDisplay.patch?.implementationDate], ["Verification", record.publicDisplay.patch?.verificationStatus], ["Verified against", record.publicDisplay.patch?.verifiedAgainst], ["Patch type", record.patch_type], ["Change scope", record.change_scope], ["Implementation mode", record.implementation_mode]]} />{displayText(record.publicDisplay.patch?.residualMonitoring) && <div className="mt-4 border-t border-border/60 pt-3"><Narrative label="Residual monitoring" value={record.publicDisplay.patch?.residualMonitoring} /></div>}<CorpusReleaseProvenance record={record} /><ProvisionTable provisions={record.publicDisplay.corpusProvisions} /></article>) : <Incomplete text="No PATCH is linked yet. A repair may still be in development — check back later." availabilityNote={false} />}</div>;
}

function LearningList({ items }: { items: string[] }) {
  return <ul className="space-y-2">{items.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" /><span>{item}</span></li>)}</ul>;
}

function LearnStage({ records, fallbackRecords }: { records: LearnRecord[]; fallbackRecords: VigilIndexRecord[] }) {
  if (records.length) return <div className="space-y-4">{records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-5">
    <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-sm text-cam-gold">{record.id}</p><h3 className="mt-1 font-serif text-2xl leading-snug text-foreground">{record.reportTitle}</h3>{record.caseDescriptor && <p className="mt-2 text-base leading-relaxed text-muted-foreground">{record.caseDescriptor}</p>}</div><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-[0.1em] ${statusTone(record.chainState)}`}>{record.chainState ?? "Learning recorded"}</span>{record.monitoringRequired && <span className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.1em] text-rose-950">Monitoring ongoing</span>}</div></div>
    <div className="mt-5"><p className="report-label">Abstracted learning</p><p className="mt-2 font-serif text-xl leading-relaxed text-foreground">{record.abstractedLearning}</p></div>
    {(record.canonicalFailureName || record.primaryFailureFamilyCode || record.taxonomyReference) && <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4"><p className="report-label">Failure taxonomy link</p>{record.canonicalFailureName && <p className="mt-2 font-serif text-lg text-foreground">{record.canonicalFailureName}</p>}<FieldGrid entries={[["Primary failure family", record.primaryFailureFamilyCode], ["Taxonomy reference", record.taxonomyReference], ["Taxonomy status", record.taxonomyStatus], ["Establishing PATCH", record.establishingPatchId]]} /></div>}
    {record.mustNotBeForgotten.length > 0 && <div className="mt-5 border-t border-border/60 pt-4"><p className="report-label">What must not be forgotten</p><div className="mt-3 text-base leading-relaxed text-foreground/85"><LearningList items={record.mustNotBeForgotten} /></div></div>}
    {record.futureApplication.length > 0 && <div className="mt-5 border-t border-border/60 pt-4"><p className="report-label">Future application</p><p className="mt-2 text-base leading-relaxed text-foreground/85">{record.futureApplication.join("; ")}</p></div>}
    {record.generalisationBoundary && <div className="mt-5 border-t border-border/60 pt-4"><Narrative label="Generalisation boundary" value={record.generalisationBoundary} /></div>}
    {(record.incidentStatus || record.camRepairStatus) && <FieldGrid entries={[["External incident status", record.incidentStatus], ["CAM repair status", record.camRepairStatus]]} />}
  </article>)}</div>;

  const learningKeys = [
    ["Lessons learned", ["lessons_learned", "learning_statement", "lesson_learned"]],
    ["Transferable governance lesson", ["transferable_lesson", "governance_lesson", "reusable_governance_pattern"]],
    ["Future-design implication", ["future_design_implications", "future_design_implication", "feedback_into_future_design"]],
  ] as const;
  const declaredLearning = fallbackRecords.flatMap((record) => learningKeys.flatMap(([label, keys]) => {
    const value = field(record, [...keys]);
    return value ? [{ record, label, value }] : [];
  }));
  return declaredLearning.length
    ? <div className="space-y-3">{declaredLearning.map(({ record, label, value }, index) => <article key={`${record.id}-${label}-${index}`} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><p className="font-mono text-sm text-cam-gold">{record.id}</p><p className="mt-1 font-serif text-lg text-foreground">{record.title}</p><p className="mt-4 report-label">{label}</p><p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{value}</p><p className="mt-4 text-sm text-muted-foreground">This legacy learning statement does not close the evidence chain. A published LEARN record is still required.</p></article>)}</div>
    : <Incomplete text="No published LEARN record is linked. Section 06 remains incomplete even where a PATCH has been implemented." availabilityNote={false} />;
}

function Incomplete({ text, availabilityNote = true }: { text: string; availabilityNote?: boolean }) {
  return <p className="rounded-lg border border-dashed border-[hsl(38_25%_80%)] bg-white/35 p-4 text-base leading-relaxed text-muted-foreground">{text}{availabilityNote ? " This report remains available while the evidence chain is incomplete." : null}</p>;
}

function Citations({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;
  return <section className="report-citations report-break-inside-avoid border-t border-border/70 pt-5"><h2 className="font-serif text-2xl text-foreground">Sources and citations</h2><ol className="mt-4 space-y-3">{citations.map((citation) => <li key={citation.number} className="flex gap-3 text-base leading-relaxed text-foreground/85">
    <span className="font-mono text-sm text-cam-gold">[{citation.number}]</span>
    <span className="min-w-0">
      {citation.kind === "vigil"
        ? <cite className="not-italic"><span className="font-medium">{citation.recordId} — {citation.recordTitle}</span><span className="text-muted-foreground"> — VIGIL Observatory{citation.recordLastUpdated ? ` · ${citation.recordLastUpdated}` : ""}{citation.recordVersion ? `, Version ${citation.recordVersion}` : ""}{citation.url ? "," : "."}</span></cite>
        : <><span className="font-medium">{citation.title}</span>{[citation.publisher, citation.date].filter(Boolean).length ? <span className="text-muted-foreground"> — {[citation.publisher, citation.date].filter(Boolean).join(" · ")}</span> : null}</>}
      {citation.url ? <><br /><a href={citation.url} target="_blank" rel="noreferrer" className="break-all text-[hsl(32_62%_25%)] underline decoration-cam-gold/50 underline-offset-4">{citation.url}</a></> : null}
    </span>
  </li>)}</ol></section>;
}

function normalizeReportRecord(detail: UnknownRecord, indexRecord: VigilIndexRecord) {
  return normalizeVigilRecord({
    ...detail,
    path: detail.path || indexRecord.path,
    github_blob_url: detail.github_blob_url || indexRecord.github_blob_url,
    raw_url: detail.raw_url || indexRecord.raw_url,
    record_version: detail.record_version || indexRecord.record_version,
    record_last_updated: detail.record_last_updated || indexRecord.record_last_updated,
  });
}

function StepSection({ number, label, description, included, onToggle, children }: { number: string; label: string; description: string; included: boolean; onToggle: () => void; children: ReactNode }) {
  const headingId = `report-section-${number}-heading`;
  return <section aria-labelledby={headingId} className={`report-section report-break-inside-avoid rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-5 md:p-6${included ? "" : " report-section-excluded"}`}><div className="flex items-start justify-between gap-4 border-b border-[hsl(38_25%_80%)] pb-4"><div className="flex min-w-0 items-start gap-4"><span className="font-mono text-base tracking-[0.12em] text-cam-gold">{number}</span><div><h2 id={headingId} className="font-serif text-2xl text-foreground">{label}</h2><p className="mt-1 max-w-3xl text-base leading-relaxed text-muted-foreground">{description}</p></div></div><label className="print:hidden shrink-0 pt-1"><input type="checkbox" checked={included} onChange={onToggle} aria-label={`Include ${label} section in the printed PDF`} className="h-4 w-4 accent-[hsl(38_62%_40%)]" /></label></div><div className="mt-4">{children}</div></section>;
}

function learnLinksRecord(learn: LearnRecord, recordId: string, legacyChain?: RecordChain) {
  const linked = new Set([
    learn.id,
    learn.primaryFailureMode,
    learn.establishingPatchId,
    ...learn.relatedObservations,
    ...learn.relatedFailureModes,
    ...learn.relatedProposals,
    ...learn.relatedPatchNotes,
  ].filter((id): id is string => Boolean(id)).map((id) => id.toLocaleUpperCase()));
  if (linked.has(recordId.toLocaleUpperCase())) return true;
  if (!legacyChain) return false;
  return [...legacyChain.observations, ...legacyChain.failureModes, ...legacyChain.proposals, ...legacyChain.patches]
    .some((id) => linked.has(id.toLocaleUpperCase()));
}

export default function EvidenceChainReport() {
  const [, params] = useRoute("/observatory/reports/:recordId");
  const sourceId = decodeURIComponent(params?.recordId ?? "").trim().replace(/\.md$/i, "");
  const [state, setState] = useState<ReportState>({ status: "loading" });
  const [includedSections, setIncludedSections] = useState<Record<string, boolean>>(() => Object.fromEntries(reportSteps.map((step) => [step.number, true])));

  useEffect(() => {
    setIncludedSections(Object.fromEntries(reportSteps.map((step) => [step.number, true])));
  }, [sourceId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const registry = await loadVigilRegistryRecords();
        const indexRecords = normalizeRecords(registry.records);
        const indexById = new Map(indexRecords.map((record) => [record.id, record]));
        const learnIndexRecords = registry.records.map(normalizeLearnRecord).filter((record): record is LearnRecord => Boolean(record));
        const learnIndexById = new Map(learnIndexRecords.map((record) => [record.id, record]));

        const sourceIndexRecord = indexById.get(sourceId);
        const sourceLearnIndexRecord = learnIndexById.get(sourceId);
        if (!sourceIndexRecord && !sourceLearnIndexRecord) throw new Error(`The VIGIL registry does not contain ${sourceId}.`);

        let sourceRecord = sourceIndexRecord;
        if (sourceIndexRecord) {
          try { sourceRecord = normalizeReportRecord(await loadVigilRecordDetail(sourceIndexRecord.raw), sourceIndexRecord); } catch { /* index projection remains useful */ }
        }

        let sourceLearnRecord = sourceLearnIndexRecord;
        if (sourceLearnIndexRecord) {
          try { sourceLearnRecord = mergeLearnDetail(sourceLearnIndexRecord, await loadVigilRecordDetail(sourceLearnIndexRecord.raw)); } catch { /* index projection remains useful */ }
        }

        const legacyChain: RecordChain | undefined = sourceRecord?.publicDisplay.chain;
        const candidateLearnIndexes = sourceLearnRecord
          ? [sourceLearnRecord]
          : learnIndexRecords.filter((record) => learnLinksRecord(record, sourceId, legacyChain));
        const detailedLearnRecords: LearnRecord[] = [];
        for (const candidate of candidateLearnIndexes) {
          if (sourceLearnRecord?.id === candidate.id) {
            detailedLearnRecords.push(sourceLearnRecord);
            continue;
          }
          try { detailedLearnRecords.push(mergeLearnDetail(candidate, await loadVigilRecordDetail(candidate.raw))); }
          catch { detailedLearnRecords.push(candidate); }
        }

        const baseChain: ReportChain = sourceRecord ? {
          observations: [...sourceRecord.publicDisplay.chain.observations],
          failureModes: [...sourceRecord.publicDisplay.chain.failureModes],
          proposals: [...sourceRecord.publicDisplay.chain.proposals],
          patches: [...sourceRecord.publicDisplay.chain.patches],
          learns: detailedLearnRecords.map((record) => record.id),
        } : sourceLearnRecord ? chainFromLearn(sourceLearnRecord) : { observations: [], failureModes: [], proposals: [], patches: [], learns: [] };
        let declaredChain = detailedLearnRecords.reduce((chain, record) => mergeChains(chain, chainFromLearn(record)), baseChain);

        if (sourceRecord && !chainIds(declaredChain).includes(sourceId)) {
          const targetKey: keyof ReportChain = sourceRecord.record_type === "observation" || sourceRecord.record_type === "research"
            ? "observations"
            : sourceRecord.record_type === "failure_mode"
              ? "failureModes"
              : sourceRecord.record_type === "proposal"
                ? "proposals"
                : "patches";
          declaredChain = { ...declaredChain, [targetKey]: uniqueIds([sourceId, ...declaredChain[targetKey]]) };
        }
        if (sourceLearnRecord && !declaredChain.learns.includes(sourceLearnRecord.id)) declaredChain.learns.unshift(sourceLearnRecord.id);

        const detailedLearnById = new Map(detailedLearnRecords.map((record) => [record.id, record]));
        if (sourceLearnRecord) detailedLearnById.set(sourceLearnRecord.id, sourceLearnRecord);
        const chain = reportChainWithKnownRecords(declaredChain, indexById, detailedLearnById);
        const details = new Map<string, VigilIndexRecord>();
        if (sourceRecord) details.set(sourceRecord.id, sourceRecord);
        for (const stage of chainStages.filter((stage) => stage.key !== "learns")) for (const id of chain[stage.key]) {
          if (details.has(id)) continue;
          const indexRecord = indexById.get(id);
          if (!indexRecord) continue;
          let record = indexRecord;
          try { record = normalizeReportRecord(await loadVigilRecordDetail(indexRecord.raw), indexRecord); } catch { /* index projection remains useful */ }
          details.set(record.id, record);
        }
        const reportLearns = chain.learns.map((id) => detailedLearnById.get(id)).filter((record): record is LearnRecord => Boolean(record));
        if (!cancelled) setState({ status: "ready", records: [...details.values()], learnRecords: reportLearns, chain, sourceId, generatedAt: new Date().toISOString() });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : "The evidence chain report could not be loaded." });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [sourceId]);

  const byId = useMemo(() => new Map(state.status === "ready" ? state.records.map((record) => [record.id, record]) : []), [state]);
  const learnById = useMemo(() => new Map(state.status === "ready" ? state.learnRecords.map((record) => [record.id, record]) : []), [state]);
  const citations = useMemo(() => collectCitations(state.status === "ready" ? state.records : [], state.status === "ready" ? state.learnRecords : []), [state]);
  const explicitObservationRecords = useMemo(() => state.status === "ready"
    ? state.chain.observations.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record)).filter(isExternalObservationEvidence)
    : [], [byId, state]);
  const failureEvidenceRecords = useMemo(() => state.status === "ready"
    ? state.chain.failureModes.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record)).filter((record) => externalSourceEvidenceFor(record).length > 0)
    : [], [byId, state]);
  const observationRecords = explicitObservationRecords.length ? explicitObservationRecords : failureEvidenceRecords;
  const observationRecordIds = useMemo(() => new Set(observationRecords.map((record) => record.id)), [observationRecords]);
  const supportingRecords = useMemo(() => state.status === "ready"
    ? state.records.filter((record) => !observationRecordIds.has(record.id))
    : [], [observationRecordIds, state]);
  const toggleSection = (number: string) => setIncludedSections((current) => ({ ...current, [number]: !current[number] }));

  return <Shell><main className="report-page container mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 md:px-8 md:py-12 lg:px-10">
    {state.status === "loading" && <div className="cam-parchment-card rounded-xl p-6 text-sm text-muted-foreground">Preparing the evidence-chain report…</div>}
    {state.status === "error" && <div className="cam-parchment-card rounded-xl p-6"><p className="font-mono text-sm uppercase tracking-[0.16em] text-rose-800">Report unavailable</p><p className="mt-3 text-base leading-relaxed text-muted-foreground">{state.message}</p><Link href="/observatory" className="mt-4 inline-flex font-mono text-sm uppercase tracking-[0.12em] text-cam-gold underline underline-offset-4">Return to Observatory →</Link></div>}
    {state.status === "ready" && <div className="space-y-6">
      <header className="report-cover border-b border-border/70 pb-7"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><p className="font-mono text-sm uppercase tracking-[0.2em] text-cam-gold">VIGIL Evidence Chain Report</p><h1 className="mt-3 max-w-5xl font-serif text-4xl leading-tight text-foreground md:text-5xl">{state.learnRecords[0]?.reportTitle ?? "Evidence to repair"}</h1>{state.learnRecords[0] && <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Evidence to repair</p>}<p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">A deterministic public audit artefact that preserves the evidence-to-repair-and-learning chain and presents its substantive findings in a structured report.</p></div><div className="flex shrink-0 flex-wrap gap-2 print:hidden"><button type="button" onClick={() => window.print()} className="rounded-lg bg-rose-900 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-rose-50 transition hover:bg-rose-800">Print / Save as PDF</button>{state.learnRecords.length > 0 && <Link href={`/observatory/knowledge-base/${encodeURIComponent(state.learnRecords[0].id)}`} className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[hsl(32_62%_25%)]">Read Knowledge Base entry</Link>}<Link href="/observatory" className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">Back to Observatory</Link></div></div><div className="mt-6 grid gap-3 rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-4 sm:grid-cols-4"><div><p className="report-label">Report initiated from</p><p className="mt-1 font-mono text-sm text-cam-gold">{state.sourceId}</p></div><div><p className="report-label">Linked records</p><p className="mt-1 font-serif text-xl text-foreground">{chainIds(state.chain).length}</p></div><div><p className="report-label">Chain state</p><p className="mt-1 font-serif text-xl text-foreground">{chainState(state.records, state.learnRecords, state.chain)}</p></div><div><p className="report-label">Report generated (UTC)</p><p className="mt-1 break-all font-mono text-sm leading-relaxed text-foreground">{state.generatedAt}</p></div></div></header>
      <StepSection {...reportSteps[0]} included={includedSections[reportSteps[0].number] !== false} onToggle={() => toggleSection(reportSteps[0].number)}><ObservationStage records={observationRecords} supportingRecords={supportingRecords} citations={citations} /></StepSection>
      <StepSection {...reportSteps[1]} included={includedSections[reportSteps[1].number] !== false} onToggle={() => toggleSection(reportSteps[1].number)}><RecordLedger records={state.records} learnRecords={state.learnRecords} chain={state.chain} byId={byId} learnById={learnById} citations={citations} /></StepSection>
      <StepSection {...reportSteps[2]} included={includedSections[reportSteps[2].number] !== false} onToggle={() => toggleSection(reportSteps[2].number)}><ClassificationStage records={state.chain.failureModes.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[3]} included={includedSections[reportSteps[3].number] !== false} onToggle={() => toggleSection(reportSteps[3].number)}><DiagnoseStage records={state.chain.proposals.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[4]} included={includedSections[reportSteps[4].number] !== false} onToggle={() => toggleSection(reportSteps[4].number)}><RepairStage records={state.chain.patches.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[5]} included={includedSections[reportSteps[5].number] !== false} onToggle={() => toggleSection(reportSteps[5].number)}><LearnStage records={state.learnRecords} fallbackRecords={state.records} /></StepSection>
      <Citations citations={citations} />
      <footer className="border-t border-border/70 pt-5 text-sm leading-relaxed text-muted-foreground">VIGIL preserves the evidence-to-repair-and-learning audit trail. CAELESTIS remains the authoritative governance corpus. This report is generated from the public VIGIL registry and does not replace the canonical source records.</footer>
    </div>}
  </main></Shell>;
}
