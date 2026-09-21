// Conclusion follows assessment, classification and repair; References remain the closing evidentiary stage.
export const VIGIL_INCIDENT_CASE_SECTIONS = [
  {
    id: "observe",
    number: "01",
    label: "Incident",
  },
  {
    id: "diagnose",
    number: "02",
    label: "Assessment",
  },
  {
    id: "classify",
    number: "03",
    label: "Classification",
  },
  {
    id: "repair",
    number: "04",
    label: "Repair",
  },
  {
    id: "conclusion",
    number: "05",
    label: "Conclusion",
  },
  {
    id: "references",
    number: "06",
    label: "References",
  },
] as const;

export type VigilIncidentCaseSectionId = typeof VIGIL_INCIDENT_CASE_SECTIONS[number]["id"];
