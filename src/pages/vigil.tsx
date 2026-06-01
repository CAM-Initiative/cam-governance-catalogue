import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Shell } from "@/components/layout/Shell";

const VIGIL_PAGE_SIZE = 20;

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

type FilterOption = { value: string; label: string };

type VigilIndexRecord = {
  raw: UnknownRecord;
  id: string;
  title: string;
  summary: string;
  record_type: string;
  record_state?: string;
  date_recorded?: string;
  date_implemented?: string;
  evidence_confidence?: string;
  path?: string;
  affected_platform_label: string;
  source_record_hint?: string;
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

const derivedFilterFieldSources: Record<FilterKey | string, string[]> = {
  recordType: ["record_type", "record_identity.record_type", "id/path fallback"],
  status: ["record_state"],
  evidenceConfidence: ["evidence_confidence", "source_summary.evidence_confidence", "classification_summary.confidence"],
  sourcePlatform: ["source_summary.primary_source_platform"],
  sourceType: ["source_summary.primary_source_type"],
  sourceAuthor: ["source_summary.primary_source_author_or_publisher"],
  observedSystemType: ["system_summary.system_type"],
  observedVendor: ["system_summary.platform_or_vendor"],
  observedProduct: ["system_summary.model_or_product"],
  interactionMode: ["system_summary.interaction_mode"],
  embodimentStatus: ["system_summary.embodiment_status"],
  primaryJurisdiction: ["jurisdiction_summary.primary_jurisdiction"],
  regulatorySurface: ["jurisdiction_summary.regulatory_surface"],
  sector: ["jurisdiction_summary.sector"],
  crossBorderRelevance: ["jurisdiction_summary.cross_border_relevance"],
  publicInterestRelevance: ["jurisdiction_summary.public_interest_relevance"],
  failureFamily: ["classification_summary.failure_family"],
  failureSubtype: ["classification_summary.failure_subtype"],
  severity: ["classification_summary.severity"],
  likelihood: ["classification_summary.likelihood"],
  classificationConfidence: ["classification_summary.confidence"],
  triagePriority: ["triage_summary.triage_priority"],
  triageStatus: ["triage_summary.triage_status"],
  mitigationStatus: ["triage_summary.mitigation_status"],
  proposalType: ["proposal_summary.proposal_type"],
  proposalCamDomains: ["proposal_summary.cam_domains"],
  proposalRegistryComponents: ["proposal_summary.registry_components"],
  proposalInterfaceComponents: ["proposal_summary.interface_components"],
  targetDomain: ["cam_summary.target_domains"],
  draftingStatus: ["cam_summary.drafting_status", "proposal_summary.drafting_status"],
  externalRelevance: ["external_relevance_summary.external_relevance", "jurisdiction_summary.public_interest_relevance"],
  patchType: ["change_summary.patch_type"],
  changeScope: ["change_summary.change_scope"],
  implementationMode: ["change_summary.implementation_mode"],
  verificationStatus: ["verification_summary.verification_status"],
  changedDomain: ["cam_summary.changed_domains"],
};

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
const unspecifiedStrings = new Set(["unknown", "not specified", "unspecified", "n/a", "na", "none", "null", "undefined"]);

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


function canonicalComparisonKey(value: string | undefined) {
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

function titleizeValue(value: string) {
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

function normalizeRecordTypeLabel(value: string | undefined) {
  const normalized = normalizeRecordType(value);
  if (normalized === "observation") return "Observation";
  if (normalized === "failure_mode") return "Failure Mode";
  if (normalized === "proposal") return "Proposal";
  if (normalized === "patch_note") return "Patch Note";
  return value ? titleizeValue(value) : "Unclassified";
}

function normalizeFailureFamilyLabel(value: string | undefined) {
  if (!isMeaningfulText(value)) return undefined;
  const slug = value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  return canonicalFailureFamilyLabelMap[slug] ?? titleizeValue(value);
}

function isSpecifiedText(value: string | undefined): value is string {
  if (!isMeaningfulText(value)) return false;
  return !unspecifiedStrings.has(value.trim().toLowerCase());
}

function normalizePlatformLabel(value: string | undefined) {
  if (!isSpecifiedText(value)) return undefined;
  const key = canonicalComparisonKey(value);
  if (key === "openai") return "OpenAI";
  if (key === "tiktok") return "TikTok";
  if (key === "vigil") return "VIGIL";
  return titleizeValue(value);
}

function normalizeProductLabel(value: string | undefined) {
  if (!isSpecifiedText(value)) return undefined;
  const key = canonicalComparisonKey(value);
  if (key === "chatgptadvancedvoicemode") return "ChatGPT Advanced Voice Mode";
  if (key === "chatgpt") return "ChatGPT";
  return titleizeValue(value);
}

function normalizeFilterLabel(key: FilterKey, value: string | undefined) {
  if (!isMeaningfulText(value)) return undefined;
  if (key === "recordType") return normalizeRecordTypeLabel(value);
  if (key === "failureFamily") return normalizeFailureFamilyLabel(value);
  if (key === "sourcePlatform" || key === "observedVendor") return normalizePlatformLabel(value);
  if (key === "observedProduct") return normalizeProductLabel(value);
  return titleizeValue(value);
}

function filterComparisonKey(key: FilterKey, value: string | undefined) {
  if (!isMeaningfulText(value)) return "";
  if (key === "recordType") return normalizeRecordType(value);
  if (key === "failureFamily") return canonicalComparisonKey(normalizeFailureFamilyLabel(value) ?? value);
  if (key === "sourcePlatform" || key === "observedVendor") return canonicalComparisonKey(normalizePlatformLabel(value) ?? value);
  if (key === "observedProduct") return canonicalComparisonKey(normalizeProductLabel(value) ?? value);
  return canonicalComparisonKey(value);
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

function recordFileName(path?: string) {
  if (!path) return undefined;
  const segment = path.split(/[\\/]/).filter(Boolean).pop();
  return segment?.replace(/\.json$/i, "");
}

function normalizeRecordType(input: UnknownRecord | string | undefined): string {
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
    if (["obs", "observation", "emerging_tech_signal"].includes(normalized) || /(^|_)obs(_|$)/.test(normalized)) return "observation";
    if (["fm", "failure_mode", "failuremode", "failure_mode_observation"].includes(normalized) || /(^|_)fm(_|$)/.test(normalized)) return "failure_mode";
    if (["prop", "proposal", "proposal_development_expansion"].includes(normalized) || /(^|_)prop(_|$)/.test(normalized)) return "proposal";
    if (["patch", "patch_note", "patchnote", "implemented_patch_note"].includes(normalized) || /(^|_)patch(_|$)/.test(normalized)) return "patch_note";
  }

  const explicit = candidates.find(isMeaningfulText)?.trim().toLowerCase().replace(/[-\s]+/g, "_");
  return explicit || "unclassified";
}

function resolveRecordTitle(record: UnknownRecord, id: string, path?: string, index?: number) {
  return getNestedField(record, ["record_identity.title", "recordIdentity.title"])
    ?? getOptionalField(record, ["title", "name"])
    ?? id
    ?? recordFileName(path)
    ?? `VIGIL record ${(index ?? 0) + 1}`;
}

function sourceRecordHint(sourcePlatform?: string, observedVendor?: string, observedProduct?: string) {
  const sourceLabel = normalizePlatformLabel(sourcePlatform);
  const affectedLabel = affectedPlatformLabel(observedVendor, observedProduct);
  if (!sourceLabel) return undefined;
  if (affectedLabel === "Affected platform not specified") return sourceLabel;
  return sourceLabel === affectedLabel ? sourceLabel : `${sourceLabel} evidence for ${affectedLabel}`;
}

function affectedPlatformLabel(observedVendor?: string, observedProduct?: string) {
  return normalizePlatformLabel(observedVendor)
    ?? normalizeProductLabel(observedProduct)
    ?? "Affected platform not specified";
}

function recordTypeBadge(recordType: string) {
  if (recordType === "observation") return "OBS";
  if (recordType === "failure_mode") return "FM";
  if (recordType === "proposal") return "PROP";
  if (recordType === "patch_note") return "PATCH";
  return recordType;
}

function previewText(text?: string, limit = 180) {
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
    { label: "Source Platform", value: getNestedField(record, ["source_summary.primary_source_platform", "primary_source_platform", "source_platform", "source.platform"]) },
    { label: "Source Author / Publisher", value: getNestedField(record, ["source_summary.primary_source_author_or_publisher", "source_author", "source_account", "source.author", "source.account", "author", "account", "publisher"]) },
    { label: "Source Type", value: getNestedField(record, ["source_summary.primary_source_type", "source_type", "source_types", "source.type"]) },
  ].filter((entry): entry is SummaryEntry => isMeaningfulText(entry.value));
}

function systemFallbackEntries(record: UnknownRecord): SummaryEntry[] {
  return [
    { label: "Observed System Vendor", value: getNestedField(record, ["system_summary.platform_or_vendor", "platform_or_vendor", "observed_system_vendor", "observed_vendor", "system_vendor"]) },
    { label: "Observed Product / System", value: getNestedField(record, ["system_summary.model_or_product", "model_or_product", "observed_product_system", "observed_product", "observed_system", "system_or_product"]) },
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
  const record_type = normalizeRecordType(record);
  const summaries = Object.fromEntries(summaryNames.map((name) => [name, summaryEntries(record[name])])) as Record<string, SummaryEntry[]>;
  addFallbackSummaries(record, summaries);

  const path = getOptionalField(record, ["path", "filename", "file", "file_name", "fileName"]);
  const id = getNestedField(record, ["record_identity.id", "record_identity.record_id", "recordIdentity.id", "recordIdentity.recordId"])
    ?? getOptionalField(record, ["id", "record_id", "recordId", "ID"])
    ?? recordFileName(path)
    ?? `VIGIL-${index + 1}`;
  const source_platform = getNestedField(record, ["source_summary.primary_source_platform", "source_summary.source_platform", "source_platform", "source.platform"]);
  const observed_vendor = getNestedField(record, ["system_summary.platform_or_vendor", "system_summary.observed_system_vendor", "observed_system_vendor", "observed_vendor", "system_vendor"]);
  const observed_product = getNestedField(record, ["system_summary.model_or_product", "system_summary.observed_product_system", "system_summary.observed_product", "system_summary.observed_product_model", "observed_product_system", "observed_product", "system_or_product", "model_or_algorithm"]);

  const normalized: VigilIndexRecord = {
    raw: record,
    id,
    title: resolveRecordTitle(record, id, path, index),
    summary: getOptionalField(record, ["summary", "description", "observation", "signal"]) ?? "Summary not provided.",
    record_type,
    record_state: normalizeStatus(getOptionalField(record, ["record_state", "status", "state"])),
    date_recorded: getOptionalField(record, ["date_recorded", "dateRecorded", "recorded_date", "recordedDate", "date"]),
    date_implemented: getOptionalField(record, ["date_implemented", "dateImplemented", "implemented_date", "implementedDate"]),
    affected_domains: arrayFrom(record.affected_domains ?? record.affectedDomains),
    affected_instruments: arrayFrom(record.affected_instruments ?? record.affectedInstruments),
    affected_annexes: arrayFrom(record.affected_annexes ?? record.affectedAnnexes),
    path,
    affected_platform_label: affectedPlatformLabel(observed_vendor, observed_product),
    source_record_hint: sourceRecordHint(source_platform, observed_vendor, observed_product),
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
    normalized.affected_platform_label,
    normalized.source_record_hint,
    recordTypeBadge(normalized.record_type),
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
        const preferred = ["Observation", "Failure Mode", "Proposal", "Patch Note"];
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

function debugFilterOptionCounts(records: VigilIndexRecord[], filterOptions: Record<FilterKey, FilterOption[]>) {
  if (!import.meta.env.DEV) return;
  const rows = Object.entries(derivedFilterFieldSources).map(([key, fields]) => {
    const filterKey = key as FilterKey;
    const optionCount = filterKey in filterOptions
      ? filterOptions[filterKey]?.length ?? 0
      : new Set(
          records
            .flatMap((record) => fields.flatMap((field) => arrayFrom(getNestedField(record.raw, [field])) ?? []))
            .filter(isMeaningfulText)
            .map(canonicalComparisonKey),
        ).size;
    return { filter_or_field: key, option_count: optionCount, generated_from: fields.join(", ") };
  });
  console.table(rows);
}

function valuesForFilter(record: VigilIndexRecord, key: FilterKey): string[] {
  const mapping: Record<FilterKey, string[] | undefined> = {
    recordType: [record.record_type],
    status: record.record_state ? [record.record_state] : undefined,
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
  const normalized = normalizeRecordType(recordType);
  if (normalized === "failure_mode") return "failure";
  if (normalized === "proposal") return "proposal";
  if (normalized === "patch_note") return "patch";
  return undefined;
}

export default function Vigil() {
  const [records, setRecords] = useState<VigilIndexRecord[]>([]);
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    recordType: "",
    status: "",
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
  const [recordPage, setRecordPage] = useState(1);
  const [expandedRecordKeys, setExpandedRecordKeys] = useState<Set<string>>(() => new Set());

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
  const filterOptions = useMemo(() => getFilterOptionsFromRecords(records), [records]);
  useEffect(() => debugFilterOptionCounts(records, filterOptions), [filterOptions, records]);
  const visibleFilterConfig = filterConfig.filter((filter) => !filter.mode || filter.mode === activeMode || (!filters.recordType && filterOptions[filter.key].length > 0));

  const filtered = useMemo(
    () => records.filter((record) => {
      const filtersOk = filterConfig.every((filter) => {
        const selected = filters[filter.key];
        if (!selected) return true;
        const selectedKey = filterComparisonKey(filter.key, selected);
        return valuesForFilter(record, filter.key).some((value) => filterComparisonKey(filter.key, value) === selectedKey);
      });
      const searchOk = !search.trim() || record.searchText.includes(search.trim().toLowerCase());
      return filtersOk && searchOk;
    }),
    [filters, records, search],
  );

  useEffect(() => {
    setRecordPage(1);
  }, [filters, search]);

  const recordPageCount = Math.max(1, Math.ceil(filtered.length / VIGIL_PAGE_SIZE));
  const currentRecordPage = Math.min(recordPage, recordPageCount);
  const recordPageStart = (currentRecordPage - 1) * VIGIL_PAGE_SIZE;
  const pagedRecords = filtered.slice(recordPageStart, recordPageStart + VIGIL_PAGE_SIZE);
  const visibleRecordStart = filtered.length === 0 ? 0 : recordPageStart + 1;
  const visibleRecordEnd = Math.min(recordPageStart + VIGIL_PAGE_SIZE, filtered.length);

  function setFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleExpandedRecord(recordKey: string) {
    setExpandedRecordKeys((current) => {
      const next = new Set(current);
      if (next.has(recordKey)) {
        next.delete(recordKey);
      } else {
        next.add(recordKey);
      }
      return next;
    });
  }

  function handleRecordRowKeyDown(event: KeyboardEvent<HTMLDivElement>, recordKey: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleExpandedRecord(recordKey);
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
      <div className="container mx-auto max-w-7xl px-5 py-8 md:px-8 lg:px-10">
        <div className="mb-5">
          <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">AI Governance Observatory</p>
          <h1 className="mb-3 font-serif text-3xl text-foreground md:text-4xl">VIGIL — Digital Ecosystem Health Register</h1>
          <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground md:text-base">
            VIGIL records observations, failure modes, CAM proposals, and implemented patch notes with public-facing source, system, jurisdiction, classification, and routing summaries.
          </p>
        </div>

        <details className="cam-parchment-card mb-5 rounded-xl p-3 text-sm shadow-sm">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] text-cam-gold">About VIGIL</summary>
          <div className="mt-3 space-y-2 leading-relaxed text-muted-foreground">
            <p>VIGIL is CAM’s public observatory for recording AI governance signals, runtime failures, implementation gaps, proposals, and corrective patches.</p>
            <p>It helps translate scattered incidents, field observations, platform behaviours, model failures, and governance proposals into structured records that can be reviewed, filtered, cited, and connected back to the CAM framework.</p>
            <p>Observation and Failure Mode records focus on what was seen: the public source, affected system, jurisdictional context, observed behaviour, and triage relevance.</p>
            <p>Proposal and Patch Note records focus on what should change: the affected CAM domain, target instrument, implementation context, and governance rationale.</p>
            <p>Together, VIGIL acts as a bridge between lived runtime evidence and formal governance maintenance.</p>
          </div>
        </details>

        <div className="grid gap-5 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:items-start">
          <aside className="cam-parchment-card rounded-xl p-3 shadow-sm lg:sticky lg:top-20">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cam-gold">Filters</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Derived from loaded VIGIL register fields.</p>
              </div>
              <button
                className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground"
                type="button"
                onClick={() => setFilters((current) => Object.fromEntries(Object.keys(current).map((key) => [key, ""])) as Record<FilterKey, string>)}
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {visibleFilterConfig.map((filter) => (
                <label key={filter.key} className="block">
                  <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/60">{filter.label}</span>
                  <select
                    aria-label={`Filter by ${filter.label}`}
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          </aside>

          <section className="min-w-0 space-y-4" data-result-range-example="Showing 1–20">
            <div className="cam-parchment-card rounded-xl p-3 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <input
                  aria-label="Search VIGIL records"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search VIGIL records"
                />
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <button
                    className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    onClick={exportCurrentView}
                    disabled={loadState !== "ready" || filtered.length === 0}
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>

            {loadState === "loading" && <div className="cam-parchment-card rounded-xl p-5 text-sm text-muted-foreground shadow-sm">Loading VIGIL records…</div>}

            {loadState === "error" && (
              <div className="cam-parchment-card rounded-xl p-5 shadow-sm">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-700">Records unavailable</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">VIGIL records could not be loaded from <code>vigil/VIGIL.Records.Index.json</code>. {errorMessage}</p>
              </div>
            )}

            {loadState === "ready" && records.length === 0 && (
              <div className="cam-parchment-card rounded-xl p-5 text-sm text-muted-foreground shadow-sm">No VIGIL records are currently published in <code>vigil/VIGIL.Records.Index.json</code>.</div>
            )}

            {loadState === "ready" && filtered.length > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-3 shadow-sm md:flex-row md:items-center md:justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70" aria-live="polite">
                  Showing {visibleRecordStart}–{visibleRecordEnd} of {filtered.length} VIGIL records.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setRecordPage((page) => Math.max(1, page - 1))}
                    disabled={currentRecordPage === 1}
                    aria-label="Show previous VIGIL records page"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">Page {currentRecordPage} of {recordPageCount}</span>
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setRecordPage((page) => Math.min(recordPageCount, page + 1))}
                    disabled={currentRecordPage === recordPageCount}
                    aria-label="Show next VIGIL records page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {loadState === "ready" && filtered.length > 0 && (
              <p className="font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground/75">Click any row to expand record details.</p>
            )}

            <div className="space-y-2">
              {loadState === "ready" && filtered.length > 0 && (
                <div className="grid gap-2 rounded-lg border border-border bg-card/45 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 md:grid-cols-[7.5rem_10rem_5.5rem_minmax(0,1fr)_5.5rem] md:px-4">
                  <div>Date</div>
                  <div>Platform</div>
                  <div>Type</div>
                  <div>Title</div>
                  <div className="md:text-right">Source</div>
                </div>
              )}

              {pagedRecords.map((record, index) => {
                const recordDate = record.date_recorded ?? record.date_implemented ?? "Date not specified";
                const sourceHref = record.path ? sourceRecordUrl(record.path) : undefined;
                const recordKey = `${record.id}-${record.path ?? index}`;
                const detailsPanelId = `vigil-record-details-${recordKey.replace(/[^A-Za-z0-9_-]/g, "-")}`;
                const isExpanded = expandedRecordKeys.has(recordKey);

                return (
                <article key={recordKey} className="group cam-parchment-card rounded-xl shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[hsl(36_48%_96%)] focus-within:ring-2 focus-within:ring-primary/20">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={detailsPanelId}
                    className="cursor-pointer px-3 py-2.5 text-sm transition md:px-4"
                    onClick={() => toggleExpandedRecord(recordKey)}
                    onKeyDown={(event) => handleRecordRowKeyDown(event, recordKey)}
                  >
                    <div className="grid gap-2 font-sans md:grid-cols-[7.5rem_10rem_5.5rem_minmax(0,1fr)_5.5rem] md:items-center">
                      <div className="font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground/75">{recordDate}</div>
                      <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(32_55%_27%)]">{record.affected_platform_label}</div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground/75">{recordTypeBadge(record.record_type)}</div>
                      <h2 className="min-w-0 whitespace-normal break-words font-sans text-sm font-semibold leading-snug text-foreground md:text-[15px]">{record.title}</h2>
                      <div className="flex items-center md:justify-end">
                        {sourceHref ? (
                          <a className="rounded-md border border-border bg-background/50 px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.12em] text-[hsl(32_55%_27%)] transition-colors hover:border-primary/30 hover:bg-card hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/25" href={sourceHref} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>Source ↗</a>
                        ) : (
                          <span className="font-sans text-[10px] text-muted-foreground/40" aria-hidden="true">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                  <div id={detailsPanelId} className="border-t border-border px-3 py-4">
                    <div className="mb-4">
                      <h2 className="font-mono text-xs text-cam-gold">{record.id}</h2>
                      <p className="mt-1 font-serif text-xl text-foreground">{record.title}</p>
                      {previewText(record.summary) && record.summary !== record.title && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{record.summary}</p>}
                    </div>

                    <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="Record Type" value={record.record_type} />
                      <Field label="Record State" value={record.record_state} />
                      <Field label="Date Recorded" value={record.date_recorded} />
                      <Field label="Date Implemented" value={record.record_type === "patch_note" ? record.date_implemented : undefined} />
                      <Field label="Evidence Confidence" value={record.record_type === "patch_note" ? undefined : record.evidence_confidence} />
                      <Field label="Next Action" value={["observation", "proposal"].includes(record.record_type) ? record.next_action : undefined} />
                      <Field label="Affected Platform" value={record.affected_platform_label} />
                      <Field label="Source Platform" value={record.source_platform} />
                      <Field label="Source Type" value={record.source_types?.join("; ")} />
                      <Field label="Source Context" value={record.source_record_hint} />
                      <Field label="Observed System Vendor" value={record.observed_vendor} />
                      <Field label="Observed Model / Product" value={record.observed_product} />
                    </div>

                    <div className="space-y-3">
                      {summaryBlocksFor(record).map((name) => (
                        <SummaryBlock key={name} title={humanLabel(name)} entries={record.summaries[name]} />
                      ))}
                    </div>

                    <details className="mt-4 rounded-lg border border-border bg-background/35 p-3">
                      <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Technical JSON record</summary>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Human-readable fields above are the primary detail view. This raw JSON is retained for technical inspection; export remains available for downloads.</p>
                      {(record.record_type === "proposal" || record.record_type === "patch_note") && (
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <Field label="Affected Domains" value={record.affected_domains?.join("; ")} />
                          <Field label="Affected Instruments" value={record.affected_instruments?.join("; ")} />
                          <Field label="Affected Annexes" value={record.affected_annexes?.join("; ")} />
                        </div>
                      )}
                      <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-card/70 p-3 text-xs leading-relaxed text-muted-foreground">{JSON.stringify(record.raw, null, 2)}</pre>
                    </details>

                    {record.path && (
                      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3 md:flex-row md:items-center md:justify-between">
                        <p className="break-words font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Source record: {record.path}</p>
                        <a className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background/80" href={sourceRecordUrl(record.path)} target="_blank" rel="noreferrer">Open source record →</a>
                      </div>
                    )}
                  </div>
                  )}
                </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}
