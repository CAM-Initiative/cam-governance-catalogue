import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { normalizeFailureFamilyLabel, publicRepairStateLabel, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";

function repairLabel(record: VigilIndexRecord) {
  return publicRepairStateLabel(record.repair_status, record.publicDisplay.repairState);
}

export function FailureModeCard({ record }: { record: VigilIndexRecord }) {
  const family = normalizeFailureFamilyLabel(record.failure_family) ?? record.failure_family ?? "Family not specified";
  const lifecycle = record.publicDisplay.lifecycleLabel ?? record.record_state ?? "Lifecycle not specified";
  const finding = record.publicDisplay.failure?.definition ?? record.publicDisplay.finding ?? record.summary;
  const systems = record.publicDisplay.systems.length ? record.publicDisplay.systems : [record.observed_vendor, record.observed_product].filter(Boolean) as string[];

  return (
    <article className="cam-parchment-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-primary">{record.id}</span>
            <span className="text-xs text-muted-foreground" aria-hidden="true">·</span>
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">{family}</span>
          </div>
          <h2 className="mt-3 font-serif text-2xl leading-tight text-foreground md:text-[1.7rem]">{record.title}</h2>
          {finding && <p className="mt-3 max-w-4xl text-[15px] leading-7 text-foreground/80">{finding}</p>}
        </div>
        <Link
          href={`/observatory/failure-modes/${encodeURIComponent(record.id)}`}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-primary/35 bg-background px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Understand failure <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Failure mode public status">
        <VigilStatusChip value={record.severity ?? "Severity not assessed"} />
        <VigilStatusChip value={record.evidence_confidence ?? "Evidence state not specified"} prefix="Evidence" />
        <VigilStatusChip value={lifecycle} />
        <VigilStatusChip value={repairLabel(record)} />
      </div>

      {systems.length > 0 && (
        <p className="mt-4 border-t border-border/70 pt-4 text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/75">Observed in:</span> {systems.join(" · ")}
        </p>
      )}
    </article>
  );
}
