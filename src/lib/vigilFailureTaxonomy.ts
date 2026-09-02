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
  recognition?: FailureTaxonomyRecognition;
  exclusions?: string[];
  examples?: string[];
  relationships?: FailureTaxonomyRelationship[];
  aliases?: string[];
  subtypes?: FailureTaxonomySubtype[];
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
      message: `The VIGIL Failure Taxonomy dataset is not yet available from the configured source (${(error as Error).message}).`,
    };
  }
}

export async function loadFailureTaxonomy(fetcher: FetchLike = fetch): Promise<FailureTaxonomyLoadResult<FailureTaxonomyDataset>> {
  const indexUrl = VIGIL_FAILURE_TAXONOMY_INDEX_URL;
  try {
    const index = await fetchJson<FailureTaxonomyIndex>(indexUrl, fetcher);
    const families = await Promise.all(index.families.map((entry) => fetchJson<FailureTaxonomyFamilyDocument>(`${VIGIL_MAIN_TAXONOMY_ROOT}/${entry.file}`, fetcher)));
    return {
      status: "ready",
      attemptedUrl: indexUrl,
      data: {
        index,
        families,
        sourceRoot: VIGIL_MAIN_TAXONOMY_ROOT,
        previewSource: false,
      },
    };
  } catch (error) {
    return {
      status: "unavailable",
      attemptedUrl: indexUrl,
      message: `The VIGIL Failure Taxonomy dataset is not yet available from the configured source (${(error as Error).message}).`,
    };
  }
}
