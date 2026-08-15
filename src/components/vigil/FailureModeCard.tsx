import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { normalizeFailureFamilyLabel, publicRepairStateLabel, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";

function repairLabel(record: VigilIndexRecord) {
  return publicRepairStateLabel(record.repair_status, record.publicDisplay.repairState);
}

function compactId(id: string) {
  return id.replace(/^VIGIL-\d{4}-/i, "");
}

function compactFamily(value: string) {
  return value.replace(/\s+Failures$/i, "");
}

function Cell({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`vigil-fm-cell ${className}`}>
      <span className="vigil-fm-mobile-label">{label}</span>
      {children}
    </div>
  );
}

export function FailureModeCard({ record }: { record: VigilIndexRecord }) {
  const family = normalizeFailureFamilyLabel(record.failure_family) ?? record.failure_family ?? "Not specified";
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

        <Cell label="Family" className="vigil-fm-family">
          <span>{compactFamily(family)}</span>
        </Cell>
        <Cell label="Severity"><VigilStatusChip value={record.severity ?? "Not assessed"} /></Cell>
        <Cell label="Evidence"><VigilStatusChip value={record.evidence_confidence ?? "Not specified"} /></Cell>
        <Cell label="Status"><VigilStatusChip value={lifecycle} /></Cell>
        <Cell label="Repair"><VigilStatusChip value={repairLabel(record)} /></Cell>
        <span className="vigil-fm-open" aria-hidden="true"><ChevronRight /></span>
      </Link>
    </article>
  );
}
