import { ExternalLink } from "lucide-react";
import type { PublicEvidenceCard } from "@/lib/vigilPublicDisplay";
import { titleizeValue } from "@/lib/vigilPresentation";

function MetaField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div className="vigil-evidence-meta-field"><dt>{label}</dt><dd>{value}</dd></div>;
}

function visibleBoundaryItems(items: string[]) {
  return items.filter((item) => {
    const normalized = item.trim().toLowerCase().replace(/[_\s]+/g, "-");
    return ![
      "directly-reviewed",
      "direct-reviewed",
      "reviewed-directly",
      "available",
      "true",
      "yes",
    ].includes(normalized);
  });
}

export function EvidenceCard({ evidence }: { evidence: PublicEvidenceCard }) {
  const boundaries = visibleBoundaryItems(evidence.evidenceBoundary);
  const hasReviewMeta = Boolean(evidence.reviewer || evidence.sourceAccess || evidence.reviewDate);

  return (
    <article className="vigil-evidence-card">
      <header className="vigil-evidence-header">
        <div className="vigil-evidence-title-row">
          <div>
            <p className="vigil-evidence-kicker">Evidence source</p>
            <h3>{evidence.title}</h3>
          </div>
          <div className="vigil-evidence-source-actions" aria-label="Evidence source links">
            {evidence.sourceUrl && <a href={evidence.sourceUrl} target="_blank" rel="noreferrer" aria-label="Open source" title="Open source"><ExternalLink aria-hidden="true" /></a>}
            {evidence.archiveUrl && <a href={evidence.archiveUrl} target="_blank" rel="noreferrer" aria-label="Open archived source" title="Open archived source"><ExternalLink aria-hidden="true" /></a>}
          </div>
        </div>
        <dl className="vigil-evidence-source-meta" aria-label="Evidence source details">
          <MetaField label="Publisher" value={evidence.publisher} />
          <MetaField label="Published" value={evidence.date} />
          <MetaField label="Source type" value={evidence.sourceType ? titleizeValue(evidence.sourceType) : undefined} />
        </dl>
      </header>

      <div className="vigil-evidence-grid">
        {evidence.confirmedEvidence && <section className="vigil-evidence-column">
          <h4>What the source establishes</h4>
          <p>{evidence.confirmedEvidence}</p>
        </section>}

        {(evidence.interpretiveConclusion || hasReviewMeta) && <section className="vigil-evidence-column vigil-evidence-interpretation">
          <h4>VIGIL interpretation</h4>
          {evidence.interpretiveConclusion && <p>{evidence.interpretiveConclusion}</p>}
          {hasReviewMeta && <dl className="vigil-evidence-review-meta" aria-label="VIGIL review details">
            <MetaField label="Reviewer" value={evidence.reviewer} />
            <MetaField label="Reviewed" value={evidence.reviewDate} />
            <MetaField label="Source access" value={evidence.sourceAccess ? titleizeValue(evidence.sourceAccess) : undefined} />
          </dl>}
        </section>}
      </div>

      {boundaries.length > 0 && <details className="vigil-evidence-limitations">
        <summary>Limits of the evidence</summary>
        <div className="vigil-evidence-boundary-list">
          {boundaries.map((item) => <p key={item}>{item}</p>)}
        </div>
      </details>}
    </article>
  );
}
