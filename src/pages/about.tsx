import { useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VIGIL_INCIDENT_CASE_SECTIONS } from "@/lib/vigilCaseSections";

const citation = "O’Rourke, M. V. (2026). VIGIL Observatory. CAM Initiative. https://cam-initiative.org";

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
  return <button className="vigil-about-copy" type="button" onClick={copy} aria-label="Copy VIGIL Observatory citation">
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
          <p>VIGIL Observatory is the CAM Initiative&apos;s evidence-to-repair observatory for AI governance failures. It preserves public Incident evidence, assesses materialised consequence and governance significance, classifies recurring failure mechanisms through a maintained taxonomy, and connects findings to accountable repair.</p>
          <div className="vigil-about-hero-actions" aria-label="Explore VIGIL Observatory">
            <Link href="/observatory/cases">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
            <Link href="/observatory/knowledge-base/failure-taxonomy">Explore the Failure Taxonomy <ArrowRight aria-hidden="true" /></Link>
          </div>
        </header>

        <article className="vigil-about-document">
          <section className="vigil-about-section" aria-labelledby="vigil-method-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Case File method</p>
              <h2 id="vigil-method-heading">Every Incident follows the same five-stage structure</h2>
            </div>
            <p className="vigil-about-record-intro">The Case File structure keeps evidence of what happened separate from occurrence-level assessment and severity, taxonomy classification, the governing invariant a repair must restore, and the material used to support those conclusions.</p>
            <p className="vigil-about-record-intro">A reported incident is not automatically a new failure class. VIGIL Observatory asks what mechanism failed, whether that mechanism is already represented in the taxonomy, and what the available evidence actually supports.</p>
            <div className="vigil-about-flow-scroll" role="region" aria-label="VIGIL Observatory five-stage Incident Case File model" tabIndex={0}>
              <div className="vigil-about-flow">
                {VIGIL_INCIDENT_CASE_SECTIONS.map((section) => <article key={section.number}>
                  <span>Stage {section.number}</span>
                  <h3>{section.label}</h3>
                  <p>{section.description}</p>
                </article>)}
              </div>
            </div>
          </section>

          <section className="vigil-about-section" aria-labelledby="vigil-taxonomy-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">VIGIL Observatory Failure Taxonomy</p>
              <h2 id="vigil-taxonomy-heading">Failure families organise the landscape. Failure classes identify the mechanism.</h2>
            </div>
            <p className="vigil-about-record-intro">The maintained VIGIL Observatory Failure Taxonomy provides shared classification language for recurring AI governance and control-failure mechanisms. Broad families provide stable structure; individual classes define the mechanism precisely enough to support comparison without collapsing unlike events together.</p>
            <div className="vigil-about-boundary-grid">
              <article><h3>Failure family</h3><p>The broad structural grouping: the governance boundary or system function involved.</p></article>
              <article><h3>Failure class</h3><p>The repeatable mechanism within a family, with its own definition, recognition criteria, exclusions and relationships.</p></article>
              <article><h3>Case File classification</h3><p>The evidence-bounded application of that shared classification language to a particular occurrence.</p></article>
              <article className="vigil-about-grid-action">
                <Link href="/observatory/knowledge-base/failure-taxonomy">Browse the taxonomy <ArrowRight aria-hidden="true" /></Link>
              </article>
            </div>
          </section>

          <section className="vigil-about-section" aria-labelledby="vigil-publication-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Publication & provenance</p>
              <h2 id="vigil-publication-heading">Independent, inspectable and explicit about its boundaries</h2>
            </div>
            <p className="vigil-about-record-intro">VIGIL Observatory is published by <strong>CAM Initiative</strong> and maintained by <strong>Dr Michelle Vivian O&apos;Rourke</strong>. Case Files are designed to preserve evidence, provenance, uncertainty and the basis for assessment so that published conclusions remain independently inspectable.</p>
            <div className="vigil-about-boundary-grid vigil-about-publication-grid">
              <article><h3>Evidence-bounded findings</h3><p>Case Files preserve source provenance, evidentiary limitations, uncertainty and the basis for assessment rather than presenting repository inclusion as final factual truth.</p></article>
              <article><h3>Publicly inspectable</h3><p>VIGIL Observatory is deliberately available for scrutiny, citation, policy discussion and research reference. Public availability does not constitute an open licence.</p></article>
              <article><h3>Separate authority layers</h3><p>VIGIL Observatory assesses observed governance failures. CAELESTIS governance instruments become authoritative only through their own amendment, validation and adoption processes.</p></article>
              <article className="vigil-about-grid-action vigil-about-resource-links" aria-label="Institutional and legal information">
                <Link href="/licensing">Copyright & Licence <ArrowRight aria-hidden="true" /></Link>
                <Link href="/privacy">Privacy <ArrowRight aria-hidden="true" /></Link>
                <a href="https://github.com/CAM-Initiative/Vigil" target="_blank" rel="noreferrer">VIGIL Observatory repository <ArrowRight aria-hidden="true" /></a>
              </article>
            </div>
          </section>

          {/* Institutional identity is stated once here; compact copyright marks elsewhere use CAM Initiative. */}
          <section className="vigil-about-section" aria-labelledby="vigil-organisation-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Organisation & founder</p>
              <h2 id="vigil-organisation-heading">About CAM Initiative</h2>
            </div>
            <p className="vigil-about-record-intro"><strong>CAM Initiative is operated by Phoenix Covenant Pty Ltd trading as CAM Initiative (ABN 14 692 195 529)</strong>, an Australian private company active from <strong>27 October 2025</strong> and based in Western Australia.</p>
            <p className="vigil-about-record-intro">The CAM Initiative was founded by <strong>Dr Michelle Vivian O&apos;Rourke</strong>. Dr O&apos;Rourke completed a PhD in analytical chemistry at La Trobe University in Melbourne, Victoria. She is a mother of two and works professionally in environmental health and contaminated-land practice.</p>
            <p className="vigil-about-record-intro vigil-about-affiliation-note">The CAM Initiative and the CAELESTIS Architecture Model are not affiliated with the separate Caelestis project at <a href="https://caelestis-project.eu/" target="_blank" rel="noreferrer">caelestis-project.eu</a>.</p>
          </section>

          <section className="vigil-about-section" aria-labelledby="vigil-citation-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Citation</p>
              <h2 id="vigil-citation-heading">Cite the work while preserving the relevant record or version</h2>
            </div>
            <div className="vigil-about-citation-card">
              <div><p className="vigil-library-kicker">Suggested general citation</p><p>{citation}</p></div>
              <CopyCitation />
            </div>
            <p className="vigil-about-record-intro">For a specific Incident or taxonomy entry, identify the relevant VIGIL Observatory record ID or taxonomy version and use the canonical URL. Citation, reference and linking are permitted; substantive reuse is governed by the applicable licence.</p>
          </section>
        </article>
      </div>
    </main>
  </Shell>;
}
