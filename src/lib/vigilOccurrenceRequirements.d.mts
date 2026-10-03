export const REQUIREMENT_ASSESSMENT_INTRO: string;
export type RequirementRow = {
  key: string;
  applicable: boolean;
  applicabilityStatus: "applicable" | "insufficient-evidence" | "not-applicable";
  title: string;
  summary: string;
  url?: string;
  normativeForce?: string;
  applicability: string;
  finding?: string;
  applicabilityBasis?: string;
  findingBasis?: string;
  evidence: Array<{ title: string; referenceNumber?: number; url?: string }>;
};
export function occurrenceRequirementRows(raw: Record<string, unknown>, requirements?: Array<unknown>): RequirementRow[];
