import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { loadVigilRecordDetail, loadVigilRegistryRecords } from "@/lib/vigilRegistry";
import { normalizeVigilRecord, type VigilIndexRecord } from "@/lib/vigilPresentation";
import type { CorpusProvision, RecordChain } from "@/lib/vigilPublicDisplay";

const chainStages: Array<{ key: keyof RecordChain; label: string; singular: string }> = [
  { key: "observations", label: "Observation / Research", singular: "Observation or research" },
  { key: "failureModes", label: "Failure Mode", singular: "Failure mode" },
  { key: "proposals", label: "Proposal", singular: "Proposal" },
  { key: "patches", label: "PATCH", singular: "PATCH" },
];

const reportSteps = [
  { number: "01", label: "Observe", description: "The signal, incident, research basis, or governance breakdown that began the chain." },
  { number: "02", label: "Record", description: "The four linked VIGIL records and the provenance preserved across the chain." },
  { number: "03", label: "Classify", description: "The repeatable failure mode or governance pattern identified from the evidence." },
  { number: "04", label: "Diagnose", description: "The governance weakness, proposed response, and decision pathway." },
  { number: "05", label: "Repair", description: "The PATCH, corpus implementation, safeguards, and verification." },
  { number: "06", label: "Learn", description: "Lifecycle, residual monitoring, unresolved work, and feedback into future design." },
] as const;

type ReportState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; chain: RecordChain; sourceId: string }
  | { status: "error"; message: string };

function chainIds(chain: RecordChain) { return chainStages.flatMap(({ key }) => chain[key]); }
function recordUrl(recordId: string) { return `/observatory#vigil-record-${recordId.replace(/[^A-Za-z0-9_-]/g, "-")}`; }
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
function typeLabel(record: VigilIndexRecord) { return record.type_label || record.record_type.replace(/_/g, " "); }

function RecordHeading({ record, link = true }: { record: VigilIndexRecord; link?: boolean }) {
  return <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <p className="font-mono text-xs text-cam-gold">{record.id}</p>
      <h3 className="mt-1 break-words font-serif text-xl leading-snug text-foreground">{record.title}</h3>
      {link && <Link href={recordUrl(record.id)} className="mt-1 inline-flex font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] underline decoration-cam-gold/50 underline-offset-4 print:hidden">View in Observatory →</Link>}
    </div>
    <span className={`w-fit shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${statusTone(statusFor(record))}`}>{statusFor(record)}</span>
  </div>;
}

function FieldGrid({ entries }: { entries: Array<[string, unknown]> }) {
  const visible = entries.map(([label, value]) => [label, displayText(value)] as const).filter((entry): entry is readonly [string, string] => Boolean(entry[1]));
  if (!visible.length) return null;
  return <dl className="grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-2">
    {visible.map(([label, value]) => <div key={label}><dt className="report-label">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">{value}</dd></div>)}
  </dl>;
}

function Narrative({ label, value }: { label: string; value?: unknown }) {
  const text = displayText(value);
  return text ? <div><p className="report-label">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{text}</p></div> : null;
}

function RecordLedger({ records, chain, byId }: { records: VigilIndexRecord[]; chain: RecordChain; byId: Map<string, VigilIndexRecord> }) {
  const ordered = chainStages.flatMap((stage) => chain[stage.key].map((id) => ({ id, label: stage.label })));
  return <div className="overflow-hidden rounded-lg border border-border/70 bg-white/55">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/60 bg-white/45 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>Linked evidence-to-repair record</span><span>Status</span></div>
    {ordered.length ? ordered.map(({ id, label }) => {
      const record = byId.get(id);
      return <div key={`${label}-${id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/50 px-4 py-3 last:border-b-0">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.1em] text-cam-gold">{label}</p><p className="mt-1 break-words font-serif text-base text-foreground">{record?.title ?? id}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{id}</p></div>
        <span className={`w-fit rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] ${record ? statusTone(statusFor(record)) : "border-amber-300 bg-amber-50 text-amber-950"}`}>{record ? statusFor(record) : "Unavailable"}</span>
      </div>;
    }) : <p className="p-4 text-sm text-muted-foreground">No linked records are available yet. This report remains available while the evidence chain is incomplete.</p>}
    {!records.length && <p className="border-t border-dashed border-border/60 p-3 text-sm text-muted-foreground">The linked record details are not currently available.</p>}
  </div>;
}

function ObservationStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><RecordHeading record={record} /><p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{summary(record)}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Narrative label="What was observed" value={record.publicDisplay.observation?.observed} /><Narrative label="Context" value={record.publicDisplay.observation?.context} /><Narrative label="Interpretation" value={record.publicDisplay.observation?.interpretation} /><Narrative label="Source / provenance" value={field(record, ["source_summary", "source", "source_url", "source_reference", "primary_source", "source_platform"])} /></div><FieldGrid entries={[["Source modality", record.publicDisplay.observation?.sourceModality], ["Public access", record.publicDisplay.observation?.publicAccess], ["Affected parties or interests", record.publicDisplay.failure?.affectedParties], ["Observed system", record.system_summary]]} /></article>) : <Incomplete text="Observation or research not yet linked." />}</div>;
}

function ClassificationStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><RecordHeading record={record} /><p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{summary(record)}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Narrative label="Failure-mode definition" value={record.publicDisplay.failure?.definition} /><Narrative label="Why it matters" value={record.publicDisplay.failure?.significance} /><Narrative label="Triggers" value={record.publicDisplay.failure?.triggers} /><Narrative label="Observed manifestations" value={record.publicDisplay.failure?.manifestations} /></div><FieldGrid entries={[["Failure family", record.failure_family], ["Failure subtype", record.failure_subtype], ["Severity", record.severity], ["Likelihood", record.likelihood], ["Affected domains", record.affected_domains], ["Affected parties or interests", record.publicDisplay.failure?.affectedParties]]} /></article>) : <Incomplete text="Failure mode not yet linked." />}</div>;
}

function DiagnoseStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><RecordHeading record={record} /><p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{summary(record)}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Narrative label="Problem diagnosed" value={record.publicDisplay.proposal?.problem} /><Narrative label="Proposed outcome" value={record.publicDisplay.proposal?.proposedOutcome} /><Narrative label="Proposed wording" value={record.publicDisplay.proposal?.proposedWording} /><Narrative label="Decision status" value={record.publicDisplay.proposal?.decisionStatus} /></div><FieldGrid entries={[["Proposal type", record.proposal_type], ["Target domains", record.target_domains], ["Drafting status", record.drafting_status], ["External relevance", record.external_relevance], ["Resulting PATCH records", record.publicDisplay.proposal?.resultingPatches]]} /></article>) : <Incomplete text="Proposal not yet linked." />}</div>;
}

function ProvisionTable({ provisions }: { provisions: CorpusProvision[] }) {
  if (!provisions.length) return null;
  return <div className="mt-4 overflow-hidden rounded-lg border border-border/70 bg-white/55"><div className="border-b border-border/60 bg-white/45 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Corpus implementation by instrument section</div><div className="divide-y divide-border/50">{provisions.map((provision, index) => <div key={`${provision.instrumentId ?? "provision"}-${provision.section ?? index}`} className="report-break-inside-avoid grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]"><div><p className="font-mono text-[10px] text-cam-gold">{provision.instrumentId ?? "Corpus provision"}{provision.section ? ` · ${provision.section}` : ""}</p>{provision.heading && <p className="mt-1 font-serif text-sm text-foreground">{provision.heading}</p>}<p className="mt-1 text-xs text-muted-foreground">{provision.action ?? provision.relationship ?? "Implementation recorded"}{provision.implementedDate ? ` · ${provision.implementedDate}` : ""}</p></div><div><p className="report-label">{provision.action?.toLowerCase().includes("remov") ? "Literal wording removed" : "Final adopted wording"}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{provision.finalWording ?? provision.previousWording ?? "Wording not supplied."}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{[provision.verificationStatus, provision.verifiedAgainst, provision.currentStatus].filter(Boolean).join(" · ")}</p></div></div>)}</div></div>;
}

function RepairStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-4">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><RecordHeading record={record} /><p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{summary(record)}</p><FieldGrid entries={[["Repair outcome", record.publicDisplay.patch?.outcome], ["Repair summary", record.publicDisplay.patch?.repairSummary], ["Implementation date", record.publicDisplay.patch?.implementationDate], ["Verification", record.publicDisplay.patch?.verificationStatus], ["Verified against", record.publicDisplay.patch?.verifiedAgainst], ["Residual monitoring", record.publicDisplay.patch?.residualMonitoring], ["Patch type", record.patch_type], ["Change scope", record.change_scope], ["Implementation mode", record.implementation_mode]]} /><ProvisionTable provisions={record.publicDisplay.corpusProvisions} /></article>) : <Incomplete text="PATCH not yet linked." />}</div>;
}

function LearnStage({ records }: { records: VigilIndexRecord[] }) {
  return <div className="space-y-3">{records.length ? records.map((record) => <article key={record.id} className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-xs text-cam-gold">{record.id}</p><p className="mt-1 font-serif text-lg text-foreground">{record.title}</p></div><span className={`w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${statusTone(statusFor(record))}`}>{statusFor(record)}</span></div><FieldGrid entries={[["Record type", typeLabel(record)], ["First observed", record.publicDisplay.dates.firstObserved], ["Published", record.publicDisplay.dates.published], ["Updated", record.publicDisplay.dates.lastUpdated], ["Implemented", record.publicDisplay.dates.implemented], ["Repair state", record.publicDisplay.repairState], ["Next action", record.next_action ?? record.publicDisplay.failure?.repairNextAction], ["Residual monitoring", record.publicDisplay.patch?.residualMonitoring], ["Verification", record.verification_status ?? record.publicDisplay.patch?.verificationStatus]]} /></article>) : <Incomplete text="No lifecycle or learning information has yet been recorded." />}</div>;
}

function Incomplete({ text }: { text: string }) { return <p className="rounded-lg border border-dashed border-[hsl(38_25%_80%)] bg-white/35 p-4 text-sm leading-relaxed text-muted-foreground">{text} This report remains available while the evidence chain is incomplete.</p>; }

function StepSection({ number, label, description, children }: { number: string; label: string; description: string; children: ReactNode }) {
  return <section className="report-section report-break-inside-avoid rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-5 md:p-6"><div className="flex items-start gap-4 border-b border-[hsl(38_25%_80%)] pb-4"><span className="font-mono text-sm tracking-[0.12em] text-cam-gold">{number}</span><div><h2 className="font-serif text-2xl text-foreground">{label}</h2><p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p></div></div><div className="mt-4">{children}</div></section>;
}

export default function EvidenceChainReport() {
  const [, params] = useRoute("/observatory/reports/:recordId");
  const sourceId = decodeURIComponent(params?.recordId ?? "");
  const [state, setState] = useState<ReportState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const registry = await loadVigilRegistryRecords();
        const indexRecords = registry.records.map((record, index) => normalizeVigilRecord(record, index));
        const indexById = new Map(indexRecords.map((record) => [record.id, record]));
        const sourceIndexRecord = indexById.get(sourceId);
        if (!sourceIndexRecord) throw new Error(`The VIGIL registry does not contain ${sourceId}.`);
        const details = new Map<string, VigilIndexRecord>();
        const pending = [sourceIndexRecord];
        const chain: RecordChain = { observations: [], failureModes: [], proposals: [], patches: [] };
        while (pending.length) {
          const indexRecord = pending.shift()!;
          if (details.has(indexRecord.id)) continue;
          let record = indexRecord;
          try { record = normalizeVigilRecord(await loadVigilRecordDetail(indexRecord.raw)); } catch { /* index projection remains useful */ }
          details.set(record.id, record);
          for (const stage of chainStages) for (const id of record.publicDisplay.chain[stage.key]) {
            if (!chain[stage.key].includes(id)) chain[stage.key].push(id);
            const linked = indexById.get(id);
            if (linked && !details.has(id)) pending.push(linked);
          }
        }
        if (!chainIds(chain).includes(sourceId)) {
          const targetKey = sourceIndexRecord.record_type === "observation" ? "observations" : sourceIndexRecord.record_type === "failure_mode" ? "failureModes" : sourceIndexRecord.record_type === "proposal" ? "proposals" : "patches";
          chain[targetKey].unshift(sourceId);
        }
        if (!cancelled) setState({ status: "ready", records: [...details.values()], chain, sourceId });
      } catch (error) { if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : "The evidence chain report could not be loaded." }); }
    }
    void load();
    return () => { cancelled = true; };
  }, [sourceId]);

  const byId = useMemo(() => new Map(state.status === "ready" ? state.records.map((record) => [record.id, record]) : []), [state]);
  return <Shell><main className="report-page container mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
    {state.status === "loading" && <div className="cam-parchment-card rounded-xl p-6 text-sm text-muted-foreground">Preparing the evidence-chain report…</div>}
    {state.status === "error" && <div className="cam-parchment-card rounded-xl p-6"><p className="font-mono text-xs uppercase tracking-[0.16em] text-red-700">Report unavailable</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{state.message}</p><Link href="/observatory" className="mt-4 inline-flex font-mono text-xs uppercase tracking-[0.12em] text-cam-gold underline underline-offset-4">Return to Observatory →</Link></div>}
    {state.status === "ready" && <div className="space-y-6">
      <header className="report-cover border-b border-border/70 pb-7"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cam-gold">VIGIL Evidence Chain Report</p><h1 className="mt-3 font-serif text-4xl leading-tight text-foreground md:text-5xl">Evidence to repair</h1><p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">A deterministic public audit artefact that preserves the four-record evidence chain while presenting its information through the Observatory’s six-step method.</p></div><div className="flex shrink-0 flex-wrap gap-2 print:hidden"><button type="button" onClick={() => window.print()} className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)]">Print / Save as PDF</button><Link href="/observatory" className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Back to Observatory</Link></div></div><div className="mt-6 grid gap-3 rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-4 sm:grid-cols-3"><div><p className="report-label">Report initiated from</p><p className="mt-1 font-mono text-sm text-cam-gold">{state.sourceId}</p></div><div><p className="report-label">Linked records</p><p className="mt-1 font-serif text-xl text-foreground">{chainIds(state.chain).length}</p></div><div><p className="report-label">Chain state</p><p className="mt-1 font-serif text-xl text-foreground">{chainStages.every(({ key }) => state.chain[key].length > 0) ? "Complete" : "Incomplete"}</p></div></div></header>
      <div className="report-step-index grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{reportSteps.map((step) => <div key={step.number} className="rounded-lg border border-border/70 bg-card/55 p-3"><span className="font-mono text-[10px] text-cam-gold">Step {step.number}</span><p className="mt-1 font-serif text-lg text-foreground">{step.label}</p></div>)}</div>
      <StepSection {...reportSteps[0]}><ObservationStage records={state.chain.observations.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[1]}><RecordLedger records={state.records} chain={state.chain} byId={byId} /></StepSection>
      <StepSection {...reportSteps[2]}><ClassificationStage records={state.chain.failureModes.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[3]}><DiagnoseStage records={state.chain.proposals.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[4]}><RepairStage records={state.chain.patches.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record))} /></StepSection>
      <StepSection {...reportSteps[5]}><LearnStage records={state.records} /></StepSection>
      <footer className="border-t border-border/70 pt-5 text-xs leading-relaxed text-muted-foreground">VIGIL preserves the evidence-to-repair audit trail. CAELESTIS remains the authoritative governance corpus. This report is generated from the public VIGIL registry and does not replace the canonical source records.</footer>
    </div>}
  </main></Shell>;
}
