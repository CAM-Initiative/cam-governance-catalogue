import { ExternalLink } from "lucide-react";
import type { PublicEvidenceCard } from "@/lib/vigilPublicDisplay";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";

function TextSection({ title, text, boundary = false }: { title: string; text?: string; boundary?: boolean }) {
  if (!text) return null;
  return (
    <section className={`rounded-xl border p-4 ${boundary ? "border-primary/25 bg-secondary/55" : "border-border bg-background/70"}`}>
      <h4 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{title}</h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{text}</p>
    </section>
  );
}

export function EvidenceCard({ evidence }: { evidence: PublicEvidenceCard }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Evidence source</p>
          <h3 className="mt-1 font-serif text-xl leading-snug text-foreground">{evidence.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{[evidence.publisher, evidence.date, evidence.sourceType].filter(Boolean).join(" · ")}</p>
        </div>
        <VigilStatusChip value={evidence.confidence} prefix="Confidence" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {evidence.sourceRole && <span className="rounded-full border border-border bg-background px-2.5 py-1">Role: {evidence.sourceRole}</span>}
        {evidence.sourceResidence && <span className="rounded-full border border-border bg-background px-2.5 py-1">Residence: {evidence.sourceResidence}</span>}
        {evidence.directReviewStatus && <span className="rounded-full border border-border bg-background px-2.5 py-1">Direct review: {evidence.directReviewStatus}</span>}
        {evidence.evidenceModalities.map((modality) => <span key={modality} className="rounded-full border border-border bg-background px-2.5 py-1">{modality}</span>)}
      </div>

      <div className="mt-5 grid gap-3">
        <TextSection title="Confirmed evidence" text={evidence.confirmedEvidence} />
        <TextSection title="Interpretive conclusion" text={evidence.interpretiveConclusion} />
        <TextSection title="Evidence boundary / not established" text={evidence.evidenceBoundary.join("\n\n")} boundary />
      </div>

      {(evidence.sourceUrl || evidence.archiveUrl) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {evidence.sourceUrl && <a href={evidence.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline decoration-primary/35 underline-offset-4">Open source <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>}
          {evidence.archiveUrl && <a href={evidence.archiveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline decoration-primary/35 underline-offset-4">Open archive <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>}
        </div>
      )}
    </article>
  );
}
