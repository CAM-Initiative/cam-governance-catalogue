import { vigilRawUrl } from "@/lib/vigilBranchSource";

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


export async function loadCurrentHarmMethodologyMetadata(fetcher: FetchLike = fetch): Promise<(HarmMethodologyMetadata & { url: string }) | undefined> {
  try {
    const schemaUrl = await vigilRawUrl("vigil/VIGIL.Schema.json", fetcher);
    const response = await fetcher(`${schemaUrl}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return undefined;
    const raw = await response.json() as Record<string, unknown>;
    const recordClasses = raw.record_classes && typeof raw.record_classes === "object" ? raw.record_classes as Record<string, unknown> : undefined;
    const incident = recordClasses?.incident && typeof recordClasses.incident === "object" ? recordClasses.incident as Record<string, unknown> : undefined;
    const version = typeof incident?.harm_impact_methodology_version === "string" ? incident.harm_impact_methodology_version.trim() : "";
    if (!version) return undefined;
    const metadata = await loadHarmMethodologyMetadata(version, fetcher);
    if (!metadata) return undefined;
    const url = await vigilRawUrl(`vigil/methodologies/VIGIL.HarmImpactMatrix.v${metadata.version}.json`, fetcher);
    return { ...metadata, url };
  } catch {
    return undefined;
  }
}

/**
 * Resolve the methodology version from the selected VIGIL branch's Incident
 * schema (main by default, or the explicit preview branch). Never infer adoption
 * merely because a proposal JSON file exists.
 */
export type HarmMethodologyThreshold = {
  criterion: string;
  aggregate_harm_threshold?: string;
  epistemic_downstream_reliance_threshold?: { numeric?: string; outcome?: string };
};

export type HarmMethodologyDimension = {
  dimension_id: string;
  label: string;
  thresholds: Record<string, HarmMethodologyThreshold>;
  adaptation_note?: string;
  interpretive_note?: string;
  quantification_note?: string;
  quantitative_indicators?: string[];
};

export type HarmMethodologyDefinition = HarmMethodologyMetadata & {
  dimensions: HarmMethodologyDimension[];
};

export async function loadCurrentHarmMethodologyDefinition(fetcher: FetchLike = fetch): Promise<HarmMethodologyDefinition | undefined> {
  try {
    const schemaUrl = await vigilRawUrl("vigil/VIGIL.Schema.json", fetcher);
    const schemaResponse = await fetcher(schemaUrl, { cache: "no-store" });
    if (!schemaResponse.ok) return undefined;
    const schema = await schemaResponse.json() as Record<string, unknown>;
    const classes = schema.record_classes as Record<string, unknown> | undefined;
    const incident = classes?.incident as Record<string, unknown> | undefined;
    const version = typeof incident?.harm_impact_methodology_version === "string" ? incident.harm_impact_methodology_version : undefined;
    if (!version || !/^\d+\.\d+\.\d+$/.test(version)) return undefined;
    const methodUrl = await vigilRawUrl(`vigil/methodologies/VIGIL.HarmImpactMatrix.v${version}.json`, fetcher);
    const methodResponse = await fetcher(methodUrl, { cache: "no-store" });
    if (!methodResponse.ok) return undefined;
    const method = await methodResponse.json() as Record<string, unknown>;
    if (method.methodology_id !== "VIGIL-HIM" || method.version !== version || !Array.isArray(method.dimensions)) return undefined;
    const dimensions: HarmMethodologyDimension[] = [];
    for (const value of method.dimensions) {
      if (!value || typeof value !== "object") return undefined;
      const dim = value as Record<string, unknown>;
      if (typeof dim.dimension_id !== "string" || typeof dim.label !== "string") return undefined;
      const rawThresholds = dim.thresholds && typeof dim.thresholds === "object" ? dim.thresholds as Record<string, unknown> : undefined;
      if (!rawThresholds) return undefined;
      const thresholds: Record<string, HarmMethodologyThreshold> = {};
      for (const band of ["S1", "S2", "S3", "S4", "S5"]) {
        const raw = rawThresholds[band] as Record<string, unknown> | undefined;
        if (!raw || typeof raw.criterion !== "string" || !raw.criterion.trim()) return undefined;
        thresholds[band] = {
          criterion: raw.criterion,
          aggregate_harm_threshold: typeof raw.aggregate_harm_threshold === "string" ? raw.aggregate_harm_threshold : undefined,
          epistemic_downstream_reliance_threshold:
            raw.epistemic_downstream_reliance_threshold && typeof raw.epistemic_downstream_reliance_threshold === "object"
              ? raw.epistemic_downstream_reliance_threshold as HarmMethodologyThreshold["epistemic_downstream_reliance_threshold"]
              : undefined,
        };
      }
      dimensions.push({
        dimension_id: dim.dimension_id,
        label: dim.label,
        thresholds,
        adaptation_note: typeof dim.adaptation_note === "string" ? dim.adaptation_note : undefined,
        interpretive_note: typeof dim.interpretive_note === "string" ? dim.interpretive_note : undefined,
        quantification_note: typeof dim.quantification_note === "string" ? dim.quantification_note : undefined,
        quantitative_indicators: Array.isArray(dim.quantitative_indicators) ? dim.quantitative_indicators.filter((value): value is string => typeof value === "string") : [],
      });
    }
    if (dimensions.length < 11) return undefined;
    return {
      id: "VIGIL-HIM",
      version,
      effectiveOn: typeof method.effective_on === "string" ? method.effective_on : undefined,
      dimensions,
    };
  } catch {
    return undefined;
  }
}
