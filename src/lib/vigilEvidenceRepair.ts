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
    id: "diagnose",
    number: "02",
    label: "Diagnosis",
    description: "What went wrong, how the failure mechanism operated, and where existing governance or controls were insufficient.",
  },
  {
    id: "classify",
    number: "03",
    label: "Classification",
    description: "How the diagnosed failure maps to the current failure taxonomy, including any new classification required.",
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

export const VIGIL_INCIDENT_CASE_SECTIONS = [
  VIGIL_EVIDENCE_REPAIR_SECTIONS[0],
  VIGIL_EVIDENCE_REPAIR_SECTIONS[1],
  VIGIL_EVIDENCE_REPAIR_SECTIONS[2],
  {
    ...VIGIL_REFERENCES_SECTION,
    number: "04",
  },
] as const;

export type VigilEvidenceRepairSectionId = typeof VIGIL_EVIDENCE_REPAIR_SECTIONS[number]["id"];
export type VigilPublicReportSectionId = typeof VIGIL_PUBLIC_REPORT_SECTIONS[number]["id"];
