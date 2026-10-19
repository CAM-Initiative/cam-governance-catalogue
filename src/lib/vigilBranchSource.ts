import registrySources from "@/config/registrySources.json";

/**
 * Production VIGIL content always resolves against the configured canonical
 * branch. Preview branch selection is deliberately not supported on main.
 */
export type ResolvedVigilSource = {
  branch: string;
  ref: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const VIGIL_REPOSITORY = registrySources.vigil.repo;
export const VIGIL_DEFAULT_BRANCH = registrySources.vigil.branch;

const VIGIL_RAW_ROOT = `https://raw.githubusercontent.com/${VIGIL_REPOSITORY}`;

export function getSelectedVigilBranch() {
  return VIGIL_DEFAULT_BRANCH;
}

export async function resolveSelectedVigilSource(_fetcher: FetchLike = fetch): Promise<ResolvedVigilSource> {
  return { branch: VIGIL_DEFAULT_BRANCH, ref: VIGIL_DEFAULT_BRANCH };
}

export async function vigilRawRoot(path = "", fetcher: FetchLike = fetch) {
  const { ref } = await resolveSelectedVigilSource(fetcher);
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  return cleanPath ? `${VIGIL_RAW_ROOT}/${ref}/${cleanPath}` : `${VIGIL_RAW_ROOT}/${ref}`;
}

export async function vigilRawUrl(path: string, fetcher: FetchLike = fetch) {
  const root = await vigilRawRoot("", fetcher);
  return `${root}/${path.replace(/^\/+/, "")}`;
}

export function vigilGithubBlobUrl(path: string) {
  return `https://github.com/${VIGIL_REPOSITORY}/blob/${VIGIL_DEFAULT_BRANCH}/${path.replace(/^\/+/, "")}`;
}
