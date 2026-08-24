import { ExternalLink } from "lucide-react";
import type { PublicEvidenceCard } from "@/lib/vigilPublicDisplay";
import { titleizeValue } from "@/lib/vigilPresentation";

function TextSection({ title, text, boundary = false }: { title: string; text?: string; boundary?: boolean }) {
  if (!text) return null;
  return (
    <section className={`vigil-evidence-column ${boundary ? "is-boundary" : ""}`}>
      <h4>{title}</h4>
      <p>{text}</p>
    </section>
  );
}

function BoundarySection({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="vigil-evidence-column is-boundary">
      <h4>Limits of the evidence</h4>
      <div className="vigil-evidence-boundary-list">
        {items.map((item) => <p key={item}>{item}</p>)}
      </div>
    </section>
  );
}

function confidenceExplanation(value?: string) {
  const normalized = value?.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (!normalized) return undefined;
  if (normalized === "corroborated") {
    return "Supported by corroborating evidence recorded for this case; this does not necessarily mean independent verification.";
  }
  if (normalized === "verified") {
    return "The evidentiary claim has been checked against the cited material recorded for this case.";
  }
  if (normalized === "observed") {
    return "Recorded as an observation supported by the cited material, without a stronger verification claim.";
  }
  return undefined;
}

function directReviewExplanation(value?: string) {
  const normalized = value?.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (!normalized) return undefined;
  if (["true", "yes", "direct", "directly-reviewed", "reviewed-directly"].includes(normalized)) {
    return "Source reviewed directly — the cited source itself was inspected rather than relied on only through a secondary description.";
  }
  if (["false", "no", "not-reviewed-directly", "indirect"].includes(normalized)) {
    return "Source not reviewed directly — this evidence relies on an intermediary or secondary description of the source.";
  }
  return `Source review: ${titleizeValue(value)}`;
}

export function EvidenceCard({ evidence }: { evidence: PublicEvidenceCard }) {
  const confidenceHelp = confidenceExplanation(evidence.confidence);
  const reviewHelp = directReviewExplanation(evidence.directReviewStatus);

  return (
    <article className="vigil-evidence-card">
      <header className="vigil-evidence-header">
        <div className="min-w-0">
          <p className="vigil-evidence-kicker">Evidence source</p>
          <h3>{evidence.title}</h3>
          <p className="vigil-evidence-source-line">{[evidence.publisher, evidence.date, evidence.sourceType ? titleizeValue(evidence.sourceType) : undefined].filter(Boolean).join(" · ")}</p>
        </div>
        {evidence.confidence && <div className="vigil-evidence-assessment">
          <span className="vigil-evidence-assessment-label">{titleizeValue(evidence.confidence)}</span>
          {confidenceHelp && <p>{confidenceHelp}</p>}
        </div>}
      </header>

      {reviewHelp && <div className="vigil-evidence-review-note">{reviewHelp}</div>}

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
