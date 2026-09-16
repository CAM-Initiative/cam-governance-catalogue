import { useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VIGIL_INCIDENT_CASE_SECTIONS } from "@/lib/vigilCaseSections";

const pillars = [
  ["Evidence", "Preserve the occurrence, source material and evidentiary limits so the factual basis remains inspectable."],
  ["Diagnosis", "Separate materialised consequence, severity and the repeatable governance or control-failure mechanism."],
  ["Repair", "Translate diagnosis into the invariant or governance constraint that must hold, with evidence available for later review."],
];

const taxonomyPrinciples = [
  ["Failure family", "The broad structural grouping: the governance boundary or system function involved."],
  ["Failure class", "The repeatable mechanism within a family, with its own definition, recognition criteria, exclusions and relationships."],
  ["Case File classification", "The evidence-bounded application of that shared classification language to a particular occurrence."],
];

const citation = "O’Rourke, M. V. (2026). VIGIL Observatory. CAM Initiative. https://www.cam-initiative.org/about";

function CopyCitation() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return <button className="vigil-about-copy" type="button" onClick={copy} aria-label="Copy VIGIL citation">
    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    {copied ? "Copied" : "Copy citation"}
  </button>;
}

export default function About() {
  return <Shell>
    <main className="vigil-about-page">
      <div className="container mx-auto max-w-[1220px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
        <header className="vigil-about-hero">
          <p className="vigil-library-kicker">CAM Initiative · VIGIL Observatory</p>
          <h1>About VIGIL Observatory</h1>
          <p>VIGIL is the CAM Initiative&apos;s evidence-to-repair observatory for AI governance failures. It preserves public Incident evidence, separates consequence from diagnosis, classifies recurring failure mechanisms through a maintained taxonomy, and connects findings to accountable repair.</p>
          <div className="vigil-about-hero-actions" aria-label="Explore VIGIL">
            <Link href="/observatory/cases">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
            <Link href="/observatory/knowledge-base/failure-taxonomy">Explore the Failure Taxonomy <ArrowRight aria-hidden="true" /></Link>
          </div>
        </header>

        <section className="vigil-about-section" aria-labelledby="vigil-purpose-heading">
          <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Purpose</p><h2 id="vigil-purpose-heading">From evidence to an accountable governance response</h2></div>
          <p className="vigil-about-record-intro">VIGIL is designed to make the reasoning between an observed AI-system occurrence and a governance response visible. It does not treat a reported incident, a severity rating and a failure classification as the same thing.</p>
          <div className="vigil-about-boundary-grid vigil-about-purpose-grid">
            {pillars.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section className="vigil-about-section" aria-labelledby="vigil-method-heading">
          <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Case File method</p><h2 id="vigil-method-heading">Every Incident follows the same five-stage structure</h2></div>
          <p className="vigil-about-record-intro">The Case File structure keeps evidence of what happened separate from occurrence-level diagnosis and severity, taxonomy classification, the governing invariant a repair must restore, and the material used to support those conclusions.</p>
          <div className="vigil-about-flow-scroll" role="region" aria-label="VIGIL Observatory five-stage Incident Case File model" tabIndex={0}>
            <div className="vigil-about-flow">
              {VIGIL_INCIDENT_CASE_SECTIONS.map((section) => <article key={section.number}><span>Stage {section.number}</span><h3>{section.label}</h3><p>{section.description}</p></article>)}
            </div>
          </div>
          <p className="vigil-about-note">A reported incident is not automatically a new failure class. VIGIL asks what mechanism failed, whether that mechanism is already represented in the taxonomy, and what the available evidence actually supports.</p>
        </section>

        <section className="vigil-about-section" aria-labelledby="vigil-severity-heading">
          <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Harm & severity</p><h2 id="vigil-severity-heading">Severity measures supported consequence, not taxonomy importance</h2></div>
          <p className="vigil-about-record-intro">VIGIL keeps four questions separate: <strong>what harm or consequence materialised</strong>, <strong>how severe that consequence was</strong>, <strong>which failure mechanism occurred</strong>, and <strong>which invariant or repair should hold</strong>. Multiple failure classifications do not increase an Incident&apos;s severity.</p>
          <div className="vigil-about-boundary-grid">
            <article><h3>Evidence first</h3><p>Each harm dimension records an evidence state before a band is selected. Unreported does not mean S1.</p></article>
            <article><h3>Highest supported harm</h3><p>The overall band is controlled by the highest defensible materialised-harm threshold; dimensions are not averaged or summed.</p></article>
            <article><h3>Inspectable thresholds</h3><p>The full VIGIL-HIM 1.0.0 matrix publishes the criteria used for physical, psychological, rights, privacy, economic, operational and other harms.</p></article>
          </div>
          <Link className="vigil-about-action" href="/observatory/severity-methodology">Read the Harm & Severity Methodology <ArrowRight aria-hidden="true" /></Link>
        </section>

        <section className="vigil-about-section" aria-labelledby="vigil-taxonomy-heading">
          <div className="vigil-about-section-heading"><p className="vigil-library-kicker">VIGIL Failure Taxonomy</p><h2 id="vigil-taxonomy-heading">Failure families organise the landscape. Failure classes identify the mechanism.</h2></div>
          <p className="vigil-about-record-intro">The maintained VIGIL Failure Taxonomy provides shared classification language for recurring AI governance and control-failure mechanisms. Broad families provide stable structure; individual classes define the mechanism precisely enough to support comparison without collapsing unlike events together.</p>
          <div className="vigil-about-boundary-grid">{taxonomyPrinciples.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
          <p className="vigil-about-note"><strong>Classification boundary:</strong> source terminology remains source terminology unless it is explicitly identified as a VIGIL classification. The Case File preserves the evidence and reasoning used to make that distinction independently reviewable.</p>
          <Link className="vigil-about-action" href="/observatory/knowledge-base/failure-taxonomy">Browse the taxonomy <ArrowRight aria-hidden="true" /></Link>
        </section>

        <section className="vigil-about-section" aria-labelledby="vigil-publication-heading">
          <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Publication & provenance</p><h2 id="vigil-publication-heading">Independent, inspectable and explicit about its boundaries</h2></div>
          <p className="vigil-about-record-intro">VIGIL is published by <strong>Phoenix Covenant Pty Ltd trading as CAM Initiative</strong>, an Australian AI governance initiative. The CAM Initiative was founded and is led by <strong>Dr Michelle Vivian O&apos;Rourke</strong>, who is identified as VIGIL&apos;s author and maintainer.</p>
          <div className="vigil-about-boundary-grid vigil-about-publication-grid">
            <article><h3>Evidence-bounded findings</h3><p>Case Files preserve source provenance, evidentiary limitations, uncertainty and the basis for diagnosis rather than presenting repository inclusion as final factual truth.</p></article>
            <article><h3>Publicly inspectable</h3><p>VIGIL is deliberately available for scrutiny, citation, policy discussion and research reference. Public availability does not constitute an open licence.</p></article>
            <article><h3>Separate authority layers</h3><p>VIGIL diagnoses observed governance failures. CAELESTIS governance instruments become authoritative only through their own amendment, validation and adoption processes.</p></article>
          </div>
          <div className="vigil-about-link-row" aria-label="Institutional and legal information">
            <Link href="/licensing">Copyright & Licensing <ArrowRight aria-hidden="true" /></Link>
            <Link href="/privacy">Privacy <ArrowRight aria-hidden="true" /></Link>
            <a href="https://github.com/CAM-Initiative/Vigil" target="_blank" rel="noreferrer">VIGIL repository <ArrowRight aria-hidden="true" /></a>
          </div>
          <p className="vigil-about-note">The CAM Initiative and the CAELESTIS Architecture Model are not affiliated with the separate Caelestis project at <a href="https://caelestis-project.eu/" target="_blank" rel="noreferrer">caelestis-project.eu</a>.</p>
        </section>

        <section className="vigil-about-section" aria-labelledby="vigil-citation-heading">
          <div className="vigil-about-section-heading"><p className="vigil-library-kicker">Citation</p><h2 id="vigil-citation-heading">Cite the work while preserving the relevant record or version</h2></div>
          <div className="vigil-about-citation-card"><div><p className="vigil-library-kicker">Suggested general citation</p><p>{citation}</p></div><CopyCitation /></div>
          <p className="vigil-about-note">For a specific Incident or taxonomy entry, identify the relevant VIGIL record ID or taxonomy version and use the canonical URL. Citation, reference and linking are permitted; substantive reuse is governed by the applicable licence.</p>
        </section>
      </div>
    </main>
  </Shell>;
}
