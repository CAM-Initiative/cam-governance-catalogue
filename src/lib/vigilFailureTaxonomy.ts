export type FailureTaxonomyIndexFamily = {
  family_id: string;
  family_code: string;
  name: string;
  version: string;
  status: string;
  file: string;
  class_count: number;
};

export type FailureTaxonomyIndex = {
  schema_version: string;
  standard: {
    name: string;
    version: string;
    publication_date?: string | null;
    status: string;
  };
  families: FailureTaxonomyIndexFamily[];
  removed_ids?: string[];
};

export type FailureTaxonomyRelationship = {
  type: string;
  target_id: string;
  note?: string;
};

export type FailureTaxonomyRecognition = {
  required_conditions?: string[];
};

export type FailureTaxonomyExternalReference = {
  title: string;
  publisher: string;
  date?: string;
  url?: string;
  reference_role?: string;
  evidence_note?: string;
};

export type FailureTaxonomyInvariantExemplar = {
  exemplar_type: string;
  exemplar_status?: string;
  linked_incident_id: string;
  title: string;
  evidence_basis?: string;
  invariant_demonstrated?: string;
  success_basis?: string;
  boundary_conditions?: string[];
  provenance_note?: string;
};

export type FailureTaxonomyCaseFileExample = {
  classification_basis?: string;
  classification_confidence?: string;
  classification_role?: string;
  incident_id: string;
  incident_title: string;
};

export type FailureTaxonomyCaseFileExamples = {
  classes: Record<string, FailureTaxonomyCaseFileExample[]>;
  generated_from?: string;
  generated_notice?: string;
};

export type FailureTaxonomySubtype = {
  name: string;
  plain_english?: string;
  definition?: string;
  recognition?: FailureTaxonomyRecognition;
  exclusions?: string[];
  examples?: string[];
  aliases?: string[];
  historical_class_id?: string;
  historical_class_code?: string;
};

export type FailureTaxonomyClass = {
  class_id: string;
  class_code: string;
  family_id: string;
  name: string;
  status: string;
  abstraction: string;
  plain_english: string;
  definition: string;
  invariant?: string;
  recognition?: FailureTaxonomyRecognition;
  exclusions?: string[];
  examples?: string[];
  relationships?: FailureTaxonomyRelationship[];
  aliases?: string[];
  subtypes?: FailureTaxonomySubtype[];
  external_references?: FailureTaxonomyExternalReference[];
  invariant_exemplars?: FailureTaxonomyInvariantExemplar[];
};

export type FailureTaxonomyFamily = {
  family_id: string;
  family_code: string;
  name: string;
  status: string;
  abstraction: string;
  version: string;
  plain_english: string;
  definition: string;
  invariant: string;
  scope?: string[];
  inclusion_rule: string;
  exclusion_rule: string;
  aliases?: string[];
  allowed_class_ids?: string[];
  allowed_class_codes?: string[];
};

export type FailureTaxonomyFamilyDocument = {
  schema_version: string;
  standard: {
    name: string;
    version: string;
    status: string;
    description?: string;
  };
  family: FailureTaxonomyFamily;
  classes: FailureTaxonomyClass[];
};

export type FailureTaxonomyDataset = {
  index: FailureTaxonomyIndex;
  families: FailureTaxonomyFamilyDocument[];
  caseFileExamples: FailureTaxonomyCaseFileExamples;
  caseFileExamplesAvailable: boolean;
  sourceRoot: string;
  previewSource: boolean;
};

type Ready<T> = { status: "ready"; data: T; attemptedUrl: string };
type Unavailable = { status: "unavailable"; attemptedUrl: string; message: string };
export type FailureTaxonomyLoadResult<T> = Ready<T> | Unavailable;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const TAXONOMY_PATH = "vigil/taxonomy";
const VIGIL_MAIN_TAXONOMY_ROOT = `https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/${TAXONOMY_PATH}`;

export const VIGIL_FAILURE_TAXONOMY_INDEX_URL = `${VIGIL_MAIN_TAXONOMY_ROOT}/VIGIL.FailureTaxonomy.Index.json`;
export const VIGIL_FAILURE_TAXONOMY_CASE_FILE_EXAMPLES_URL = `${VIGIL_MAIN_TAXONOMY_ROOT}/generated/VIGIL.FailureTaxonomy.CaseFileExamples.json`;

async function fetchJson<T>(url: string, fetcher: FetchLike) {
  const response = await fetcher(`${url}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status}`);
  return await response.json() as T;
}

export async function loadFailureTaxonomyIndex(fetcher: FetchLike = fetch): Promise<FailureTaxonomyLoadResult<FailureTaxonomyIndex>> {
  const url = VIGIL_FAILURE_TAXONOMY_INDEX_URL;
  try {
    const data = await fetchJson<FailureTaxonomyIndex>(url, fetcher);
    return { status: "ready", data, attemptedUrl: url };
  } catch (error) {
    return {
      status: "unavailable",
      attemptedUrl: url,
      message: `The VIGIL Alignment Taxonomy dataset is not yet available from the configured source (${(error as Error).message}).`,
    };
  }
}

export async function loadFailureTaxonomy(fetcher: FetchLike = fetch): Promise<FailureTaxonomyLoadResult<FailureTaxonomyDataset>> {
  const indexUrl = VIGIL_FAILURE_TAXONOMY_INDEX_URL;
  try {
    const index = await fetchJson<FailureTaxonomyIndex>(indexUrl, fetcher);
    const [families, caseFileProjection] = await Promise.all([
      Promise.all(index.families.map((entry) => fetchJson<FailureTaxonomyFamilyDocument>(`${VIGIL_MAIN_TAXONOMY_ROOT}/${entry.file}`, fetcher))),
      fetchJson<FailureTaxonomyCaseFileExamples>(VIGIL_FAILURE_TAXONOMY_CASE_FILE_EXAMPLES_URL, fetcher)
        .then((data) => ({ data, available: true }))
        .catch(() => ({ data: { classes: {} }, available: false })),
    ]);
    return {
      status: "ready",
      attemptedUrl: indexUrl,
      data: {
        index,
        families,
        caseFileExamples: caseFileProjection.data,
        caseFileExamplesAvailable: caseFileProjection.available,
        sourceRoot: VIGIL_MAIN_TAXONOMY_ROOT,
        previewSource: false,
      },
    };
  } catch (error) {
    return {
      status: "unavailable",
      attemptedUrl: indexUrl,
      message: `The VIGIL Alignment Taxonomy dataset is not yet available from the configured source (${(error as Error).message}).`,
    };
  }
}
