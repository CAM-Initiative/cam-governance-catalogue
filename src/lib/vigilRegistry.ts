import registrySources from "@/config/registrySources.json";

export type UnknownRecord = Record<string, unknown>;

export type RegistryLoadResult = {
  data: unknown;
  attemptedUrl: string;
  loadedFromFallback: boolean;
  message?: string;
  records: UnknownRecord[];
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const VIGIL_REGISTRY_SOURCE = registrySources.vigil;
export const VIGIL_INCIDENT_REGISTRY_URL = VIGIL_REGISTRY_SOURCE.incident_registry_index_url;
export const VIGIL_FALLBACK_URL = `${import.meta.env.BASE_URL}data/vigil-registry-fallback.json`;

export function cacheBustUrl(url: string, version = Date.now()) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function fetchJson(fetcher: FetchLike, url: string) {
  const response = await fetcher(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${url} (${response.status})`);
  return response.json() as Promise<unknown>;
}

function incidentRecords(payload: unknown): UnknownRecord[] {
  if (!isObject(payload) || !Array.isArray(payload.records)) return [];
  return payload.records.flatMap((record) => {
    if (!isObject(record) || record.record_type !== "incident") return [];
    return [record];
  });
}

export async function loadVigilIncidentRecords(
  fetcher: FetchLike = fetch,
  liveRegistryUrl = VIGIL_INCIDENT_REGISTRY_URL,
  fallbackRegistryUrl = VIGIL_FALLBACK_URL,
): Promise<RegistryLoadResult> {
  const attemptedUrl = cacheBustUrl(liveRegistryUrl);

  try {
    const data = await fetchJson(fetcher, attemptedUrl);
    const records = incidentRecords(data);
    if (!records.length) throw new Error("Incident registry contains no canonical Incident records");
    return { data, attemptedUrl, loadedFromFallback: false, records };
  } catch (liveError) {
    if (!fallbackRegistryUrl) {
      throw new Error(`VIGIL Incident registry could not be loaded from ${attemptedUrl}. ${(liveError as Error).message}`);
    }
    try {
      const data = await fetchJson(fetcher, fallbackRegistryUrl);
      const records = incidentRecords(data);
      if (!records.length) throw new Error("fallback contains no canonical Incident records");
      return {
        data,
        attemptedUrl,
        loadedFromFallback: true,
        records,
        message: `VIGIL Incident registry could not be loaded from ${attemptedUrl}. Showing cached Incident data.`,
      };
    } catch {
      throw new Error(`VIGIL Incident registry could not be loaded from ${attemptedUrl}. ${(liveError as Error).message}`);
    }
  }
}

export function githubBlobUrlForRecord(record: { github_blob_url?: string; path?: string }) {
  if (record.github_blob_url) return record.github_blob_url;
  if (!record.path) return undefined;
  return `https://github.com/${VIGIL_REGISTRY_SOURCE.repo}/blob/${VIGIL_REGISTRY_SOURCE.branch}/${record.path}`;
}

export function rawUrlForRecord(record: { raw_url?: string; path?: string }) {
  if (record.raw_url) return record.raw_url;
  if (!record.path) return undefined;
  return `https://raw.githubusercontent.com/${VIGIL_REGISTRY_SOURCE.repo}/${VIGIL_REGISTRY_SOURCE.branch}/${record.path}`;
}

export async function loadVigilRecordDetail(
  record: UnknownRecord,
  fetcher: FetchLike = fetch,
): Promise<UnknownRecord> {
  const detailUrl = rawUrlForRecord({
    raw_url: typeof record.raw_url === "string" ? record.raw_url : undefined,
    path: typeof record.path === "string" ? record.path : undefined,
  });
  if (!detailUrl) throw new Error("VIGIL Incident could not be loaded because its index entry has no usable raw_url or path.");

  try {
    const payload = await fetchJson(fetcher, cacheBustUrl(detailUrl));
    if (!isObject(payload) || payload.record_type !== "incident") {
      throw new Error("canonical detail must be an Incident JSON object");
    }
    return payload;
  } catch (error) {
    throw new Error(`VIGIL Incident could not be loaded from ${detailUrl}. ${(error as Error).message}`);
  }
}
