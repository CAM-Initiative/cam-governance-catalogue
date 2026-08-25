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

export type FailureTaxonomyClass = {
  class_id: string;
  class_code: string;
  family_id: string;
  name: string;
  status: string;
  abstraction: string;
  plain_english: string;
  definition: string;
  recognition?: {
    required_conditions?: string[];
  };
  exclusions?: string[];
  examples?: string[];
  relationships?: FailureTaxonomyRelationship[];
  aliases?: string[];
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
const VIGIL_PROTOTYPE_TAXONOMY_ROOT = `https://raw.githubusercontent.com/CAM-Initiative/Vigil/agent/failure-taxonomy-prototype/${TAXONOMY_PATH}`;

export const VIGIL_FAILURE_TAXONOMY_INDEX_URL = `${VIGIL_MAIN_TAXONOMY_ROOT}/VIGIL.FailureTaxonomy.Index.json`;

function candidateRoots() {
  // Production always consumes canonical VIGIL main. The working-branch fallback
  // exists only so local/Codespaces development can build the UI before the
  // taxonomy package is promoted upstream.
  return import.meta.env.DEV
    ? [VIGIL_MAIN_TAXONOMY_ROOT, VIGIL_PROTOTYPE_TAXONOMY_ROOT]
    : [VIGIL_MAIN_TAXONOMY_ROOT];
}

async function fetchJson<T>(url: string, fetcher: FetchLike) {
  const response = await fetcher(`${url}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status}`);
  return await response.json() as T;
}

export async function loadFailureTaxonomyIndex(fetcher: FetchLike = fetch): Promise<FailureTaxonomyLoadResult<FailureTaxonomyIndex>> {
  let lastUrl = VIGIL_FAILURE_TAXONOMY_INDEX_URL;
  let lastStatus = "unavailable";
  for (const root of candidateRoots()) {
    const url = `${root}/VIGIL.FailureTaxonomy.Index.json`;
    lastUrl = url;
    try {
      const data = await fetchJson<FailureTaxonomyIndex>(url, fetcher);
      return { status: "ready", data, attemptedUrl: url };
    } catch (error) {
      lastStatus = (error as Error).message;
    }
  }
  return {
    status: "unavailable",
    attemptedUrl: lastUrl,
    message: `The VIGIL Failure Taxonomy dataset is not yet available from the canonical public source (${lastStatus}).`,
  };
}

export async function loadFailureTaxonomy(fetcher: FetchLike = fetch): Promise<FailureTaxonomyLoadResult<FailureTaxonomyDataset>> {
  let lastUrl = VIGIL_FAILURE_TAXONOMY_INDEX_URL;
  let lastStatus = "unavailable";

  for (const root of candidateRoots()) {
    const indexUrl = `${root}/VIGIL.FailureTaxonomy.Index.json`;
    lastUrl = indexUrl;
    try {
      const index = await fetchJson<FailureTaxonomyIndex>(indexUrl, fetcher);
      const families = await Promise.all(index.families.map((entry) => fetchJson<FailureTaxonomyFamilyDocument>(`${root}/${entry.file}`, fetcher)));
      return {
        status: "ready",
        attemptedUrl: indexUrl,
        data: {
          index,
          families,
          sourceRoot: root,
          previewSource: root === VIGIL_PROTOTYPE_TAXONOMY_ROOT,
        },
      };
    } catch (error) {
      lastStatus = (error as Error).message;
    }
  }

  return {
    status: "unavailable",
    attemptedUrl: lastUrl,
    message: `The VIGIL Failure Taxonomy dataset is not yet available from the canonical public source (${lastStatus}).`,
  };
}
