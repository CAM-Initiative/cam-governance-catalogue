export type SourcePointer = {
  raw_url?: unknown;
  rawUrl?: unknown;
  path?: unknown;
  link?: unknown;
  url?: unknown;
  github_blob_url?: unknown;
  githubBlobUrl?: unknown;
};

export type SourceRepository = {
  repo: string;
  branch: string;
  basePath?: string;
};

function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isAbsoluteSource(value: string) {
  return /^(https?:|mailto:|#|\/)/.test(value);
}

function normalizePath(path: string, basePath?: string) {
  const cleanPath = path.replace(/^\/+/, "");
  if (!basePath) return cleanPath;
  const cleanBase = basePath.replace(/^\/+|\/+$/g, "");
  if (!cleanBase || cleanPath === cleanBase || cleanPath.startsWith(`${cleanBase}/`)) return cleanPath;
  return `${cleanBase}/${cleanPath}`;
}

export function resolveRawSourceUrl(pointer: SourcePointer, repository: SourceRepository): string | undefined {
  const rawUrl = asText(pointer.raw_url) ?? asText(pointer.rawUrl);
  if (rawUrl) return rawUrl;

  const candidatePath = asText(pointer.path) ?? asText(pointer.link);
  if (!candidatePath) return undefined;
  if (/^https?:\/\/raw\.githubusercontent\.com\//.test(candidatePath)) return candidatePath;
  if (/^https?:\/\/github\.com\//.test(candidatePath)) {
    return candidatePath.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("/blob/", "/");
  }
  if (isAbsoluteSource(candidatePath)) return candidatePath;

  const repoPath = normalizePath(candidatePath, repository.basePath);
  return `https://raw.githubusercontent.com/${repository.repo}/${repository.branch}/${repoPath}`;
}

export function resolveGithubBlobUrl(pointer: SourcePointer, repository: SourceRepository): string | undefined {
  const blobUrl = asText(pointer.github_blob_url) ?? asText(pointer.githubBlobUrl);
  if (blobUrl) return blobUrl;

  const url = asText(pointer.url);
  if (url?.startsWith("https://github.com/")) return url;

  const rawUrl = asText(pointer.raw_url) ?? asText(pointer.rawUrl);
  if (rawUrl?.startsWith("https://raw.githubusercontent.com/")) {
    return rawUrl.replace("https://raw.githubusercontent.com/", "https://github.com/").replace(`/${repository.branch}/`, `/blob/${repository.branch}/`);
  }

  const candidatePath = asText(pointer.path) ?? asText(pointer.link);
  if (!candidatePath) return undefined;
  if (candidatePath.startsWith("https://github.com/")) return candidatePath;
  if (candidatePath.startsWith("https://raw.githubusercontent.com/")) {
    return candidatePath.replace("https://raw.githubusercontent.com/", "https://github.com/").replace(`/${repository.branch}/`, `/blob/${repository.branch}/`);
  }
  if (isAbsoluteSource(candidatePath)) return candidatePath;

  const repoPath = normalizePath(candidatePath, repository.basePath);
  return `https://github.com/${repository.repo}/blob/${repository.branch}/${repoPath}`;
}

export async function fetchSourceText(url: string, fetcher: typeof fetch = fetch): Promise<string> {
  const response = await fetcher(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load source (${response.status})`);
  return response.text();
}
