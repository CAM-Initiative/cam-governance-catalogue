import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { CaseTaxonomyClassification } from "@/components/vigil/CaseTaxonomyClassification";
import EvidenceChainReportDeterministic from "@/pages/evidence-chain-report-deterministic";
import { loadVigilRecordDetail, loadVigilRegistryRecords, type UnknownRecord } from "@/lib/vigilRegistry";
import { normalizeRecords } from "@/lib/vigilPresentation";
import { loadTaxonomyReferenceTargets, type TaxonomyReferenceTarget } from "@/lib/vigilTaxonomyClassification";

const REPORT_SECTIONS = [
  { number: "01", label: "Observation" },
  { number: "02", label: "Diagnosis" },
  { number: "03", label: "Classification" },
  { number: "04", label: "Repair" },
  { number: "05", label: "Learn" },
  { number: "06", label: "References" },
] as const;

type IncludedSections = Record<string, boolean>;

type ReportFailure = {
  id: string;
  title: string;
  severity?: string;
  raw: UnknownRecord;
  taxonomyReferences: TaxonomyReferenceTarget[];
};

const EMPTY_SECTION_MARKERS: Record<string, string[]> = {
  "01": ["No structured evidence is available in the current public projection."],
  "02": ["No structured diagnosis is available."],
  "03": ["No current taxonomy classification is linked."],
  "04": ["No PATCH is linked yet."],
  "05": ["No published LEARN record is linked."],
  "06": ["No references are currently available."],
};

function sectionNumber(section: HTMLElement) {
  const heading = section.querySelector("h2")?.textContent?.trim();
  return REPORT_SECTIONS.find((item) => item.label === heading)?.number;
}

function sectionHasSubstantiveContent(section: HTMLElement, number: string) {
  const text = section.textContent ?? "";
  return !(EMPTY_SECTION_MARKERS[number] ?? []).some((marker) => text.includes(marker));
}

function compactFailureId(id: string) {
  return id.replace(/^VIGIL-\d{4}-/i, "");
}

function taxonomyRelationshipLabel(reference: TaxonomyReferenceTarget) {
  if (reference.relationship === "primary") return "Primary taxonomy classification";
  if (reference.relationship === "secondary") return "Secondary taxonomy classification";
  return "Family-only taxonomy classification";
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export default function EvidenceChainReportPrintable() {
  const [, params] = useRoute("/observatory/reports/:recordId");
  const sourceId = decodeURIComponent(params?.recordId ?? "").trim().replace(/\.md$/i, "");
  const hostRef = useRef<HTMLDivElement>(null);
  const referenceBaseCountRef = useRef(0);
  const [includedSections, setIncludedSections] = useState<IncludedSections>(() => Object.fromEntries(REPORT_SECTIONS.map((section) => [section.number, true])));
  const [defaultsResolved, setDefaultsResolved] = useState(false);
  const [reportFailure, setReportFailure] = useState<ReportFailure>();
  const [classificationSlot, setClassificationSlot] = useState<HTMLElement | null>(null);
  const [referenceList, setReferenceList] = useState<HTMLOListElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function resolveFailure() {
      try {
        const registry = await loadVigilRegistryRecords();
        const records = normalizeRecords(registry.records);
        const source = records.find((record) => record.id.toUpperCase() === sourceId.toUpperCase());
        if (!source) return;
        const failureId = source.record_type === "failure_mode"
          ? source.id
          : source.publicDisplay.chain.failureModes[0];
        if (!failureId) return;
        const failureIndex = records.find((record) => record.id.toUpperCase() === failureId.toUpperCase());
        if (!failureIndex) return;
        const raw = await loadVigilRecordDetail(failureIndex.raw);
        const taxonomyReferences = await loadTaxonomyReferenceTargets(raw);
        if (!cancelled) {
          setReportFailure({
            id: failureIndex.id,
            title: text(raw.title) ?? failureIndex.title,
            severity: text(raw.severity) ?? failureIndex.severity,
            raw,
            taxonomyReferences,
          });
        }
      } catch {
        // The deterministic report remains usable even if taxonomy enrichment is unavailable.
      }
    }
    void resolveFailure();
    return () => { cancelled = true; };
  }, [sourceId]);

  useEffect(() => {
    if (!reportFailure) return;
    const previousTitle = document.title;
    document.title = `VIGIL Case File — ${compactFailureId(reportFailure.id)} — ${reportFailure.title}`;
    return () => { document.title = previousTitle; };
  }, [reportFailure]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const resolveDefaults = () => {
      const sections = [...host.querySelectorAll<HTMLElement>(".report-section")];
      if (sections.length < REPORT_SECTIONS.length) return false;
      const next: IncludedSections = {};
      for (const section of sections) {
        const number = sectionNumber(section);
        if (!number) continue;
        next[number] = sectionHasSubstantiveContent(section, number);

        if (number === "03") {
          const legacyBody = section.children.item(1) as HTMLElement | null;
          if (legacyBody && !section.querySelector(".report-taxonomy-parity-slot")) {
            legacyBody.classList.add("report-legacy-taxonomy");
            const slot = document.createElement("div");
            slot.className = "report-taxonomy-parity-slot";
            section.appendChild(slot);
            setClassificationSlot(slot);
          }
        }
        if (number === "06") {
          const list = section.querySelector<HTMLOListElement>("ol");
          if (list) {
            referenceBaseCountRef.current = list.children.length;
            setReferenceList(list);
          }
        }
      }
      for (const item of REPORT_SECTIONS) if (next[item.number] === undefined) next[item.number] = true;
      setIncludedSections(next);
      setDefaultsResolved(true);
      return true;
    };

    if (resolveDefaults()) return;
    const observer = new MutationObserver(() => {
      if (resolveDefaults()) observer.disconnect();
    });
    observer.observe(host, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    for (const section of host.querySelectorAll<HTMLElement>(".report-section")) {
      const number = sectionNumber(section);
      if (!number) continue;
      const included = includedSections[number] !== false;
      section.hidden = !included;
      section.dataset.reportIncluded = included ? "true" : "false";
    }
  }, [includedSections, defaultsResolved]);

  const includedCount = useMemo(() => REPORT_SECTIONS.filter((section) => includedSections[section.number] !== false).length, [includedSections]);

  const taxonomyReferencePortal = referenceList && reportFailure?.taxonomyReferences.length
    ? createPortal(<>{reportFailure.taxonomyReferences.map((reference, index) => <li key={`taxonomy-${reference.relationship}-${reference.id}`} className="flex gap-3 text-base leading-relaxed text-foreground/85 report-taxonomy-reference">
        <span className="font-mono text-sm text-cam-gold">[{referenceBaseCountRef.current + index + 1}]</span>
        <span className="min-w-0">
          <strong>{reference.id} — {reference.title}</strong>
          <span className="text-muted-foreground"> — VIGIL Failure Taxonomy · {taxonomyRelationshipLabel(reference)}</span>
          <br />
          <a href={reference.url} target="_blank" rel="noreferrer" className="break-all text-[hsl(32_62%_25%)] underline decoration-cam-gold/50 underline-offset-4">{reference.url}</a>
        </span>
      </li>)}</>, referenceList)
    : null;

  return <div ref={hostRef} className="vigil-deterministic-report-host">
    <aside className="print:hidden sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6 md:px-10" aria-label="PDF section controls">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-cam-gold">Print sections</p>
          <p className="mt-1 text-sm text-muted-foreground">The report uses the deterministic Case File projection. Choose which populated or empty sections to include in the printed PDF.</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {REPORT_SECTIONS.map((section) => <label key={section.number} className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={includedSections[section.number] !== false}
              onChange={(event) => setIncludedSections((current) => ({ ...current, [section.number]: event.target.checked }))}
              className="h-4 w-4 accent-[hsl(38_62%_40%)]"
            />
            <span className="font-mono text-xs text-cam-gold">{section.number}</span>
            <span>{section.label}</span>
          </label>)}
        </div>
        <p className="text-xs text-muted-foreground lg:text-right">{includedCount} of 6 included</p>
      </div>
    </aside>
    <EvidenceChainReportDeterministic />
    {classificationSlot && reportFailure ? createPortal(
      <CaseTaxonomyClassification failureId={reportFailure.id} raw={reportFailure.raw} severityLabel={reportFailure.severity} />,
      classificationSlot,
    ) : null}
    {taxonomyReferencePortal}
    <section className="report-reliance-notice mx-auto max-w-6xl border-t border-border/60 px-4 py-5 text-muted-foreground sm:px-6 md:px-10" aria-labelledby="report-reliance-heading">
      <h2 id="report-reliance-heading" className="report-label">Use and reliance notice</h2>
      <p className="mt-2">
        This report is provided for research and informational purposes as a deterministic projection of the corresponding VIGIL Case File. It does not constitute legal, regulatory, security, assurance, certification, risk, or other professional advice, and should not be relied upon as a substitute for independent assessment. Third parties remain responsible for verifying the cited source material, the current state of the underlying VIGIL records and taxonomy, the applicability of the analysis to their circumstances, and any decision or action taken in reliance on this report.
      </p>
    </section>
  </div>;
}
