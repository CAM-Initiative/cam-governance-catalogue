// Public reading guide, consistent with VIGIL.AlignmentTaxonomy.ReadingGuide.json.
export const vigilReadingGuide = [
  {
    section: "taxonomy",
    title: "Reading the Alignment Taxonomy",
    paragraphs: [
      "A Fidelity Family groups related governance properties. A Fidelity Class defines a particular property and its governing invariant: the condition that should hold within the class boundary. Fidelity names the property examined; it does not presume an Aligned result.",
      "Read a class through its definition, invariant, success and failure conditions, recognition criteria, exclusions, examples and external references. Aligned requires affirmative evidence that the invariant held. Not aligned requires evidence that the failure conditions are satisfied. Boundary identifies a relevant relationship for which a decisive outcome is not established.",
      "Absence of failure evidence does not establish Aligned. Absence of success evidence does not establish Not aligned. A class exclusion does not establish the opposite result.",
    ],
  },
  {
    section: "taxonomy",
    title: "Scope, incomplete adjudication and exemplars",
    paragraphs: [
      "Results belong to assessed actions or source clauses and their governance boundaries. Different actions in one Incident can receive different results. Incomplete adjudication remains explicit while completed findings remain available. An unreviewed observation is not automatically Boundary.",
      "An Aligned finding does not automatically admit an Incident to the exemplar collection. Exemplar admission is a separate governed decision. An admitted exemplar demonstrates the stated invariant within its recorded evidence and boundary conditions.",
    ],
  },
  {
    section: "standards",
    title: "External requirements and normative force",
    paragraphs: [
      "Taxonomy relationships help identify external requirements for review. Each retained requirement is assessed independently against the occurrence evidence. A taxonomy result does not determine the external requirement result. For an external requirement, Boundary identifies a genuinely relevant requirement with a missing decisive occurrence fact.",
      "Normative force describes the authority of the source. It is separate from the alignment result. Voluntary guidance can receive Aligned, Not aligned or Boundary. A binding-law label does not establish that a provision was in force or legally applicable to the actor and occurrence.",
      "Review considers scope, actor, activity, jurisdiction, publication date and commencement or transition conditions. Requirements published after an occurrence do not create retrospective Not aligned results. These assessments do not establish certification, legal liability or organisation-wide compliance. An empty assessment table makes no positive compliance claim.",
    ],
  },
  {
    section: "harm-impact",
    title: "Separate Harm Impact assessment",
    paragraphs: [
      "Harm Impact assesses materialised consequences. Taxonomy classification assesses governance invariants. External requirement assessments compare the occurrence with separate requirements. Severity does not determine alignment, and an alignment result does not determine severity.",
      "Each harm dimension is assessed independently. The highest supported assessed severity band controls overall severity; dimensions are not averaged or summed. Unreported harm is not automatically S1. The full Harm Impact methodology is available separately and remains at the back of the taxonomy textbook.",
    ],
  },
];
