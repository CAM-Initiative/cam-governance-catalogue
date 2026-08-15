import { ArrowDown, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { EvidenceCard } from "@/components/vigil/EvidenceCard";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { normalizeFailureFamilyLabel, publicRepairStateLabel, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { deriveFailureModePublicDetail } from "@/lib/vigilPublicDisplay";

function chainHref(id: string) {
  if (/-FM-/i.test(id)) return `/observatory/failure-modes/${encodeURIComponent(id)}`;
  if (/-LEARN-/i.test(id)) return `/observatory/knowledge-base/${encodeURIComponent(id)}`;
  if (/-OBS-|-RESEARCH-|-PROP-|-PATCH-/i.test(id)) return `/observatory/cases/${encodeURIComponent(id)}`;
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
    <div className="vigil-detail-field">
      <dt>{label}</dt>
      <dd className={mono ? "is-mono" : undefined}>{value}</dd>
    </div>
  );
}

export function FailureModeDetail({ record }: { record: VigilIndexRecord }) {
  const detail = deriveFailureModePublicDetail(record.raw, record.publicDisplay);
  const family = normalizeFailureFamilyLabel(record.failure_family) ?? record.failure_family;
  const chainIds = allChainIds(record);
  const lifecycle = record.publicDisplay.lifecycleLabel ?? record.record_state;
  const repairState = publicRepairStateLabel(detail.repairState, record.repair_status, record.publicDisplay.repairState);
  const leadProvision = record.publicDisplay.corpusProvisions[0];
  const caseAnchor = record.publicDisplay.chain.observations[0] ?? record.publicDisplay.chain.failureModes[0] ?? record.id;

  return (
    <div className="vigil-detail-page">
      <div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-9">
        <Link href="/observatory/failure-modes" className="vigil-back-link">
          <ArrowLeft aria-hidden="true" /> Failure Mode Library
        </Link>

        <article className="vigil-detail-article">
          <header className="vigil-detail-hero">
            <div className="vigil-detail-identity">
              <div className="vigil-detail-code-line">
                <span className="vigil-detail-id">{record.id.replace(/^VIGIL-\d{4}-/i, "")}</span>
                {family && <span>{family.replace(/\s+Failures$/i, "")}</span>}
              </div>
              <h1>{record.title}</h1>
              <p className="vigil-detail-deck">{detail.definition ?? record.summary}</p>
              <div className="vigil-detail-statuses" aria-label="Failure classification and public state">
                <VigilStatusChip value={record.severity ?? "Severity not assessed"} />
                <VigilStatusChip value={record.evidence_confidence ?? "Evidence state not specified"} prefix="Evidence" />
                <VigilStatusChip value={lifecycle} />
                <VigilStatusChip value={repairState} prefix="Repair" />
              </div>
              <Link href={`/observatory/cases/${encodeURIComponent(caseAnchor)}`} className="vigil-case-cta">
                View related case file <ArrowRight aria-hidden="true" />
              </Link>
            </div>

            <aside className="vigil-corpus-relationship" aria-labelledby="corpus-relationship-heading">
              <p className="vigil-panel-kicker">Corpus relationship</p>
              <h2 id="corpus-relationship-heading" className="sr-only">Corpus relationship</h2>
              <dl>
                <Field label="Coverage" value={detail.existingCoverage ?? leadProvision?.relationship ?? "Not separately stated"} />
                <Field label="Gap / boundary" value={detail.governanceGap[0] ?? "No separate gap statement"} />
                <Field label="Repair" value={repairState} />
              </dl>
            </aside>
          </header>

          <section className="vigil-detail-core" aria-labelledby="failure-definition-heading">
            <div className="vigil-core-section vigil-core-definition">
              <p className="vigil-panel-kicker">Failure definition</p>
              <h2 id="failure-definition-heading" className="sr-only">Failure Definition</h2>
              <p>{detail.definition ?? record.summary}</p>
            </div>
            <div className="vigil-core-pair">
              <section className="vigil-core-section" aria-labelledby="recognition-threshold-heading">
                <p className="vigil-panel-kicker">Recognition threshold</p>
                <h2 id="recognition-threshold-heading">This failure is present when…</h2>
                <p>{detail.recognitionThreshold ?? "A canonical recognition threshold is not yet available in the public record."}</p>
              </section>
              <section className="vigil-core-section" aria-labelledby="why-it-matters-heading">
                <p className="vigil-panel-kicker">Governance significance</p>
                <h2 id="why-it-matters-heading">Why it matters</h2>
                <p>{detail.significance ?? "Governance significance is not yet separately stated in the canonical record."}</p>
              </section>
            </div>
          </section>

          <section className="vigil-detail-section" aria-labelledby="failure-evidence-heading">
            <div className="vigil-section-heading">
              <div>
                <p className="vigil-panel-kicker">Verify the basis</p>
                <h2 id="failure-evidence-heading">Evidence</h2>
              </div>
              <p>Source claims, VIGIL interpretation, and evidentiary limits remain distinct.</p>
            </div>
            <div className="vigil-evidence-list">
              {detail.evidence.length > 0
                ? detail.evidence.map((evidence, index) => <EvidenceCard key={`${evidence.title}-${index}`} evidence={evidence} />)
                : <div className="vigil-empty-panel">No structured evidence cards are present in this public projection. The canonical record remains available in Audit &amp; Record Metadata.</div>}
            </div>
          </section>

          <section className="vigil-response-layout" aria-label="Governance response and evidence-to-repair chain">
            <div className="vigil-response-panel" aria-labelledby="governance-response-heading">
              <p className="vigil-panel-kicker">Respond to the failure</p>
              <h2 id="governance-response-heading">Governance response</h2>
              <dl className="vigil-response-fields">
                <Field label="Current repair state" value={detail.repairState ?? record.publicDisplay.repairState ?? record.repair_status} />
                <Field label="Governance control sought" value={detail.governanceControlSought ?? record.next_action} />
                <Field label="Existing coverage" value={detail.existingCoverage} />
                <Field label="Proposed control" value={detail.proposedControl} />
                <Field label="Implemented provision" value={detail.implementedProvision} mono />
                {detail.governanceGap.length > 0 && <Field label="Identified governance gap / remaining boundary" value={detail.governanceGap.join("\n\n")} />}
              </dl>

              {record.publicDisplay.corpusProvisions.length > 0 && (
                <div className="vigil-corpus-provisions">
                  <h3>Corpus relationship</h3>
                  <div className="vigil-provision-grid">
                    {record.publicDisplay.corpusProvisions.map((provision, index) => (
                      <div key={`${provision.instrumentId}-${provision.section}-${index}`} className="vigil-provision">
                        <p className="vigil-provision-id">{provision.instrumentId ?? "Corpus provision"}</p>
                        <p className="vigil-provision-title">{[provision.section, provision.heading].filter(Boolean).join(" · ")}</p>
                        {provision.relationship && <p>{provision.relationship}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="vigil-chain-panel" aria-labelledby="evidence-repair-chain-heading">
              <div className="vigil-chain-heading-row">
                <div>
                  <p className="vigil-panel-kicker">Trace the provenance</p>
                  <h2 id="evidence-repair-chain-heading">Evidence-to-Repair Chain</h2>
                </div>
                <Link href={`/observatory/cases/${encodeURIComponent(caseAnchor)}`} className="vigil-chain-case-link">Open case →</Link>
              </div>
              <p className="vigil-chain-key">OBS → FM → PROP → PATCH → LEARN</p>
              {chainIds.length > 0 ? (
                <div className="vigil-chain-list">
                  {chainIds.map((id, index) => (
                    <div key={id} className="vigil-chain-step-wrap">
                      <Link href={chainHref(id)} className="vigil-chain-step">
                        <span className="vigil-chain-stage">{stageFor(id)}</span>
                        <span className="vigil-chain-id">{id}</span>
                      </Link>
                      {index < chainIds.length - 1 && <ArrowDown className="vigil-chain-arrow" aria-hidden="true" />}
                    </div>
                  ))}
                </div>
              ) : <p className="vigil-chain-empty">No linked chain records are declared in the current public projection.</p>}
            </aside>
          </section>

          <details className="vigil-audit-panel" id="audit-record-metadata">
            <summary>Audit &amp; Record Metadata</summary>
            <p className="vigil-audit-intro">Administrative workflow, record provenance and raw canonical data.</p>
            <dl className="vigil-audit-grid">
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
            <div className="vigil-audit-links">
              {record.github_blob_url && <a href={record.github_blob_url} target="_blank" rel="noreferrer">Canonical record <ExternalLink aria-hidden="true" /></a>}
              {record.raw_url && <a href={record.raw_url} target="_blank" rel="noreferrer">Raw JSON <ExternalLink aria-hidden="true" /></a>}
            </div>
            <details className="vigil-json-panel">
              <summary>Inspect loaded JSON</summary>
              <pre>{JSON.stringify(record.raw, null, 2)}</pre>
            </details>
          </details>
        </article>
      </div>
    </div>
  );
}
