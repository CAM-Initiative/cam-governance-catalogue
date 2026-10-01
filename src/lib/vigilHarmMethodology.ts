export type HarmMethodologyMetadata = {
  id: string;
  version: string;
  effectiveOn?: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const VIGIL_MAIN_ROOT = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil";
export const VIGIL_SCHEMA_URL = `${VIGIL_MAIN_ROOT}/VIGIL.Schema.json`;

export function harmMethodologyUrl(version: string) {
  return `${VIGIL_MAIN_ROOT}/methodologies/VIGIL.HarmImpactMatrix.v${encodeURIComponent(version)}.json`;
}

export async function loadHarmMethodologyMetadata(version: string, fetcher: FetchLike = fetch): Promise<HarmMethodologyMetadata | undefined> {
  const normalized = version.trim();
  if (!normalized) return undefined;
  const url = harmMethodologyUrl(normalized);
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


export async function loadCurrentHarmMethodologyMetadata(fetcher: FetchLike = fetch): Promise<(HarmMethodologyMetadata & { url: string }) | undefined> {
  try {
    const response = await fetcher(`${VIGIL_SCHEMA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return undefined;
    const raw = await response.json() as Record<string, unknown>;
    const recordClasses = raw.record_classes && typeof raw.record_classes === "object" ? raw.record_classes as Record<string, unknown> : undefined;
    const incident = recordClasses?.incident && typeof recordClasses.incident === "object" ? recordClasses.incident as Record<string, unknown> : undefined;
    const version = typeof incident?.harm_impact_methodology_version === "string" ? incident.harm_impact_methodology_version.trim() : "";
    if (!version) return undefined;
    const metadata = await loadHarmMethodologyMetadata(version, fetcher);
    return metadata ? { ...metadata, url: harmMethodologyUrl(metadata.version) } : undefined;
  } catch {
    return undefined;
  }
}
