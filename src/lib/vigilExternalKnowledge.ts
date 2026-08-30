export type CanonicalIdentifier = {
  scheme?: string;
  value?: string;
};

export type ExternalRequirement = {
  requirement_id: string;
  vigil_source_id: string;
  external_source_id: string;
  source_version: string;
  canonical_source_identifier?: CanonicalIdentifier;
  issuer?: string;
  jurisdiction?: string;
  source_class?: string;
  source_lifecycle_state?: string;
  source_role?: string;
  source_access_status?: string;
  clause_or_control: string;
  requirement_summary: string;
  requirement_posture: string;
  expectation_type?: string;
  normative_force?: string;
  alignment_relationship?: string;
  applicable_actor?: string[];
  governance_concepts?: string[];
  interpretation_status?: string;
};

export type ExternalRequirementDetail = ExternalRequirement & {
  identity_key?: string;
  authoritative_locator?: string;
  parent_section_or_group?: string | null;
  source_review_date?: string;
  source_access_notes?: string;
  governed_object?: string[];
  lifecycle_stage?: string[];
  governance_expectation?: string;
  evidence_expectation?: string[];
  timing_or_frequency?: string[];
  required_artefacts?: string[];
  verification_method?: string[];
  applicability_conditions?: string[];
  exceptions_or_qualifications?: string[];
  source_defined_tags?: Array<{ scheme?: string; values?: string[] }>;
  related_external_requirements?: string[];
  review_limitations?: string[];
};

export type ExternalReviewSystem = {
  provider: string;
  platform: string;
  model: string;
};

export type ExternalReviewMethod = {
  access_method: string;
  scope_method: string;
};

export type ExternalReviewEvent = {
  review_event_id: string;
  review_date: string;
  review_system: ExternalReviewSystem;
  ai_role: string;
  generation_mode: string;
  review_method: ExternalReviewMethod;
  review_scope: string;
  source_scope_reference: string;
  limitations_reference: string[];
  human_role: string;
  human_review_status: string;
  human_verification_status: string;
};

export type ExternalSubstantiveReviewProvenance = {
  current_review_event_id: string;
  review_events: ExternalReviewEvent[];
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
  public_summary?: string;
  ai_governance_relevance?: string[];
  applicable_lifecycle_stages?: string[];
  relevance_scope?: string;
  last_substantive_reviewed?: string;
  substantive_review_provenance?: ExternalSubstantiveReviewProvenance;
  notes?: string | null;
  review_state?: string;
  review_eligible?: boolean;
  alignment_state?: string;
};

export type ExternalSourceScopeEntry = {
  vigil_source_id: string;
  external_source_id: string;
  source_version: string;
  canonical_source_identifier?: CanonicalIdentifier;
  source_role?: string;
  source_access_status?: string;
  extraction_status?: string;
  extraction_scope_notes?: string;
  inaccessible_sections?: string[];
  known_unreviewed_sections?: string[];
  next_action?: string;
  maintainer_action_required?: boolean;
  maintainer_action?: string | null;
  review_priority?: string;
  review_priority_rationale?: string;
};

type Ready<T> = { status: "ready"; data: T; attemptedUrl: string };
type Unavailable = { status: "unavailable"; attemptedUrl: string; message: string };
export type ExternalLoadResult<T> = Ready<T> | Unavailable;

const VIGIL_RAW_ROOT = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil";
const VIGIL_EXTERNAL_GOVERNANCE_ROOT = `${VIGIL_RAW_ROOT}/external_governance`;
export const VIGIL_EXTERNAL_REQUIREMENTS_INDEX_URL = `${VIGIL_EXTERNAL_GOVERNANCE_ROOT}/requirements/requirements-index.json`;
export const VIGIL_EXTERNAL_REQUIREMENTS_FULL_URL = `${VIGIL_EXTERNAL_GOVERNANCE_ROOT}/requirements/requirements.json`;
export const VIGIL_EXTERNAL_SOURCE_SCOPE_URL = `${VIGIL_EXTERNAL_GOVERNANCE_ROOT}/requirements/source-scope.json`;
export const VIGIL_EXTERNAL_SOURCE_REGISTRY_URL = `${VIGIL_EXTERNAL_GOVERNANCE_ROOT}/sources/source-registry.json`;
export const VIGIL_EXTERNAL_LEGACY_SOURCES_URL = `${VIGIL_RAW_ROOT}/external_sources/ledger.json`;
// Compatibility exports for callers that previously expected one source URL.
export const VIGIL_EXTERNAL_REQUIREMENTS_URL = VIGIL_EXTERNAL_REQUIREMENTS_INDEX_URL;
export const VIGIL_EXTERNAL_SOURCES_URL = VIGIL_EXTERNAL_SOURCE_REGISTRY_URL;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

async function fetchOptional<T>(url: string, fetcher: FetchLike): Promise<ExternalLoadResult<T>> {
  try {
    const response = await fetcher(`${url}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      return { status: "unavailable", attemptedUrl: url, message: `This dataset is not currently available (${response.status}).` };
    }
    return { status: "ready", data: await response.json() as T, attemptedUrl: url };
  } catch (error) {
    return { status: "unavailable", attemptedUrl: url, message: `The dataset could not be loaded. ${(error as Error).message}` };
  }
}

async function fetchFirstAvailable<T>(urls: string[], fetcher: FetchLike): Promise<ExternalLoadResult<T>> {
  let lastUnavailable: Unavailable | undefined;
  for (const url of urls) {
    const result = await fetchOptional<T>(url, fetcher);
    if (result.status === "ready") return result;
    lastUnavailable = result;
  }
  return lastUnavailable ?? {
    status: "unavailable",
    attemptedUrl: urls[0] ?? "",
    message: "The dataset could not be located.",
  };
}

function unwrapRequirements<T>(payload: { requirements?: T[] } | T[]) {
  return Array.isArray(payload) ? payload : Array.isArray(payload.requirements) ? payload.requirements : [];
}

export async function loadExternalRequirements(fetcher: FetchLike = fetch): Promise<ExternalLoadResult<ExternalRequirement[]>> {
  const result = await fetchOptional<{ requirements?: ExternalRequirement[] } | ExternalRequirement[]>(VIGIL_EXTERNAL_REQUIREMENTS_INDEX_URL, fetcher);
  if (result.status !== "ready") return result;
  return { status: "ready", data: unwrapRequirements(result.data), attemptedUrl: result.attemptedUrl };
}

export async function loadExternalRequirementDetails(fetcher: FetchLike = fetch): Promise<ExternalLoadResult<ExternalRequirementDetail[]>> {
  const result = await fetchOptional<{ requirements?: ExternalRequirementDetail[] } | ExternalRequirementDetail[]>(VIGIL_EXTERNAL_REQUIREMENTS_FULL_URL, fetcher);
  if (result.status !== "ready") return result;
  return { status: "ready", data: unwrapRequirements(result.data), attemptedUrl: result.attemptedUrl };
}

export async function loadExternalSourceScope(fetcher: FetchLike = fetch): Promise<ExternalLoadResult<ExternalSourceScopeEntry[]>> {
  const result = await fetchOptional<{ entries?: ExternalSourceScopeEntry[] } | ExternalSourceScopeEntry[]>(VIGIL_EXTERNAL_SOURCE_SCOPE_URL, fetcher);
  if (result.status !== "ready") return result;
  const payload = result.data;
  const entries = Array.isArray(payload) ? payload : Array.isArray(payload.entries) ? payload.entries : [];
  return { status: "ready", data: entries, attemptedUrl: result.attemptedUrl };
}

export async function loadExternalSources(fetcher: FetchLike = fetch): Promise<ExternalLoadResult<ExternalSourceEntry[]>> {
  const result = await fetchFirstAvailable<{ entries?: ExternalSourceEntry[] } | ExternalSourceEntry[]>(
    [VIGIL_EXTERNAL_SOURCE_REGISTRY_URL, VIGIL_EXTERNAL_LEGACY_SOURCES_URL],
    fetcher,
  );
  if (result.status !== "ready") return result;
  const payload = result.data;
  const rawEntries = Array.isArray(payload) ? payload : Array.isArray(payload.entries) ? payload.entries : [];
  const entries = rawEntries.map((entry) => ({
    ...entry,
    title: entry.title?.trim() || entry.external_source_id || entry.vigil_source_id,
  }));
  return { status: "ready", data: entries, attemptedUrl: result.attemptedUrl };
}

export function canonicalIdentifierLabel(source?: ExternalSourceEntry) {
  const scheme = source?.canonical_identifier?.scheme?.trim();
  const value = source?.canonical_identifier?.value?.trim();
  if (scheme && value) {
    const schemePrefix = scheme.toLowerCase();
    if (value.toLowerCase().startsWith(schemePrefix)) return value;
    return `${scheme} ${value}`;
  }
  return value ?? source?.external_source_id ?? source?.vigil_source_id;
}

export function externalSourceKey(source: Pick<ExternalSourceEntry, "vigil_source_id" | "source_version">) {
  return `${source.vigil_source_id}|${source.source_version}`;
}

function triggerJsonDownload(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * One public action for the one conceptual dataset. The baseline is stored in
 * two machine-readable files because source selection/provenance and clause
 * records are distinct data structures; visitors should not need two buttons
 * to obtain them.
 */
export async function downloadExternalGovernanceDataset(fetcher: FetchLike = fetch) {
  const [sources, clauses] = await Promise.all([
    fetcher(`${VIGIL_EXTERNAL_SOURCE_REGISTRY_URL}?v=${Date.now()}`, { cache: "no-store" }),
    fetcher(`${VIGIL_EXTERNAL_REQUIREMENTS_FULL_URL}?v=${Date.now()}`, { cache: "no-store" }),
  ]);

  if (!sources.ok || !clauses.ok) {
    throw new Error("The complete external-governance dataset is not currently available for download.");
  }

  const [sourcesText, clausesText] = await Promise.all([sources.text(), clauses.text()]);
  triggerJsonDownload("vigil-external-governance-sources.json", sourcesText);
  window.setTimeout(() => triggerJsonDownload("vigil-external-governance-clauses.json", clausesText), 180);
}
