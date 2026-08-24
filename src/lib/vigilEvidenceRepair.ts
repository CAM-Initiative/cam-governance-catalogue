export const VIGIL_REFERENCES_SECTION = {
  id: "references",
  number: "06",
  label: "References",
  description: "Sources and VIGIL records cited in this case.",
} as const;

export const VIGIL_EVIDENCE_REPAIR_SECTIONS = [
  {
    id: "observe",
    number: "01",
    label: "Observation",
    description: "What happened, which systems were affected, and what the evidence establishes.",
  },
  {
    id: "classify",
    number: "02",
    label: "Classification",
    description: "The recurring failure mode, severity, and taxonomy classification.",
  },
  {
    id: "diagnose",
    number: "03",
    label: "Diagnosis",
    description: "The governance weakness, existing coverage, and remaining control gap.",
  },
  {
    id: "repair",
    number: "04",
    label: "Repair",
    description: "The governance response, implementation status, and verification.",
  },
  {
    id: "learn",
    number: "05",
    label: "Learn",
    description: "The reusable governance lesson, future application, and limitations.",
  },
  VIGIL_REFERENCES_SECTION,
] as const;

export const VIGIL_PUBLIC_REPORT_SECTIONS = VIGIL_EVIDENCE_REPAIR_SECTIONS;

export type VigilEvidenceRepairSectionId = typeof VIGIL_EVIDENCE_REPAIR_SECTIONS[number]["id"];
export type VigilPublicReportSectionId = typeof VIGIL_PUBLIC_REPORT_SECTIONS[number]["id"];
