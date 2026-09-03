import { githubBlobUrlForRecord, rawUrlForRecord, type UnknownRecord } from "@/lib/vigilRegistry";
import { deriveIncidentPublicDisplay, type IncidentPublicDisplay } from "@/lib/vigilPublicDisplay";

export type VigilIndexRecord = {
  raw: UnknownRecord;
  id: string;
  record_type: "incident";
  record_state?: string;
  record_version?: string;
  record_last_updated?: string;
  date_recorded?: string;
  title: string;
  summary: string;
  platform_label: string;
  affected_platform_label: string;
  severity?: string;
  path?: string;
  github_blob_url?: string;
  raw_url?: string;
  source_registry?: string;
  publicDisplay: IncidentPublicDisplay;
  searchText: string;
};

const INCIDENT_ID = /^VIGIL-INC-\d{6}$/i;

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function valueAt(record: UnknownRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (Array.isArray(current) && /^\d+$/.test(part)) return current[Number(part)];
    return isObject(current) ? current[part] : undefined;
  }, record);
}

function firstText(record: UnknownRecord, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = valueAt(record, path);
    if (isText(value)) return value.trim();
  }
  return undefined;
}

function collectText(value: unknown, depth = 0): string[] {
  if (depth > 5 || value === undefined || value === null) return [];
  if (isText(value)) return [value.trim()];
  if (Array.isArray(value)) return value.flatMap((item) => collectText(item, depth + 1));
  if (isObject(value)) return Object.values(value).flatMap((item) => collectText(item, depth + 1));
  return [];
}

export function canonicalComparisonKey(value: string | undefined) {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/open\s*ai/g, "openai")
    .replace(/chat\s*gpt/g, "chatgpt")
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

function normalizedPlatform(value?: string) {
  if (!value || ["unknown", "not specified", "not applicable"].includes(value.trim().toLowerCase())) return "Not specified";
  const key = canonicalComparisonKey(value);
  if (key === "openai") return "OpenAI";
  if (key === "tiktok") return "TikTok";
  return titleizeValue(value);
}

export function normalizeVigilRecord(record: UnknownRecord, index = 0): VigilIndexRecord {
  const id = firstText(record, ["id", "record_identity.record_id", "record_identity.id"]);
  if (!id || !INCIDENT_ID.test(id) || record.record_type !== "incident") {
    throw new Error(`VIGIL Incident registry entry ${index + 1} does not contain a canonical Incident ID and record type.`);
  }

  const path = firstText(record, ["path"]);
  const platform = normalizedPlatform(firstText(record, [
    "platform_or_vendor",
    "system_context.platform_or_vendor",
    "affected_platform_label",
    "primary_evidenced_vendors.0",
    "primary_source_platform",
  ]));
  const publicDisplay = deriveIncidentPublicDisplay(record);
  const title = firstText(record, ["title", "record_identity.title"]) ?? id;
  const summary = firstText(record, ["summary"]) ?? "";
  const searchText = collectText({
    id,
    title,
    summary,
    platform,
    severity: record.severity_assessment ?? record.severity,
    taxonomy: record.taxonomy_classification_summary ?? record.taxonomy_classification,
    sources: record.source_records ?? {
      titles: record.primary_source_title,
      platforms: record.source_platforms,
      types: record.source_types,
    },
    system: record.system_context ?? {
      vendor: record.platform_or_vendor,
      product: record.product_or_service,
      runtime: record.specific_model_or_runtime,
    },
    jurisdiction: record.jurisdictional_context ?? {
      primary: record.primary_jurisdiction,
      sector: record.sector,
    },
    public: publicDisplay.searchTokens,
  }).join(" ").toLowerCase();

  return {
    raw: record,
    id,
    record_type: "incident",
    record_state: firstText(record, ["record_state"]),
    record_version: firstText(record, ["record_version", "record_identity.version"]),
    record_last_updated: firstText(record, ["record_last_updated", "record_identity.updated"]),
    date_recorded: firstText(record, ["date_recorded"]),
    title,
    summary,
    platform_label: platform,
    affected_platform_label: platform,
    severity: firstText(record, ["severity_assessment.severity", "severity"]),
    path,
    github_blob_url: githubBlobUrlForRecord({ github_blob_url: firstText(record, ["github_blob_url"]), path }),
    raw_url: rawUrlForRecord({ raw_url: firstText(record, ["raw_url"]), path }),
    source_registry: firstText(record, ["source_registry"]),
    publicDisplay,
    searchText,
  };
}

export function normalizeRecords(data: unknown): VigilIndexRecord[] {
  const items = Array.isArray(data)
    ? data
    : isObject(data) && Array.isArray(data.records)
      ? data.records
      : [];

  return items.flatMap((item, index) => {
    if (!isObject(item)) return [];
    try {
      return [normalizeVigilRecord(item, index)];
    } catch {
      return [];
    }
  });
}
