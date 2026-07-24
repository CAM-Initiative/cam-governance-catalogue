import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { loadVigilRecordDetail, loadVigilRegistryRecords, type UnknownRecord } from "@/lib/vigilRegistry";
import { normalizeVigilRecord, type VigilIndexRecord } from "@/lib/vigilPresentation";
import type { RecordChain } from "@/lib/vigilPublicDisplay";

const stages: Array<{ key: keyof RecordChain; label: string; singular: string }> = [
  { key: "observations", label: "Observation / Research", singular: "Observation or research" },
  { key: "failureModes", label: "Failure Mode", singular: "Failure mode" },
  { key: "proposals", label: "Proposal", singular: "Proposal" },
  { key: "patches", label: "PATCH", singular: "PATCH" },
];

const reportSteps = [
  { number: "01", label: "Observe", description: "The signal, incident, research basis, or governance breakdown that began the chain." },
  { number: "02", label: "Record", description: "What VIGIL preserved: provenance, context, affected interests, and the public finding." },
  { number: "03", label: "Classify", description: "The repeatable failure mode or governance pattern identified from the evidence." },
  { number: "04", label: "Diagnose", description: "The accountability, design, implementation, or assurance weakness and the proposed response." },
  { number: "05", label: "Repair", description: "The PATCH, safeguard, standard, instrument, or institutional response and its verification." },
  { number: "06", label: "Learn", description: "Current lifecycle, remaining work, monitoring, and what the chain contributes to future design." },
] as const;

type ReportState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; chain: RecordChain; sourceId: string }
  | { status: "error"; message: string };

function chainIds(chain: RecordChain) { return stages.flatMap(({ key }) => chain[key]); }
function recordUrl(recordId: string) { return `/observatory#vigil-record-${recordId.replace(/[^A-Za-z0-9_-]/g, "-")}`; }
function publicSummary(record: VigilIndexRecord) { return record.publicDisplay.finding || record.summary || "No public finding is currently available for this record."; }
function statusTone(label?: string) {
  const value = String(label ?? "").toLowerCase();
  if (value.includes("closed") || value.includes("implemented")) return "border-blue-300 bg-blue-50 text-blue-950";
  if (value.includes("active") || value.includes("open") || value.includes("watching")) return "border-emerald-300 bg-emerald-50 text-emerald-950";
  if (value.includes("deferred") || value.includes("triage")) return "border-amber-300 bg-amber-50 text-amber-950";
  return "border-border bg-background/60 text-muted-foreground";
}

function firstValue(record: VigilIndexRecord, keys: string[]) {
  for (const key of keys) {
    const value = record.raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value) && value.length) return value.map(String).join("; ");
  }
  return undefined;
}

function ReportRecord({ record, sourceId, detail = false }: { record: VigilIndexRecord; sourceId: string; detail?: boolean }) {
  const lifecycle = record.publicDisplay.lifecycleLabel ?? record.record_state ?? "Status not specified";
  const source = firstValue(record, ["source", "source_url", "source_reference", "primary_source", "source_platform"]);
  const affected = firstValue(record, ["affected_parties_or_interests", "affected_parties", "affected_population"]);
  const nextAction = firstValue(record, ["next_action", "recommended_next_step", "recommended_action", "follow_up"]);
  const repair = record.publicDisplay.principalRepair;
  return (
    <article className="report-record report-break-inside-avoid rounded-lg border border-border/70 bg-white/60 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs text-cam-gold">{record.id}</p>
          <h3 className="mt-1 break-words font-serif text-xl leading-snug text-foreground">{record.title}</h3>
        </div>
        <span className={`w-fit shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${statusTone(lifecycle)}`}>{lifecycle}</span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{publicSummary(record)}</p>
      {detail && (source || affected || repair || nextAction) && (
        <dl className="mt-4 grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-2">
          {source && <div><dt className="report-label">Source / provenance</dt><dd className="mt-1 break-words text-sm leading-relaxed">{source}</dd></div>}
          {affected && <div><dt className="report-label">Affected parties or interests</dt><dd className="mt-1 break-words text-sm leading-relaxed">{affected}</dd></div>}
          {repair && <div><dt className="report-label">Repair state</dt><dd className="mt-1 break-words text-sm leading-relaxed">{repair}</dd></div>}
          {nextAction && <div><dt className="report-label">Next action</dt><dd className="mt-1 break-words text-sm leading-relaxed">{nextAction}</dd></div>}
        </dl>
      )}
      {record.id !== sourceId && <Link href={recordUrl(record.id)} className="mt-3 inline-flex font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] underline decoration-cam-gold/50 underline-offset-4 print:hidden">View in Observatory →</Link>}
    </article>
  );
}

function ReportStage({ label, singular, records, byId, sourceId, detail = false }: { label: string; singular: string; records: string[]; byId: Map<string, VigilIndexRecord>; sourceId: string; detail?: boolean }) {
  return (
    <div className="space-y-3">
      {records.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[hsl(38_25%_80%)] bg-white/35 p-4 text-sm leading-relaxed text-muted-foreground">{singular} not yet linked. This report remains available while the evidence chain is incomplete.</p>
      ) : records.map((recordId) => {
        const record = byId.get(recordId);
        return record ? <ReportRecord key={recordId} record={record} sourceId={sourceId} detail={detail} /> : <p key={recordId} className="rounded-lg border border-amber-300 bg-amber-50 p-3 font-mono text-xs text-amber-950">{recordId} — linked record details unavailable.</p>;
      })}
    </div>
  );
}

function StepSection({ number, label, description, children }: { number: string; label: string; description: string; children: ReactNode }) {
  return (
    <section className="report-section report-break-inside-avoid rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-5 md:p-6">
      <div className="flex items-start gap-4 border-b border-[hsl(38_25%_80%)] pb-4">
        <span className="font-mono text-sm tracking-[0.12em] text-cam-gold">{number}</span>
        <div><h2 className="font-serif text-2xl text-foreground">{label}</h2><p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p></div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
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
          for (const stage of stages) for (const id of record.publicDisplay.chain[stage.key]) {
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
  const linkedRecords = state.status === "ready" ? chainIds(state.chain) : [];
  const records = state.status === "ready" ? state.records : [];
  const learningRecords = records.filter((record) => record.publicDisplay.lifecycleLabel || record.record_state || record.publicDisplay.repairState);

  return <Shell><main className="report-page container mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
    {state.status === "loading" && <div className="cam-parchment-card rounded-xl p-6 text-sm text-muted-foreground">Preparing the evidence-chain report…</div>}
    {state.status === "error" && <div className="cam-parchment-card rounded-xl p-6"><p className="font-mono text-xs uppercase tracking-[0.16em] text-red-700">Report unavailable</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{state.message}</p><Link href="/observatory" className="mt-4 inline-flex font-mono text-xs uppercase tracking-[0.12em] text-cam-gold underline underline-offset-4">Return to Observatory →</Link></div>}
    {state.status === "ready" && <div className="space-y-6">
      <header className="report-cover border-b border-border/70 pb-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cam-gold">VIGIL Evidence Chain Report</p><h1 className="mt-3 font-serif text-4xl leading-tight text-foreground md:text-5xl">Evidence to repair</h1><p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">A deterministic public audit artefact following the Observatory’s six-step evidence-to-repair method. It preserves incomplete stages rather than silently omitting them.</p></div><div className="flex shrink-0 flex-wrap gap-2 print:hidden"><button type="button" onClick={() => window.print()} className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)]">Print / Save as PDF</button><Link href="/observatory" className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Back to Observatory</Link></div></div>
        <div className="mt-6 grid gap-3 rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-4 sm:grid-cols-3"><div><p className="report-label">Report initiated from</p><p className="mt-1 font-mono text-sm text-cam-gold">{state.sourceId}</p></div><div><p className="report-label">Linked records</p><p className="mt-1 font-serif text-xl text-foreground">{linkedRecords.length}</p></div><div><p className="report-label">Chain state</p><p className="mt-1 font-serif text-xl text-foreground">{stages.every(({ key }) => state.chain[key].length > 0) ? "Complete" : "Incomplete"}</p></div></div>
      </header>
      <div className="report-step-index grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{reportSteps.map((step) => <div key={step.number} className="rounded-lg border border-border/70 bg-card/55 p-3"><span className="font-mono text-[10px] text-cam-gold">Step {step.number}</span><p className="mt-1 font-serif text-lg text-foreground">{step.label}</p></div>)}</div>
      <StepSection {...reportSteps[0]}><ReportStage {...stages[0]} records={state.chain.observations} byId={byId} sourceId={state.sourceId} detail /></StepSection>
      <StepSection {...reportSteps[1]}><div className="space-y-3">{records.filter((record) => state.chain.observations.includes(record.id)).map((record) => <ReportRecord key={record.id} record={record} sourceId={state.sourceId} detail />)}{!state.chain.observations.length && <p className="text-sm text-muted-foreground">No observation or research record is linked yet.</p>}</div></StepSection>
      <StepSection {...reportSteps[2]}><ReportStage {...stages[1]} records={state.chain.failureModes} byId={byId} sourceId={state.sourceId} detail /></StepSection>
      <StepSection {...reportSteps[3]}><ReportStage {...stages[2]} records={state.chain.proposals} byId={byId} sourceId={state.sourceId} detail /></StepSection>
      <StepSection {...reportSteps[4]}><ReportStage {...stages[3]} records={state.chain.patches} byId={byId} sourceId={state.sourceId} detail /></StepSection>
      <StepSection {...reportSteps[5]}><div className="space-y-3">{learningRecords.length ? learningRecords.map((record) => <ReportRecord key={record.id} record={record} sourceId={state.sourceId} detail />) : <p className="rounded-lg border border-dashed border-[hsl(38_25%_80%)] bg-white/35 p-4 text-sm leading-relaxed text-muted-foreground">No lifecycle or repair outcome has yet been recorded.</p>}</div></StepSection>
      <footer className="border-t border-border/70 pt-5 text-xs leading-relaxed text-muted-foreground">VIGIL preserves the evidence-to-repair audit trail. CAELESTIS remains the authoritative governance corpus. This report is generated from the public VIGIL registry and does not replace the canonical source records.</footer>
    </div>}
  </main></Shell>;
}
