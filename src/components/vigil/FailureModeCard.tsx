import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { VigilIndexRecord } from "@/lib/vigilPresentation";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";

function compactId(id: string) {
  return id.replace(/^VIGIL-\d{4}-/i, "");
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="vigil-fm-cell">
      <span className="vigil-fm-mobile-label">{label}</span>
      {children}
    </div>
  );
}

export function FailureModeCard({ record }: { record: VigilIndexRecord }) {
  const lifecycle = record.publicDisplay.lifecycleLabel ?? record.record_state ?? "Not specified";
  const finding = record.publicDisplay.failure?.definition ?? record.publicDisplay.finding ?? record.summary;
  const href = `/observatory/failure-modes/${encodeURIComponent(record.id)}`;

  return (
    <article className="vigil-fm-row">
      <Link href={href} className="vigil-fm-row-link" aria-label={`Open ${record.id}: ${record.title}`}>
        <div className="vigil-fm-primary">
          <span className="vigil-fm-id" title={record.id}>{compactId(record.id)}</span>
          <div className="vigil-fm-copy">
            <h2 className="vigil-fm-title">{record.title}</h2>
            {finding && <p className="vigil-fm-summary">{finding}</p>}
          </div>
        </div>

        <Cell label="Severity"><VigilStatusChip value={record.severity ?? "Not assessed"} /></Cell>
        <Cell label="Evidence"><VigilStatusChip value={record.evidence_confidence ?? "Not specified"} /></Cell>
        <Cell label="Status"><VigilStatusChip value={lifecycle} /></Cell>
        <span className="vigil-fm-open" aria-hidden="true"><ChevronRight /></span>
      </Link>
    </article>
  );
}
