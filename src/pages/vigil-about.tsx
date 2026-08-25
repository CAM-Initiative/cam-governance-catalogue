import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VIGIL_EVIDENCE_REPAIR_SECTIONS } from "@/lib/vigilEvidenceRepair";

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
  ["Case Files", "Evidence-centred investigations of AI governance failures, organised through Observation, Diagnosis, Classification, Repair, Learn and References."],
  ["AI Governance Failure Taxonomy", "The technical reference that defines failure families and failure classes used to compare recurring governance mechanisms across systems and incidents."],
  ["AI Governance Standards", "A compliance-oriented reference baseline of laws, standards, frameworks and technical guidance relevant to AI governance obligations and controls."],
  ["Policy", "Public-interest policy papers and submissions that translate evidence and governance analysis into institutional and regulatory proposals."],
];

export default function VigilAbout() {
  return <Shell><VigilObservatoryNav /><main className="vigil-about-page"><div className="container mx-auto max-w-[1220px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <header className="vigil-about-hero">
      <p className="vigil-library-kicker">VIGIL Observatory</p>
      <h1>About VIGIL</h1>
      <p>VIGIL is a public AI-governance observatory that connects evidence, failure classification, governance requirements and repair. Its purpose is to make recurring failure mechanisms easier to identify, compare and trace from real-world evidence to accountable governance response.</p>
    </header>

    <section className="vigil-about-section" aria-labelledby="vigil-method-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Evidence to repair</p><h2 id="vigil-method-heading">How a VIGIL Case File is structured</h2></div>
      <p className="vigil-about-record-intro">Each public Case File follows the same six-stage report structure: Observation, Diagnosis, Classification, Repair, Learn and References. That structure keeps the evidence of what happened separate from the diagnosis of the failure mechanism, the taxonomy classification and any proposed or implemented governance response.</p>
      <div className="vigil-about-flow-scroll" role="region" aria-label="VIGIL six-stage evidence-to-repair report model" tabIndex={0}>
        <div className="vigil-about-flow">
          {VIGIL_EVIDENCE_REPAIR_SECTIONS.map((section) => <article key={section.number}><span>Stage {section.number}</span><h3>{section.label}</h3><p>{section.description}</p></article>)}
        </div>
      </div>
      <p className="vigil-about-note">A reported incident is not automatically a new failure class. VIGIL first asks what mechanism failed, whether that mechanism is already represented in the taxonomy, and what the available evidence actually supports.</p>
    </section>

    <section className="vigil-about-section" aria-labelledby="vigil-taxonomy-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">AI governance failure taxonomy</p><h2 id="vigil-taxonomy-heading">Failure families organise the landscape. Failure classes identify the mechanism.</h2></div>
      <p className="vigil-about-record-intro">The <strong>VIGIL AI Governance Failure Taxonomy</strong> is the shared classification reference used across VIGIL. It is deliberately hierarchical: broad failure families provide stable structural organisation, while individual failure classes describe the specific repeatable mechanisms that can be recognised in evidence.</p>
      <div className="vigil-about-boundary-grid">
        {taxonomyPrinciples.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </div>
      <p className="vigil-about-note">Taxonomy classification is interpretive. It does not by itself establish legal liability, regulatory status, enforcement authority or final incident truth. Those claims require their own evidence and authority.</p>
      <Link className="vigil-about-action" href="/observatory/knowledge-base/failure-taxonomy">
        Browse the taxonomy <ArrowRight aria-hidden="true" />
      </Link>
    </section>

    <section className="vigil-about-section" aria-labelledby="vigil-knowledge-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Knowledge Base</p><h2 id="vigil-knowledge-heading">How the public VIGIL surfaces fit together</h2></div>
      <p className="vigil-about-record-intro">The Knowledge Base is the public entry point for VIGIL&apos;s major reference surfaces. Each has a different job: Case Files preserve investigations; the taxonomy provides the classification language; the standards baseline supports compliance interpretation; and policy work carries evidence into public governance proposals.</p>
      <div className="vigil-about-boundary-grid">
        {knowledgeSurfaces.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </div>
      <Link className="vigil-about-action" href="/observatory/knowledge-base">
        Open the Knowledge Base <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  </div></main></Shell>;
}
