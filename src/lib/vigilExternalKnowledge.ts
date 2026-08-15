export type ExternalRequirement = {
  requirement_id: string;
  vigil_source_id: string;
  external_source_id: string;
  source_version: string;
  clause_or_control: string;
  requirement_summary: string;
  requirement_posture: string;
  applicable_actor?: string[];
  governance_concepts?: string[];
  interpretation_status?: string;
};

export type CanonicalIdentifier = {
  scheme?: string;
  value?: string;
};

export type ExternalSourceEntry = {
  vigil_source_id: string;
  external_source_id: string;
  source_version: string;
  canonical_identifier?: CanonicalIdentifier;
  title: string;
  issuer?: string;
  jurisdiction?: string;
  source_class?: string;
  source_lifecycle_state?: string;
  publication_date?: string | null;
  effective_date?: string | null;
  official_locator?: string;
};

type Ready<T> = { status: "ready"; data: T; attemptedUrl: string };
type Unavailable = { status: "unavailable"; attemptedUrl: string; message: string };
export type ExternalLoadResult<T> = Ready<T> | Unavailable;

const VIGIL_RAW_ROOT = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil";
export const VIGIL_EXTERNAL_REQUIREMENTS_URL = `${VIGIL_RAW_ROOT}/external_requirements/requirements-index.json`;
export const VIGIL_EXTERNAL_SOURCES_URL = `${VIGIL_RAW_ROOT}/external_sources/ledger.json`;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

async function fetchOptional<T>(url: string, fetcher: FetchLike): Promise<ExternalLoadResult<T>> {
  try {
    const response = await fetcher(`${url}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      return { status: "unavailable", attemptedUrl: url, message: `Canonical VIGIL has not published this projection yet (${response.status}).` };
    }
    return { status: "ready", data: await response.json() as T, attemptedUrl: url };
  } catch (error) {
    return { status: "unavailable", attemptedUrl: url, message: `Canonical VIGIL reference data could not be loaded. ${(error as Error).message}` };
  }
}

export async function loadExternalRequirements(fetcher: FetchLike = fetch): Promise<ExternalLoadResult<ExternalRequirement[]>> {
  const result = await fetchOptional<{ requirements?: ExternalRequirement[] } | ExternalRequirement[]>(VIGIL_EXTERNAL_REQUIREMENTS_URL, fetcher);
  if (result.status !== "ready") return result;
  const payload = result.data;
  const requirements = Array.isArray(payload) ? payload : Array.isArray(payload.requirements) ? payload.requirements : [];
  return { status: "ready", data: requirements, attemptedUrl: result.attemptedUrl };
}

export async function loadExternalSources(fetcher: FetchLike = fetch): Promise<ExternalLoadResult<ExternalSourceEntry[]>> {
  const result = await fetchOptional<{ entries?: ExternalSourceEntry[] } | ExternalSourceEntry[]>(VIGIL_EXTERNAL_SOURCES_URL, fetcher);
  if (result.status !== "ready") return result;
  const payload = result.data;
  const entries = Array.isArray(payload) ? payload : Array.isArray(payload.entries) ? payload.entries : [];
  return { status: "ready", data: entries, attemptedUrl: result.attemptedUrl };
}

export function canonicalIdentifierLabel(source?: ExternalSourceEntry) {
  const scheme = source?.canonical_identifier?.scheme?.trim();
  const value = source?.canonical_identifier?.value?.trim();
  if (scheme && value) return `${scheme} ${value}`;
  return value ?? source?.external_source_id ?? source?.vigil_source_id;
}

export function externalSourceKey(source: Pick<ExternalSourceEntry, "vigil_source_id" | "source_version">) {
  return `${source.vigil_source_id}|${source.source_version}`;
}
