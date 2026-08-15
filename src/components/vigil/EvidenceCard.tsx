import { ExternalLink } from "lucide-react";
import type { PublicEvidenceCard } from "@/lib/vigilPublicDisplay";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";

function TextSection({ title, text, boundary = false }: { title: string; text?: string; boundary?: boolean }) {
  if (!text) return null;
  return (
    <section className={`vigil-evidence-column ${boundary ? "is-boundary" : ""}`}>
      <h4>{title}</h4>
      <p>{text}</p>
    </section>
  );
}

export function EvidenceCard({ evidence }: { evidence: PublicEvidenceCard }) {
  return (
    <article className="vigil-evidence-card">
      <header className="vigil-evidence-header">
        <div className="min-w-0">
          <p className="vigil-evidence-kicker">Evidence source</p>
          <h3>{evidence.title}</h3>
          <p className="vigil-evidence-source-line">{[evidence.publisher, evidence.date, evidence.sourceType].filter(Boolean).join(" · ")}</p>
        </div>
        <VigilStatusChip value={evidence.confidence} prefix="Confidence" />
      </header>

      {(evidence.sourceRole || evidence.sourceResidence || evidence.directReviewStatus || evidence.evidenceModalities.length > 0) && (
        <div className="vigil-evidence-meta" aria-label="Evidence metadata">
          {evidence.sourceRole && <span>Role: {evidence.sourceRole}</span>}
          {evidence.sourceResidence && <span>Residence: {evidence.sourceResidence}</span>}
          {evidence.directReviewStatus && <span>Direct review: {evidence.directReviewStatus}</span>}
          {evidence.evidenceModalities.map((modality) => <span key={modality}>{modality}</span>)}
        </div>
      )}

      <div className="vigil-evidence-grid">
        <TextSection title="Confirmed evidence" text={evidence.confirmedEvidence} />
        <TextSection title="Interpretive conclusion" text={evidence.interpretiveConclusion} />
        <TextSection title="Evidence boundary / not established" text={evidence.evidenceBoundary.join("\n\n")} boundary />
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
