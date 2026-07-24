import { useEffect, useMemo, useState } from "react";
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

type ReportState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; chain: RecordChain; sourceId: string }
  | { status: "error"; message: string };

function chainIds(chain: RecordChain) {
  return stages.flatMap(({ key }) => chain[key]);
}

function recordUrl(recordId: string) {
  return `/observatory#vigil-record-${recordId.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

function statusTone(label?: string) {
  const value = String(label ?? "").toLowerCase();
  if (value.includes("closed") || value.includes("implemented")) return "border-blue-300 bg-blue-50 text-blue-950";
  if (value.includes("active") || value.includes("open") || value.includes("watching")) return "border-emerald-300 bg-emerald-50 text-emerald-950";
  if (value.includes("deferred") || value.includes("triage")) return "border-amber-300 bg-amber-50 text-amber-950";
  return "border-border bg-background/60 text-muted-foreground";
}

function publicSummary(record: VigilIndexRecord) {
  return record.publicDisplay.finding || record.summary || "No public finding is currently available for this record.";
}

function ReportStage({ label, singular, records, byId, sourceId }: { label: string; singular: string; records: string[]; byId: Map<string, VigilIndexRecord>; sourceId: string }) {
  return (
    <section className="report-break-inside-avoid rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-5">
      <div className="flex items-start justify-between gap-4 border-b border-[hsl(38_25%_80%)] pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Evidence stage</p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">{label}</h2>
        </div>
        <span className="rounded-full border border-[hsl(38_25%_80%)] bg-white/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          {records.length} {records.length === 1 ? "record" : "records"}
        </span>
      </div>
      {records.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[hsl(38_25%_80%)] bg-white/35 p-4 text-sm leading-relaxed text-muted-foreground">{singular} not yet linked. This report remains available while the evidence chain is incomplete.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {records.map((recordId) => {
            const record = byId.get(recordId);
            if (!record) return <p key={recordId} className="rounded-lg border border-amber-300 bg-amber-50 p-3 font-mono text-xs text-amber-950">{recordId} — linked record details unavailable.</p>;
            return (
              <article key={recordId} className="report-break-inside-avoid rounded-lg border border-border/70 bg-white/55 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-xs text-cam-gold">{record.id}</p>
                    <h3 className="mt-1 font-serif text-xl leading-snug text-foreground">{record.title}</h3>
                  </div>
                  <span className={`w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${statusTone(record.publicDisplay.lifecycleLabel ?? record.record_state)}`}>
                    {record.publicDisplay.lifecycleLabel ?? record.record_state ?? "Status not specified"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">{publicSummary(record)}</p>
                {record.id !== sourceId && <Link href={recordUrl(record.id)} className="mt-3 inline-flex font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] underline decoration-cam-gold/50 underline-offset-4 print:hidden">View in Observatory →</Link>}
              </article>
            );
          })}
        </div>
      )}
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
          try {
            const raw: UnknownRecord = await loadVigilRecordDetail(indexRecord.raw);
            record = normalizeVigilRecord(raw);
          } catch {
            // The index projection remains useful when a linked canonical record is temporarily unavailable.
          }
          details.set(record.id, record);
          for (const stage of stages) {
            for (const id of record.publicDisplay.chain[stage.key]) {
              if (!chain[stage.key].includes(id)) chain[stage.key].push(id);
              const linked = indexById.get(id);
              if (linked && !details.has(id)) pending.push(linked);
            }
          }
        }

        if (!chainIds(chain).includes(sourceId)) {
          const sourceType = sourceIndexRecord.record_type;
          const targetKey = sourceType === "observation" ? "observations" : sourceType === "failure_mode" ? "failureModes" : sourceType === "proposal" ? "proposals" : "patches";
          chain[targetKey].unshift(sourceId);
        }
        if (!cancelled) setState({ status: "ready", records: [...details.values()], chain, sourceId });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : "The evidence chain report could not be loaded." });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [sourceId]);

  const byId = useMemo(() => new Map(state.status === "ready" ? state.records.map((record) => [record.id, record]) : []), [state]);

  return (
    <Shell>
      <main className="container mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
        {state.status === "loading" && <div className="cam-parchment-card rounded-xl p-6 text-sm text-muted-foreground">Preparing the evidence-chain report…</div>}
        {state.status === "error" && <div className="cam-parchment-card rounded-xl p-6"><p className="font-mono text-xs uppercase tracking-[0.16em] text-red-700">Report unavailable</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{state.message}</p><Link href="/observatory" className="mt-4 inline-flex font-mono text-xs uppercase tracking-[0.12em] text-cam-gold underline underline-offset-4">Return to Observatory →</Link></div>}
        {state.status === "ready" && (
          <div className="space-y-8">
            <header className="border-b border-border/70 pb-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cam-gold">VIGIL Evidence Chain Report</p>
                  <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground md:text-5xl">Evidence to repair</h1>
                  <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">A deterministic public audit view of the linked observation or research basis, failure mode, proposal, and PATCH. Incomplete stages remain visible rather than being omitted.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
                  <button type="button" onClick={() => window.print()} className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] transition hover:bg-primary/15">Print / Save as PDF</button>
                  <Link href="/observatory" className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground">Back to Observatory</Link>
                </div>
              </div>
              <div className="mt-6 grid gap-3 rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-4 sm:grid-cols-3">
                <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Report initiated from</p><p className="mt-1 font-mono text-sm text-cam-gold">{state.sourceId}</p></div>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Linked records</p><p className="mt-1 font-serif text-xl text-foreground">{chainIds(state.chain).length}</p></div>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Chain state</p><p className="mt-1 font-serif text-xl text-foreground">{stages.every(({ key }) => state.chain[key].length > 0) ? "Complete" : "Incomplete"}</p></div>
              </div>
            </header>
            <div className="space-y-5">
              {stages.map((stage) => <ReportStage key={stage.key} {...stage} records={state.chain[stage.key]} byId={byId} sourceId={state.sourceId} />)}
            </div>
            <footer className="border-t border-border/70 pt-5 text-xs leading-relaxed text-muted-foreground">
              VIGIL preserves the evidence-to-repair audit trail. CAELESTIS remains the authoritative governance corpus. This report is generated from the public VIGIL registry and does not replace the canonical source records.
            </footer>
          </div>
        )}
      </main>
    </Shell>
  );
}
