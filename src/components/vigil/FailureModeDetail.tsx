import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { EvidenceCard } from "@/components/vigil/EvidenceCard";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { normalizeFailureFamilyLabel, publicRepairStateLabel, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { deriveFailureModePublicDetail } from "@/lib/vigilPublicDisplay";

function chainHref(id: string) {
  if (/-FM-/i.test(id)) return `/observatory/failure-modes/${encodeURIComponent(id)}`;
  if (/-LEARN-/i.test(id)) return `/observatory/knowledge-base/${encodeURIComponent(id)}`;
  if (/-OBS-|-RESEARCH-|-PROP-|-PATCH-/i.test(id)) return `/observatory/reports/${encodeURIComponent(id)}`;
  return `/observatory/ledger#vigil-record-${encodeURIComponent(id)}`;
}

function allChainIds(record: VigilIndexRecord) {
  const chain = record.publicDisplay.chain;
  const declared = [...chain.observations, ...chain.failureModes, ...chain.proposals, ...chain.patches];
  const linked = record.raw.linked_records;
  const learns = linked && typeof linked === "object" && !Array.isArray(linked)
    ? Object.entries(linked)
      .filter(([key]) => /learn/i.test(key))
      .flatMap(([, value]) => JSON.stringify(value).match(/VIGIL-\d{4}-LEARN-\d{4}/gi) ?? [])
    : [];
  return [...new Set([...declared, ...learns])];
}

function stageFor(id: string) {
  if (/-OBS-|-RESEARCH-/i.test(id)) return "OBS";
  if (/-FM-/i.test(id)) return "FM";
  if (/-PROP-/i.test(id)) return "PROP";
  if (/-PATCH-/i.test(id)) return "PATCH";
  if (/-LEARN-/i.test(id)) return "LEARN";
  return "Record";
}

function Field({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</dt>
      <dd className={`mt-1 break-words text-sm leading-6 text-foreground/80 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

export function FailureModeDetail({ record }: { record: VigilIndexRecord }) {
  const detail = deriveFailureModePublicDetail(record.raw, record.publicDisplay);
  const family = normalizeFailureFamilyLabel(record.failure_family) ?? record.failure_family;
  const chainIds = allChainIds(record);
  const lifecycle = record.publicDisplay.lifecycleLabel ?? record.record_state;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 md:px-10 md:py-14">
      <Link href="/observatory/failure-modes" className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.11em] text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Failure Mode Library
      </Link>

      <article className="mt-7">
        <header className="border-b border-border pb-8">
          <div className="flex flex-wrap gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.12em]">
            <span className="font-semibold text-primary">{record.id}</span>
            {family && <span className="text-muted-foreground">{family}</span>}
          </div>
          <h1 className="mt-4 max-w-5xl font-serif text-4xl leading-[1.08] text-foreground sm:text-5xl">{record.title}</h1>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Failure classification and public state">
            <VigilStatusChip value={record.severity ?? "Severity not assessed"} />
            <VigilStatusChip value={record.evidence_confidence ?? "Evidence state not specified"} prefix="Evidence" />
            <VigilStatusChip value={lifecycle} />
            <VigilStatusChip value={publicRepairStateLabel(detail.repairState, record.repair_status, record.publicDisplay.repairState)} prefix="Repair" />
          </div>
        </header>

        <div className="mt-9 grid gap-6">
          <section className="rounded-2xl border border-primary/25 bg-card p-6 shadow-sm md:p-8" aria-labelledby="failure-definition-heading">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-primary">Failure definition</p>
            <h2 id="failure-definition-heading" className="sr-only">Failure Definition</h2>
            <p className="mt-4 max-w-5xl font-serif text-2xl leading-relaxed text-foreground md:text-[1.75rem]">{detail.definition ?? record.summary}</p>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-background p-6" aria-labelledby="recognition-threshold-heading">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-primary">Recognition threshold</p>
              <h2 id="recognition-threshold-heading" className="mt-3 font-serif text-2xl text-foreground">This failure is present when…</h2>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-foreground/80">{detail.recognitionThreshold ?? "A canonical recognition threshold is not yet available in the public record."}</p>
            </section>
            <section className="rounded-2xl border border-border bg-secondary/45 p-6" aria-labelledby="why-it-matters-heading">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-primary">Governance significance</p>
              <h2 id="why-it-matters-heading" className="mt-3 font-serif text-2xl text-foreground">Why it matters</h2>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-foreground/80">{detail.significance ?? "Governance significance is not yet separately stated in the canonical record."}</p>
            </section>
          </div>

          <section className="pt-4" aria-labelledby="failure-evidence-heading">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-primary">Verify the basis</p>
            <h2 id="failure-evidence-heading" className="mt-2 font-serif text-3xl text-foreground">Evidence</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Source claims, VIGIL interpretation, and evidentiary limits are kept distinct.</p>
            <div className="mt-5 grid gap-4">
              {detail.evidence.length > 0
                ? detail.evidence.map((evidence, index) => <EvidenceCard key={`${evidence.title}-${index}`} evidence={evidence} />)
                : <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No structured evidence cards are present in this public projection. The canonical record remains available in Audit &amp; Record Metadata.</div>}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-primary/25 bg-card p-6 shadow-sm md:p-8" aria-labelledby="governance-response-heading">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-primary">Respond to the failure</p>
            <h2 id="governance-response-heading" className="mt-2 font-serif text-3xl text-foreground">Governance response</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Current repair state" value={detail.repairState ?? record.publicDisplay.repairState ?? record.repair_status} />
              <Field label="Governance control sought" value={detail.governanceControlSought ?? record.next_action} />
              <Field label="Existing coverage" value={detail.existingCoverage} />
              <Field label="Proposed control" value={detail.proposedControl} />
              <Field label="Implemented provision" value={detail.implementedProvision} mono />
              {detail.governanceGap.length > 0 && <Field label="Identified governance gap / remaining boundary" value={detail.governanceGap.join("\n\n")} />}
            </div>

            {record.publicDisplay.corpusProvisions.length > 0 && (
              <div className="mt-7 border-t border-border pt-6">
                <h3 className="font-serif text-xl text-foreground">Corpus relationship</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {record.publicDisplay.corpusProvisions.map((provision, index) => (
                    <div key={`${provision.instrumentId}-${provision.section}-${index}`} className="rounded-xl border border-border bg-background p-4">
                      <p className="font-mono text-xs font-semibold text-primary">{provision.instrumentId ?? "Corpus provision"}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{[provision.section, provision.heading].filter(Boolean).join(" · ")}</p>
                      {provision.relationship && <p className="mt-2 text-sm leading-6 text-muted-foreground">{provision.relationship}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="pt-4" aria-labelledby="evidence-repair-chain-heading">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-primary">Trace the provenance</p>
            <h2 id="evidence-repair-chain-heading" className="mt-2 font-serif text-3xl text-foreground">Evidence-to-Repair Chain</h2>
            <p className="mt-2 text-sm text-muted-foreground">OBS → FM → PROP → PATCH → LEARN</p>
            {chainIds.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {chainIds.map((id) => (
                  <Link key={id} href={chainHref(id)} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 hover:bg-secondary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{stageFor(id)}</span>
                    <span className="mt-1 block break-words font-mono text-xs font-semibold text-primary">{id}</span>
                  </Link>
                ))}
              </div>
            ) : <p className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No linked chain records are declared in the current public projection.</p>}
          </section>

          <details className="mt-5 rounded-2xl border border-border bg-card p-5" id="audit-record-metadata">
            <summary className="cursor-pointer font-serif text-2xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Audit &amp; Record Metadata</summary>
            <p className="mt-2 text-sm text-muted-foreground">Administrative workflow, record provenance and raw canonical data.</p>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Triage priority" value={record.triage_priority} mono />
              <Field label="Workflow state" value={record.triage_status} />
              <Field label="Next action" value={record.next_action} />
              <Field label="Monitoring" value={record.monitoring_required === undefined ? undefined : record.monitoring_required ? "Required" : "Not required"} />
              <Field label="Record state" value={record.record_state} />
              <Field label="Record version" value={record.record_version} mono />
              <Field label="Last updated" value={record.record_last_updated ?? record.publicDisplay.dates.lastUpdated} mono />
              <Field label="Verification" value={record.verification_status} />
              <Field label="Source registry" value={record.source_registry} mono />
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              {record.github_blob_url && <a href={record.github_blob_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline decoration-primary/35 underline-offset-4">Canonical record <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>}
              {record.raw_url && <a href={record.raw_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline decoration-primary/35 underline-offset-4">Raw JSON <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>}
            </div>
            <details className="mt-6 rounded-xl border border-border bg-background p-4">
              <summary className="cursor-pointer font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Inspect loaded JSON</summary>
              <pre className="mt-4 max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[hsl(var(--muted))] p-4 font-mono text-xs leading-6 text-foreground">{JSON.stringify(record.raw, null, 2)}</pre>
            </details>
          </details>
        </div>
      </article>
    </div>
  );
}
