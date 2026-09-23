import registrySources from "@/config/registrySources.json";

export type VigilBranchOption = {
  name: string;
  sha: string;
  protected: boolean;
};

export type ResolvedVigilSource = {
  branch: string;
  ref: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const VIGIL_REPOSITORY = registrySources.vigil.repo;
export const VIGIL_DEFAULT_BRANCH = registrySources.vigil.branch;
export const VIGIL_BRANCH_STORAGE_KEY = "cam:vigil-preview-branch";
export const VIGIL_BRANCH_CHANGE_EVENT = "cam-vigil-branch-change";

const VIGIL_BUILD_ENV = (import.meta as ImportMeta & { readonly env?: ImportMetaEnv }).env;
const VIGIL_BUILD_BRANCH = VIGIL_BUILD_ENV?.VITE_VIGIL_RECORD_BRANCH?.trim();
const VIGIL_API_ROOT = `https://api.github.com/repos/${VIGIL_REPOSITORY}`;
const VIGIL_RAW_ROOT = `https://raw.githubusercontent.com/${VIGIL_REPOSITORY}`;

let resolvedSourcePromise: Promise<ResolvedVigilSource> | undefined;
let resolvedSourceBranch: string | undefined;
let lastResolvedSource: ResolvedVigilSource | undefined;

function browserStorage() {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function branchFromQuery() {
  if (typeof window === "undefined") return undefined;
  const value = new URL(window.location.href).searchParams.get("vigilBranch")?.trim();
  return value || undefined;
}

export function getSelectedVigilBranch() {
  return branchFromQuery()
    ?? browserStorage()?.getItem(VIGIL_BRANCH_STORAGE_KEY)?.trim()
    ?? VIGIL_BUILD_BRANCH
    ?? VIGIL_DEFAULT_BRANCH;
}

export function setSelectedVigilBranch(branch: string) {
  const normalized = branch.trim();
  if (!normalized) return;
  browserStorage()?.setItem(VIGIL_BRANCH_STORAGE_KEY, normalized);
  resolvedSourcePromise = undefined;
  resolvedSourceBranch = undefined;
  lastResolvedSource = undefined;

  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.set("vigilBranch", normalized);
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new CustomEvent(VIGIL_BRANCH_CHANGE_EVENT, { detail: { branch: normalized } }));
  }
}

export async function listVigilBranches(fetcher: FetchLike = fetch): Promise<VigilBranchOption[]> {
  const branches: VigilBranchOption[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetcher(`${VIGIL_API_ROOT}/branches?per_page=100&page=${page}`, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`Unable to list VIGIL branches (${response.status})`);
    const payload = await response.json() as Array<{
      name?: unknown;
      protected?: unknown;
      commit?: { sha?: unknown };
    }>;
    if (!Array.isArray(payload)) throw new Error("GitHub returned an invalid VIGIL branch list.");

    for (const item of payload) {
      if (typeof item.name !== "string" || typeof item.commit?.sha !== "string") continue;
      branches.push({
        name: item.name,
        sha: item.commit.sha,
        protected: item.protected === true,
      });
    }
    if (payload.length < 100) break;
  }

  return branches.sort((left, right) => {
    if (left.name === VIGIL_DEFAULT_BRANCH) return -1;
    if (right.name === VIGIL_DEFAULT_BRANCH) return 1;
    return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
  });
}

export async function resolveSelectedVigilSource(fetcher: FetchLike = fetch): Promise<ResolvedVigilSource> {
  const branch = getSelectedVigilBranch();
  if (resolvedSourcePromise && resolvedSourceBranch === branch) return resolvedSourcePromise;

  resolvedSourceBranch = branch;
  resolvedSourcePromise = (async () => {
    const response = await fetcher(`${VIGIL_API_ROOT}/branches/${encodeURIComponent(branch)}`, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`Unable to resolve VIGIL branch "${branch}" (${response.status})`);
    const payload = await response.json() as { commit?: { sha?: unknown } };
    if (typeof payload.commit?.sha !== "string" || !payload.commit.sha.trim()) {
      throw new Error(`VIGIL branch "${branch}" did not resolve to a commit.`);
    }
    const source = { branch, ref: payload.commit.sha.trim() };
    lastResolvedSource = source;
    return source;
  })();

  return resolvedSourcePromise;
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
  const selected = getSelectedVigilBranch();
  const ref = lastResolvedSource?.branch === selected ? lastResolvedSource.ref : selected;
  return `https://github.com/${VIGIL_REPOSITORY}/blob/${ref}/${path.replace(/^\/+/, "")}`;
}
