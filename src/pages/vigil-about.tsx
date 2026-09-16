import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VIGIL_INCIDENT_CASE_SECTIONS } from "@/lib/vigilCaseSections";
import { HarmImpactMatrix } from "@/components/vigil/HarmImpactMatrix";

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
  ["VIGIL Failure Taxonomy", "The technical reference that defines failure families and failure classes used to compare recurring governance mechanisms across systems and incidents."],
  ["AI Governance Standards", "A compliance-oriented reference baseline of laws, standards, frameworks and technical guidance relevant to AI governance obligations and controls."],
  ["Policy", "Public-interest policy papers and submissions that translate evidence and governance analysis into institutional and regulatory proposals."],
];

export default function VigilAbout() {
  return <Shell><VigilObservatoryNav /><main className="vigil-about-page"><div className="container mx-auto max-w-[1220px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <header className="vigil-about-hero">
      <p className="vigil-library-kicker">VIGIL Observatory</p>
      <h1>About VIGIL Observatory</h1>
      <p>VIGIL Observatory is the CAM Initiative&apos;s evidence-to-repair AI governance observatory. It provides a public AI incident database through its canonical Case File registry, preserving Incident records, diagnosing governance and control failures, applying a maintained failure taxonomy, and linking evidence to accountable repair and verification.</p>
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

    <section className="vigil-about-section" aria-labelledby="vigil-severity-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Severity methodology</p><h2 id="vigil-severity-heading">AI incident severity measures consequence, not the failure mechanism</h2></div>
      <p className="vigil-about-record-intro">VIGIL keeps four questions separate: <strong>harm or consequence</strong> records what adverse effect occurred; <strong>severity</strong> assesses the supported magnitude of that occurrence; the <strong>failure mechanism</strong> identifies the repeatable governance or control failure; and the <strong>invariant or repair</strong> states the corrective constraint that must hold. Severity does not determine classification, and multiple failure classifications do not increase an Incident&apos;s severity.</p>

      <p className="vigil-about-record-intro"><strong>Incident evidence → harm impact threshold(s) → highest supported harm → overall severity.</strong> Every applicable harm dimension is recorded as assessed, unreported, insufficient evidence or not applicable. Absence of published evidence is not evidence of no harm: unreported dimensions receive no severity selection, and S1 requires positive evidence of minimal or no materialised downstream harm.</p>
      <HarmImpactMatrix />
      <p id="vigil-severity-caption" className="vigil-about-note"><strong>Evidence-to-repair sequence:</strong> observed incident → incident evidence → observed consequences or harms → VIGIL severity assessment → AI failure mechanism classification → invariant or governance repair.</p>
      <p className="vigil-about-record-intro">VIGIL aligns the direction of its five-level scale with established AI harm-assessment practice: the <a href="https://airisk.mit.edu/ai-incident-tracker/harm-taxonomy">MIT AI Incident Tracker harm-severity scale</a> runs from 1 (Negligible) to 5 (Catastrophic) and uses harm categories based on the <a href="https://cset.georgetown.edu/wp-content/uploads/20230022-Adding-structure-to-AI-Harm-FINAL.pdf">CSET AI Harm Framework</a>. VIGIL also adapts functional-impact and recoverability concepts from CISA, NIST, NIS2, DORA and ASD. VIGIL retains its own deterministic thresholds because its Case Files support evidence-to-repair governance analysis rather than harm classification alone. These frameworks inform VIGIL; their scales are not interchangeable.</p>
    </section>

    <section className="vigil-about-section" aria-labelledby="vigil-taxonomy-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">VIGIL Failure Taxonomy</p><h2 id="vigil-taxonomy-heading">Failure families organise the landscape. Failure classes identify the mechanism.</h2></div>
      <p className="vigil-about-record-intro">The <strong>VIGIL Failure Taxonomy</strong> is the maintained classification reference used by VIGIL Observatory. It is deliberately hierarchical and evidence-grounded: broad failure families provide stable structural organisation, while individual failure classes describe specific repeatable governance and control-failure mechanisms with explicit recognition criteria, exclusions and classification boundaries.</p>
      <div className="vigil-about-boundary-grid">
        {taxonomyPrinciples.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </div>
      <p className="vigil-about-note"><strong>Classification boundary:</strong> VIGIL Observatory distinguishes source terminology from VIGIL classification. Terms used by providers, media, researchers or other third parties remain source descriptions unless explicitly identified as a VIGIL Observatory classification.</p>
      <p className="vigil-about-note"><strong>Use of VIGIL findings:</strong> VIGIL Observatory documents, diagnoses and classifies AI governance failure mechanisms from available evidence using explicit classification criteria and a maintained taxonomy. Its findings are designed to support technical, governance, regulatory, contractual and legal analysis, with the underlying evidence and reasoning available for independent review.</p>
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
