import { vigilRawUrl } from "@/lib/vigilBranchSource";

export type HarmMethodologyMetadata = {
  id: string;
  version: string;
  effectiveOn?: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function loadHarmMethodologyMetadata(version: string, fetcher: FetchLike = fetch): Promise<HarmMethodologyMetadata | undefined> {
  const normalized = version.trim();
  if (!normalized) return undefined;
  const url = await vigilRawUrl(`vigil/methodologies/VIGIL.HarmImpactMatrix.v${normalized}.json`, fetcher);
  try {
    const response = await fetcher(`${url}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return undefined;
    const raw = await response.json() as Record<string, unknown>;
    const id = typeof raw.methodology_id === "string" ? raw.methodology_id.trim() : "";
    const resolvedVersion = typeof raw.version === "string" ? raw.version.trim() : normalized;
    const effectiveOn = typeof raw.effective_on === "string" && raw.effective_on.trim() ? raw.effective_on.trim() : undefined;
    if (!id || !resolvedVersion) return undefined;
    return { id, version: resolvedVersion, effectiveOn };
  } catch {
    return undefined;
  }
}
