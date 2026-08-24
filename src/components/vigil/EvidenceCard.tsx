import { ExternalLink } from "lucide-react";
import type { PublicEvidenceCard } from "@/lib/vigilPublicDisplay";
import { titleizeValue } from "@/lib/vigilPresentation";

function TextSection({ title, text }: { title: string; text?: string }) {
  if (!text) return null;
  return (
    <section className="vigil-evidence-column">
      <h4>{title}</h4>
      <p>{text}</p>
    </section>
  );
}

function BoundarySection({ items }: { items: string[] }) {
  const visibleItems = items.filter((item) => {
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
  if (!visibleItems.length) return null;
  return (
    <section className="vigil-evidence-column is-boundary">
      <h4>Limits of the evidence</h4>
      <div className="vigil-evidence-boundary-list">
        {visibleItems.map((item) => <p key={item}>{item}</p>)}
      </div>
    </section>
  );
}

function MetaField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div className="vigil-evidence-meta-field"><dt>{label}</dt><dd>{value}</dd></div>;
}

export function EvidenceCard({ evidence }: { evidence: PublicEvidenceCard }) {
  return (
    <article className="vigil-evidence-card">
      <header className="vigil-evidence-header">
        <p className="vigil-evidence-kicker">Evidence source</p>
        <h3>{evidence.title}</h3>
        <dl className="vigil-evidence-source-meta" aria-label="Evidence source details">
          <MetaField label="Publisher" value={evidence.publisher} />
          <MetaField label="Published" value={evidence.date} />
          <MetaField label="Source type" value={evidence.sourceType ? titleizeValue(evidence.sourceType) : undefined} />
        </dl>
      </header>

      <div className="vigil-evidence-grid">
        <TextSection title="What the source establishes" text={evidence.confirmedEvidence} />
        <TextSection title="VIGIL interpretation" text={evidence.interpretiveConclusion} />
        <BoundarySection items={evidence.evidenceBoundary} />
      </div>

      {(evidence.sourceUrl || evidence.archiveUrl) && (
        <footer className="vigil-evidence-links">
          {evidence.sourceUrl && <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">Open source <ExternalLink aria-hidden="true" /></a>}
          {evidence.archiveUrl && <a href={evidence.archiveUrl} target="_blank" rel="noreferrer">Open archive <ExternalLink aria-hidden="true" /></a>}
        </footer>
      )}
    </article>
  );
}
