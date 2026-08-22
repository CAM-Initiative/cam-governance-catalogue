import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";

const stages = [
  { number: "01", label: "Evidence", text: "Preserve an observable incident, research result, platform behaviour, or other governance-relevant signal with its source and evidentiary limits." },
  { number: "02", label: "Classify", text: "Identify the repeatable failure mode and connect it to the authoritative governance taxonomy without treating contextual links as co-equal classifications." },
  { number: "03", label: "Diagnose", text: "Identify the governance weakness and the control, assessment, or institutional response that may be required." },
  { number: "04", label: "Respond", text: "Record an implemented repair, relied-upon existing control, verification state, and any remaining gap." },
  { number: "05", label: "Learn", text: "Preserve the corrected governance reasoning, reusable lesson, future applications, limitations, and recurrence risk." },
];

const recordTypes = [
  ["OBS", "Observations", "Source-linked records of externally observable events, system behaviour, or governance-relevant signals. They preserve what was observed without converting the observation itself into a general failure claim."],
  ["RESEARCH", "Research", "Structured research and evidence-synthesis records that test, contextualise, or reconcile claims across sources while preserving what is established, inferred, and unresolved."],
  ["FM", "Failure modes", "Repeatable governance-relevant failure mechanisms that survive non-duplication review. A public Case File is organised around one authoritative FM classification."],
  ["PROP", "Proposals", "Candidate governance responses describing the gap to be repaired, the proposed change, and the intended control effect. A proposal is not evidence that a repair has been implemented."],
  ["PATCH", "Repairs", "Implementation records showing where a governance response was actually placed, or where verified existing coverage was relied upon, together with provenance and verification state."],
  ["LEARN", "Governance lessons", "Durable learning records that preserve corrected reasoning, reusable lessons, future applications, limitations, and recurrence risk after an investigation."],
];

export default function VigilAbout() {
  return <Shell><VigilObservatoryNav /><main className="vigil-about-page"><div className="container mx-auto max-w-[1220px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <header className="vigil-about-hero">
      <p className="vigil-library-kicker">VIGIL Observatory</p>
      <h1>About VIGIL</h1>
      <p>VIGIL is an evidence-to-repair observatory for AI governance. It records externally observable incidents, research, platform behaviours and governance signals; identifies repeatable failure modes; routes diagnosis and repair; preserves implementation provenance; and records reusable learning.</p>
      <p>VIGIL is not a regulator, legal determination system, safety certification body, or final incident adjudication authority. Its records are governance artefacts designed to support analysis, scrutiny, traceability and repair.</p>
    </header>

    <section className="vigil-about-section" aria-labelledby="vigil-method-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Evidence to repair</p><h2 id="vigil-method-heading">How an investigation moves through VIGIL</h2></div>
      <div className="vigil-about-flow">{stages.map((stage) => <article key={stage.number}><span>{stage.number}</span><h3>{stage.label}</h3><p>{stage.text}</p></article>)}</div>
      <p className="vigil-about-note">Contextual relationships may help explain a record, but they do not automatically expand an authoritative Case File, change its failure classification, or create a repair claim.</p>
    </section>

    <section className="vigil-about-section" aria-labelledby="vigil-record-types-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Record system</p><h2 id="vigil-record-types-heading">VIGIL record types</h2></div>
      <p className="vigil-about-record-intro">A Case File is a public investigation view assembled from distinct canonical records. Those records retain separate evidentiary and governance roles in the ledger; they are not flattened into one document.</p>
      <div className="vigil-about-record-grid">{recordTypes.map(([code, title, text]) => <article key={code}><span>{code}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="vigil-about-section" aria-labelledby="vigil-public-surfaces-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Public surfaces</p><h2 id="vigil-public-surfaces-heading">Three ways to use the Observatory</h2></div>
      <div className="vigil-about-surface-grid">
        <Link href="/observatory/cases"><strong>Case Files</strong><span>Investigate a documented AI failure mode through evidence, classification, diagnosis, response, learning and provenance.</span></Link>
        <Link href="/observatory/knowledge-base"><strong>Knowledge Base</strong><span>Browse governance lessons, authoritative external requirements, and the source/version register.</span></Link>
        <Link href="/observatory/ledger"><strong>Full Ledger</strong><span>Audit the complete record system, workflow state, metadata, raw JSON and administrative relationships.</span></Link>
      </div>
    </section>

    <section className="vigil-about-section vigil-about-boundaries" aria-labelledby="vigil-boundaries-heading">
      <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Interpretive boundaries</p><h2 id="vigil-boundaries-heading">What the public interface is intended to preserve</h2></div>
      <div className="vigil-about-boundary-grid">
        <article><h3>Evidence is bounded</h3><p>Source evidence, VIGIL interpretation, and what is not established are kept distinct. A named platform, model or actor is shown only where the underlying record supports it.</p></article>
        <article><h3>Severity is not priority</h3><p>Severity classifies supported harm potential. Operational priority describes the current governance work queue. They are separate concepts and are not interchangeable.</p></article>
        <article><h3>One Case File, one authoritative FM</h3><p>A Case File may share evidence with other investigations, but contextual or related failure modes do not become additional classifications or alter its severity.</p></article>
        <article><h3>Corpus provenance is not incident evidence</h3><p>Governance-corpus commits, versions and implementation states are repair provenance. They are not presented as external evidentiary citations.</p></article>
      </div>
    </section>
  </div></main></Shell>;
}
