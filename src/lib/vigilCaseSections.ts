export const VIGIL_INCIDENT_CASE_SECTIONS = [
  {
    id: "observe",
    number: "01",
    label: "Observation",
    description: "What happened, which systems were affected, and what the evidence establishes.",
  },
  {
    id: "diagnose",
    number: "02",
    label: "Assessment",
    description: "The occurrence-level governance assessment, including materialised severity and evidentiary limits.",
  },
  {
    id: "classify",
    number: "03",
    label: "Classification",
    description: "The canonical structural mechanism supported by the assessment and evidence.",
  },
  {
    id: "repair",
    number: "04",
    label: "Repair",
    description: "The governing invariant condition that a repair must restore and preserve.",
  },
  {
    id: "references",
    number: "05",
    label: "References",
    description: "Sources, taxonomy records and the canonical Incident cited in this Case File.",
  },
] as const;

export type VigilIncidentCaseSectionId = typeof VIGIL_INCIDENT_CASE_SECTIONS[number]["id"];
