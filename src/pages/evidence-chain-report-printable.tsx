import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import EvidenceChainReportDeterministic from "@/pages/evidence-chain-report-deterministic";
import { nonAssessedHarmDimensionLimitItems } from "@/components/vigil/HarmImpactMatrix";
import { loadVigilIncidentRecords, loadVigilRecordDetail, type UnknownRecord } from "@/lib/vigilRegistry";
import { normalizeRecords } from "@/lib/vigilPresentation";
import { loadTaxonomyReferenceTargets, type TaxonomyReferenceTarget } from "@/lib/vigilTaxonomyClassification";
import { loadHarmMethodologyMetadata, type HarmMethodologyMetadata } from "@/lib/vigilHarmMethodology";

const REPORT_SECTIONS = [
  { number: "01", label: "Incident" },
  { number: "02", label: "Assessment" },
  { number: "03", label: "Classification" },
  { number: "04", label: "Repair" },
  { number: "05", label: "Conclusion" },
  { number: "06", label: "References" },
] as const;

type IncludedSections = Record<string, boolean>;

type ReportIncident = {
  id: string;
  title: string;
  severity?: string;
  raw: UnknownRecord;
  taxonomyReferences: TaxonomyReferenceTarget[];
};

type TaxonomyEvidenceReference = {
  key: string;
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  role?: string;
  classIds: string[];
};

const EMPTY_SECTION_MARKERS: Record<string, string[]> = {
  "01": ["No structured evidence is available in the current public projection."],
  "02": ["No structured diagnosis is available."],
  "03": ["No current Alignment Taxonomy classification is linked."],
  "04": [
    "No class invariant can be resolved from a canonical classification for this Incident.",
    "No Fidelity Class can be resolved from the canonical fidelity classification for this Incident, so no class invariant can be shown.",
    "No repair invariant is shown because this Case File has no resolved mapping where failure is evidenced.",
    "No repair invariant is shown because this Case File has no resolved alignment mapping that requires repair.",
  ],
  "05": ["No integrated governance conclusion is currently published for this Incident."],
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

function compactIncidentId(id: string) {
  return id.replace(/^VIGIL-(?:\d{4}-)?/i, "");
}

function taxonomyRelationshipLabel(reference: TaxonomyReferenceTarget) {
  const relationship = reference.relationship === "primary"
    ? "Primary fidelity classification"
    : reference.relationship === "secondary"
      ? "Secondary fidelity classification"
      : "Family-only fidelity classification";
  return reference.role === "successful-invariant"
    ? `${relationship} · invariant held · exemplar`
    : relationship;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function textList(value: unknown) {
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  return values.flatMap((item) => text(item) ? [text(item)!] : []);
}

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function taxonomyEvidenceKey(reference: TaxonomyReferenceTarget["externalReferences"][number]) {
  const url = text(reference.url)?.replace(/\/$/, "").toLowerCase();
  if (url) return `url:${url}`;
  return `meta:${[reference.publisher, reference.title, reference.date].map((value) => text(value)?.toLowerCase() ?? "").join("|")}`;
}

function collectTaxonomyEvidence(targets: TaxonomyReferenceTarget[]) {
  const collected = new Map<string, TaxonomyEvidenceReference>();
  for (const target of targets) {
    for (const reference of target.externalReferences) {
      const key = taxonomyEvidenceKey(reference);
      const existing = collected.get(key);
      if (existing) {
        if (!existing.classIds.includes(target.id)) existing.classIds.push(target.id);
        continue;
      }
      collected.set(key, {
        key,
        title: text(reference.title) ?? "Taxonomy evidence reference",
        publisher: text(reference.publisher),
        date: text(reference.date),
        url: text(reference.url),
        role: text(reference.reference_role),
        classIds: [target.id],
      });
    }
  }
  return [...collected.values()];
}

export default function EvidenceChainReportPrintable() {
  const [, params] = useRoute("/observatory/reports/:recordId");
  const sourceId = decodeURIComponent(params?.recordId ?? "").trim().replace(/\.md$/i, "");
  const hostRef = useRef<HTMLDivElement>(null);
  const [includedSections, setIncludedSections] = useState<IncludedSections>(() => Object.fromEntries(REPORT_SECTIONS.map((section) => [section.number, true])));
  const [defaultsResolved, setDefaultsResolved] = useState(false);
  const [reportIncident, setReportIncident] = useState<ReportIncident>();
  const [referenceList, setReferenceList] = useState<HTMLOListElement | null>(null);
  const [postscriptHost, setPostscriptHost] = useState<HTMLElement | null>(null);
  const [harmMethodologyMetadata, setHarmMethodologyMetadata] = useState<HarmMethodologyMetadata>();

  useEffect(() => {
    let cancelled = false;
    async function resolveIncident() {
      try {
        const registry = await loadVigilIncidentRecords();
        const records = normalizeRecords(registry.records);
        const source = records.find((record) => record.id.toUpperCase() === sourceId.toUpperCase());
        if (!source || source.record_type !== "incident") return;
        const raw = await loadVigilRecordDetail(source.raw);
        const taxonomyReferences = await loadTaxonomyReferenceTargets(raw);
        if (!cancelled) {
          setReportIncident({
            id: source.id,
            title: text(raw.title) ?? text(isObject(raw.record_identity) ? raw.record_identity.title : undefined) ?? source.title,
            severity: text(raw.severity) ?? source.severity,
            raw,
            taxonomyReferences,
          });
        }
      } catch {
        // The report remains usable even if taxonomy enrichment is unavailable.
      }
    }
    void resolveIncident();
    return () => { cancelled = true; };
  }, [sourceId]);

  useEffect(() => {
    if (!reportIncident) return;
    const previousTitle = document.title;
    document.title = `VIGIL Observatory Case File — ${compactIncidentId(reportIncident.id)} — ${reportIncident.title}`;
    return () => { document.title = previousTitle; };
  }, [reportIncident]);

  useEffect(() => {
    let cancelled = false;
    const harm = reportIncident && isObject(reportIncident.raw.harm_impact_assessment)
      ? reportIncident.raw.harm_impact_assessment
      : undefined;
    const methodologyVersion = harm ? text(harm.methodology_version) : undefined;
    if (!methodologyVersion) {
      setHarmMethodologyMetadata(undefined);
      return () => { cancelled = true; };
    }
    void loadHarmMethodologyMetadata(methodologyVersion)
      .then((metadata) => { if (!cancelled) setHarmMethodologyMetadata(metadata); });
    return () => { cancelled = true; };
  }, [reportIncident]);

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

        if (number === "06") {
          const list = section.querySelector<HTMLOListElement>("ol[data-report-taxonomy-reference-list]");
          if (list) {
            setReferenceList(list);
          }
        }
      }
      for (const item of REPORT_SECTIONS) if (next[item.number] === undefined) next[item.number] = true;
      const postscript = host.querySelector<HTMLElement>("[data-report-postscript]");
      if (postscript) setPostscriptHost(postscript);
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
  const taxonomyEvidenceReferences = useMemo(
    () => collectTaxonomyEvidence(reportIncident?.taxonomyReferences ?? []),
    [reportIncident?.taxonomyReferences],
  );
  const hasHarmMethodologyReference = Boolean(reportIncident && isObject(reportIncident.raw.harm_impact_assessment));
  const assessmentBoundaries = useMemo(() => {
    const assessment = reportIncident && isObject(reportIncident.raw.vigil_assessment)
      ? reportIncident.raw.vigil_assessment
      : undefined;
    return textList(assessment?.assessment_boundaries);
  }, [reportIncident]);
  const assessmentLimitItems = useMemo(() => {
    const harmAssessment = reportIncident && isObject(reportIncident.raw.harm_impact_assessment)
      ? reportIncident.raw.harm_impact_assessment
      : undefined;
    // Keep non-assessed harm dimensions in the closing assessment limits rather than the scored Harm Impact table.
    const harmDimensionLimits = nonAssessedHarmDimensionLimitItems(harmAssessment);
    return [...assessmentBoundaries, ...harmDimensionLimits];
  }, [assessmentBoundaries, reportIncident]);

  const taxonomyReferencePortal = referenceList && ((reportIncident?.taxonomyReferences.length ?? 0) > 0 || hasHarmMethodologyReference || taxonomyEvidenceReferences.length > 0)
    ? createPortal(<>
      {(reportIncident?.taxonomyReferences.length ?? 0) > 0 && <li id="vigil-failure-taxonomy-reference" key="vigil-failure-taxonomy" className="report-reference-item report-taxonomy-reference">
        <span className="report-reference-number" aria-hidden="true" />
        <span className="report-reference-copy">
          <strong>VIGIL Observatory Alignment Taxonomy</strong>
          <span className="report-reference-meta"> — {["CAM Initiative", "Public taxonomy reference", reportIncident?.taxonomyReferences[0]?.referenceVersion ? `Version ${reportIncident.taxonomyReferences[0].referenceVersion}` : reportIncident?.taxonomyReferences[0]?.taxonomyVersion ? `Version ${reportIncident.taxonomyReferences[0].taxonomyVersion}` : undefined, reportIncident?.taxonomyReferences[0]?.referencePublicationDate ? `Revised ${reportIncident.taxonomyReferences[0].referencePublicationDate}` : undefined].filter(Boolean).join(" · ")}</span>
          <br />
          <a href="https://www.cam-initiative.org/observatory/knowledge-base/failure-taxonomy" target="_blank" rel="noreferrer" className="report-reference-url">https://www.cam-initiative.org/observatory/knowledge-base/failure-taxonomy</a>
        </span>
      </li>}
      {hasHarmMethodologyReference && <li id="vigil-harm-methodology-reference" key="vigil-harm-impact-methodology" className="report-reference-item report-methodology-reference">
        <span className="report-reference-number" aria-hidden="true" />
        <span className="report-reference-copy">
          <strong>VIGIL Harm Impact Methodology</strong>
          <span className="report-reference-meta"> — {["CAM Initiative", "Harm severity methodology", harmMethodologyMetadata?.version ? `Version ${harmMethodologyMetadata.version}` : reportIncident && isObject(reportIncident.raw.harm_impact_assessment) && text(reportIncident.raw.harm_impact_assessment.methodology_version) ? `Version ${text(reportIncident.raw.harm_impact_assessment.methodology_version)}` : undefined, harmMethodologyMetadata?.effectiveOn ? `Revised ${harmMethodologyMetadata.effectiveOn}` : undefined].filter(Boolean).join(" · ")}</span>
          <br />
          <a href="https://www.cam-initiative.org/observatory/severity-methodology" target="_blank" rel="noreferrer" className="report-reference-url">https://www.cam-initiative.org/observatory/severity-methodology</a>
        </span>
      </li>}
      {taxonomyEvidenceReferences.map((reference) => {
        const meta = [reference.publisher, reference.date, reference.role?.replaceAll("-", " ")].filter(Boolean).join(" · ");
        return <li key={`taxonomy-evidence-${reference.key}`} className="report-reference-item report-taxonomy-evidence-reference">
          <span className="report-reference-number" aria-hidden="true" />
          <span className="report-reference-copy">
            <strong>{reference.title}</strong>
            {meta ? <span className="report-reference-meta"> — {meta}</span> : null}
            <br />
            <span className="report-reference-meta">Taxonomy evidence supporting {reference.classIds.join(", ")}</span>
            {reference.url ? <><br /><a href={reference.url} target="_blank" rel="noreferrer" className="report-reference-url">{reference.url}</a></> : null}
          </span>
        </li>;
      })}
    </>, referenceList)
    : null;

  const postscriptPortal = postscriptHost ? createPortal(
    <section className="report-postscript" aria-label="Report reliance and assessment boundaries">
      <section className="report-reliance-notice" aria-labelledby="report-reliance-heading">
        <h2 id="report-reliance-heading" className="report-label">Use and reliance notice</h2>
        <p>
          This report is provided for research and informational purposes. It does not constitute legal, regulatory, security, assurance, certification, risk, or other professional advice, and should not be relied upon as a substitute for independent assessment. Third parties remain responsible for verifying the cited source material, the current state of the underlying VIGIL Observatory records and taxonomy, the applicability of the analysis to their circumstances, and any decision or action taken in reliance on this report.
        </p>
      </section>
      {assessmentLimitItems.length > 0 && <section className="report-assessment-limits" aria-labelledby="report-assessment-limits-heading">
        <h2 id="report-assessment-limits-heading" className="report-label">Limits of the assessment</h2>
        <ul className="report-list">{assessmentLimitItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>}
      <p className="report-copyright">
        © 2026 CAM Initiative. All rights reserved.
      </p>
    </section>,
    postscriptHost,
  ) : null;

  return <div ref={hostRef} className="vigil-deterministic-report-host">
    <aside className="print:hidden sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6 md:px-10" aria-label="PDF section controls">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-cam-gold">Print sections</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose which populated or empty sections to include in the printed PDF.</p>
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
        <p className="text-xs text-muted-foreground lg:text-right">{includedCount} of {REPORT_SECTIONS.length} included</p>
      </div>
    </aside>
    <EvidenceChainReportDeterministic hasTaxonomyReference={Boolean(reportIncident?.taxonomyReferences.length)} />
    {taxonomyReferencePortal}
    {postscriptPortal}
  </div>;
}
