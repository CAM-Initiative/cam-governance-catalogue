import { useEffect, useMemo, useRef, useState } from "react";
import EvidenceChainReportDeterministic from "@/pages/evidence-chain-report-deterministic";

const REPORT_SECTIONS = [
  { number: "01", label: "Observation" },
  { number: "02", label: "Diagnosis" },
  { number: "03", label: "Classification" },
  { number: "04", label: "Repair" },
  { number: "05", label: "Learn" },
  { number: "06", label: "References" },
] as const;

type IncludedSections = Record<string, boolean>;

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

export default function EvidenceChainReportPrintable() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [includedSections, setIncludedSections] = useState<IncludedSections>(() => Object.fromEntries(REPORT_SECTIONS.map((section) => [section.number, true])));
  const [defaultsResolved, setDefaultsResolved] = useState(false);

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
  </div>;
}
