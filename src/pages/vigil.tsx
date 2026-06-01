import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";

type UnknownRecord = Record<string, unknown>;

type SummaryEntry = { label: string; value: string };
type FilterKey =
  | "recordType"
  | "status"
  | "evidenceConfidence"
  | "sourcePlatform"
  | "sourceType"
  | "observedVendor"
  | "observedProduct"
  | "interactionMode"
  | "primaryJurisdiction"
  | "regulatorySurface"
  | "sector"
  | "failureFamily"
  | "failureSubtype"
  | "severity"
  | "likelihood"
  | "triagePriority"
  | "triageStatus"
  | "mitigationStatus"
  | "proposalType"
  | "targetDomain"
  | "draftingStatus"
  | "externalRelevance"
  | "patchType"
  | "changeScope"
  | "implementationMode"
  | "verificationStatus"
  | "changedDomain";

type VigilIndexRecord = {
  raw: UnknownRecord;
  id: string;
  title: string;
  summary: string;
  record_type: string;
  record_state: string;
  date_recorded?: string;
  date_implemented?: string;
  evidence_confidence?: string;
  path?: string;
  next_action?: string;
  source_types?: string[];
  affected_domains?: string[];
  affected_instruments?: string[];
  affected_annexes?: string[];
  source_platform?: string;
  source_author?: string;
  observed_vendor?: string;
  observed_product?: string;
  interaction_modes?: string[];
  primary_jurisdictions?: string[];
  regulatory_surfaces?: string[];
  sectors?: string[];
  failure_family?: string;
  failure_subtype?: string;
  severity?: string;
  likelihood?: string;
  triage_priority?: string;
  triage_status?: string;
  mitigation_status?: string;
  proposal_type?: string;
  target_domains?: string[];
  drafting_status?: string;
  external_relevance?: string;
  patch_type?: string;
  change_scope?: string;
  implementation_mode?: string;
  verification_status?: string;
  changed_domains?: string[];
  summaries: Record<string, SummaryEntry[]>;
  searchText: string;
};

const preferredStatuses = ["open", "watching", "triage", "routed", "deferred", "implemented", "closed", "closed-no-action", "closed-actioned"];
const preferredRecordTypes = ["observation", "failure_mode", "proposal", "patch_note"];
const sourceRecordBaseUrl = "https://github.com/CAM-Initiative/VIGIL/blob/main/";
const exportNotice = "Filtered VIGIL index export from the CAM Interface. Canonical records remain in CAM-Initiative/VIGIL.";
const summaryNames = [
  "source_summary",
  "system_summary",
  "jurisdiction_summary",
  "classification_summary",
  "triage_summary",
  "proposal_summary",
  "external_relevance_summary",
  "change_summary",
  "verification_summary",
  "impact_summary",
  "cam_summary",
] as const;
const searchSummaryNames = [
  "source_summary",
  "system_summary",
  "jurisdiction_summary",
  "classification_summary",
  "triage_summary",
  "proposal_summary",
  "change_summary",
  "external_relevance_summary",
] as const;

const labelMap: Record<string, string> = {
  title: "Title",
  summary: "Summary",
  record_state: "Record State",
  status: "Record State",
  date_recorded: "Date Recorded",
  date_implemented: "Date Implemented",
  evidence_confidence: "Evidence Confidence",
  source_summary: "Source Summary",
  system_summary: "Observed System Summary",
  jurisdiction_summary: "Jurisdiction Summary",
  classification_summary: "Classification Summary",
  triage_summary: "Triage Summary",
  proposal_summary: "Proposal Summary",
  external_relevance_summary: "External Relevance Summary",
  change_summary: "Change Summary",
  verification_summary: "Verification Summary",
  impact_summary: "Impact Summary",
  cam_summary: "CAM Summary",
  next_action: "Next Action",
  source_platform: "Source Platform",
  platform: "Source Platform",
  source_author: "Source Author / Publisher",
  source_account: "Source Author / Publisher",
  author: "Source Author / Publisher",
  account: "Source Author / Publisher",
  publisher: "Source Author / Publisher",
  source_type: "Source Type",
  source_types: "Source Type",
  observed_system_vendor: "Observed System Vendor",
  observed_vendor: "Observed System Vendor",
  system_vendor: "Observed System Vendor",
  vendor: "Observed System Vendor",
  observed_system: "Observed Product / System",
  observed_product: "Observed Product / System",
  observed_product_model: "Observed Product / Model",
  observed_product_system: "Observed Product / System",
  system_or_product: "Observed Product / System",
  model_or_algorithm: "Observed Product / Model",
  interaction_mode: "Interaction Mode",
  interaction_modes: "Interaction Mode",
  primary_jurisdiction: "Jurisdiction",
  primary_jurisdictions: "Jurisdiction",
  jurisdiction: "Jurisdiction",
  regulatory_surface: "Regulatory Surface",
  regulatory_surfaces: "Regulatory Surface",
  sector: "Sector",
  sectors: "Sector",
  failure_family: "Failure Family",
  failure_subtype: "Failure Subtype",
  severity: "Severity",
  likelihood: "Likelihood",
  triage_priority: "Triage Priority",
  triage_status: "Triage Status",
  mitigation_status: "Mitigation Status",
  proposal_type: "Proposal Type",
  target_domain: "Target Domain",
  target_domains: "Target Domain",
  drafting_status: "Drafting Status",
  external_relevance: "External Relevance",
  patch_type: "Patch Type",
  change_scope: "Change Scope",
  implementation_mode: "Implementation Mode",
  verification_status: "Verification Status",
  changed_domain: "Changed Domain",
  changed_domains: "Changed Domain",
  affected_domains: "Affected Domains",
  affected_instruments: "Affected Instruments",
  affected_annexes: "Affected Annexes",
};

const filterConfig: Array<{ key: FilterKey; label: string; placeholder: string; mode?: "failure" | "proposal" | "patch" }> = [
  { key: "recordType", label: "Record Type", placeholder: "All record types" },
  { key: "status", label: "Record State", placeholder: "All record states" },
  { key: "evidenceConfidence", label: "Evidence Confidence", placeholder: "All evidence confidence values" },
  { key: "sourcePlatform", label: "Source Platform", placeholder: "All source platforms" },
  { key: "sourceType", label: "Source Type", placeholder: "All source types" },
  { key: "observedVendor", label: "Observed System / Vendor", placeholder: "All observed vendors" },
  { key: "observedProduct", label: "Observed Product / Model", placeholder: "All observed products/models" },
  { key: "interactionMode", label: "Interaction Mode", placeholder: "All interaction modes" },
  { key: "primaryJurisdiction", label: "Primary Jurisdiction", placeholder: "All jurisdictions" },
  { key: "regulatorySurface", label: "Regulatory Surface", placeholder: "All regulatory surfaces" },
  { key: "sector", label: "Sector", placeholder: "All sectors" },
  { key: "failureFamily", label: "Failure Family", placeholder: "All failure families", mode: "failure" },
  { key: "failureSubtype", label: "Failure Subtype", placeholder: "All failure subtypes", mode: "failure" },
  { key: "severity", label: "Severity", placeholder: "All severity values", mode: "failure" },
  { key: "likelihood", label: "Likelihood", placeholder: "All likelihood values", mode: "failure" },
  { key: "triagePriority", label: "Triage Priority", placeholder: "All triage priorities", mode: "failure" },
  { key: "triageStatus", label: "Triage Status", placeholder: "All triage statuses", mode: "failure" },
  { key: "mitigationStatus", label: "Mitigation Status", placeholder: "All mitigation statuses", mode: "failure" },
  { key: "proposalType", label: "Proposal Type", placeholder: "All proposal types", mode: "proposal" },
  { key: "targetDomain", label: "Target Domain", placeholder: "All target domains", mode: "proposal" },
  { key: "draftingStatus", label: "Drafting Status", placeholder: "All drafting statuses", mode: "proposal" },
  { key: "externalRelevance", label: "External Relevance", placeholder: "All external relevance values", mode: "proposal" },
  { key: "patchType", label: "Patch Type", placeholder: "All patch types", mode: "patch" },
  { key: "changeScope", label: "Change Scope", placeholder: "All change scopes", mode: "patch" },
  { key: "implementationMode", label: "Implementation Mode", placeholder: "All implementation modes", mode: "patch" },
  { key: "verificationStatus", label: "Verification Status", placeholder: "All verification statuses", mode: "patch" },
  { key: "changedDomain", label: "Changed Domain", placeholder: "All changed domains", mode: "patch" },
];

const blankStrings = new Set(["", "[]", "{}"]);

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMeaningfulText(value: string | undefined): value is string {
  return Boolean(value && !blankStrings.has(value.trim()));
}

function textFrom(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return isMeaningfulText(value) ? value.trim() : undefined;
  if (Array.isArray(value)) {
    const values = value.map((item) => textFrom(item)).filter(isMeaningfulText);
    return values.length ? values.join("; ") : undefined;
  }
  if (isObject(value)) {
    const values = Object.entries(value)
      .map(([key, item]) => {
        const text = textFrom(item);
        return text ? `${humanLabel(key)}: ${text}` : undefined;
      })
      .filter(isMeaningfulText);
    return values.length ? values.join("; ") : undefined;
  }
  return String(value);
}

function humanLabel(key: string) {
  return labelMap[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOptionalField(record: UnknownRecord, names: string[]): string | undefined {
  for (const name of names) {
    const value = textFrom(record[name]);
    if (value) return value;
  }
  return undefined;
}

function getNestedField(record: UnknownRecord, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, part) => (isObject(current) ? current[part] : undefined), record);
    const text = textFrom(value);
    if (text) return text;
  }
  return undefined;
}

function arrayFrom(value: unknown): string[] | undefined {
  if (value === null || value === undefined) return undefined;
  const rawValues = Array.isArray(value) ? value : [value];
  const values = rawValues.flatMap((item) => {
    const text = textFrom(item);
    return text ? text.split(/\s*\|\s*|\s*;\s*/) : [];
  }).map((item) => item.trim()).filter(isMeaningfulText);
  return values.length ? [...new Set(values)] : undefined;
}

function normalizeRecordType(recordType: string) {
  const normalized = recordType.trim().toLowerCase().replace(/-/g, "_");
  if (["obs", "observation", "emerging_tech_signal"].includes(normalized)) return "observation";
  if (["fm", "failure_mode", "failure_mode_observation"].includes(normalized)) return "failure_mode";
  if (["prop", "proposal", "proposal_development_expansion"].includes(normalized)) return "proposal";
  if (["patch", "patch_note", "implemented_patch_note"].includes(normalized)) return "patch_note";
  return normalized || "unclassified";
}

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase() === "proposal" ? "open" : status.trim();
}

function summaryEntries(value: unknown): SummaryEntry[] {
  if (!value) return [];
  if (isObject(value)) {
    return Object.entries(value)
      .map(([key, item]) => ({ label: humanLabel(key), value: textFrom(item) }))
      .filter((entry): entry is SummaryEntry => isMeaningfulText(entry.value));
  }
  const text = textFrom(value);
  return text ? [{ label: "Summary", value: text }] : [];
}

function sourceFallbackEntries(record: UnknownRecord): SummaryEntry[] {
  return [
    { label: "Source Platform", value: getNestedField(record, ["source_platform", "source.platform", "platform"]) },
    { label: "Source Author / Publisher", value: getNestedField(record, ["source_author", "source_account", "source.author", "source.account", "author", "account", "publisher"]) },
    { label: "Source Type", value: getNestedField(record, ["source_type", "source_types", "source.type"]) },
  ].filter((entry): entry is SummaryEntry => isMeaningfulText(entry.value));
}

function systemFallbackEntries(record: UnknownRecord): SummaryEntry[] {
  return [
    { label: "Observed System Vendor", value: getNestedField(record, ["observed_system_vendor", "observed_vendor", "system_vendor", "vendor", "platform"]) },
    { label: "Observed Product / System", value: getNestedField(record, ["observed_product_system", "observed_product", "observed_system", "system_or_product"]) },
    { label: "Observed Product / Model", value: getNestedField(record, ["observed_product_model", "model_or_algorithm"]) },
    { label: "Interaction Mode", value: getNestedField(record, ["interaction_mode", "interaction_modes", "deployment_context"]) },
  ].filter((entry): entry is SummaryEntry => isMeaningfulText(entry.value));
}

function jurisdictionFallbackEntries(record: UnknownRecord): SummaryEntry[] {
  return [
    { label: "Jurisdiction", value: getNestedField(record, ["primary_jurisdiction", "primary_jurisdictions", "jurisdiction", "jurisdictions"]) },
    { label: "Regulatory Surface", value: getNestedField(record, ["regulatory_surface", "regulatory_surfaces"]) },
    { label: "Sector", value: getNestedField(record, ["sector", "sectors", "ecosystem_area"]) },
  ].filter((entry): entry is SummaryEntry => isMeaningfulText(entry.value));
}

function classificationFallbackEntries(record: UnknownRecord): SummaryEntry[] {
  return [
    { label: "Failure Family", value: getNestedField(record, ["failure_family"]) },
    { label: "Failure Subtype", value: getNestedField(record, ["failure_subtype", "failure_mode"]) },
    { label: "Severity", value: getNestedField(record, ["severity"]) },
    { label: "Likelihood", value: getNestedField(record, ["likelihood"]) },
  ].filter((entry): entry is SummaryEntry => isMeaningfulText(entry.value));
}

function addFallbackSummaries(record: UnknownRecord, summaries: Record<string, SummaryEntry[]>) {
  if (!summaries.source_summary?.length) summaries.source_summary = sourceFallbackEntries(record);
  if (!summaries.system_summary?.length) summaries.system_summary = systemFallbackEntries(record);
  if (!summaries.jurisdiction_summary?.length) summaries.jurisdiction_summary = jurisdictionFallbackEntries(record);
  if (!summaries.classification_summary?.length) summaries.classification_summary = classificationFallbackEntries(record);
}

function normalizeIndexRecord(record: UnknownRecord, index: number): VigilIndexRecord {
  const record_type = normalizeRecordType(getOptionalField(record, ["record_type", "recordType", "type", "category"]) ?? "unclassified");
  const summaries = Object.fromEntries(summaryNames.map((name) => [name, summaryEntries(record[name])])) as Record<string, SummaryEntry[]>;
  addFallbackSummaries(record, summaries);

  const source_platform = getNestedField(record, ["source_summary.source_platform", "source_summary.platform", "source_platform", "source.platform", "platform"]);
  const observed_vendor = getNestedField(record, ["system_summary.observed_system_vendor", "system_summary.vendor", "observed_system_vendor", "observed_vendor", "system_vendor", "vendor", "platform"]);
  const observed_product = getNestedField(record, ["system_summary.observed_product_system", "system_summary.observed_product", "system_summary.observed_product_model", "observed_product_system", "observed_product", "system_or_product", "model_or_algorithm"]);

  const normalized: VigilIndexRecord = {
    raw: record,
    id: getOptionalField(record, ["id", "record_id", "recordId", "ID"]) ?? `VIGIL-${index + 1}`,
    title: getOptionalField(record, ["title", "name"]) ?? getOptionalField(record, ["summary", "description", "observation", "signal"]) ?? `VIGIL record ${index + 1}`,
    summary: getOptionalField(record, ["summary", "description", "observation", "signal"]) ?? "Summary not provided.",
    record_type,
    record_state: normalizeStatus(getOptionalField(record, ["record_state", "status", "state"]) ?? "unclassified"),
    date_recorded: getOptionalField(record, ["date_recorded", "dateRecorded", "recorded_date", "recordedDate", "date"]),
    date_implemented: getOptionalField(record, ["date_implemented", "dateImplemented", "implemented_date", "implementedDate"]),
    affected_domains: arrayFrom(record.affected_domains ?? record.affectedDomains),
    affected_instruments: arrayFrom(record.affected_instruments ?? record.affectedInstruments),
    affected_annexes: arrayFrom(record.affected_annexes ?? record.affectedAnnexes),
    path: getOptionalField(record, ["path"]),
    next_action: getOptionalField(record, ["next_action", "nextAction"]),
    evidence_confidence: getOptionalField(record, ["evidence_confidence", "evidenceConfidence"]),
    source_types: arrayFrom(record.source_types ?? record.source_type ?? record.sourceTypes),
    source_platform,
    source_author: getNestedField(record, ["source_summary.source_author", "source_summary.source_account", "source_summary.author", "source_author", "source_account", "source.author", "source.account", "author", "account", "publisher"]),
    observed_vendor,
    observed_product,
    interaction_modes: arrayFrom(getNestedField(record, ["system_summary.interaction_mode", "system_summary.interaction_modes", "interaction_mode", "interaction_modes", "deployment_context"])),
    primary_jurisdictions: arrayFrom(getNestedField(record, ["jurisdiction_summary.primary_jurisdiction", "jurisdiction_summary.jurisdiction", "primary_jurisdiction", "primary_jurisdictions", "jurisdiction", "jurisdictions"])),
    regulatory_surfaces: arrayFrom(getNestedField(record, ["jurisdiction_summary.regulatory_surface", "jurisdiction_summary.regulatory_surfaces", "regulatory_surface", "regulatory_surfaces"])),
    sectors: arrayFrom(getNestedField(record, ["jurisdiction_summary.sector", "jurisdiction_summary.sectors", "sector", "sectors", "ecosystem_area"])),
    failure_family: getNestedField(record, ["classification_summary.failure_family", "failure_family"]),
    failure_subtype: getNestedField(record, ["classification_summary.failure_subtype", "failure_subtype", "failure_mode"]),
    severity: getNestedField(record, ["classification_summary.severity", "severity"]),
    likelihood: getNestedField(record, ["classification_summary.likelihood", "likelihood"]),
    triage_priority: getNestedField(record, ["triage_summary.triage_priority", "triage_priority"]),
    triage_status: getNestedField(record, ["triage_summary.triage_status", "triage_status"]),
    mitigation_status: getNestedField(record, ["triage_summary.mitigation_status", "mitigation_status"]),
    proposal_type: getNestedField(record, ["proposal_summary.proposal_type", "proposal_type"]),
    target_domains: arrayFrom(getNestedField(record, ["proposal_summary.target_domain", "proposal_summary.target_domains", "target_domain", "target_domains", "affected_domains"])),
    drafting_status: getNestedField(record, ["proposal_summary.drafting_status", "drafting_status"]),
    external_relevance: getNestedField(record, ["external_relevance_summary.external_relevance", "external_relevance"]),
    patch_type: getNestedField(record, ["change_summary.patch_type", "patch_type"]),
    change_scope: getNestedField(record, ["change_summary.change_scope", "change_scope"]),
    implementation_mode: getNestedField(record, ["change_summary.implementation_mode", "implementation_mode"]),
    verification_status: getNestedField(record, ["verification_summary.verification_status", "verification_status"]),
    changed_domains: arrayFrom(getNestedField(record, ["change_summary.changed_domain", "change_summary.changed_domains", "changed_domain", "changed_domains", "affected_domains"])),
    summaries,
    searchText: "",
  };

  normalized.searchText = [
    normalized.id,
    normalized.title,
    normalized.summary,
    normalized.record_state,
    normalized.record_type,
    normalized.date_recorded,
    normalized.evidence_confidence,
    ...searchSummaryNames.flatMap((name) => normalized.summaries[name]?.flatMap((entry) => [entry.label, entry.value]) ?? []),
  ].filter(isMeaningfulText).join(" ").toLowerCase();

  return normalized;
}

function normalizeRecords(data: unknown): VigilIndexRecord[] {
  const items = Array.isArray(data)
    ? data
    : isObject(data) && Array.isArray(data.records)
      ? data.records
      : isObject(data) && Array.isArray(data.items)
        ? data.items
        : [];

  return items.map((item, index) => normalizeIndexRecord(isObject(item) ? item : { summary: item }, index));
}

function uniqueWithPreferred(values: Array<string | undefined>, preferred: string[] = []) {
  const present = new Set(values.filter(isMeaningfulText));
  return [...preferred.filter((value) => present.has(value)), ...[...present].filter((value) => !preferred.includes(value)).sort()];
}

function valuesForFilter(record: VigilIndexRecord, key: FilterKey): string[] {
  const mapping: Record<FilterKey, string[] | undefined> = {
    recordType: [record.record_type],
    status: [record.record_state],
    evidenceConfidence: record.evidence_confidence ? [record.evidence_confidence] : undefined,
    sourcePlatform: record.source_platform ? [record.source_platform] : undefined,
    sourceType: record.source_types,
    observedVendor: record.observed_vendor ? [record.observed_vendor] : undefined,
    observedProduct: record.observed_product ? [record.observed_product] : undefined,
    interactionMode: record.interaction_modes,
    primaryJurisdiction: record.primary_jurisdictions,
    regulatorySurface: record.regulatory_surfaces,
    sector: record.sectors,
    failureFamily: record.failure_family ? [record.failure_family] : undefined,
    failureSubtype: record.failure_subtype ? [record.failure_subtype] : undefined,
    severity: record.severity ? [record.severity] : undefined,
    likelihood: record.likelihood ? [record.likelihood] : undefined,
    triagePriority: record.triage_priority ? [record.triage_priority] : undefined,
    triageStatus: record.triage_status ? [record.triage_status] : undefined,
    mitigationStatus: record.mitigation_status ? [record.mitigation_status] : undefined,
    proposalType: record.proposal_type ? [record.proposal_type] : undefined,
    targetDomain: record.target_domains,
    draftingStatus: record.drafting_status ? [record.drafting_status] : undefined,
    externalRelevance: record.external_relevance ? [record.external_relevance] : undefined,
    patchType: record.patch_type ? [record.patch_type] : undefined,
    changeScope: record.change_scope ? [record.change_scope] : undefined,
    implementationMode: record.implementation_mode ? [record.implementation_mode] : undefined,
    verificationStatus: record.verification_status ? [record.verification_status] : undefined,
    changedDomain: record.changed_domains,
  };
  return mapping[key] ?? [];
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!isMeaningfulText(value)) return null;

  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function SummaryBlock({ title, entries }: { title: string; entries?: SummaryEntry[] }) {
  if (!entries?.length) return null;

  return (
    <section className="rounded-xl border border-border bg-background/35 p-4">
      <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cam-gold">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map((entry, index) => (
          <Field key={`${entry.label}-${index}`} label={entry.label} value={entry.value} />
        ))}
      </div>
    </section>
  );
}

function sourceRecordUrl(path: string) {
  return `${sourceRecordBaseUrl}${path}`;
}

function exportFileName(status: string) {
  const date = new Date().toISOString().slice(0, 10);
  const statusPart = (status || "all").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  return `vigil-current-view-${statusPart}-${date}.json`;
}

function summaryBlocksFor(record: VigilIndexRecord) {
  if (record.record_type === "observation") {
    return ["source_summary", "system_summary", "jurisdiction_summary"] as const;
  }
  if (record.record_type === "failure_mode") {
    return ["source_summary", "system_summary", "jurisdiction_summary", "classification_summary", "triage_summary"] as const;
  }
  if (record.record_type === "proposal") {
    return ["source_summary", "proposal_summary", "external_relevance_summary", "cam_summary"] as const;
  }
  if (record.record_type === "patch_note") {
    return ["source_summary", "change_summary", "verification_summary", "impact_summary", "cam_summary"] as const;
  }
  return ["source_summary", "system_summary", "jurisdiction_summary", "classification_summary", "triage_summary", "proposal_summary", "change_summary"] as const;
}

function modeForRecordType(recordType: string): "failure" | "proposal" | "patch" | undefined {
  if (recordType === "failure_mode") return "failure";
  if (recordType === "proposal") return "proposal";
  if (recordType === "patch_note") return "patch";
  return undefined;
}

export default function Vigil() {
  const [records, setRecords] = useState<VigilIndexRecord[]>([]);
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    recordType: "",
    status: "open",
    evidenceConfidence: "",
    sourcePlatform: "",
    sourceType: "",
    observedVendor: "",
    observedProduct: "",
    interactionMode: "",
    primaryJurisdiction: "",
    regulatorySurface: "",
    sector: "",
    failureFamily: "",
    failureSubtype: "",
    severity: "",
    likelihood: "",
    triagePriority: "",
    triageStatus: "",
    mitigationStatus: "",
    proposalType: "",
    targetDomain: "",
    draftingStatus: "",
    externalRelevance: "",
    patchType: "",
    changeScope: "",
    implementationMode: "",
    verificationStatus: "",
    changedDomain: "",
  });
  const [search, setSearch] = useState("");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}vigil/VIGIL.Records.Index.json`)
      .then((response) => {
        if (response.status === 404) return [];
        if (!response.ok) throw new Error(`Unable to load VIGIL records (${response.status})`);
        return response.json();
      })
      .then((data) => {
        setRecords(normalizeRecords(data));
        setLoadState("ready");
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
        setRecords([]);
        setLoadState("error");
      });
  }, []);

  const activeMode = modeForRecordType(filters.recordType);
  const visibleFilterConfig = filterConfig.filter((filter) => !filter.mode || filter.mode === activeMode);
  const filterOptions = useMemo(() => {
    return Object.fromEntries(
      filterConfig.map((filter) => {
        const preferred = filter.key === "recordType" ? preferredRecordTypes : filter.key === "status" ? preferredStatuses : [];
        return [filter.key, uniqueWithPreferred(records.flatMap((record) => valuesForFilter(record, filter.key)), preferred)];
      }),
    ) as Record<FilterKey, string[]>;
  }, [records]);

  const filtered = useMemo(
    () => records.filter((record) => {
      const filtersOk = filterConfig.every((filter) => {
        const selected = filters[filter.key];
        if (!selected) return true;
        return valuesForFilter(record, filter.key).includes(selected);
      });
      const searchOk = !search.trim() || record.searchText.includes(search.trim().toLowerCase());
      return filtersOk && searchOk;
    }),
    [filters, records, search],
  );

  function setFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function exportCurrentView() {
    const payload = {
      export_notice: exportNotice,
      exported_at_utc: new Date().toISOString(),
      source: "VIGIL.Records.Index.json",
      filters: { ...filters, search },
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
  }

  return (
    <Shell>
      <div className="container mx-auto max-w-6xl px-6 py-10 md:px-10">
        <div className="mb-6">
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">AI Governance Observatory</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground">VIGIL — Digital Ecosystem Health Register</h1>
          <p className="max-w-4xl text-base leading-relaxed text-muted-foreground">
            VIGIL is CAM’s public AI governance observatory and digital ecosystem health register. It records observations, failure modes, CAM proposals, and implemented CAM patch notes with external-facing source, system, jurisdiction, classification, and routing summaries.
          </p>
        </div>

        <details className="cam-parchment-card mb-6 rounded-2xl p-4 shadow-sm">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">About VIGIL</summary>
          <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
            <p>Observation and Failure Mode records foreground public source, observed system, jurisdiction, and triage context rather than CAM internal routing.</p>
            <p>Proposal and Patch Note records are CAM-specific, so target or changed instruments, domains, annexes, and implementation context may be shown when present.</p>
          </div>
        </details>

        <div className="cam-parchment-card mb-6 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visibleFilterConfig.map((filter) => (
              <label key={filter.key} className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">{filter.label}</span>
                <select
                  aria-label={`Filter by ${filter.label}`}
                  className="w-full rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={filters[filter.key]}
                  onChange={(event) => setFilter(filter.key, event.target.value)}
                >
                  <option value="">{filter.placeholder}</option>
                  {filterOptions[filter.key].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
            ))}
            <input
              aria-label="Search VIGIL records"
              className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, summary, source, system, jurisdiction, classification, triage, proposal, and change summaries"
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">Showing {filtered.length} of {records.length} records</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Exports the filtered index view. Canonical records remain in the VIGIL repository.</p>
            </div>
            <button
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={exportCurrentView}
              disabled={loadState !== "ready" || filtered.length === 0}
            >
              Export current view
            </button>
          </div>
        </div>

        {loadState === "loading" && <div className="cam-parchment-card rounded-2xl p-6 text-base text-muted-foreground shadow-sm">Loading VIGIL records…</div>}

        {loadState === "error" && (
          <div className="cam-parchment-card rounded-2xl p-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-700">Records unavailable</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">VIGIL records could not be loaded from <code>vigil/VIGIL.Records.Index.json</code>. {errorMessage}</p>
          </div>
        )}

        {loadState === "ready" && records.length === 0 && (
          <div className="cam-parchment-card rounded-2xl p-6 text-base text-muted-foreground shadow-sm">No VIGIL records are currently published in <code>vigil/VIGIL.Records.Index.json</code>.</div>
        )}

        <div className="space-y-4">
          {filtered.map((record, index) => (
            <article key={`${record.id}-${index}`} className="cam-parchment-card rounded-2xl p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="font-mono text-sm text-cam-gold">{record.id}</h2>
                  <p className="mt-1 font-serif text-xl text-foreground">{record.title}</p>
                  {record.summary !== record.title && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{record.summary}</p>}
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <span className="rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{record.record_state}</span>
                  <span className="rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{record.record_type}</span>
                </div>
              </div>

              <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Date Recorded" value={record.date_recorded} />
                <Field label="Date Implemented" value={record.record_type === "patch_note" ? record.date_implemented : undefined} />
                <Field label="Evidence Confidence" value={record.record_type === "patch_note" ? undefined : record.evidence_confidence} />
                <Field label="Next Action" value={["observation", "proposal"].includes(record.record_type) ? record.next_action : undefined} />
              </div>

              <div className="space-y-4">
                {summaryBlocksFor(record).map((name) => (
                  <SummaryBlock key={name} title={humanLabel(name)} entries={record.summaries[name]} />
                ))}
              </div>

              <details className="mt-5 rounded-xl border border-border bg-background/40 p-4">
                <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">Full Record / Technical Details</summary>
                {record.record_type === "observation" || record.record_type === "failure_mode" ? (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">CAM internal routing is intentionally below the public source, system, jurisdiction, and triage context for this record class.</p>
                ) : null}
                {(record.record_type === "proposal" || record.record_type === "patch_note") && (
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <Field label="Affected Domains" value={record.affected_domains?.join("; ")} />
                    <Field label="Affected Instruments" value={record.affected_instruments?.join("; ")} />
                    <Field label="Affected Annexes" value={record.affected_annexes?.join("; ")} />
                  </div>
                )}
                <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-card p-3 text-xs leading-relaxed text-muted-foreground">{JSON.stringify(record.raw, null, 2)}</pre>
              </details>

              {record.path && (
                <div className="mt-5 flex flex-col gap-2 rounded-xl border border-border bg-background/40 p-4 md:flex-row md:items-center md:justify-between">
                  <p className="break-words font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">Source record: {record.path}</p>
                  <a className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background/80" href={sourceRecordUrl(record.path)} target="_blank" rel="noreferrer">Open source record →</a>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}
