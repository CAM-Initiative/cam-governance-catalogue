import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";
import { loadVigilRecordDetail, loadVigilRegistryRecords, VIGIL_REGISTRY_SOURCE, type UnknownRecord } from "@/lib/vigilRegistry";
import { arrayFrom, filterComparisonKey, humanLabel, isMeaningfulText, isObject, normalizeFilterLabel, normalizeRecords, previewText, recordTypeBadge, textFrom, titleizeValue, type SummaryEntry, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { matchesVigilSearch, type CorpusProvision, type RecordChain } from "@/lib/vigilPublicDisplay";

const VIGIL_PAGE_SIZE = 20;

type FilterKey = "recordType" | "affectedPlatform" | "status";
type SortKey = "id" | "date" | "platform" | "type" | "title" | "status";
type SortDirection = "asc" | "desc";
type SortConfig = { key: SortKey; direction: SortDirection };

type FilterOption = { value: string; label: string };
type DetailLoadState = { status: "loading" } | { status: "ready"; raw: UnknownRecord; displayRecord: VigilIndexRecord } | { status: "error"; error: string };
type PendingJsonAction = { action: "copy" | "download"; record: VigilIndexRecord; recordKey: string; exportText: string } | null;

const preferredStatuses = ["open", "watching", "triage", "routed", "deferred", "implemented", "closed", "closed-no-action", "closed-actioned"];
const exportNotice = "Filtered VIGIL index-entry export from the CAM Governance Interface. Full canonical records remain in CAM-Initiative/Vigil and are loaded per record on demand.";
const vigilRecommendedCitation = "CAM Initiative. VIGIL: Evidence-to-Repair Governance Ledger. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org/vigil";
const camInitiativeCitationHeader = "CAM Initiative. CAM Initiative public governance infrastructure. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org";
const vigilReuseNotice = "This is public-benefit governance infrastructure. Please cite VIGIL if you use this record or export. Public access does not imply unrestricted reuse. If this work is useful to you, please consider supporting CAM Initiative.";
const vigilSupportUrl = "https://buymeacoffee.com/cam_initiative";
const vigilCitation = {
  recommended_citation: vigilRecommendedCitation,
  title: "VIGIL: Evidence-to-Repair Governance Ledger",
  publisher: "CAM Initiative",
  maintainer: "Aeon Governance Lab",
  year: "2026",
  url: "https://www.cam-initiative.org/vigil",
  repository: "https://github.com/CAM-Initiative/Vigil",
};

const evidenceRepairSteps = [
  { label: "Observe", text: "Identify a real-world incident, harm, or governance breakdown." },
  { label: "Record", text: "Preserve evidence and context." },
  { label: "Classify", text: "Map the failure against CAM domains and taxonomy." },
  { label: "Diagnose", text: "Identify design failures, accountability gaps, and governance weaknesses." },
  { label: "Repair", text: "Propose patches, standards, safeguards, or institutional responses." },
  { label: "Learn", text: "Feed the pattern back into future-system design and transition planning." },
];

const sortableColumns: Array<{ key: SortKey; label: string }> = [
  { key: "id", label: "Record ID" },
  { key: "date", label: "Date" },
  { key: "title", label: "Record" },
  { key: "status", label: "Status" },
];

const filterConfig: Array<{ key: FilterKey; label: string; placeholder: string }> = [
  { key: "recordType", label: "Record Type", placeholder: "All record types" },
  { key: "affectedPlatform", label: "Affected Platform", placeholder: "All affected platforms" },
  { key: "status", label: "Record Status", placeholder: "All record statuses" },
];

function getFilterOptionsFromRecords(records: VigilIndexRecord[]) {
  return Object.fromEntries(
    filterConfig.map((filter) => {
      const optionsByKey = new Map<string, FilterOption>();
      for (const rawValue of records.flatMap((record) => valuesForFilter(record, filter.key))) {
        const label = normalizeFilterLabel(filter.key, rawValue);
        if (!label) continue;
        const key = filterComparisonKey(filter.key, rawValue);
        if (!optionsByKey.has(key)) optionsByKey.set(key, { value: label, label });
      }

      const options = [...optionsByKey.values()].sort((a, b) => a.label.localeCompare(b.label));
      if (filter.key === "recordType") {
        const preferred = ["Failure Modes", "Observations", "Proposals", "Patch Notes"];
        return [filter.key, [
          ...preferred.flatMap((label) => optionsByKey.get(filterComparisonKey(filter.key, label)) ?? []),
          ...options.filter((option) => !preferred.includes(option.label)),
        ]];
      }
      if (filter.key === "status") {
        const preferred = preferredStatuses.map(titleizeValue);
        return [filter.key, [
          ...preferred.flatMap((label) => optionsByKey.get(filterComparisonKey(filter.key, label)) ?? []),
          ...options.filter((option) => !preferred.includes(option.label)),
        ]];
      }
      return [filter.key, options];
    }),
  ) as Record<FilterKey, FilterOption[]>;
}

function valuesForFilter(record: VigilIndexRecord, key: FilterKey): string[] {
  const mapping: Record<FilterKey, string[] | undefined> = {
    recordType: [record.record_type],
    affectedPlatform: record.affected_platform_label ? [record.affected_platform_label] : undefined,
    status: record.record_state ? [record.record_state] : undefined,
  };
  return mapping[key] ?? [];
}

function recordTimestamp(record: VigilIndexRecord) {
  const dateValue = record.date_recorded ?? record.date_implemented;
  const timestamp = dateValue ? Date.parse(dateValue) : Number.NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortTextValue(value?: string) {
  const cleaned = String(value ?? "").trim();
  return cleaned ? cleaned.toLocaleLowerCase() : undefined;
}

function sortValueForRecord(record: VigilIndexRecord, key: SortKey) {
  if (key === "date") {
    const timestamp = recordTimestamp(record);
    return timestamp > 0 ? timestamp : undefined;
  }

  const values: Record<Exclude<SortKey, "date">, string | undefined> = {
    id: record.id,
    platform: record.platform_label,
    type: record.type_label,
    title: record.title,
    status: record.record_state,
  };

  return sortTextValue(values[key]);
}

function compareRecordsBySort(a: VigilIndexRecord, b: VigilIndexRecord, sortConfig: SortConfig) {
  const aValue = sortValueForRecord(a, sortConfig.key);
  const bValue = sortValueForRecord(b, sortConfig.key);

  if (aValue === undefined && bValue === undefined) return 0;
  if (aValue === undefined) return 1;
  if (bValue === undefined) return -1;

  const comparison = typeof aValue === "number" && typeof bValue === "number"
    ? aValue - bValue
    : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: "base" });

  return sortConfig.direction === "asc" ? comparison : -comparison;
}

function jsonFileName(record: VigilIndexRecord) {
  return `${(record.id || "vigil-record").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "vigil-record"}.json`;
}

function recordKeyFor(record: VigilIndexRecord, index = 0) {
  const stableParts = [record.id, record.path, record.raw_url, record.github_blob_url].filter(isMeaningfulText);
  return stableParts.length ? stableParts.join("::") : `vigil-record-${index}`;
}

function findingSentence(text?: string, limit = 240) {
  if (!isMeaningfulText(text)) return undefined;
  const firstSentence = text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
  return previewText(firstSentence, limit);
}

function InlineMarkdown({ text }: { text?: string }) {
  if (!isMeaningfulText(text)) return null;
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => (
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={`${part}-${index}`} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
          : part
      ))}
    </>
  );
}

function lifecycleTone(label?: string) {
  const value = String(label ?? "").toLocaleLowerCase();
  if (value.includes("closed—actioned") || value.includes("closed-actioned") || value === "implemented") {
    return "border-blue-300 bg-blue-50 text-blue-900";
  }
  if (value.includes("closed") || value.includes("no action")) {
    return "border-slate-300 bg-slate-100 text-slate-800";
  }
  if (value.includes("active") || value === "open" || value.includes("watching")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
  if (value.includes("deferred") || value.includes("triage")) {
    return "border-amber-300 bg-amber-50 text-amber-950";
  }
  if (value.includes("superseded")) {
    return "border-violet-300 bg-violet-50 text-violet-900";
  }
  return "border-border bg-background/60 text-muted-foreground";
}

const chipTones = [
  "border-amber-300 bg-amber-50 text-amber-950",
  "border-emerald-300 bg-emerald-50 text-emerald-950",
  "border-blue-300 bg-blue-50 text-blue-950",
  "border-violet-300 bg-violet-50 text-violet-950",
  "border-rose-300 bg-rose-50 text-rose-950",
];

function chipTone(value: string) {
  const hash = [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
  return chipTones[hash % chipTones.length];
}

const vendorTones: Array<[RegExp, string]> = [
  [/\bopenai\b|\bchatgpt\b/i, "border-emerald-300 bg-emerald-50 text-emerald-950"],
  [/\banthropic\b|\bclaude\b/i, "border-amber-300 bg-amber-50 text-amber-950"],
  [/\bxai\b|\bgrok\b/i, "border-slate-400 bg-slate-100 text-slate-950"],
  [/\bgoogle\b|\bdeepmind\b|\bgemini\b/i, "border-blue-300 bg-blue-50 text-blue-950"],
  [/\bmeta\b|\bllama\b/i, "border-indigo-300 bg-indigo-50 text-indigo-950"],
  [/\bmicrosoft\b|\bazure\b|\bcopilot\b/i, "border-cyan-300 bg-cyan-50 text-cyan-950"],
  [/\breplit\b/i, "border-orange-300 bg-orange-50 text-orange-950"],
  [/\bmistral\b/i, "border-rose-300 bg-rose-50 text-rose-950"],
  [/\bcam initiative\b/i, "border-yellow-500 bg-yellow-50 text-yellow-950"],
  [/\bmulti[\s-]*vendor\b|\bmultiple\b|\bother .*providers?\b/i, "border-violet-300 bg-violet-50 text-violet-950"],
];

function vendorTone(value: string) {
  return vendorTones.find(([pattern]) => pattern.test(value))?.[1] ?? chipTone(value);
}

function isVendorPillLabel(label?: string) {
  return Boolean(label && /vendor|provider/i.test(label));
}

function pillTone(label: string | undefined, value: string) {
  return isVendorPillLabel(label) ? vendorTone(value) : chipTone(value);
}

function detailDisplayRecord(indexRecord: VigilIndexRecord, detail: UnknownRecord) {
  const normalized = normalizeRecords([{
    ...detail,
    path: typeof detail.path === "string" ? detail.path : indexRecord.path,
    raw_url: typeof detail.raw_url === "string" ? detail.raw_url : indexRecord.raw_url,
    github_blob_url: typeof detail.github_blob_url === "string" ? detail.github_blob_url : indexRecord.github_blob_url,
    source_registry: typeof detail.source_registry === "string" ? detail.source_registry : indexRecord.source_registry,
  }])[0];
  return { ...normalized, raw: detail };
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!isMeaningfulText(value)) return null;

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{label}</p>
      <p className="mt-1 text-[15px] leading-relaxed text-foreground"><InlineMarkdown text={value} /></p>
    </div>
  );
}

function SummaryBlock({ title, entries, defaultOpen = false }: { title: string; entries?: SummaryEntry[]; defaultOpen?: boolean }) {
  if (!entries?.length) return null;

  return (
    <details className="rounded-lg border border-border bg-background/35 px-3 py-2" open={defaultOpen}>
      <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold marker:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background [&::-webkit-details-marker]:hidden">
        <span className="inline-flex w-full items-center justify-between gap-3">
          <span>{title}</span>
          <span className="text-[9px] text-muted-foreground/60" aria-hidden="true">Open / close</span>
        </span>
      </summary>
      <div className="mt-3 grid gap-3 border-t border-border/70 pt-3 md:grid-cols-2">
        {entries.map((entry, index) => (
          <Field key={`${entry.label}-${index}`} label={entry.label} value={entry.value} />
        ))}
      </div>
    </details>
  );
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return isMeaningfulText(value);
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (isObject(value)) return Object.values(value).some(hasMeaningfulValue);
  return true;
}

function fieldValue(record: UnknownRecord, nestedKey: string, fallback?: UnknownRecord) {
  const value = record[nestedKey];
  if (hasMeaningfulValue(value)) return value;
  return fallback?.[nestedKey];
}

function valuesForKeys(record: UnknownRecord | undefined, keys: string[], fallback?: UnknownRecord) {
  if (!record && !fallback) return [];
  return keys
    .map((key) => ({ key, label: humanLabel(key), value: record ? fieldValue(record, key, fallback) : fallback?.[key] }))
    .filter((entry) => hasMeaningfulValue(entry.value));
}

function compactText(value: unknown) {
  const text = textFrom(value);
  return isMeaningfulText(text) ? text : undefined;
}

function primitiveItems(value: unknown) {
  const values = arrayFrom(value);
  return values?.filter(isMeaningfulText) ?? [];
}

function isPrimitiveList(value: unknown) {
  return Array.isArray(value) && value.every((item) => !isObject(item));
}

function LinkValue({ value }: { value: unknown }) {
  const text = compactText(value);
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) {
    return <a className="break-words text-[hsl(32_62%_25%)] underline decoration-cam-gold/50 underline-offset-4 hover:text-cam-gold" href={text} target="_blank" rel="noreferrer">{text}</a>;
  }
  return <span><InlineMarkdown text={text} /></span>;
}

function ValueField({ label, value }: { label: string; value: unknown }) {
  if (!hasMeaningfulValue(value)) return null;

  if (Array.isArray(value)) {
    const chips = isPrimitiveList(value) ? primitiveItems(value) : [];
    if (chips.length) {
      if (label === "Affected parties or interests") {
        return (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{label}</p>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground">{chips.join("; ")}</p>
          </div>
        );
      }
      return (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{label}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {chips.map((item, index) => <span key={`${item}-${index}`} className={`rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] ${pillTone(label, item)}`}>{item}</span>)}
          </div>
        </div>
      );
    }
  }

  if (isObject(value)) {
    const entries = Object.entries(value).filter(([, item]) => hasMeaningfulValue(item));
    if (!entries.length) return null;
    return (
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{label}</p>
        <div className="mt-1 space-y-1.5 text-[15px] leading-relaxed text-foreground">
          {entries.map(([key, item]) => (
            <p key={key}><span className="font-medium text-foreground/80">{humanLabel(key)}:</span> <LinkValue value={item} /></p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{label}</p>
      <p className="mt-1 text-[15px] leading-relaxed text-foreground"><LinkValue value={value} /></p>
    </div>
  );
}

function DetailSection({ title, children, defaultOpen = false, show = true }: { title: string; children: ReactNode; defaultOpen?: boolean; show?: boolean }) {
  if (!show || !children) return null;
  return (
    <details className="group rounded-lg border border-border bg-background/35 px-3 py-2" open={defaultOpen}>
      <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.14em] text-cam-gold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background [&::-webkit-details-marker]:hidden">
        <span className="inline-flex w-full items-center gap-3">
          <span className="inline-block h-0 w-0 shrink-0 border-y-[0.3rem] border-l-[0.45rem] border-y-transparent border-l-[hsl(var(--primary))] transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
          <span>{title}</span>
        </span>
      </summary>
      <div className="mt-3 border-t border-border/70 pt-3">{children}</div>
    </details>
  );
}

function FieldGrid({ entries }: { entries: Array<{ key: string; label: string; value: unknown }> }) {
  if (!entries.length) return null;
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => <ValueField key={entry.key} label={entry.label} value={entry.value} />)}
    </div>
  );
}

function ParagraphFields({ entries }: { entries: Array<{ key: string; label: string; value: unknown }> }) {
  if (!entries.length) return null;
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.key}>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">{entry.label}</p>
          <div className="text-[15px] leading-relaxed text-foreground"><ValueBody value={entry.value} label={entry.label} /></div>
        </div>
      ))}
    </div>
  );
}

function ValueBody({ value, label }: { value: unknown; label?: string }) {
  if (Array.isArray(value)) {
    const chips = isPrimitiveList(value) ? primitiveItems(value) : [];
    if (chips.length) return <div className="flex flex-wrap gap-1.5">{chips.map((item, index) => <span key={`${item}-${index}`} className={`rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] ${pillTone(label, item)}`}>{item}</span>)}</div>;
  }
  if (isObject(value)) {
    const entries = Object.entries(value).filter(([, item]) => hasMeaningfulValue(item));
    return <div className="grid gap-2 md:grid-cols-2">{entries.map(([key, item]) => <ValueField key={key} label={humanLabel(key)} value={item} />)}</div>;
  }
  return <p><InlineMarkdown text={compactText(value)} /></p>;
}

function CompactObjectCards({ items, keys, titleKeys = [] }: { items: unknown; keys: string[]; titleKeys?: string[] }) {
  const records = Array.isArray(items) ? items.filter(isObject) : isObject(items) ? [items] : [];
  if (!records.length) return null;
  return (
    <div className="space-y-3">
      {records.map((item, index) => {
        const title = titleKeys.map((key) => compactText(item[key])).find(isMeaningfulText);
        const entries = valuesForKeys(item, keys.filter((key) => !titleKeys.includes(key)));
        const sourceUrl = compactText(item.source_url ?? item.url);
        const archiveUrl = compactText(item.archive_url);
        return (
          <article key={`${title ?? "record"}-${index}`} className="rounded-lg border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-3">
            {title && <h4 className="mb-2 font-serif text-base leading-snug text-foreground">{title}</h4>}
            <FieldGrid entries={entries} />
            {(sourceUrl || archiveUrl) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {sourceUrl && <a className="rounded-md border border-border bg-background/70 px-2.5 py-1.5 text-[hsl(32_62%_25%)] transition hover:text-cam-gold" href={sourceUrl} target="_blank" rel="noreferrer">Source link →</a>}
                {archiveUrl && <a className="rounded-md border border-border bg-background/70 px-2.5 py-1.5 text-[hsl(32_62%_25%)] transition hover:text-cam-gold" href={archiveUrl} target="_blank" rel="noreferrer">Archive link →</a>}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function TextList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2 text-[15px] leading-relaxed text-foreground">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-cam-gold" aria-hidden="true" />
          <span><InlineMarkdown text={item} /></span>
        </li>
      ))}
    </ul>
  );
}

function canonicalCorpusUrl(provision: CorpusProvision) {
  if (provision.canonicalUrl) return provision.canonicalUrl;
  if (!provision.canonicalPath || !provision.canonicalPath.includes("/")) return undefined;
  return `https://github.com/CAM-Initiative/Caelestis/blob/main/${provision.canonicalPath.replace(/^\/+/, "")}`;
}

function implementationCommitUrl(provision: CorpusProvision) {
  if (provision.implementationUrl) return provision.implementationUrl;
  const commit = provision.verifiedAgainst?.match(/\b[a-f0-9]{40}\b/i)?.[0];
  return commit ? `https://github.com/CAM-Initiative/Caelestis/commit/${commit}` : undefined;
}

function corpusActionLabel(action?: string) {
  const key = String(action ?? "").trim().toLocaleLowerCase().replace(/[_\s]+/g, "-");
  const labels: Record<string, string> = {
    added: "Added",
    amended: "Amended",
    removed: "Removed",
    repealed: "Removed",
    "relied-upon": "Existing control—unchanged",
  };
  return labels[key] ?? action;
}

type CorpusProvisionGroup = {
  key: string;
  instrumentId?: string;
  instrumentTitle?: string;
  canonicalUrl?: string;
  implementationUrl?: string;
  provisions: CorpusProvision[];
};

function groupCorpusProvisions(provisions: CorpusProvision[]): CorpusProvisionGroup[] {
  const groups = new Map<string, CorpusProvisionGroup>();
  provisions.forEach((provision, index) => {
    const key = provision.instrumentId?.trim().toLocaleLowerCase()
      ?? provision.canonicalPath?.trim().toLocaleLowerCase()
      ?? provision.canonicalUrl?.trim().toLocaleLowerCase()
      ?? `unidentified-${index}`;
    const existing = groups.get(key);
    if (existing) {
      existing.provisions.push(provision);
      existing.canonicalUrl ??= canonicalCorpusUrl(provision);
      existing.implementationUrl ??= implementationCommitUrl(provision);
      return;
    }
    groups.set(key, {
      key,
      instrumentId: provision.instrumentId,
      instrumentTitle: provision.instrumentTitle,
      canonicalUrl: canonicalCorpusUrl(provision),
      implementationUrl: implementationCommitUrl(provision),
      provisions: [provision],
    });
  });
  return [...groups.values()];
}

function CorpusProvisionCards({ provisions, patchMode = false }: { provisions: CorpusProvision[]; patchMode?: boolean }) {
  if (!provisions.length) return null;
  const groups = groupCorpusProvisions(provisions);
  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const complete = group.provisions.every((provision) => provision.complete);
        const instrumentLabels = [group.instrumentId, group.instrumentTitle]
          .filter(isMeaningfulText)
          .map((value) => value.replace(/\s+/g, " ").trim().toLocaleLowerCase());
        const visibleProvisions = patchMode
          ? group.provisions
          : group.provisions.filter((provision) => {
              const relationship = compactText(provision.relationship);
              const relationshipIsInstrumentRepeat = relationship
                ? instrumentLabels.includes(relationship.replace(/\s+/g, " ").trim().toLocaleLowerCase())
                : false;
              return [
                provision.section,
                provision.heading,
                provision.action,
                provision.currentStatus,
                relationshipIsInstrumentRepeat ? undefined : relationship,
              ].some(hasMeaningfulValue);
            });
        return (
          <article key={group.key} className="overflow-hidden rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)]">
            <div className="flex flex-col gap-2 border-b border-[hsl(38_25%_80%)] px-3.5 py-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">Instrument</p>
                <h4 className="mt-0.5 break-words font-serif text-base leading-snug text-foreground md:text-lg">
                  {group.instrumentId ?? "Instrument not identified"}
                </h4>
                {group.instrumentTitle && group.instrumentTitle !== group.instrumentId && <p className="mt-0.5 text-sm text-muted-foreground">{group.instrumentTitle}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {patchMode && <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${complete ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900"}`}>{complete ? "Traceable repair" : "Details incomplete"}</span>}
                {group.canonicalUrl && <a className="text-xs font-medium text-[hsl(32_62%_25%)] underline decoration-primary/35 underline-offset-4 transition hover:text-cam-gold" href={group.canonicalUrl} target="_blank" rel="noreferrer">View current instrument →</a>}
              </div>
            </div>

            {visibleProvisions.length > 0 && (
              <>
                <div className="hidden grid-cols-[minmax(15rem,2.25fr)_minmax(8rem,1fr)_minmax(11rem,1.3fr)_minmax(9rem,1fr)] gap-x-4 border-b border-[hsl(38_25%_82%)] bg-[hsl(40_42%_96%)] px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/75 lg:grid">
                  <span>Section</span>
                  <span>Action</span>
                  <span>{patchMode ? "Implemented" : "Relationship"}</span>
                  <span>{patchMode ? "Verification" : "Status"}</span>
                </div>

                <div className="divide-y divide-[hsl(38_25%_82%)]">
                  {visibleProvisions.map((provision, index) => {
                    const actionKey = provision.action?.toLocaleLowerCase() ?? "";
                    const removesText = actionKey.includes("repeal") || actionKey.includes("remove");
                    const exactRepair = provision.finalWording ?? (removesText ? provision.previousWording : undefined);
                    const verification = [
                      provision.verificationStatus,
                      provision.currentStatus ? `Clause ${titleizeValue(provision.currentStatus)}` : undefined,
                      provision.verifiedAgainst ? `Commit ${provision.verifiedAgainst.slice(0, 8)}` : undefined,
                    ].filter(Boolean).join(" · ");
                    const relationship = compactText(provision.relationship);
                    const displayRelationship = relationship && instrumentLabels.includes(relationship.replace(/\s+/g, " ").trim().toLocaleLowerCase())
                      ? undefined
                      : relationship;
                    return (
                      <section key={`${provision.section ?? "section"}-${index}`} className="bg-[hsl(40_48%_97%)] px-3.5 py-3">
                        <dl className="grid gap-3 lg:grid-cols-[minmax(15rem,2.25fr)_minmax(8rem,1fr)_minmax(11rem,1.3fr)_minmax(9rem,1fr)] lg:gap-x-4">
                          {[
                            ["Section", [provision.section, provision.heading].filter(Boolean).join(" — ")],
                            ["Action", corpusActionLabel(provision.action)],
                            [patchMode ? "Implemented" : "Relationship", patchMode ? provision.implementedDate : displayRelationship],
                            [patchMode ? "Verification" : "Status", patchMode ? verification : provision.currentStatus],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="min-w-0">
                              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 lg:sr-only">{label}</dt>
                              <dd className="mt-0.5 break-words text-[15px] leading-relaxed text-foreground lg:mt-0"><InlineMarkdown text={hasMeaningfulValue(value) ? compactText(value) : "—"} /></dd>
                            </div>
                          ))}
                        </dl>

                        {patchMode && exactRepair && (
                          <details className="group/wording mt-3 border-t border-[hsl(38_25%_84%)] pt-3">
                            <summary className="cursor-pointer list-none rounded-md font-mono text-[10px] uppercase tracking-[0.14em] text-cam-gold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-[hsl(40_48%_97%)] [&::-webkit-details-marker]:hidden">
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block h-0 w-0 shrink-0 border-y-[0.28rem] border-l-[0.42rem] border-y-transparent border-l-current transition-transform duration-200 group-open/wording:rotate-90" aria-hidden="true" />
                                <span>{removesText ? "Literal wording removed" : "Final adopted wording"}</span>
                                <span className="text-[9px] text-muted-foreground/70">Show wording</span>
                              </span>
                            </summary>
                            <blockquote className="mt-3 whitespace-pre-wrap border-l-4 border-cam-gold bg-[hsl(40_55%_98%)] px-4 py-2.5 font-serif text-base leading-7 text-foreground"><InlineMarkdown text={exactRepair} /></blockquote>
                          </details>
                        )}

                        {patchMode && provision.previousWording && provision.previousWording !== exactRepair && (
                          <details className="mt-3 border-t border-border/70 pt-2">
                            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Previous wording</summary>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{provision.previousWording}</p>
                          </details>
                        )}
                      </section>
                    );
                  })}
                </div>
              </>
            )}

            {group.implementationUrl && (
              <div className="border-t border-[hsl(38_25%_80%)] px-3.5 py-2 text-right">
                <a className="text-xs font-medium text-[hsl(32_62%_25%)] underline decoration-primary/35 underline-offset-4 transition hover:text-cam-gold" href={group.implementationUrl} target="_blank" rel="noreferrer">View implementation record →</a>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function RecordChainView({ chain, currentId, onNavigateRecord }: { chain: RecordChain; currentId: string; onNavigateRecord?: (recordId: string) => void }) {
  const stages = [
    { label: "Observation", records: chain.observations },
    { label: "Failure Mode", records: chain.failureModes },
    { label: "Proposal", records: chain.proposals },
    { label: "PATCH", records: chain.patches },
  ];
  return (
    <div className="rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">Evidence-to-repair record chain</p>
        <a href={`/observatory/reports/${encodeURIComponent(currentId)}`} className="inline-flex w-fit items-center rounded-md border border-primary/35 bg-primary/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.11em] text-[hsl(32_62%_25%)] transition hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/25">Generate report →</a>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-4">
        {stages.map((stage, index) => {
          const isCurrentStage = stage.records.includes(currentId);
          return (
          <div key={stage.label} className={`relative rounded-lg border p-3 ${isCurrentStage ? "border-cam-gold/70 bg-[hsl(43_62%_86%)] shadow-sm" : "border-[hsl(38_25%_80%)] bg-[hsl(40_48%_97%)]"}`}>
            {index < stages.length - 1 && <span className="absolute -right-[0.58rem] top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-[hsl(38_48%_94%)] px-0.5 text-sm text-cam-gold md:inline" aria-hidden="true">→</span>}
            <div className="flex min-h-5 items-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold">{index + 1}. {stage.label}</p>
            </div>
            <div className="mt-2 flex min-h-7 flex-wrap items-start gap-1.5">
              {stage.records.length === 0 && <span className="text-sm text-muted-foreground/70">Not linked</span>}
              {stage.records.map((recordId) => (
                <button
                  key={recordId}
                  type="button"
                  className={`rounded-md border px-2 py-1 font-mono text-[10px] tracking-[0.04em] transition ${recordId === currentId ? "border-cam-gold/60 bg-white/65 font-semibold text-[hsl(32_62%_25%)]" : "border-border bg-background text-muted-foreground hover:text-cam-gold"}`}
                  onClick={() => recordId !== currentId && onNavigateRecord?.(recordId)}
                  disabled={recordId === currentId || !onNavigateRecord}
                  aria-label={recordId === currentId ? `${recordId}, current record` : `Find linked record ${recordId}`}
                >
                  {recordId}
                </button>
              ))}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

function ObservationDetailView({ record }: { record: VigilIndexRecord }) {
  const raw = record.raw;
  const observation = record.publicDisplay.observation;
  const systemContext = isObject(raw.system_context) ? raw.system_context : raw;
  const systemEntries = valuesForKeys(systemContext, ["system_type", "platform_or_vendor", "product_or_service", "specific_model_or_runtime", "interface_surface", "deployment_context", "affected_population"], raw);

  return (
    <div className="space-y-2">
      <DetailSection title="What was directly observed" defaultOpen show={Boolean(observation?.observed)}>
        <p className="text-[15px] leading-relaxed text-foreground"><InlineMarkdown text={observation?.observed} /></p>
      </DetailSection>
      <DetailSection title="System and observation context" defaultOpen={systemEntries.length > 0} show={systemEntries.length > 0 || Boolean(observation?.context)}>
        <div className="space-y-3">
          {observation?.context && <p className="text-sm leading-relaxed text-foreground">{observation.context}</p>}
          <FieldGrid entries={systemEntries} />
        </div>
      </DetailSection>
      <DetailSection title="Evidence sources" defaultOpen show={hasMeaningfulValue(raw.source_records)}>
        <CompactObjectCards items={raw.source_records} titleKeys={["source_title", "title"]} keys={["source_title", "author_or_publisher", "source_date", "source_type", "source_modality", "source_platform", "system_or_product", "public_access_status", "access_status", "source_url_status", "relevance_note"]} />
      </DetailSection>
      <DetailSection title="Evidence modality and access" show={Boolean(observation?.sourceModality.length || observation?.publicAccess)}>
        <FieldGrid entries={[
          { key: "source_modality", label: "Source modality", value: observation?.sourceModality },
          { key: "public_access", label: "Public-access status", value: observation?.publicAccess },
        ].filter((entry) => hasMeaningfulValue(entry.value))} />
      </DetailSection>
      <DetailSection title="Interpretation — separate from observation" defaultOpen={Boolean(observation?.interpretation)} show={Boolean(observation?.interpretation)}>
        <p className="text-sm leading-relaxed text-foreground">{observation?.interpretation}</p>
      </DetailSection>
    </div>
  );
}

function FailureModeDetailView({ record, onNavigateRecord }: { record: VigilIndexRecord; onNavigateRecord?: (recordId: string) => void }) {
  const raw = record.raw;
  const publicFailure = record.publicDisplay.failure;
  const systemContext = isObject(raw.system_context) ? raw.system_context : raw;
  const failureClassification = isObject(raw.failure_classification) ? raw.failure_classification : raw;
  const triage = isObject(raw.triage) ? raw.triage : raw;
  const jurisdiction = isObject(raw.jurisdictional_context) ? raw.jurisdictional_context : raw;
  const camInternal = isObject(raw.cam_internal) ? raw.cam_internal : raw;

  const systemEntries = valuesForKeys(systemContext, ["system_type", "platform_or_vendor", "vendor_cluster", "primary_evidenced_vendors", "product_or_service", "interface_surface", "deployment_context", "user_role", "affected_population"], raw);
  const classificationEntries = valuesForKeys(failureClassification, ["failure_family", "failure_subtype", "harm_vectors", "severity", "likelihood", "confidence", "affected_rights_or_interests", "failure_scope", "recurrence_pattern", "taxonomy_reference", "related_failure_groups", "persistence", "reproducibility", "visibility"], raw);
  const triageEntries = valuesForKeys(triage, ["triage_priority", "triage_owner", "triage_status", "mitigation_status", "escalation_required", "recommended_next_step"], raw);
  const jurisdictionEntries = valuesForKeys(jurisdiction, ["primary_jurisdiction", "secondary_jurisdictions", "regulatory_surface"]);
  const impactEntries = valuesForKeys(raw, ["distinguishing_observations", "user_impact"]);
  const gapEntries = valuesForKeys(raw, ["governance_gap", "repair_hypothesis"]);
  const camEntries = valuesForKeys(camInternal, ["cam_relevance", "cam_failure_type", "cam_compliance_status", "cam_internal_failure_statement", "cam_expected_control", "cam_observed_failure", "cam_taxonomy_primary_group", "cam_taxonomy_secondary_groups", "cam_taxonomy_candidate_labels", "cam_controls_implicated", "recommended_cam_action"], raw);
  const repairPatches = record.publicDisplay.chain.patches;

  return (
    <div className="space-y-2">
      <DetailSection title="Failure finding" defaultOpen show={Boolean(publicFailure?.definition)}>
        <p className="text-[15px] leading-relaxed text-foreground"><InlineMarkdown text={publicFailure?.definition} /></p>
      </DetailSection>
      <DetailSection title="Relevant corpus provisions" defaultOpen show>
        {record.publicDisplay.corpusProvisions.length > 0
          ? <CorpusProvisionCards provisions={record.publicDisplay.corpusProvisions} />
          : <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">No exact CAELESTIS instrument and section is yet identified in this public record. Treat this as an unresolved corpus-basis gap, not as evidence that no relevant provision exists.</div>}
      </DetailSection>
      <DetailSection title="Triggers, manifestations, and significance" defaultOpen show={Boolean(publicFailure && (publicFailure.triggers.length || publicFailure.manifestations.length || publicFailure.significance || publicFailure.affectedParties.length))}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-cam-gold">Triggering conditions</p>
            <TextList items={publicFailure?.triggers ?? []} />
          </div>
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-cam-gold">Observed manifestations</p>
            <TextList items={publicFailure?.manifestations ?? []} />
          </div>
          {publicFailure?.significance && <ValueField label="Governance significance" value={publicFailure.significance} />}
          {publicFailure?.affectedParties.length ? <ValueField label="Affected parties or interests" value={publicFailure.affectedParties} /> : null}
          {publicFailure?.corpusRelationship && <ValueField label="Corpus relationship" value={publicFailure.corpusRelationship} />}
        </div>
      </DetailSection>
      <DetailSection title="Repair status" defaultOpen={repairPatches.length > 0} show>
        <div className="space-y-2 text-sm leading-relaxed">
          {repairPatches.length > 0 ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-950">
              <p className="font-medium">{publicFailure?.repairStatus ? `${titleizeValue(publicFailure.repairStatus)} — ` : ""}repair documented through {repairPatches.join(", ")}.</p>
              {record.publicDisplay.principalRepair && <p className="mt-1">Corpus basis: {record.publicDisplay.principalRepair}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {repairPatches.map((patchId) => <button key={patchId} type="button" className="rounded-md border border-emerald-300 bg-white/70 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.08em] text-emerald-900" onClick={() => onNavigateRecord?.(patchId)}>View {patchId} →</button>)}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950">
              <p className="font-medium">{record.publicDisplay.repairState ?? "No implemented repair is linked."}</p>
              {publicFailure?.repairNextAction && <p className="mt-1"><span className="font-medium">Next action:</span> {publicFailure.repairNextAction}</p>}
            </div>
          )}
        </div>
      </DetailSection>
      <DetailSection title="System Context" defaultOpen={systemEntries.length > 0} show={systemEntries.length > 0}><FieldGrid entries={systemEntries} /></DetailSection>
      <DetailSection title="Evidence & Sources" show={hasMeaningfulValue(raw.source_records)}><CompactObjectCards items={raw.source_records} titleKeys={["source_title", "title"]} keys={["source_title", "author_or_publisher", "source_date", "source_type", "source_platform", "system_or_product", "source_context", "relevance_note"]} /></DetailSection>
      <DetailSection title="Failure Classification" show={classificationEntries.length > 0}><FieldGrid entries={classificationEntries} /></DetailSection>
      <DetailSection title="Triage & Status" show={triageEntries.length > 0}><FieldGrid entries={triageEntries} /></DetailSection>
      <DetailSection title="Jurisdictional / Standards Context" show={jurisdictionEntries.length > 0 || hasMeaningfulValue(jurisdiction.external_standards_or_regulations ?? raw.external_standards_or_regulations)}>
        <div className="space-y-3">
          <FieldGrid entries={jurisdictionEntries} />
          <CompactObjectCards items={jurisdiction.external_standards_or_regulations ?? raw.external_standards_or_regulations} titleKeys={["instrument"]} keys={["jurisdiction", "instrument", "status", "failure_relevance", "x_should_have_happened", "y_happened_instead"]} />
        </div>
      </DetailSection>
      <DetailSection title="Impact & Distinguishing Observations" show={impactEntries.length > 0}><ParagraphFields entries={impactEntries} /></DetailSection>
      <DetailSection title="CAM Coverage & Governance Gap" show={hasMeaningfulValue(raw.existing_cam_coverage) || gapEntries.length > 0}>
        <div className="space-y-3">
          <CompactObjectCards items={raw.existing_cam_coverage} titleKeys={["instrument"]} keys={["instrument", "coverage_type", "relevance", "internal_failure"]} />
          <ParagraphFields entries={gapEntries} />
        </div>
      </DetailSection>
      <DetailSection title="Recommended Repair Path" show={hasMeaningfulValue(raw.recommended_repair_path)}><CompactObjectCards items={raw.recommended_repair_path} titleKeys={["repair_action"]} keys={["repair_action", "expected_control", "implementation_note"]} /></DetailSection>
      <DetailSection title="CAM Internal" show={camEntries.length > 0}><FieldGrid entries={camEntries} /></DetailSection>
    </div>
  );
}

function ProposalDetailView({ record, onNavigateRecord }: { record: VigilIndexRecord; onNavigateRecord?: (recordId: string) => void }) {
  const raw = record.raw;
  const proposal = record.publicDisplay.proposal;
  const targetProvisions = record.publicDisplay.corpusProvisions;

  return (
    <div className="space-y-2">
      <DetailSection title="Problem and proposed governance outcome" defaultOpen show={Boolean(proposal?.problem || proposal?.proposedOutcome)}>
        <div className="space-y-4">
          {proposal?.problem && <ValueField label="Problem being addressed" value={proposal.problem} />}
          {proposal?.proposedOutcome && <ValueField label="Proposed governance outcome" value={proposal.proposedOutcome} />}
        </div>
      </DetailSection>
      <DetailSection title="Proposed corpus targets" defaultOpen={targetProvisions.length > 0} show>
        {targetProvisions.length > 0
          ? <CorpusProvisionCards provisions={targetProvisions} />
          : <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">The proposal does not yet identify an exact target instrument and section.</div>}
      </DetailSection>
      <DetailSection title="Proposed wording — not yet binding" defaultOpen={Boolean(proposal?.proposedWording)} show={Boolean(proposal?.proposedWording)}>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-900">Draft only · not CAELESTIS authority</p>
          <p className="mt-2 whitespace-pre-wrap font-serif text-sm leading-7 text-amber-950">{proposal?.proposedWording}</p>
        </div>
      </DetailSection>
      <DetailSection title="Decision and implementation status" defaultOpen show>
        <div className="space-y-3">
          <FieldGrid entries={[
            { key: "decision_status", label: "Decision status", value: proposal?.decisionStatus },
            { key: "repair_state", label: "Implementation state", value: record.publicDisplay.repairState },
          ].filter((entry) => hasMeaningfulValue(entry.value))} />
          {proposal?.resultingPatches.length ? (
            <div className="flex flex-wrap gap-2">
              {proposal.resultingPatches.map((patchId) => <button key={patchId} type="button" className="rounded-md border border-primary/35 bg-primary/10 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.08em] text-[hsl(32_62%_25%)]" onClick={() => onNavigateRecord?.(patchId)}>Resulting {patchId} →</button>)}
            </div>
          ) : <p className="text-sm leading-relaxed text-muted-foreground">No resulting PATCH is linked. Any proposed wording remains non-binding.</p>}
        </div>
      </DetailSection>
      <DetailSection title="Evidence and rationale" show={hasMeaningfulValue(raw.source_records) || hasMeaningfulValue(raw.why_it_matters_to_CAM)}>
        <div className="space-y-3">
          {hasMeaningfulValue(raw.why_it_matters_to_CAM) && <ValueField label="Why it matters to CAM" value={raw.why_it_matters_to_CAM} />}
          <CompactObjectCards items={raw.source_records} titleKeys={["source_title", "title"]} keys={["source_title", "author_or_publisher", "source_date", "source_type", "source_platform", "source_context", "relevance_note"]} />
        </div>
      </DetailSection>
    </div>
  );
}

function PatchDetailView({ record }: { record: VigilIndexRecord }) {
  const raw = record.raw;
  const patch = record.publicDisplay.patch;
  const provisions = record.publicDisplay.corpusProvisions;
  const implementationEntries = [
    { key: "implementation_date", label: "Implemented", value: patch?.implementationDate ?? record.publicDisplay.dates.implemented },
    { key: "verification_status", label: "Verification status", value: patch?.verificationStatus },
    { key: "verified_against", label: "Verified against", value: patch?.verifiedAgainst },
    { key: "source_status", label: "Source lifecycle status", value: record.record_state ? titleizeValue(record.record_state) : undefined },
  ].filter((entry) => hasMeaningfulValue(entry.value));

  return (
    <div className="space-y-2">
      <section className="rounded-xl border-2 border-cam-gold/35 bg-[hsl(38_48%_94%)] p-4" aria-labelledby={`${record.id}-applied-repairs`}>
        <div className="flex flex-col gap-3 border-b border-primary/20 pb-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cam-gold">Primary audit surface</p>
            <h3 id={`${record.id}-applied-repairs`} className="mt-1 font-serif text-xl text-foreground">Applied corpus repairs</h3>
          </div>
          <span className={`w-fit rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${patch?.contractStatus === "complete-amendment" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : patch?.contractStatus === "complete-no-corpus-change" ? "border-blue-300 bg-blue-50 text-blue-900" : "border-red-300 bg-red-50 text-red-800"}`}>
            {patch?.contractStatus === "complete-amendment" ? "Display contract satisfied" : patch?.contractStatus === "complete-no-corpus-change" ? "No corpus amendment" : "Display contract incomplete"}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {patch?.contractStatus === "incomplete" && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[15px] leading-relaxed text-amber-950" role="note">
              <p className="font-medium">Implementation details incomplete.</p>
              <p className="mt-1">{patch.contractMessage} The source lifecycle state remains visible exactly as recorded in VIGIL.</p>
            </div>
          )}

          {patch?.explicitNoCorpusTextChange && (
            <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm leading-relaxed text-blue-950">
              <p className="font-medium">This PATCH did not amend CAELESTIS corpus text.</p>
              <p className="mt-1">{patch.noCorpusChangeExplanation ?? "It records a non-doctrinal repair or verified reliance on pre-existing corpus coverage."}</p>
            </div>
          )}

          {!patch?.explicitNoCorpusTextChange && provisions.length > 0 && <CorpusProvisionCards provisions={provisions} patchMode />}

          {!patch?.explicitNoCorpusTextChange && provisions.length === 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[15px] leading-relaxed text-amber-950">No structured corpus amendment is available for public verification.</div>
          )}

          {patch?.explicitNoCorpusTextChange && provisions.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Pre-existing provisions relied upon</p>
              <CorpusProvisionCards provisions={provisions} patchMode />
            </div>
          )}

          <div className="rounded-lg border border-border bg-background/55 p-3 text-xs leading-relaxed text-muted-foreground">
            VIGIL reproduces adopted wording for auditability. <strong className="text-foreground">CAELESTIS remains the authoritative governance corpus.</strong> Where this record and the current corpus differ, the current CAELESTIS provision governs.
          </div>
        </div>
      </section>

      <DetailSection title="Implementation and verification" defaultOpen={implementationEntries.length > 0} show={implementationEntries.length > 0}>
        <FieldGrid entries={implementationEntries} />
      </DetailSection>
      <DetailSection title="Repair summary and background" show={Boolean(patch?.repairSummary || hasMeaningfulValue(raw.why_it_matters_to_CAM))}>
        <div className="space-y-4">
          {patch?.repairSummary && <ValueField label="Repair summary" value={patch.repairSummary} />}
          {hasMeaningfulValue(raw.why_it_matters_to_CAM) && <ValueField label="Why it matters to CAM" value={raw.why_it_matters_to_CAM} />}
        </div>
      </DetailSection>
      <DetailSection title="Impact" show={hasMeaningfulValue(raw.impact_summary)}><ValueBody value={raw.impact_summary} /></DetailSection>
      <DetailSection title="Residual monitoring" show={Boolean(patch?.residualMonitoring.length)}>
        <TextList items={patch?.residualMonitoring ?? []} />
      </DetailSection>
      <DetailSection title="Evidence sources" show={hasMeaningfulValue(raw.source_records)}>
        <CompactObjectCards items={raw.source_records} titleKeys={["source_title", "title"]} keys={["source_title", "author_or_publisher", "source_date", "source_type", "source_platform", "system_or_product", "source_context", "relevance_note"]} />
      </DetailSection>
    </div>
  );
}

function GenericDetailView({ record }: { record: VigilIndexRecord }) {
  const raw = record.raw;
  const openEntries = valuesForKeys(raw, ["summary", "source_summary", "system_summary", "proposal_summary", "change_summary", "verification_summary", "impact_summary"]);
  const curatedTopLevelKeys = [
    "record_identity", "source_records", "system_context", "failure_classification", "triage", "jurisdictional_context", "distinguishing_observations", "user_impact", "existing_cam_coverage", "governance_gap", "repair_hypothesis", "recommended_repair_path", "linked_records", "cam_internal",
  ];
  const fallbackSections = Object.entries(raw)
    .filter(([key, value]) => !["path", "raw_url", "github_blob_url"].includes(key) && !openEntries.some((entry) => entry.key === key) && (curatedTopLevelKeys.includes(key) || isObject(value) || Array.isArray(value)))
    .filter(([, value]) => hasMeaningfulValue(value));

  return (
    <div className="space-y-2">
      <DetailSection title="Core Record Content" defaultOpen={openEntries.length > 0} show={openEntries.length > 0}><ParagraphFields entries={openEntries} /></DetailSection>
      {fallbackSections.map(([key, value], index) => (
        <DetailSection key={key} title={humanLabel(key)} defaultOpen={index === 0 && openEntries.length === 0}>
          {Array.isArray(value) && value.some(isObject)
            ? <CompactObjectCards items={value} titleKeys={["title", "source_title", "instrument", "repair_action"]} keys={Array.from(new Set(value.filter(isObject).flatMap((item) => Object.keys(item)).slice(0, 12)))} />
            : <ValueBody value={value} />}
        </DetailSection>
      ))}
      {!openEntries.length && !fallbackSections.length && <SummaryBlock title="Record Summary" entries={summaryBlocksFor(record).flatMap((name) => record.summaries[name] ?? [])} defaultOpen />}
    </div>
  );
}

function CuratedRecordDetail({ record, onNavigateRecord }: { record: VigilIndexRecord; onNavigateRecord?: (recordId: string) => void }) {
  if (record.record_type === "observation") return <ObservationDetailView record={record} />;
  if (record.record_type === "failure_mode") return <FailureModeDetailView record={record} onNavigateRecord={onNavigateRecord} />;
  if (record.record_type === "proposal") return <ProposalDetailView record={record} onNavigateRecord={onNavigateRecord} />;
  if (record.record_type === "patch_note") return <PatchDetailView record={record} />;
  return <GenericDetailView record={record} />;
}

function recordExportText(jsonText: string) {
  return `${camInitiativeCitationHeader}\n\n${vigilReuseNotice}\n\n${jsonText}\n`;
}

function sourceRecordUrl(record: Pick<VigilIndexRecord, "github_blob_url">) {
  return record.github_blob_url || undefined;
}

function exportFileName(status: string) {
  const date = new Date().toISOString().slice(0, 10);
  const statusPart = (status || "all").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  return `vigil-current-view-${statusPart}-${date}.json`;
}

function summaryBlocksFor(record: VigilIndexRecord) {
  if (record.record_type === "observation") {
    return ["source_summary", "system_summary", "jurisdiction_summary", "classification_summary", "cam_summary"] as const;
  }
  if (record.record_type === "failure_mode") {
    return ["classification_summary", "triage_summary", "source_summary", "system_summary", "jurisdiction_summary", "cam_summary"] as const;
  }
  if (record.record_type === "proposal") {
    return ["proposal_summary", "source_summary", "external_relevance_summary", "cam_summary"] as const;
  }
  if (record.record_type === "patch_note") {
    return ["change_summary", "verification_summary", "impact_summary", "cam_summary"] as const;
  }
  return ["source_summary", "system_summary", "jurisdiction_summary", "classification_summary", "triage_summary", "proposal_summary", "change_summary", "external_relevance_summary", "impact_summary", "cam_summary"] as const;
}

function defaultOpenSummaryNames(record: VigilIndexRecord) {
  const preferredByType: Record<string, string[]> = {
    observation: ["source_summary", "system_summary"],
    failure_mode: ["classification_summary", "triage_summary"],
    proposal: ["proposal_summary"],
    patch_note: ["change_summary", "verification_summary"],
  };
  const meaningfulSummaries = summaryBlocksFor(record).filter((name) => record.summaries[name]?.length);
  const preferred = new Set((preferredByType[record.record_type] ?? []).filter((name) => meaningfulSummaries.includes(name as (typeof meaningfulSummaries)[number])));
  if (preferred.size > 0) return preferred;
  return new Set(meaningfulSummaries.slice(0, 1));
}

export default function Vigil() {
  const [records, setRecords] = useState<VigilIndexRecord[]>([]);
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    recordType: "",
    affectedPlatform: "",
    status: "",
  });
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "date", direction: "desc" });
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadNotice, setLoadNotice] = useState("");
  const [recordPage, setRecordPage] = useState(1);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [expandedRecordKeys, setExpandedRecordKeys] = useState<Set<string>>(() => new Set());
  const [copiedRecordKey, setCopiedRecordKey] = useState<string | null>(null);
  const [pendingJsonAction, setPendingJsonAction] = useState<PendingJsonAction>(null);
  const [detailLoads, setDetailLoads] = useState<Record<string, DetailLoadState>>({});
  const detailLoadPromises = useRef<Partial<Record<string, Promise<UnknownRecord>>>>({});

  useEffect(() => {
    let cancelled = false;

    loadVigilRegistryRecords()
      .then((result) => {
        if (cancelled) return;
        setRecords(normalizeRecords(result.records));
        setLoadNotice(result.message ?? "");
        setLoadState("ready");
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setErrorMessage(error.message);
        setRecords([]);
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filterOptions = useMemo(() => getFilterOptionsFromRecords(records), [records]);

  const filtered = useMemo(
    () => records.filter((record) => {
      const filtersOk = filterConfig.every((filter) => {
        const selected = filters[filter.key];
        if (!selected) return true;
        const selectedKey = filterComparisonKey(filter.key, selected);
        return valuesForFilter(record, filter.key).some((value) => filterComparisonKey(filter.key, value) === selectedKey);
      });
      const searchOk = matchesVigilSearch(record.searchText, search);
      return filtersOk && searchOk;
    }).sort((a, b) => compareRecordsBySort(a, b, sortConfig)),
    [filters, records, search, sortConfig],
  );

  useEffect(() => {
    setRecordPage(1);
  }, [filters, search, sortConfig]);

  useEffect(() => {
    if (!isExportDialogOpen) return;

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsExportDialogOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isExportDialogOpen]);

  const recordPageCount = Math.max(1, Math.ceil(filtered.length / VIGIL_PAGE_SIZE));
  const currentRecordPage = Math.min(recordPage, recordPageCount);
  const recordPageStart = (currentRecordPage - 1) * VIGIL_PAGE_SIZE;
  const pagedRecords = filtered.slice(recordPageStart, recordPageStart + VIGIL_PAGE_SIZE);
  const visibleRecordStart = filtered.length === 0 ? 0 : recordPageStart + 1;
  const visibleRecordEnd = Math.min(recordPageStart + VIGIL_PAGE_SIZE, filtered.length);

  function setFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function updateSort(key: SortKey) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  async function ensureRecordDetail(record: VigilIndexRecord, recordKey: string) {
    const existing = detailLoads[recordKey];
    if (existing?.status === "ready") return existing.raw;
    if (detailLoadPromises.current[recordKey]) return detailLoadPromises.current[recordKey];

    setDetailLoads((current) => ({ ...current, [recordKey]: { status: "loading" } }));
    const detailPromise = loadVigilRecordDetail(record.raw)
      .then((raw) => {
        const displayRecord = detailDisplayRecord(record, raw);
        setDetailLoads((current) => ({ ...current, [recordKey]: { status: "ready", raw, displayRecord } }));
        setRecords((current) => current.map((item) => item.id === displayRecord.id ? displayRecord : item));
        return raw;
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "VIGIL canonical record could not be loaded.";
        setDetailLoads((current) => ({ ...current, [recordKey]: { status: "error", error: message } }));
        return record.raw;
      })
      .finally(() => {
        delete detailLoadPromises.current[recordKey];
      });

    detailLoadPromises.current[recordKey] = detailPromise;
    return detailPromise;
  }

  async function performRecordCopy(exportText: string, recordKey: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = exportText;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("Clipboard copy failed");
      }

      setCopiedRecordKey(recordKey);
      window.setTimeout(() => {
        setCopiedRecordKey((current) => (current === recordKey ? null : current));
      }, 2000);
    } catch {
      setCopiedRecordKey(null);
    }
  }

  function performRecordDownload(record: VigilIndexRecord, exportText: string) {
    const blob = new Blob([exportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = jsonFileName(record);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copyRecordJson(record: VigilIndexRecord, recordKey: string) {
    const detailJson = await ensureRecordDetail(record, recordKey);
    const exportText = recordExportText(JSON.stringify(detailJson, null, 2));
    setPendingJsonAction({ action: "copy", record, recordKey, exportText });
  }

  async function downloadRecordJson(record: VigilIndexRecord, recordKey: string) {
    const detailJson = await ensureRecordDetail(record, recordKey);
    const exportText = recordExportText(JSON.stringify(detailJson, null, 2));
    setPendingJsonAction({ action: "download", record, recordKey, exportText });
  }

  async function continuePendingJsonAction() {
    if (!pendingJsonAction) return;
    if (pendingJsonAction.action === "copy") {
      await performRecordCopy(pendingJsonAction.exportText, pendingJsonAction.recordKey);
    } else {
      performRecordDownload(pendingJsonAction.record, pendingJsonAction.exportText);
    }
    setPendingJsonAction(null);
  }

  function toggleExpandedRecord(record: VigilIndexRecord, recordKey: string) {
    const shouldLoadDetail = !expandedRecordKeys.has(recordKey);
    setExpandedRecordKeys((current) => {
      const next = new Set(current);
      if (next.has(recordKey)) {
        next.delete(recordKey);
      } else {
        next.add(recordKey);
      }
      return next;
    });
    if (shouldLoadDetail) void ensureRecordDetail(record, recordKey);
  }

  function navigateToRecord(recordId: string) {
    const targetIndex = records.findIndex((record) => record.id.toLocaleLowerCase() === recordId.toLocaleLowerCase());
    setSearch(recordId);
    setFilters({ recordType: "", affectedPlatform: "", status: "" });
    setRecordPage(1);
    if (targetIndex < 0) return;

    const target = records[targetIndex];
    const targetKey = recordKeyFor(target, targetIndex);
    setExpandedRecordKeys(new Set([targetKey]));
    void ensureRecordDetail(target, targetKey);
    window.setTimeout(() => {
      document.getElementById(`vigil-record-${target.id.replace(/[^A-Za-z0-9_-]/g, "-")}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleRecordRowKeyDown(event: KeyboardEvent<HTMLDivElement>, record: VigilIndexRecord, recordKey: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleExpandedRecord(record, recordKey);
  }

  function exportCurrentView() {
    const payload = {
      export_notice: exportNotice,
      exported_at_utc: new Date().toISOString(),
      source: VIGIL_REGISTRY_SOURCE.registry_index_url,
      source_registry: VIGIL_REGISTRY_SOURCE.registry_index_url,
      citation: vigilCitation,
      reuse_notice: vigilReuseNotice,
      filters: { ...filters, search, sort: sortConfig },
      record_count: filtered.length,
      records: filtered.map(({ raw }) => raw),
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(filters.status);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
  }

  function openSupportLink() {
    window.open(vigilSupportUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Shell>
      <div className="container mx-auto max-w-7xl px-5 py-8 md:px-8 lg:px-10">
        <div className="mb-5">
          <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">Evidence-to-Repair Governance Ledger</p>
          <h1 className="mb-3 font-serif text-3xl text-foreground md:text-4xl">VIGIL Observatory</h1>
          <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground md:text-base">
            VIGIL records observations, failure modes, CAM proposals, and implemented repairs. Its public view prioritises the evidence, governance finding, exact CAELESTIS basis, literal repair, and current outcome.
          </p>
        </div>

        <details className="group cam-parchment-card mb-5 rounded-xl p-3 text-sm shadow-sm transition hover:border-primary/30 hover:bg-[hsl(36_48%_96%)]">
          <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.18em] text-cam-gold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background [&::-webkit-details-marker]:hidden">
            <span className="inline-flex w-full items-center gap-3">
              <span className="inline-block h-0 w-0 shrink-0 border-y-[0.35rem] border-l-[0.52rem] border-y-transparent border-l-[hsl(var(--primary))] transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
              <span>About VIGIL</span>
            </span>
          </summary>
          <div className="mt-3 space-y-5 border-t border-border/70 pt-3 leading-relaxed text-muted-foreground">
            <div className="space-y-2">
              <p>VIGIL is CAM’s public evidence-to-repair governance ledger. It records AI governance signals, runtime failures, implementation gaps, proposals, corrective patches, and source-linked digital ecosystem observations.</p>
              <p>It helps translate scattered incidents, field observations, platform behaviours, model failures, and governance proposals into structured records that can be reviewed, filtered, cited, and connected back to the CAM framework.</p>
              <p><strong className="text-foreground">Public-display contract:</strong> the Observatory shows the evidence, finding, corpus basis, exact repair, and current outcome. Complete technical and review metadata remain available in each record’s JSON. CAELESTIS remains the authoritative governance corpus. <a className="text-[hsl(32_62%_25%)] underline decoration-cam-gold/50 underline-offset-4 hover:text-cam-gold" href="https://github.com/CAM-Initiative/cam-governance-catalogue/blob/main/VIGIL-PUBLIC-DISPLAY-CONTRACT.md" target="_blank" rel="noreferrer">Read the interface contract →</a></p>
            </div>

            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">From evidence to repair:</p>
              <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
                {evidenceRepairSteps.map((step, index) => (
                  <div className="contents" key={step.label}>
                    <div className="rounded-lg border border-border bg-background/35 p-3">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">{step.label}</p>
                      <p className="text-xs leading-relaxed md:text-sm">{step.text}</p>
                    </div>
                    {index < evidenceRepairSteps.length - 1 && (
                      <div className="flex items-center justify-center text-cam-gold/75" aria-hidden="true">
                        <span className="hidden lg:inline">→</span>
                        <span className="lg:hidden">↓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Record types</p>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/35 p-3">
                  <p className="font-medium text-foreground">Observation — what was seen.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">A source-linked record of an observed AI-system behaviour, platform signal, governance gap, or emerging digital ecosystem event.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/35 p-3">
                  <p className="font-medium text-foreground">Failure Mode — the pattern.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">A structured classification of a recurring, significant, or governance-relevant failure pattern.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/35 p-3">
                  <p className="font-medium text-foreground">Proposal — what might change.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">A candidate governance, schema, taxonomy, interface, operational, or doctrinal change. Proposals are exploratory unless implemented by a patch note.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/35 p-3">
                  <p className="font-medium text-foreground">Patch Note — what changed.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">A traceable record of the exact implemented corpus repair—or an explicit declaration that no CAELESTIS text changed.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/35 p-3 md:col-span-2">
                  <p className="font-medium text-foreground">Source / Research — supporting context.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">Research notes, source records, or supporting evidence that may inform observations, proposals, or future governance work.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-primary/20 bg-card/45 p-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Lifecycle note</p>
                <p className="text-xs leading-relaxed md:text-sm">Records may move from observation to failure mode, proposal, patch note, monitoring, closed—actioned, closed—no action, deferred, or superseded states. Not every observation becomes a proposal, and not every failure mode requires a new instrument.</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-card/45 p-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">What VIGIL is not</p>
                <p className="text-xs leading-relaxed md:text-sm">VIGIL is not a regulator, legal determination system, safety certification body, or final incident adjudication authority. Records are governance artefacts intended to support analysis, review, and repair.</p>
              </div>
            </div>
          </div>
        </details>

        {isExportDialogOpen && (
          <div
            aria-labelledby="vigil-export-dialog-title"
            aria-modal="true"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm"
            role="dialog"
          >
            <div className="w-full max-w-lg rounded-2xl border border-primary/25 bg-[hsl(36_48%_95%)] p-5 text-foreground shadow-2xl md:p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cam-gold">VIGIL export</p>
              <h2 id="vigil-export-dialog-title" className="font-serif text-2xl leading-snug text-foreground">Export current VIGIL view</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>{vigilReuseNotice}</p>
                <div className="rounded-xl border border-border bg-card/55 p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Please cite VIGIL if you use this data</p>
                  <p className="font-mono text-xs leading-relaxed text-foreground">{vigilRecommendedCitation}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={() => setIsExportDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={openSupportLink}
                >
                  Support CAM Initiative
                </button>
                <button
                  className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] transition hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={exportCurrentView}
                >
                  Continue to download
                </button>
              </div>
            </div>
          </div>
        )}

        {pendingJsonAction && (
          <div
            aria-labelledby="vigil-json-action-dialog-title"
            aria-modal="true"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm"
            role="dialog"
          >
            <div className="w-full max-w-lg rounded-2xl border border-primary/25 bg-[hsl(36_48%_95%)] p-5 text-foreground shadow-2xl md:p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cam-gold">VIGIL record JSON</p>
              <h2 id="vigil-json-action-dialog-title" className="font-serif text-2xl leading-snug text-foreground">Public infrastructure notice</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>{vigilReuseNotice}</p>
                <div className="rounded-xl border border-border bg-card/55 p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Recommended citation</p>
                  <p className="font-mono text-xs leading-relaxed text-foreground">{vigilRecommendedCitation}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={() => setPendingJsonAction(null)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={openSupportLink}
                >
                  Support CAM Initiative
                </button>
                <button
                  className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] transition hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                  type="button"
                  disabled={pendingJsonAction.action !== "copy"}
                  onClick={() => void continuePendingJsonAction()}
                >
                  Continue to copy
                </button>
                <button
                  className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] transition hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                  type="button"
                  disabled={pendingJsonAction.action !== "download"}
                  onClick={() => void continuePendingJsonAction()}
                >
                  Continue to download
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="space-y-4" data-result-range-example="Showing 1–20">
          <div className="cam-parchment-card rounded-xl p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">Public filters</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Search by record ID, failure title, provider, domain, instrument, or section; narrow results by type, affected platform, and lifecycle status.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilters({ recordType: "", affectedPlatform: "", status: "" });
                  }}
                >
                  Clear
                </button>
                <button
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={() => setIsExportDialogOpen(true)}
                  disabled={loadState !== "ready" || filtered.length === 0}
                >
                  Export current view
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block sm:col-span-2 lg:col-span-1">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/75">Search</span>
                <input
                  aria-label="Search VIGIL records"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="e.g. AEON-003 §7.4.1"
                />
              </label>
              {filterConfig.map((filter) => (
                <label key={filter.key} className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/75">{filter.label}</span>
                  <select
                    aria-label={`Filter by ${filter.label}`}
                    className="w-full rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={filters[filter.key]}
                    onChange={(event) => setFilter(filter.key, event.target.value)}
                  >
                    <option value="">{filter.placeholder}</option>
                    {filterOptions[filter.key].map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {loadState === "ready" && (
              <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-3 md:flex-row md:items-center md:justify-between">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground/75" aria-live="polite">
                  Showing {visibleRecordStart}–{visibleRecordEnd} of {filtered.length} VIGIL records.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setRecordPage((page) => Math.max(1, page - 1))}
                    disabled={currentRecordPage === 1 || filtered.length === 0}
                    aria-label="Show previous VIGIL records page"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">Page {currentRecordPage} of {recordPageCount}</span>
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setRecordPage((page) => Math.min(recordPageCount, page + 1))}
                    disabled={currentRecordPage === recordPageCount || filtered.length === 0}
                    aria-label="Show next VIGIL records page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {loadState === "loading" && <div className="cam-parchment-card rounded-xl p-5 text-sm text-muted-foreground shadow-sm">Loading VIGIL records from <code>{VIGIL_REGISTRY_SOURCE.registry_index_url}</code>…</div>}

          {loadState === "error" && (
            <div className="cam-parchment-card rounded-xl p-5 shadow-sm">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-700">Records unavailable</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{errorMessage || `VIGIL registry could not be loaded from the live registry source. Attempted ${VIGIL_REGISTRY_SOURCE.registry_index_url}.`}</p>
            </div>
          )}

          {loadState === "ready" && loadNotice && (
            <div className="cam-parchment-card rounded-xl p-5 text-sm text-muted-foreground shadow-sm">{loadNotice}</div>
          )}

          {loadState === "ready" && records.length === 0 && (
            <div className="cam-parchment-card rounded-xl p-5 text-sm text-muted-foreground shadow-sm">No VIGIL records are currently published in <code>{VIGIL_REGISTRY_SOURCE.registry_index_url}</code>.</div>
          )}

          {loadState === "ready" && filtered.length > 0 && (
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">Select any entry to inspect its public finding, evidence-to-repair chain, corpus basis, and complete JSON. Click a column heading to sort records.</p>
          )}

          <div className="space-y-2">
            {loadState === "ready" && filtered.length > 0 && (
              <div className="hidden gap-3 rounded-lg border border-border bg-card/60 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground md:grid md:grid-cols-[8rem_7rem_minmax(0,1fr)_9rem]" role="row">
                {sortableColumns.map((column) => {
                  const isActive = sortConfig.key === column.key;
                  return (
                    <div key={column.key} role="columnheader" aria-sort={isActive ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}>
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition hover:bg-background/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background ${isActive ? "text-cam-gold" : "text-muted-foreground"}`}
                        onClick={() => updateSort(column.key)}
                        aria-label={`Sort VIGIL records by ${column.label} ${isActive && sortConfig.direction === "asc" ? "descending" : "ascending"}`}
                      >
                        <span>{column.label}</span>
                        <span className={isActive ? "text-cam-gold" : "text-muted-foreground/60"} aria-hidden="true">{isActive ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {pagedRecords.map((record, index) => {
              const recordDate = record.date_recorded ?? record.date_implemented ?? "Date not specified";
              const sourceHref = sourceRecordUrl(record);
              const recordKey = recordKeyFor(record, recordPageStart + index);
              const detailsPanelId = `vigil-record-details-${recordKey.replace(/[^A-Za-z0-9_-]/g, "-")}`;
              const isExpanded = expandedRecordKeys.has(recordKey);
              const detailLoad = detailLoads[recordKey];
              const detailRecord = detailLoad?.status === "ready" ? detailLoad.displayRecord : record;
              const detailReadyForPublicView = detailLoad?.status === "ready" || detailLoad?.status === "error";
              const detailRecordDate = detailRecord.date_recorded ?? detailRecord.date_implemented ?? "Date not specified";
              const displayRecordId = record.id;
              const publicFinding = record.publicDisplay.finding ?? record.summary;
              const domainLabel = record.publicDisplay.domains.join("; ");
              const publicLifecycle = record.publicDisplay.lifecycleLabel ?? record.record_state;
              return (
                <article id={`vigil-record-${record.id.replace(/[^A-Za-z0-9_-]/g, "-")}`} key={recordKey} className="group cam-parchment-card scroll-mt-6 rounded-xl shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[hsl(36_48%_96%)] focus-within:ring-2 focus-within:ring-primary/20">
                  {!isExpanded && (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-controls={detailsPanelId}
                      className="cursor-pointer px-3 py-2.5 text-sm transition md:px-4"
                      onClick={() => toggleExpandedRecord(record, recordKey)}
                      onKeyDown={(event) => handleRecordRowKeyDown(event, record, recordKey)}
                    >
                      <div className="font-sans">
                        <div className="space-y-3 md:hidden">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Record ID</p>
                              <p className="mt-1 break-words font-mono text-xs text-cam-gold">{displayRecordId}</p>
                            </div>
                            <span className="shrink-0 rounded-full border border-border bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                              {isExpanded ? "Collapse" : "Expand"}
                            </span>
                          </div>

                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Title</p>
                            <h2 className="mt-1 break-words font-mono text-base font-normal leading-snug text-foreground/90">{record.title}</h2>
                          </div>

                          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-background/35 p-3">
                            <Field label="Record Type" value={record.type_label} />
                            <Field label="Lifecycle Status" value={publicLifecycle} />
                            <Field label="Record Date" value={recordDate} />
                            <Field label="Domain / System" value={domainLabel || record.platform_label} />
                          </div>

                          {findingSentence(publicFinding) && publicFinding !== record.title && (
                            <p className="text-[15px] leading-relaxed text-muted-foreground"><InlineMarkdown text={findingSentence(publicFinding)} /></p>
                          )}

                          {record.record_type === "patch_note" && record.publicDisplay.principalRepair && <p className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 font-mono text-[10px] leading-relaxed text-[hsl(32_62%_25%)]">Principal repair: {record.publicDisplay.principalRepair}</p>}

                          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-3">
                            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Details {isExpanded ? "−" : "+"}</span>
                          </div>
                        </div>

                        <div className="hidden gap-3 md:grid md:grid-cols-[8rem_7rem_minmax(0,1fr)_9rem] md:items-start">
                          <div className="break-words font-mono text-xs leading-snug text-cam-gold">{displayRecordId}</div>
                          <div className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground/80">{recordDate}</div>
                          <div className="min-w-0">
                            <h2 className="whitespace-normal break-words font-mono text-[15px] font-normal leading-snug text-foreground/90 lg:text-base">{record.title}</h2>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                              {[record.type_label, record.platform_label, domainLabel].filter(isMeaningfulText).join(" · ")}
                            </p>
                            {findingSentence(publicFinding, 260) && publicFinding !== record.title && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground"><InlineMarkdown text={findingSentence(publicFinding, 260)} /></p>}
                            {record.record_type === "patch_note" && record.publicDisplay.principalRepair && <p className="mt-1.5 line-clamp-2 font-mono text-[10px] leading-relaxed text-cam-gold">Repair: {record.publicDisplay.principalRepair}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 text-right">
                            <span className={`rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${lifecycleTone(publicLifecycle)}`}>{publicLifecycle}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div id={detailsPanelId} className="px-3 py-4 md:px-4">
                      <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <p className="break-words font-mono text-[11px] text-cam-gold">{detailRecord.id}</p>
                          <h2 className="mt-1 break-words font-mono text-xl font-normal leading-snug text-foreground/90">{detailRecord.title}</h2>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {[detailRecord.type_label, detailRecord.publicDisplay.lifecycleLabel, detailRecordDate, detailRecord.platform_label].filter(isMeaningfulText).map((value, badgeIndex) => (
                              <span key={`${value}-${badgeIndex}`} className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${badgeIndex === 1 ? lifecycleTone(String(value)) : "border-border bg-card text-muted-foreground"}`}>{value}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {sourceHref && <a className="inline-flex items-center justify-center rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] transition hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/25" href={sourceHref} target="_blank" rel="noreferrer">View source record →</a>}
                          <button type="button" className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25" onClick={() => void copyRecordJson(record, recordKey)} aria-label={`Copy raw JSON for ${detailRecord.id}`}>
                            {copiedRecordKey === recordKey ? "Copied" : "Copy JSON"}
                          </button>
                          <button type="button" className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25" onClick={() => void downloadRecordJson(record, recordKey)} aria-label={`Download raw JSON for ${detailRecord.id}`}>Download JSON</button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                            onClick={() => toggleExpandedRecord(record, recordKey)}
                            aria-expanded={isExpanded}
                            aria-controls={detailsPanelId}
                          >
                            Collapse record −
                          </button>
                        </div>
                      </div>

                      {detailLoad?.status === "loading" && (
                        <div className="mb-4 rounded-lg border border-border bg-card/60 p-3 text-xs leading-relaxed text-muted-foreground" role="status">
                          Loading canonical VIGIL record detail…
                        </div>
                      )}

                      {detailLoad?.status === "error" && (
                        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs leading-relaxed text-red-800" role="alert">
                          Detailed canonical record could not be loaded. Showing the registry index entry instead. {detailLoad.error}
                        </div>
                      )}

                      {previewText(detailRecord.publicDisplay.finding) && detailRecord.publicDisplay.finding !== detailRecord.title && (
                        <div className="mb-4 rounded-lg border border-border/70 bg-background/35 p-3">
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cam-gold">Public finding</p>
                          <p className="mt-2 text-base leading-relaxed text-foreground"><InlineMarkdown text={detailRecord.publicDisplay.finding} /></p>
                        </div>
                      )}

                      {detailReadyForPublicView && <div className="mb-3"><RecordChainView chain={detailRecord.publicDisplay.chain} currentId={detailRecord.id} onNavigateRecord={navigateToRecord} /></div>}

                      {detailReadyForPublicView && <CuratedRecordDetail record={detailRecord} onNavigateRecord={navigateToRecord} />}

                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </Shell>
  );
}
