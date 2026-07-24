import registrySources from "@/config/registrySources.json";

export type UnknownRecord = Record<string, unknown>;

export type RegistryLoadResult = {
  data: unknown;
  attemptedUrl: string;
  loadedFromFallback: boolean;
  message?: string;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type RegistryPointer = {
  key?: string;
  raw_url?: string;
  url?: string;
  registry_index_url?: string;
};

const childRegistryRecordKeys = ["failure_modes", "observations", "proposals", "patch_notes", "records", "items"];

export const VIGIL_REGISTRY_SOURCE = registrySources.vigil;
export const VIGIL_REGISTRY_URL = VIGIL_REGISTRY_SOURCE.registry_index_url;
export const VIGIL_FALLBACK_URL = `${import.meta.env.BASE_URL}data/vigil-registry-fallback.json`;

export function cacheBustUrl(url: string, version = Date.now()) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}

async function fetchJson(fetcher: FetchLike, url: string) {
  const response = await fetcher(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${url} (${response.status})`);
  return response.json() as Promise<unknown>;
}

function isMarkdownUrl(url: string) {
  return new URL(url).pathname.toLowerCase().endsWith(".md");
}

function parseYamlScalar(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed === "null" || trimmed === "~") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\([\\"'])/g, "$1");
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map((item) => parseYamlScalar(item)).filter((item) => item !== undefined);
  }
  return trimmed;
}

function parseResearchMarkdown(source: string): UnknownRecord {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/);
  const hasFrontMatter = lines[0]?.trim() === "---";
  if (!hasFrontMatter) return { _canonical_format: "markdown", _canonical_markdown_body: source };

  const end = lines.findIndex((line, index) => index > 0 && /^(---|\.\.\.)\s*$/.test(line.trim()));
  if (end < 0) return { _canonical_format: "markdown", _canonical_markdown_body: source };

  const metadata: UnknownRecord = {};
  let pendingListKey: string | undefined;
  for (const line of lines.slice(1, end)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && pendingListKey) {
      const existing = Array.isArray(metadata[pendingListKey]) ? metadata[pendingListKey] as unknown[] : [];
      existing.push(parseYamlScalar(listItem[1]));
      metadata[pendingListKey] = existing;
      continue;
    }
    const entry = line.match(/^\s*([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!entry) continue;
    const [, key, rawValue] = entry;
    if (rawValue.trim()) {
      metadata[key] = parseYamlScalar(rawValue);
      pendingListKey = undefined;
    } else {
      metadata[key] = [];
      pendingListKey = key;
    }
  }

  return {
    ...metadata,
    _canonical_format: "markdown",
    _canonical_markdown_body: lines.slice(end + 1).join("\\n").replace(/^\s+|\s+$/g, ""),
  };
}

async function fetchCanonicalDetail(fetcher: FetchLike, url: string): Promise<unknown> {
  const response = await fetcher(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${url} (${response.status})`);
  if (isMarkdownUrl(url)) return parseResearchMarkdown(await response.text());
  return response.json() as Promise<unknown>;
}

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function registryPointerEntries(registries: unknown): RegistryPointer[] {
  if (Array.isArray(registries)) {
    return registries.filter(isObject).map((entry) => entry as RegistryPointer);
  }
  if (!isObject(registries)) return [];

  return Object.entries(registries)
    .filter(([, entry]) => isObject(entry))
    .map(([key, entry]) => ({ key, ...(entry as UnknownRecord) } as RegistryPointer));
}

function recordsFromRegistryPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isObject(payload)) return [];

  for (const key of childRegistryRecordKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function sourceRegistryLabel(pointer: RegistryPointer, fallbackIndex: number) {
  return String(pointer.key ?? pointer["registry_type" as keyof RegistryPointer] ?? pointer.raw_url ?? `registry-${fallbackIndex + 1}`);
}

export async function resolveVigilRegistryRecords(registry: unknown, fetcher: FetchLike = fetch): Promise<UnknownRecord[]> {
  const combinedRecords = recordsFromRegistryPayload(registry);
  if (combinedRecords.length || (isObject(registry) && Array.isArray(registry.records))) {
    return combinedRecords.map((record) => (isObject(record) ? record : { summary: record }));
  }

  if (!isObject(registry)) return [];

  const childRegistries = registryPointerEntries(registry.registries);
  if (!childRegistries.length) return [];

  const childRecordSets = await Promise.all(childRegistries.map(async (pointer, index) => {
    const childUrl = pointer.raw_url ?? pointer.registry_index_url ?? pointer.url;
    if (!childUrl) return [];
    const childPayload = await fetchJson(fetcher, cacheBustUrl(childUrl));
    return recordsFromRegistryPayload(childPayload).map((record) => {
      const normalizedRecord: UnknownRecord = isObject(record) ? { ...record } : { summary: record };
      if (normalizedRecord.source_registry === undefined) normalizedRecord.source_registry = sourceRegistryLabel(pointer, index);
      return normalizedRecord;
    });
  }));

  return childRecordSets.flat();
}

export async function loadVigilRegistry(
  fetcher: FetchLike = fetch,
  liveRegistryUrl = VIGIL_REGISTRY_URL,
  fallbackRegistryUrl = VIGIL_FALLBACK_URL,
): Promise<RegistryLoadResult> {
  const attemptedUrl = cacheBustUrl(liveRegistryUrl);

  try {
    const liveRegistry = await fetchJson(fetcher, attemptedUrl);
    return { data: liveRegistry, attemptedUrl, loadedFromFallback: false };
  } catch (liveError) {
    if (!fallbackRegistryUrl) {
      throw new Error(`VIGIL registry could not be loaded from the live registry source. Attempted ${attemptedUrl}. ${(liveError as Error).message}`);
    }

    try {
      const fallbackRegistry = await fetchJson(fetcher, fallbackRegistryUrl);
      return {
        data: fallbackRegistry,
        attemptedUrl,
        loadedFromFallback: true,
        message: `VIGIL registry could not be loaded from the live registry source. Attempted ${attemptedUrl}. Showing cached fallback registry data.`,
      };
    } catch {
      throw new Error(`VIGIL registry could not be loaded from the live registry source. Attempted ${attemptedUrl}. ${(liveError as Error).message}`);
    }
  }
}

export async function loadVigilRegistryRecords(fetcher: FetchLike = fetch): Promise<RegistryLoadResult & { records: UnknownRecord[] }> {
  const result = await loadVigilRegistry(fetcher);
  const records = await resolveVigilRegistryRecords(result.data, fetcher);
  return { ...result, records };
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
    raw_url: typeof record.raw_url === "string" ? record.raw_url : typeof record.rawUrl === "string" ? record.rawUrl : undefined,
    path: typeof record.path === "string" ? record.path : undefined,
  });

  if (!detailUrl) {
    throw new Error("VIGIL canonical record could not be loaded because the index entry has no usable raw_url or path.");
  }

  try {
    const payload = await fetchCanonicalDetail(fetcher, cacheBustUrl(detailUrl));
    if (!isObject(payload)) {
      throw new Error("canonical record JSON must be a top-level object");
    }
    return payload;
  } catch (error) {
    throw new Error(`VIGIL canonical record could not be loaded from ${detailUrl}. ${(error as Error).message}`);
  }
}
