import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VIGIL_INCIDENT_CASE_SECTIONS } from "@/lib/vigilCaseSections";

const taxonomyPrinciples = [
  [
    "Failure family",
    "A failure family is the broad structural grouping. It identifies the kind of governance boundary or system function involved, so related mechanisms can be organised together without pretending they are identical.",
  ],
  [
    "Failure class",
    "A failure class is the more precise repeatable mechanism within a family. Each class has its own definition, recognition criteria, exclusions and relationships to nearby classes so similar-looking failures can be distinguished consistently.",
  ],
  [
    "Case File classification",
    "A Case File applies the taxonomy to evidence from a real investigation. The family and class provide the shared classification language; the Case File preserves what happened, why the classification was used, what evidence supports it and what remains uncertain.",
  ],
];

const knowledgeSurfaces = [
  ["Case Files", "Evidence-centred Incident investigations organised through Observation, Diagnosis, Classification, Repair and References."],
  ["AI Governance Failure Taxonomy", "The technical reference that defines failure families and failure classes used to compare recurring governance mechanisms across systems and incidents."],
  ["AI Governance Standards", "A compliance-oriented reference baseline of laws, standards, frameworks and technical guidance relevant to AI governance obligations and controls."],
  ["Policy", "Public-interest policy papers and submissions that translate evidence and governance analysis into institutional and regulatory proposals."],
];

export default function VigilAbout() {
  return <Shell><VigilObservatoryNav /><main className="vigil-about-page"><div className="container mx-auto max-w-[1220px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <header className="vigil-about-hero">
      <p className="vigil-library-kicker">VIGIL Observatory</p>
      <h1>About VIGIL Observatory</h1>
      <p>VIGIL Observatory is the CAM Initiative&apos;s evidence-to-repair AI governance observatory: a public incident-analysis system that preserves canonical Incident records, diagnoses governance and control failures, applies a maintained failure taxonomy, and links evidence to accountable repair and verification.</p>
    </header>

    <section className="vigil-about-section" aria-labelledby="vigil-method-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Incident analysis</p><h2 id="vigil-method-heading">How a VIGIL Case File is structured</h2></div>
      <p className="vigil-about-record-intro">Each public Case File follows the same five-stage structure: Observation, Diagnosis, Classification, Repair and References. That structure keeps evidence of what happened separate from occurrence-level diagnosis and severity, taxonomy classification, the governing invariant a repair must restore, and the material used to support those conclusions.</p>
      <div className="vigil-about-flow-scroll" role="region" aria-label="VIGIL Observatory five-stage Incident Case File model" tabIndex={0}>
        <div className="vigil-about-flow">
          {VIGIL_INCIDENT_CASE_SECTIONS.map((section) => {
            return <article key={section.number}>
              <div className="flex items-center justify-between gap-2"><span>Stage {section.number}</span></div>
              <h3>{section.label}</h3>
              <p>{section.description}</p>
            </article>;
          })}
        </div>
      </div>
      <p className="vigil-about-note">A reported incident is not automatically a new failure class. VIGIL Observatory first asks what mechanism failed, whether that mechanism is already represented in the taxonomy, and what the available evidence actually supports.</p>
    </section>

    <section className="vigil-about-section" aria-labelledby="vigil-taxonomy-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">AI governance failure taxonomy</p><h2 id="vigil-taxonomy-heading">Failure families organise the landscape. Failure classes identify the mechanism.</h2></div>
      <p className="vigil-about-record-intro">The <strong>VIGIL AI Governance Failure Taxonomy</strong> is the maintained classification reference used by VIGIL Observatory. It is deliberately hierarchical and evidence-grounded: broad failure families provide stable structural organisation, while individual failure classes describe specific repeatable governance and control-failure mechanisms with explicit recognition criteria, exclusions and classification boundaries.</p>
      <div className="vigil-about-boundary-grid">
        {taxonomyPrinciples.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </div>
      <p className="vigil-about-note"><strong>Classification boundary:</strong> VIGIL Observatory distinguishes source terminology from VIGIL classification. Terms used by providers, media, researchers or other third parties remain source descriptions unless explicitly identified as a VIGIL Observatory classification.</p>
      <p className="vigil-about-note"><strong>Use and authority:</strong> VIGIL Observatory classifications are analytical determinations of governance failure mechanisms. They may inform legal, regulatory, contractual, technical or institutional analysis. VIGIL Observatory does not presently exercise recognised adjudicative, judicial or regulatory authority, so a classification does not by itself create binding legal effect. That institutional boundary does not prevent VIGIL Observatory from analysing or classifying mechanisms that bear on disputed legal or governance questions.</p>
      <Link className="vigil-about-action" href="/observatory/knowledge-base/failure-taxonomy">
        Browse the taxonomy <ArrowRight aria-hidden="true" />
      </Link>
    </section>

    <section className="vigil-about-section" aria-labelledby="vigil-knowledge-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Knowledge Base</p><h2 id="vigil-knowledge-heading">How the public VIGIL surfaces fit together</h2></div>
      <p className="vigil-about-record-intro">The Knowledge Base is the public entry point for VIGIL Observatory&apos;s major reference surfaces. Each has a different job: Case Files preserve investigations; the taxonomy provides the classification language; the standards baseline supports compliance interpretation; and policy work carries evidence into public governance proposals.</p>
      <div className="vigil-about-boundary-grid">
        {knowledgeSurfaces.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </div>
      <Link className="vigil-about-action" href="/observatory/knowledge-base">
        Open the Knowledge Base <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  </div></main></Shell>;
}
