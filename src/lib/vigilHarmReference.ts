import canonicalMethodology from "@/data/vigil-harm-methodology.json";
import canonicalReferences from "@/data/vigil-harm-references.json";

export const HARM_BANDS = ["S1", "S2", "S3", "S4", "S5"] as const;
export type HarmBand = typeof HARM_BANDS[number];
export type HarmDimension = {
  dimension_id: string;
  label: string;
  thresholds: Record<HarmBand, { threshold_id: string; criterion: string; aggregate_harm_threshold?: string }>;
  adaptation_note?: string;
  interpretive_note?: string;
  quantitative_indicators: string[];
  quantification_note: string;
};

export const harmMethodology = canonicalMethodology;
export const harmDimensions = canonicalMethodology.dimensions as HarmDimension[];
export const harmReferences = canonicalReferences;
export const harmMethodologyUrl = `https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/methodologies/VIGIL.HarmImpactMatrix.v${harmMethodology.version}.json`;

export function harmIndicatorLabel(indicator: string) {
  return indicator.replace(/_/g, " ");
}
