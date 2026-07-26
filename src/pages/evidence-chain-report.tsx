import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { loadVigilRecordDetail, loadVigilRegistryRecords, type UnknownRecord } from "@/lib/vigilRegistry";
import { normalizeRecords, normalizeVigilRecord, type VigilIndexRecord } from "@/lib/vigilPresentation";
import type { CorpusProvision, RecordChain } from "@/lib/vigilPublicDisplay";

const chainStages: Array<{ key: keyof RecordChain; label: string; singular: string }> = [
  { key: "observations", label: "Observation / Research", singular: "Observation or research" },
  { key: "failureModes", label: "Failure Mode", singular: "Failure mode" },
  { key: "proposals", label: "Proposal", singular: "Proposal" },
  { key: "patches", label: "PATCH", singular: "PATCH" },
];

const reportSteps = [
  { number: "01", label: "Observation", description: "The signal, incident, research basis, or governance breakdown that began the chain." },
  { number: "02", label: "Record", description: "The primary linked VIGIL records and the provenance preserved across the chain." },
  { number: "03", label: "Classification", description: "The repeatable failure mode or governance pattern identified from the evidence." },
  { number: "04", label: "Diagnosis", description: "The governance weakness, proposed response, and decision pathway." },
  { number: "05", label: "Repair", description: "A corpus PATCH or ecosystem-suggested repair grounded in existing corpus safeguards." },
  { number: "06", label: "Learn", description: "Distinct lessons or future-design implications explicitly declared by the linked records." },
] as const;

type ReportState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; chain: RecordChain; sourceId: string; generatedAt: string }
  | { status: "error"; message: string };

type SourceEvidence = {
  title: string;
  description?: string;
  publisher?: string;
  date?: string;
  url?: string;
  sourceType?: string;
  accessStatus?: string;
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

const caelestisArchiveCitation: SourceEvidence = {
  title: "O'Rourke, M. (2026). Caelestis Architecture Model — Public Archive (Version 1.1.0) [Computer software]. Zenodo.",
  url: "https://doi.org/10.5281/zenodo.20686316",
};

function chainIds(chain: RecordChain) { return chainStages.flatMap(({ key }) => chain[key]); }
function reportChainWithKnownRecords(chain: RecordChain, recordsById: Map<string, VigilIndexRecord>): RecordChain {
  // A generated report is a registry-backed public artefact. Never render a
  // stale, malformed, or future placeholder as though it were a VIGIL record.
  return {
    observations: chain.observations.filter((id) => recordsById.has(id)),
    failureModes: chain.failureModes.filter((id) => recordsById.has(id)),
    proposals: chain.proposals.filter((id) => recordsById.has(id)),
    patches: chain.patches.filter((id) => recordsById.has(id)),
  };
}
function chainState(chain: RecordChain) {
  // The four-record evidence chain ends at PATCH. A recorded PATCH is the
  // evidence-to-repair endpoint. Earlier stages may
  // be absent while the repair itself is still a complete public chain.
  return chain.patches.length > 0 ? "Complete" : "Incomplete";
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
function statusFor(record: VigilIndexRecord) { return record.publicDisplay.lifecycleLabel ?? record.record_state ?? "Status not specified"; }
function statusTone(label?: string) {
  const value = String(label ?? "").toLowerCase();
  if (value.includes("closed") || value.includes("implemented")) return "border-blue-300 bg-blue-50 text-blue-950";
  if (value.includes("active") || value.includes("open") || value.includes("watching")) return "border-emerald-300 bg-emerald-50 text-emerald-950";
  if (value.includes("deferred") || value.includes("triage")) return "border-amber-300 bg-amber-50 text-amber-950";
  return "border-border bg-background/60 text-muted-foreground";
}
function summary(record: VigilIndexRecord) { return record.publicDisplay.finding || record.summary || "No public finding is currently available for this record."; }
function normalizedNarrative(value: unknown) {
  return displayText(value)?.replace(/\s+/g, " ").trim().toLowerCase();
}
function distinctObservationPreamble(record: VigilIndexRecord) {
  const preamble = summary(record);
  const observed = record.publicDisplay.observation?.observed;
  return normalizedNarrative(preamble) === normalizedNarrative(observed) ? undefined : preamble;
}
function typeLabel(record: VigilIndexRecord) { return record.type_label || record.record_type.replace(/_/g, " "); }
function isExternalObservationEvidence(record: VigilIndexRecord) {
  // Research is a permitted evidence origin even when it is CAM-authored.
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
  return /^VIGIL-\d{4}-(?:OBS|FM|PROP|PATCH|RESEARCH)-\d{4}\b/i.test(source.title.trim());
}

function externalSourceEvidenceFor(record: VigilIndexRecord): SourceEvidence[] {
  return sourceEvidenceFor(record).filter((source) => !isVigilRecordCitationSource(source));
}

type SupportingSource = {
  source: SourceEvidence;
  records: VigilIndexRecord[];
};

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

function collectCitations(records: VigilIndexRecord[]): Citation[] {
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
  citations.push({ ...caelestisArchiveCitation, number: citations.length + 1, kind: "source" });
  return citations;
}

function citationNumber(source: SourceEvidence, citations: Citation[]) {
  const found = citations.find((citation) => citation.kind === "source" && sourceKey(citation) === sourceKey(source));
  return found?.number;
}

function vigilCitationNumber(record: VigilIndexRecord, citations: Citation[]) {
  const found = citations.find((citation) => citation.kind === "vigil" && citation.recordId === record.id);
  return found?.number;
}

function RecordHeading({ record }: { record: VigilIndexRecord }) {
  return <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <p className="font-mono text-sm text-cam-gold">{record.id}</p>
      <h3 className="mt-1 break-words font-serif text-xl leading-snug text-foreground">{record.title}</h3>
    </div>
    <span className={`w-fit shrink-0 rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-[0.1em] ${statusTone(statusFor(record))}`}>{statusFor(record)}</span>
  </div>;
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
  return <div className="border-t border-border/60 pt-4">
    <p className="report-label">VIGIL Interpretation</p>
    {preamble && <div className="mt-3"><Narrative label="Public finding" value={preamble} /></div>}
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Narrative label="What was observed" value={record.publicDisplay.observation?.observed} />
      <Narrative label="Context" value={record.publicDisplay.observation?.context} />
      <div className="sm:col-span-2"><Narrative label="Interpretation" value={record.publicDisplay.observation?.interpretation} /></div>
    </div>
  </div>;
}

function ObservationEvidenceRecord({ record, citations }: { record: VigilIndexRecord; citations: Citation[] }) {
  const sources = uniqueSourceEvidence(externalSourceEvidenceFor(record));
  return <article className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4">
    {sources.length ? <div className="space-y-3">{sources.map((source, index) => <SourceDetails key={`${sourceKey(source)}-${index}`} source={source} citations={citations} />)}</div> : <p className="report-label">No external SOURCE entry is declared for this observation.</p>}
    <ObservationNarrative record={record} />
  </article>;
}

function SupportingEvidence({ sources, citations }: { sources: SupportingSource[]; citations: Citation[] }) {
  if (!sources.length) return null;
  return <article className="report-record report-break-inside-avoid rounded-lg border border-dashed border-[hsl(38_25%_80%)] bg-white/45 p-4">
    <div className="border-b border-border/60 pb-3">
      <p className="report-label">Supporting evidence</p>
    </div>
    <div className="mt-4 space-y-3">{sources.map(({ source }, index) => <div key={`${sourceKey(source)}-${index}`} className="report-break-inside-avoid">
      <SourceDetails source={source} citations={citations} />
    </div>)}</div>
  </article>;
}

function RecordLedger({ records, chain, byId, citations }: { records: VigilIndexRecord[]; chain: RecordChain; byId: Map<string, VigilIndexRecord>; citations: Citation[] }) {
  const ordered = chainStages.flatMap((stage) => chain[stage.key].map((id) => ({ id, label: stage.label })));
  return <div className="overflow-hidden rounded-lg border border-border/70 bg-white/55">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/60 bg-white/45 px-4 py-2.5 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground"><span>Linked evidence-to-repair record</span><span>Status</span></div>
    {ordered.length ? ordered.map(({ id, label }) => {
      const record = byId.get(id);
      const citation = record ? vigilCitationNumber(record, citations) : undefined;
      return <div key={`${label}-${id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/50 px-4 py-3 last:border-b-0">
        <div><p className="font-mono text-sm uppercase tracking-[0.1em] text-cam-gold">{label}</p><p className="mt-1 break-words font-serif text-lg text-foreground">{record?.title ?? id}{citation ? <sup className="ml-1 font-mono text-sm text-cam-gold" aria-label={`Citation ${citation}`}>[{citation}]</sup> : null}</p><p className="mt-1 font-mono text-sm text-muted-foreground">{id}</p></div>
        <span className={`w-fit rounded-full border px-2 py-1 font-mono text-xs uppercase tracking-[0.08em] ${record ? statusTone(statusFor(record)) : "border-amber-300 bg-amber-50 text-amber-950"}`}>{record ? statusFor(record) : "Unavailable"}</span>
      </div>;
    }) : <p className="p-4 text-sm text-muted-foreground">No linked records are available yet. This report remains available while the evidence chain is incomplete.</p>}
    {!records.length && <p className="border-t border-dashed border-border/60 p-3 text-sm text-muted-foreground">The linked record details are not currently available.</p>}
  </div>;
}

function ObservationStage({ records, supportingRecords, citations }: { records: VigilIndexRecord[]; supportingRecords: VigilIndexRecord[]; citations: Citation[] }) {
  const primarySources = records.flatMap(externalSourceEvidenceFor);
  const supportingSources = supportingSourceEvidence(supportingRecords, primarySources);
  return <div className="space-y-4">
    {records.map((record) => <ObservationEvidenceRecord key={record.id} record={record} citations={citations} />)}
    <SupportingEvidence sources={supportingSources} citations={citations} />
    {!records.length && !supportingSources.length && <Incomplete text="Observation or research not yet linked." />}
  </div>;
}

function ClassificationStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><p className="text-base leading-relaxed text-foreground/85">{summary(record)}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Narrative label="Failure-mode definition" value={record.publicDisplay.failure?.definition} /><Narrative label="Why it matters" value={record.publicDisplay.failure?.significance} /><div className="sm:col-span-2"><Narrative label="Triggers" value={record.publicDisplay.failure?.triggers} /></div><Narrative label="Observed manifestations" value={record.publicDisplay.failure?.manifestations} /></div><FieldGrid entries={[["Failure family", record.failure_family], ["Failure subtype", record.failure_subtype], ["Severity", record.severity], ["Likelihood", record.likelihood]]} /></article>) : <Incomplete text="Failure mode not yet linked." />}</div>;
}

function DiagnoseStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4">
    <div>
      <p className="report-label">Problem Diagnosed</p>
      <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{displayText(record.publicDisplay.proposal?.problem) ?? "Problem not specified in the linked VIGIL record."}</p>
    </div>
    <div className="mt-5 border-t border-border/60 pt-4">
      <p className="report-label">VIGIL Proposal</p>
      <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{summary(record)}</p>
    </div>
    <div className="mt-5 border-t border-border/60 pt-4">
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Narrative label="Proposed wording" value={record.publicDisplay.proposal?.proposedWording} />
      </div>
      <FieldGrid entries={[["Target domains", record.target_domains], ["Drafting status", record.drafting_status], ["Resulting PATCH records", record.publicDisplay.proposal?.resultingPatches]]} />
    </div>
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
    <div className="border-b border-border/60 bg-white/45 px-4 py-2.5 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground">Corpus implementation by instrument section</div>
    <div className="divide-y divide-border/50">{provisions.map((provision, index) => {
      const sourceUrl = provision.canonicalUrl ?? provision.implementationUrl;
      const wording = provision.finalWording ?? provision.previousWording ?? "Wording not supplied.";
      return <article key={`${provision.instrumentId ?? "provision"}-${provision.section ?? index}`} className="report-break-inside-avoid px-4 py-4">
        <header className="-mx-4 -mt-4 mb-4 border-b border-[hsl(var(--cam-corpus-selected-border)/0.75)] bg-[hsl(var(--cam-corpus-selected))] px-4 py-4 text-[hsl(var(--cam-corpus-selected-foreground))] shadow-sm">
          <p className="font-mono text-sm text-cam-gold">{provision.instrumentId ?? "Corpus provision"}{provision.section ? ` · ${provision.section}` : ""}</p>
          {provision.heading && <h3 className="mt-1 font-serif text-lg leading-snug text-[hsl(var(--cam-corpus-selected-foreground))]">{provision.heading}</h3>}
          <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--cam-corpus-selected-foreground))]/80"><span className="font-medium text-[hsl(var(--cam-corpus-selected-foreground))]">{provisionActionLabel(provision.action)}</span>{provision.implementedDate ? ` · ${provision.implementedDate}` : ""}</p>
          {(provision.verificationStatus || provision.verifiedAgainst) && <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--cam-corpus-selected-foreground))]/85"><span className="font-medium text-[hsl(var(--cam-corpus-selected-foreground))]">Verification:</span>{provision.verificationStatus && ` ${provision.verificationStatus}`}{provision.verifiedAgainst && <>{provision.verificationStatus && " · "}{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer" className="font-mono text-cam-gold underline decoration-cam-gold/60 underline-offset-4">{provision.verifiedAgainst}</a> : provision.verifiedAgainst}</>}</p>}
        </header>
        <div>
          <p className="report-label">{provisionWordingLabel(provision.action)}</p>
          <CorpusWording value={wording} />
        </div>
      </article>;
    })}</div>
  </div>;
}

function RepairStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><p className="text-base leading-relaxed text-foreground/85">{summary(record)}</p><FieldGrid entries={[["Repair outcome", record.publicDisplay.patch?.outcome], ["Repair summary", record.publicDisplay.patch?.repairSummary], ["Implementation date", record.publicDisplay.patch?.implementationDate], ["Verification", record.publicDisplay.patch?.verificationStatus], ["Verified against", record.publicDisplay.patch?.verifiedAgainst], ["Patch type", record.patch_type], ["Change scope", record.change_scope], ["Implementation mode", record.implementation_mode]]} />{displayText(record.publicDisplay.patch?.residualMonitoring) && <div className="mt-4 border-t border-border/60 pt-3"><Narrative label="Residual monitoring" value={record.publicDisplay.patch?.residualMonitoring} /></div>}<ProvisionTable provisions={record.publicDisplay.corpusProvisions} /></article>) : <Incomplete text="No PATCH is linked yet. A repair may still be in development — check back later." availabilityNote={false} />}</div>;
}

function LearnStage({ records }: { records: VigilIndexRecord[] }) {
  const learningKeys = [
    ["Lessons learned", ["lessons_learned", "learning_statement", "lesson_learned"]],
    ["Transferable governance lesson", ["transferable_lesson", "governance_lesson", "reusable_governance_pattern"]],
    ["Future-design implication", ["future_design_implications", "future_design_implication", "feedback_into_future_design"]],
    ["Residual risk or open question", ["residual_risk", "open_question", "open_questions"]],
  ] as const;
  const declaredLearning = records.flatMap((record) => learningKeys.flatMap(([label, keys]) => {
    const value = field(record, [...keys]);
    return value ? [{ record, label, value }] : [];
  }));
  return declaredLearning.length
    ? <div className="space-y-3">{declaredLearning.map(({ record, label, value }, index) => <article key={`${record.id}-${label}-${index}`} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><p className="font-mono text-sm text-cam-gold">{record.id}</p><p className="mt-1 font-serif text-lg text-foreground">{record.title}</p><p className="mt-4 report-label">{label}</p><p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{value}</p></article>)}</div>
    : <Incomplete text="No separate learning statement is declared in the linked records. Lifecycle actions, next steps, residual monitoring, and verification remain in Repair." availabilityNote={false} />;
}

function Incomplete({ text, availabilityNote = true }: { text: string; availabilityNote?: boolean }) { return <p className="rounded-lg border border-dashed border-[hsl(38_25%_80%)] bg-white/35 p-4 text-base leading-relaxed text-muted-foreground">{text}{availabilityNote ? " This report remains available while the evidence chain is incomplete." : null}</p>; }

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

export default function EvidenceChainReport() {
  const [, params] = useRoute("/observatory/reports/:recordId");
  // Older Observatory pages could pass a Markdown filename after the research
  // detail loader lost the front-matter ID. Treat that legacy route as the
  // canonical VIGIL ID rather than asking the registry for a non-existent .md
  // record identifier.
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
        const sourceIndexRecord = indexById.get(sourceId);
        if (!sourceIndexRecord) throw new Error(`The VIGIL registry does not contain ${sourceId}.`);
        let sourceRecord = sourceIndexRecord;
        try { sourceRecord = normalizeReportRecord(await loadVigilRecordDetail(sourceIndexRecord.raw), sourceIndexRecord); } catch { /* index projection remains useful */ }
        const details = new Map<string, VigilIndexRecord>([[sourceRecord.id, sourceRecord]]);
        // A report is a declared chain, not a graph walk: load the source and
        // its direct authoritative links exactly once. Context never expands it.
        const declaredChain: RecordChain = {
          observations: [...sourceRecord.publicDisplay.chain.observations],
          failureModes: [...sourceRecord.publicDisplay.chain.failureModes],
          proposals: [...sourceRecord.publicDisplay.chain.proposals],
          patches: [...sourceRecord.publicDisplay.chain.patches],
        };
        if (!chainIds(declaredChain).includes(sourceId)) {
          const targetKey = sourceRecord.record_type === "observation" || sourceRecord.record_type === "research" ? "observations" : sourceRecord.record_type === "failure_mode" ? "failureModes" : sourceRecord.record_type === "proposal" ? "proposals" : "patches";
          declaredChain[targetKey].unshift(sourceId);
        }
        const chain = reportChainWithKnownRecords(declaredChain, indexById);
        for (const stage of chainStages) for (const id of chain[stage.key]) {
          if (details.has(id)) continue;
          const indexRecord = indexById.get(id);
          if (!indexRecord) continue;
          let record = indexRecord;
          try { record = normalizeReportRecord(await loadVigilRecordDetail(indexRecord.raw), indexRecord); } catch { /* index projection remains useful */ }
          details.set(record.id, record);
        }
        if (!cancelled) setState({ status: "ready", records: [...details.values()], chain, sourceId, generatedAt: new Date().toISOString() });
      } catch (error) { if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : "The evidence chain report could not be loaded." }); }
    }
    void load();
    return () => { cancelled = true; };
  }, [sourceId]);

  const byId = useMemo(() => new Map(state.status === "ready" ? state.records.map((record) => [record.id, record]) : []), [state]);
  const citations = useMemo(() => collectCitations(state.status === "ready" ? state.records : []), [state]);
  const observationRecordIds = useMemo(() => new Set(state.status === "ready" ? state.chain.observations : []), [state]);
  const supportingRecords = useMemo(() => state.status === "ready"
    ? state.records.filter((record) => !observationRecordIds.has(record.id))
    : [], [observationRecordIds, state]);
  const toggleSection = (number: string) => {
    setIncludedSections((current) => ({ ...current, [number]: !current[number] }));
  };
  return <Shell><main className="report-page container mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 md:px-8 md:py-12 lg:px-10">
    {state.status === "loading" && <div className="cam-parchment-card rounded-xl p-6 text-sm text-muted-foreground">Preparing the evidence-chain report…</div>}
    {state.status === "error" && <div className="cam-parchment-card rounded-xl p-6"><p className="font-mono text-sm uppercase tracking-[0.16em] text-red-700">Report unavailable</p><p className="mt-3 text-base leading-relaxed text-muted-foreground">{state.message}</p><Link href="/observatory" className="mt-4 inline-flex font-mono text-sm uppercase tracking-[0.12em] text-cam-gold underline underline-offset-4">Return to Observatory →</Link></div>}
    {state.status === "ready" && <div className="space-y-6">
      <header className="report-cover border-b border-border/70 pb-7"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><p className="font-mono text-sm uppercase tracking-[0.2em] text-cam-gold">VIGIL Evidence Chain Report</p><h1 className="mt-3 font-serif text-4xl leading-tight text-foreground md:text-5xl">Evidence to repair</h1><p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">A deterministic public audit artefact that preserves the evidence chain and presents its substantive findings in a structured report.</p></div><div className="flex shrink-0 flex-wrap gap-2 print:hidden"><button type="button" onClick={() => window.print()} className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[hsl(32_62%_25%)]">Print / Save as PDF</button><Link href="/observatory" className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">Back to Observatory</Link></div></div><div className="mt-6 grid gap-3 rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-4 sm:grid-cols-4"><div><p className="report-label">Report initiated from</p><p className="mt-1 font-mono text-sm text-cam-gold">{state.sourceId}</p></div><div><p className="report-label">Linked records</p><p className="mt-1 font-serif text-xl text-foreground">{chainIds(state.chain).length}</p></div><div><p className="report-label">Chain state</p><p className="mt-1 font-serif text-xl text-foreground">{chainState(state.chain)}</p></div><div><p className="report-label">Report generated (UTC)</p><p className="mt-1 break-all font-mono text-sm leading-relaxed text-foreground">{state.generatedAt}</p></div></div></header>
      <StepSection {...reportSteps[0]} included={includedSections[reportSteps[0].number] !== false} onToggle={() => toggleSection(reportSteps[0].number)}><ObservationStage records={state.chain.observations.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record)).filter(isExternalObservationEvidence)} supportingRecords={supportingRecords} citations={citations} /></StepSection>
      <StepSection {...reportSteps[1]} included={includedSections[reportSteps[1].number] !== false} onToggle={() => toggleSection(reportSteps[1].number)}><RecordLedger records={state.records} chain={state.chain} byId={byId} citations={citations} /></StepSection>
      <StepSection {...reportSteps[2]} included={includedSections[reportSteps[2].number] !== false} onToggle={() => toggleSection(reportSteps[2].number)}><ClassificationStage records={state.chain.failureModes.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[3]} included={includedSections[reportSteps[3].number] !== false} onToggle={() => toggleSection(reportSteps[3].number)}><DiagnoseStage records={state.chain.proposals.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[4]} included={includedSections[reportSteps[4].number] !== false} onToggle={() => toggleSection(reportSteps[4].number)}><RepairStage records={state.chain.patches.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[5]} included={includedSections[reportSteps[5].number] !== false} onToggle={() => toggleSection(reportSteps[5].number)}><LearnStage records={state.records} /></StepSection>
      <Citations citations={citations} />
      <footer className="border-t border-border/70 pt-5 text-sm leading-relaxed text-muted-foreground">VIGIL preserves the evidence-to-repair audit trail. CAELESTIS remains the authoritative governance corpus. This report is generated from the public VIGIL registry and does not replace the canonical source records.</footer>
    </div>}
  </main></Shell>;
}
