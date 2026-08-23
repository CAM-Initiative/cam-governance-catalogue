import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VIGIL_EVIDENCE_REPAIR_SECTIONS, VIGIL_REFERENCES_SECTION } from "@/lib/vigilEvidenceRepair";

const recordTypes = [
  ["OBS", "Observations", "Source-linked records of externally observable events, system behaviour, or governance-relevant signals. They preserve what was observed without converting the observation itself into a general failure claim."],
  ["RESEARCH", "Research", "Structured research and evidence-synthesis records that test, contextualise, or reconcile claims across sources while preserving what is established, inferred, and unresolved."],
  ["FM", "Failure modes", "Repeatable governance-relevant failure mechanisms that survive non-duplication review. A public Case File is organised around one authoritative FM classification."],
  ["PROP", "Proposals", "Candidate governance responses describing the gap to be repaired, the proposed change, and the intended control effect. A proposal is not evidence that a repair has been implemented."],
  ["PATCH", "Repairs", "Implementation records showing where a governance response was actually placed, or where verified existing coverage was relied upon, together with provenance and verification state."],
  ["LEARN", "Governance lessons", "Durable learning records that preserve corrected reasoning, reusable lessons, future applications, limitations, and recurrence risk after an investigation."],
];

const taxonomyPrinciples = [
  ["Structural failure family", "Classifies what failed using a controlled set of runtime and governance failure families, so similar mechanisms can be compared across different systems and incidents."],
  ["Orthogonal failure metadata", "Keeps manifestation, cause, failure locus, severity, persistence, replayability, observability, propagation, evidence state and repair responsibility distinct rather than collapsing them into one label."],
  ["Evidence-linked classification", "Failure Mode records apply the taxonomy to evidence. The taxonomy provides the common classification language; the FM record preserves the actual evidence, threshold, triage and governance implications."],
];

export default function VigilAbout() {
  return <Shell><VigilObservatoryNav /><main className="vigil-about-page"><div className="container mx-auto max-w-[1220px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <header className="vigil-about-hero">
      <p className="vigil-library-kicker">VIGIL Observatory</p>
      <h1>About VIGIL</h1>
      <p>VIGIL is an evidence-to-repair observatory for AI governance. It records externally observable incidents, research, platform behaviours and governance signals; identifies repeatable failure modes; routes diagnosis and repair; preserves record and repair provenance; and records reusable learning.</p>
    </header>

    <section className="vigil-about-section" aria-labelledby="vigil-method-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Evidence to repair</p><h2 id="vigil-method-heading">How a VIGIL case is structured</h2></div>
      <p className="vigil-about-record-intro">Sections 01–06 form the canonical evidence-to-repair investigation. Section 07, References, provides the external evidence, canonical VIGIL citations and repair provenance needed to audit the Case File or generated report. VIGIL record routing remains conditional, so an investigation may enter the lifecycle at different points and does not require every record type.</p>
      <div className="vigil-about-flow-scroll" role="region" aria-label="VIGIL six-stage evidence-to-repair report model" tabIndex={0}>
        <div className="vigil-about-flow">
          {VIGIL_EVIDENCE_REPAIR_SECTIONS.map((section) => <article key={section.number}><span>Stage {section.number}</span><h3>{section.label}</h3><p>{section.description}</p></article>)}
          <article key={VIGIL_REFERENCES_SECTION.number}><span>Stage {VIGIL_REFERENCES_SECTION.number}</span><h3>{VIGIL_REFERENCES_SECTION.label}</h3><p>{VIGIL_REFERENCES_SECTION.description}</p></article>
        </div>
      </div>
      <p className="vigil-about-note">Contextual relationships may help explain a record, but they do not automatically expand an authoritative Case File, change its failure classification, or create a repair claim.</p>
    </section>

    <section className="vigil-about-section" aria-labelledby="vigil-taxonomy-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Failure taxonomy</p><h2 id="vigil-taxonomy-heading">How VIGIL groups structurally similar failures</h2></div>
      <p className="vigil-about-record-intro"><strong>VIGIL-2026-STD-0001 — Runtime &amp; Governance Failure Taxonomy</strong> is VIGIL&apos;s internal interpretive standard for AI-system failure classification. It provides a shared language for comparing failure mechanisms across systems, incidents and deployment contexts without treating every manifestation as a separate class.</p>
      <div className="vigil-about-boundary-grid">
        {taxonomyPrinciples.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </div>
      <p className="vigil-about-note">The taxonomy includes execution, arbitration, epistemic, relational, security and integrity, state and context, UX and representation, governance, infrastructure and continuity, classification, and economic and legitimacy failure families. Classification is interpretive: it does not independently establish legal liability, regulatory status, enforcement authority or final incident truth.</p>
    </section>

    <section className="vigil-about-section" aria-labelledby="vigil-record-types-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Record system</p><h2 id="vigil-record-types-heading">VIGIL record types</h2></div>
      <p className="vigil-about-record-intro">A Case File is a public investigation view assembled from distinct canonical records. Those records retain separate evidentiary and governance roles in the ledger; they are not flattened into one document.</p>
      <div className="vigil-about-record-grid">{recordTypes.map(([code, title, text]) => <article key={code}><span>{code}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
  </div></main></Shell>;
}
