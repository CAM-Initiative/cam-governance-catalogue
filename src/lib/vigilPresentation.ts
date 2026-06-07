import { githubBlobUrlForRecord, rawUrlForRecord, type UnknownRecord } from "@/lib/vigilRegistry";

export type SummaryEntry = { label: string; value: string };

export type VigilIndexRecord = {
  raw: UnknownRecord;
  id: string;
  record_type: string;
  record_state?: string;
  date_recorded?: string;
  date_implemented?: string;
  title: string;
  summary: string;
  platform_label: string;
  type_label: string;
  evidence_confidence?: string;
  source_label?: string;
  source_types?: string[];
  source_summary?: string;
  system_summary?: string;
  linked_records?: string[];
  path?: string;
  github_blob_url?: string;
  raw_url?: string;
  registry_type?: string;
  source_registry?: string;
  affected_platform_label: string;
  source_record_hint?: string;
  next_action?: string;
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

const blankStrings = new Set(["", "[]", "{}"]);
const unspecifiedStrings = new Set(["unknown", "not specified", "unspecified", "n/a", "na", "none", "null", "undefined"]);

const canonicalFailureFamilyLabelMap: Record<string, string> = {
  execution: "Execution Failures",
  arbitration: "Arbitration Failures",
  epistemic: "Epistemic Failures",
  relational: "Relational Failures",
  "security-integrity": "Security & Integrity Failures",
  "state-context": "State & Context Failures",
  "ux-representation": "UX & Representation Failures",
  governance: "Governance Failures",
  "infrastructure-continuity": "Infrastructure & Continuity Failures",
  classification: "Classification Failures",
};

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

export function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isMeaningfulText(value: string | undefined): value is string {
  return Boolean(value && !blankStrings.has(value.trim()));
}

export function humanLabel(key: string) {
  return labelMap[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function textFrom(value: unknown): string | undefined {
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

export function canonicalComparisonKey(value: string | undefined) {
  if (!isMeaningfulText(value)) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/open\s*ai/g, "openai")
    .replace(/chat\s*gpt/g, "chatgpt")
    .replace(/failure\s*mode/g, "failuremode")
    .replace(/patch\s*note/g, "patchnote")
    .replace(/[^a-z0-9]+/g, "");
}

export function titleizeValue(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bAi\b/g, "AI")
    .replace(/\bUx\b/g, "UX")
    .replace(/\bCam\b/g, "CAM")
    .replace(/\bApi\b/g, "API")
    .replace(/\bGpt\b/g, "GPT")
    .replace(/\bChatgpt\b/g, "ChatGPT")
    .replace(/\bOpenai\b/g, "OpenAI")
    .replace(/\bVigil\b/g, "VIGIL");
}

export function normalizeRecordType(input: UnknownRecord | string | undefined): string {
  const candidates = typeof input === "string"
    ? [input]
    : input
      ? [
          getOptionalField(input, ["record_type", "recordType", "type", "category"]),
          getNestedField(input, ["record_identity.record_type", "record_identity.type", "recordIdentity.recordType"]),
          getNestedField(input, ["record_identity.id", "record_identity.record_id", "recordIdentity.id", "recordIdentity.recordId"]),
          getOptionalField(input, ["id", "record_id", "recordId", "ID"]),
          getOptionalField(input, ["path", "filename", "file", "file_name", "fileName"]),
        ]
      : [];

  for (const candidate of candidates.filter(isMeaningfulText)) {
    const normalized = candidate.trim().toLowerCase().replace(/[-\s]+/g, "_");
    if (["obs", "observation", "observations", "emerging_tech_signal"].includes(normalized) || /(^|_)obs(_|$)/.test(normalized)) return "observation";
    if (["fm", "failure_mode", "failure_modes", "failuremode", "failure_mode_observation"].includes(normalized) || /(^|_)fm(_|$)/.test(normalized)) return "failure_mode";
    if (["prop", "proposal", "proposals", "proposal_development_expansion"].includes(normalized) || /(^|_)prop(_|$)/.test(normalized)) return "proposal";
    if (["patch", "patches", "patch_note", "patch_notes", "patchnote", "implemented_patch_note"].includes(normalized) || /(^|_)patch(_|$)/.test(normalized)) return "patch_note";
  }

  const explicit = candidates.find(isMeaningfulText)?.trim().toLowerCase().replace(/[-\s]+/g, "_");
  return explicit || "unclassified";
}

export function normalizeRecordTypeLabel(value: string | undefined) {
  const normalized = normalizeRecordType(value);
  if (normalized === "observation") return "Observations";
  if (normalized === "failure_mode") return "Failure Modes";
  if (normalized === "proposal") return "Proposals";
  if (normalized === "patch_note") return "Patch Notes";
  return value ? titleizeValue(value) : "Unclassified";
}

export function normalizeFailureFamilyLabel(value: string | undefined) {
  if (!isMeaningfulText(value)) return undefined;
  const slug = value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  return canonicalFailureFamilyLabelMap[slug] ?? titleizeValue(value);
}

function isSpecifiedText(value: string | undefined): value is string {
  if (!isMeaningfulText(value)) return false;
  return !unspecifiedStrings.has(value.trim().toLowerCase());
}

export function normalizePlatformLabel(value: string | undefined) {
  if (!isSpecifiedText(value)) return undefined;
  const key = canonicalComparisonKey(value);
  if (key === "openai") return "OpenAI";
  if (key === "tiktok") return "TikTok";
  if (key === "vigil") return "VIGIL";
  return titleizeValue(value);
}

export function normalizeProductLabel(value: string | undefined) {
  if (!isSpecifiedText(value)) return undefined;
  const key = canonicalComparisonKey(value);
  if (key === "chatgptadvancedvoicemode") return "ChatGPT Advanced Voice Mode";
  if (key === "chatgpt") return "ChatGPT";
  return titleizeValue(value);
}

export function normalizeFilterLabel(key: string, value: string | undefined) {
  if (!isMeaningfulText(value)) return undefined;
  if (key === "recordType") return normalizeRecordTypeLabel(value);
  if (key === "failureFamily") return normalizeFailureFamilyLabel(value);
  if (key === "sourcePlatform" || key === "affectedPlatform" || key === "observedVendor") return normalizePlatformLabel(value);
  if (key === "observedProduct") return normalizeProductLabel(value);
  return titleizeValue(value);
}

export function filterComparisonKey(key: string, value: string | undefined) {
  if (!isMeaningfulText(value)) return "";
  if (key === "recordType") return normalizeRecordType(value);
  if (key === "failureFamily") return canonicalComparisonKey(normalizeFailureFamilyLabel(value) ?? value);
  if (key === "sourcePlatform" || key === "affectedPlatform" || key === "observedVendor") return canonicalComparisonKey(normalizePlatformLabel(value) ?? value);
  if (key === "observedProduct") return canonicalComparisonKey(normalizeProductLabel(value) ?? value);
  return canonicalComparisonKey(value);
}

export function getOptionalField(record: UnknownRecord, names: string[]): string | undefined {
  for (const name of names) {
    const value = textFrom(record[name]);
    if (value) return value;
  }
  return undefined;
}

export function getNestedField(record: UnknownRecord, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, part) => {
      if (Array.isArray(current) && /^\d+$/.test(part)) return current[Number(part)];
      return isObject(current) ? current[part] : undefined;
    }, record);
    const text = textFrom(value);
    if (text) return text;
  }
  return undefined;
}

export function arrayFrom(value: unknown): string[] | undefined {
  if (value === null || value === undefined) return undefined;
  const rawValues = Array.isArray(value) ? value : [value];
  const values = rawValues.flatMap((item) => {
    const text = textFrom(item);
    return text ? text.split(/\s*\|\s*|\s*;\s*/) : [];
  }).map((item) => item.trim()).filter(isMeaningfulText);
  return values.length ? [...new Set(values)] : undefined;
}

function recordFileName(path?: string) {
  if (!path) return undefined;
  const segment = path.split(/[\\/]/).filter(Boolean).pop();
  return segment?.replace(/\.json$/i, "");
}

function resolveRecordTitle(record: UnknownRecord, id: string, path?: string, index?: number) {
  return getOptionalField(record, ["title"])
    ?? getNestedField(record, ["record_identity.title", "recordIdentity.title"])
    ?? getOptionalField(record, ["summary"])
    ?? id
    ?? recordFileName(path)
    ?? `VIGIL record ${(index ?? 0) + 1}`;
}

function sourceRecordHint(sourcePlatform?: string, platformLabel?: string) {
  const sourceLabel = normalizePlatformLabel(sourcePlatform);
  if (!sourceLabel) return undefined;
  if (!platformLabel || platformLabel === "Not specified") return sourceLabel;
  return sourceLabel === platformLabel ? sourceLabel : `${sourceLabel} evidence for ${platformLabel}`;
}

function resolvePlatformValue(record: UnknownRecord) {
  return getNestedField(record, [
    "platform_label",
    "affected_platform_label",
    "system_context.platform_or_vendor",
    "platform_or_vendor",
    "observed_system_vendor",
    "observed_vendor",
    "system_vendor",
    "source_records.0.source_platform",
    "source_platform",
    "system_summary.platform_or_vendor",
    "system_summary.product_family",
    "system_summary.product_or_service",
    "source_summary.primary_source_platform",
  ]);
}

function resolveObservedVendor(record: UnknownRecord) {
  return getNestedField(record, [
    "platform_label",
    "affected_platform_label",
    "system_context.platform_or_vendor",
    "platform_or_vendor",
    "observed_system_vendor",
    "observed_vendor",
    "system_vendor",
    "source_records.0.source_platform",
    "source_platform",
    "system_summary.platform_or_vendor",
    "system_summary.product_family",
    "system_summary.product_or_service",
    "system_summary.observed_system_vendor",
  ]);
}

function resolveObservedProduct(record: UnknownRecord) {
  return getNestedField(record, [
    "observed_product",
    "system_context.product_or_service",
    "system_context.specific_model_or_runtime",
    "system_or_product",
    "model_or_product",
    "model_or_algorithm",
    "source_records.0.system_or_product",
    "source_records.0.model_or_algorithm",
    "system_summary.model_or_product",
    "system_summary.product_family",
    "system_summary.product_or_service",
    "system_summary.observed_product_system",
    "system_summary.observed_product",
    "system_summary.observed_product_model",
    "observed_product_system",
  ]);
}

export function recordTypeBadge(recordType: string) {
  if (recordType === "observation") return "OBS";
  if (recordType === "failure_mode") return "FM";
  if (recordType === "proposal") return "PROP";
  if (recordType === "patch_note") return "PATCH";
  if (recordType === "patch") return "PATCH";
  return recordType;
}

export function previewText(text?: string, limit = 180) {
  if (!isMeaningfulText(text)) return undefined;
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

function normalizeStatus(status: string | undefined): string | undefined {
  if (!isSpecifiedText(status)) return undefined;
  if (canonicalComparisonKey(status) === "unclassified") return undefined;
  return status.trim();
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
    { label: "Source Platform", value: getNestedField(record, ["source_platform", "source_summary.primary_source_platform", "primary_source_platform", "source.platform", "source_records.0.source_platform"]) },
    { label: "Source Author / Publisher", value: getNestedField(record, ["source_summary.primary_source_author_or_publisher", "source_author", "source_account", "source.author", "source.account", "author", "account", "publisher"]) },
    { label: "Source Type", value: getNestedField(record, ["source_summary.primary_source_type", "source_type", "source_types", "source.type"]) },
  ].filter((entry): entry is SummaryEntry => isMeaningfulText(entry.value));
}

function systemFallbackEntries(record: UnknownRecord): SummaryEntry[] {
  return [
    { label: "Observed System Vendor", value: getNestedField(record, ["platform_label", "affected_platform_label", "system_context.platform_or_vendor", "platform_or_vendor", "observed_system_vendor", "observed_vendor", "system_vendor", "source_records.0.source_platform", "source_platform", "system_summary.platform_or_vendor", "system_summary.product_family", "system_summary.product_or_service"]) },
    { label: "Observed Product / System", value: getNestedField(record, ["observed_product", "system_context.product_or_service", "system_context.specific_model_or_runtime", "system_or_product", "model_or_product", "model_or_algorithm", "source_records.0.system_or_product", "source_records.0.model_or_algorithm", "system_summary.model_or_product", "system_summary.product_family", "system_summary.product_or_service", "observed_product_system", "observed_system"]) },
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

export function normalizeVigilRecord(record: UnknownRecord, index = 0): VigilIndexRecord {
  const record_type = normalizeRecordType(record);
  const summaries = Object.fromEntries(summaryNames.map((name) => [name, summaryEntries(record[name])])) as Record<string, SummaryEntry[]>;
  addFallbackSummaries(record, summaries);

  const path = getOptionalField(record, ["path", "filename", "file", "file_name", "fileName"]);
  const id = getNestedField(record, ["record_identity.id", "record_identity.record_id", "recordIdentity.id", "recordIdentity.recordId"])
    ?? getOptionalField(record, ["id", "record_id", "recordId", "ID"])
    ?? recordFileName(path)
    ?? `VIGIL-${index + 1}`;
  const source_platform = getNestedField(record, ["source_platform", "source_summary.primary_source_platform", "source_summary.source_platform", "source.platform", "source_records.0.source_platform"]);
  const observed_vendor = resolveObservedVendor(record);
  const observed_product = resolveObservedProduct(record);
  const platform_label = normalizePlatformLabel(resolvePlatformValue(record)) ?? "Not specified";
  const github_blob_url = githubBlobUrlForRecord({ github_blob_url: getOptionalField(record, ["github_blob_url", "githubBlobUrl"]), path }) ?? "";
  const raw_url = rawUrlForRecord({ raw_url: getOptionalField(record, ["raw_url", "rawUrl"]), path }) ?? "";

  const normalized: VigilIndexRecord = {
    raw: record,
    id,
    record_type,
    record_state: normalizeStatus(getOptionalField(record, ["record_state", "status", "state"])),
    date_recorded: getOptionalField(record, ["date_recorded", "dateRecorded", "recorded_date", "recordedDate", "date"]),
    date_implemented: getOptionalField(record, ["date_implemented", "dateImplemented", "implemented_date", "implementedDate"]),
    title: resolveRecordTitle(record, id, path, index),
    summary: getOptionalField(record, ["summary"])
      ?? getNestedField(record, ["proposal_summary.scope_summary"])
      ?? getOptionalField(record, ["failure_mode_definition"])
      ?? "",
    platform_label,
    type_label: recordTypeBadge(record_type),
    affected_domains: arrayFrom(record.affected_domains ?? record.affectedDomains),
    affected_instruments: arrayFrom(record.affected_instruments ?? record.affectedInstruments),
    affected_annexes: arrayFrom(record.affected_annexes ?? record.affectedAnnexes),
    path,
    github_blob_url,
    raw_url,
    registry_type: getOptionalField(record, ["registry_type", "registryType"]),
    source_registry: getOptionalField(record, ["source_registry", "sourceRegistry"]),
    source_summary: textFrom(record.source_summary),
    system_summary: textFrom(record.system_summary),
    linked_records: arrayFrom(record.linked_records ?? record.linkedRecords),
    affected_platform_label: platform_label,
    source_label: source_platform,
    source_record_hint: sourceRecordHint(source_platform, platform_label),
    next_action: getOptionalField(record, ["next_action", "nextAction"]),
    evidence_confidence: getNestedField(record, ["evidence_confidence", "evidenceConfidence", "source_summary.evidence_confidence", "classification_summary.confidence"]),
    source_types: arrayFrom(getNestedField(record, ["source_summary.primary_source_type", "source_summary.source_type", "source_type", "source_types"])),
    source_platform,
    source_author: getNestedField(record, ["source_summary.primary_source_author_or_publisher", "source_summary.source_author", "source_summary.source_account", "source_author", "source_account", "source.author", "source.account", "author", "account", "publisher"]),
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
    target_domains: arrayFrom(getNestedField(record, ["cam_summary.target_domains", "proposal_summary.cam_domains", "proposal_summary.target_domain", "proposal_summary.target_domains", "target_domain", "target_domains"])),
    drafting_status: getNestedField(record, ["cam_summary.drafting_status", "proposal_summary.drafting_status", "drafting_status"]),
    external_relevance: getNestedField(record, ["external_relevance_summary.external_relevance", "jurisdiction_summary.public_interest_relevance", "external_relevance"]),
    patch_type: getNestedField(record, ["change_summary.patch_type", "patch_type"]),
    change_scope: getNestedField(record, ["change_summary.change_scope", "change_scope"]),
    implementation_mode: getNestedField(record, ["change_summary.implementation_mode", "implementation_mode"]),
    verification_status: getNestedField(record, ["verification_summary.verification_status", "verification_status"]),
    changed_domains: arrayFrom(getNestedField(record, ["cam_summary.changed_domains", "change_summary.changed_domain", "change_summary.changed_domains", "changed_domain", "changed_domains"])),
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
    normalized.path,
    normalized.platform_label,
    normalized.source_record_hint,
    normalized.type_label,
    ...searchSummaryNames.flatMap((name) => normalized.summaries[name]?.flatMap((entry) => [entry.label, entry.value]) ?? []),
  ].filter(isMeaningfulText).join(" ").toLowerCase();

  return normalized;
}

export function normalizeRecords(data: unknown): VigilIndexRecord[] {
  const items = Array.isArray(data)
    ? data
    : isObject(data) && Array.isArray(data.records)
      ? data.records
      : isObject(data) && Array.isArray(data.items)
        ? data.items
        : [];

  return items.map((item, index) => normalizeVigilRecord(isObject(item) ? item : { summary: item }, index));
}
