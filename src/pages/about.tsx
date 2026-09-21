import { useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilAlignmentLegend } from "@/components/vigil/CaseTaxonomyClassification";

const citation = "O’Rourke, M. V. (2026). VIGIL Observatory. CAM Initiative. https://cam-initiative.org";

const ABOUT_CASE_FILE_STAGES = [
  {
    number: "01",
    label: "Incident",
    description: "What happened, which systems were affected, and what the evidence establishes.",
  },
  {
    number: "02",
    label: "Assessment",
    description: "The occurrence-level governance assessment, including materialised severity and evidentiary limits.",
  },
  {
    number: "03",
    label: "Classification",
    description: "The canonical structural mechanism supported by the assessment and evidence.",
  },
  {
    number: "04",
    label: "Repair",
    description: "The governing invariant condition that a repair must restore and preserve.",
  },
  {
    number: "05",
    label: "Conclusion",
    description: "The integrated VIGIL Observatory interpretation reached after assessment, classification and repair analysis.",
  },
  {
    number: "06",
    label: "References",
    description: "Sources, taxonomy records and the canonical Incident cited in this Case File.",
  },
] as const;


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
    <main className="vigil-about-page" data-about-entity="cam-initiative">
      <div className="container mx-auto max-w-[1220px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
        <header className="vigil-about-hero">
          <p className="vigil-library-kicker">CAM Initiative · Public-interest AI governance</p>
          <h1>About CAM Initiative</h1>
          <p>CAM Initiative develops publicly accessible AI governance infrastructure for understanding systems, supporting compliance, diagnosing failures and navigating change. It brings together governance architecture, regulatory and standards alignment, relational safeguards, technology-failure diagnostics and public-interest governance for emerging systems.</p>
          <div className="vigil-about-identity-summary" aria-label="CAM Initiative organisation and founder">
            <p><strong>CAM Initiative is operated by Phoenix Covenant Pty Ltd trading as CAM Initiative (ABN 14 692 195 529)</strong>, an Australian private company active from <strong>27 October 2025</strong> and based in Western Australia.</p>
            <p>The CAM Initiative was founded by <strong>Dr Michelle Vivian O&apos;Rourke</strong>. Dr O&apos;Rourke completed a PhD in analytical chemistry at La Trobe University in Melbourne, Victoria. She is a mother of two and works professionally in environmental health and contaminated-land practice.</p>
          </div>
        </header>

        <article className="vigil-about-document">

          <section className="vigil-about-section vigil-about-project-container" aria-labelledby="caelestis-architecture-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">CAELESTIS Architecture Model</p>
              <h2 id="caelestis-architecture-heading">Governance architecture for advanced AI systems</h2>
            </div>
            <p className="vigil-about-record-intro">The CAELESTIS Architecture Model (CAM) is a publicly inspectable governance corpus for advanced AI systems, synthetic agents, relational AI environments and digital ecosystem accountability. It sets out constitutional architecture, charters, laws, schedules, registries, symbolic structures and supporting validation infrastructure for CAM-governed contexts.</p>
            <p className="vigil-about-record-intro">The public architecture reference is undergoing a substantive refactor. Its archived public release remains available as version 1.1.0 through Zenodo; the revised architecture will return when its structure, source material and presentation are ready for publication.</p>
            <p className="vigil-about-record-intro">CAELESTIS provides a governance architecture. VIGIL Observatory documents and analyses Incidents independently; a VIGIL assessment or taxonomy relationship does not create or amend CAELESTIS doctrine.</p>
            <p className="vigil-about-record-intro vigil-about-affiliation-note">The CAM Initiative and the CAELESTIS Architecture Model are not affiliated with the separate Caelestis project at <a href="https://caelestis-project.eu/" target="_blank" rel="noreferrer">caelestis-project.eu</a>.</p>
            <div className="vigil-about-link-row" aria-label="CAELESTIS Architecture Model resources">
              <a href="https://doi.org/10.5281/zenodo.20686316" target="_blank" rel="noreferrer">Open archived release <ArrowRight aria-hidden="true" /></a>
              <a href="https://github.com/CAM-Initiative/Caelestis" target="_blank" rel="noreferrer">CAELESTIS repository <ArrowRight aria-hidden="true" /></a>
            </div>
          </section>

          <section className="vigil-about-section vigil-about-project-container" aria-labelledby="vigil-observatory-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">VIGIL Observatory</p>
              <h2 id="vigil-observatory-heading">Public Incident evidence, classification and repair analysis</h2>
            </div>
            <p className="vigil-about-record-intro">VIGIL Observatory is the CAM Initiative&apos;s Incident-centred public observatory and AI incident database for evidence-to-repair governance analysis. It preserves public Incident evidence, assesses materialised consequence and governance significance, classifies recurring failure mechanisms through a maintained taxonomy, and records successful-invariant exemplars when the relevant governance boundary holds under pressure.</p>
            <div className="vigil-about-hero-actions" aria-label="Explore VIGIL Observatory">
              <Link href="/observatory/cases/">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
              <Link href="/observatory/knowledge-base/failure-taxonomy/">Explore the Failure Taxonomy <ArrowRight aria-hidden="true" /></Link>
              <Link href="/observatory/severity-methodology/">Harm &amp; Severity Methodology <ArrowRight aria-hidden="true" /></Link>
            </div>
            <p className="vigil-about-record-intro vigil-about-affiliation-note"><strong>Project boundaries.</strong> VIGIL uses its own Incident model, VIGIL Harm Impact Methodology (VIGIL-HIM) and VIGIL Observatory Failure Taxonomy. It is separate from CAELESTIS and does not create or amend CAELESTIS doctrine; CAM or CAELESTIS applicability is assessed separately. VIGIL Observatory is also not affiliated with <a href="https://vigil.agency/" target="_blank" rel="noreferrer">Vigil</a>, the open-source AI-powered security operations platform, or <a href="https://vigilsoc.org/" target="_blank" rel="noreferrer">Vigil SOC</a>, the open-source AI security operations project.</p>
          </section>

          <section className="vigil-about-section" aria-labelledby="vigil-method-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Case File method</p>
              <h2 id="vigil-method-heading">Every Incident follows the same six-stage structure</h2>
            </div>
            <p className="vigil-about-record-intro">The Case File structure keeps what happened separate from incident-level assessment and severity, taxonomy classification, any governing invariant that a failure requires repair to restore, the integrated VIGIL Observatory conclusion, and the references supporting that analysis.</p>
            <p className="vigil-about-record-intro">A reported Incident is not automatically evidence of a failure, and a failure is not automatically a new class. VIGIL Observatory asks what the evidence establishes, which taxonomy boundary is relevant, and whether that relationship represents a failure-classified Incident or an example of the governing invariant holding successfully.</p>
            <div className="vigil-about-flow-scroll" role="region" aria-label="VIGIL Observatory six-stage Incident Case File model" tabIndex={0}>
              <div className="vigil-about-flow">
                {ABOUT_CASE_FILE_STAGES.map((section) => <article key={section.number}>
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
            <p className="vigil-about-record-intro">Each Case File relationship is explicit. A taxonomy mapping may document a <strong>failure-classified Incident</strong>, where the class mechanism is evidenced, or a <strong>successful-invariant exemplar</strong>, where the same failure boundary was tested but the governing invariant held. Exemplars remain attached to the relevant Failure Class because they show what successful governance looks like; they are not counted as failure evidence and do not create a Repair requirement.</p>
            <VigilAlignmentLegend detailed />
            <div className="vigil-about-boundary-grid">
              <article><h3>Failure family</h3><p>The broad structural grouping: the governance boundary or system function involved.</p></article>
              <article><h3>Failure class</h3><p>The repeatable mechanism within a family, with its own definition, recognition criteria, exclusions and governing invariant.</p></article>
              <article><h3>Failure-classified Incident</h3><p>The evidence supports the class mechanism in the Incident. Where a class invariant is published, Repair identifies the condition that must be restored.</p></article>
              <article><h3>Successful-invariant exemplar</h3><p>The Incident sits on the successful side of the same class boundary: the relevant invariant held under pressure. It remains visible for comparison without being presented as a failure.</p></article>
            </div>
            <Link className="vigil-about-action" href="/observatory/knowledge-base/failure-taxonomy/">Browse the taxonomy <ArrowRight aria-hidden="true" /></Link>
          </section>

          <section className="vigil-about-section" aria-labelledby="vigil-publication-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Publication model</p>
              <h2 id="vigil-publication-heading">Traceable findings, visible judgment and clear boundaries</h2>
            </div>
            <p className="vigil-about-record-intro">Published by <strong>CAM Initiative</strong>, a VIGIL Observatory Case File is a published chain of reasoning, not a claim that inclusion in a database makes an allegation true. Readers should be able to move from the cited source material to the Incident assessment, taxonomy classification and, where a failure is evidenced, the governing invariant relevant to repair.</p>
            <div className="vigil-about-boundary-grid vigil-about-publication-grid">
              <article><h3>Trace the conclusion</h3><p>Sources remain identifiable and the basis for assessment stays attached to the Case File, so a reader can inspect what supports a conclusion rather than relying on the conclusion alone.</p></article>
              <article><h3>Keep evidence and judgment separate</h3><p>What happened, what the evidence supports, how VIGIL assesses the Incident and how it is classified are presented as distinct steps. Interpretation is not disguised as raw evidence.</p></article>
              <article><h3>Publish the limits</h3><p>Uncertainty, evidentiary limits, disputed or provisional classifications and unresolved gaps remain visible instead of being smoothed away to make a record look more certain than it is.</p></article>
              <article><h3>Open to scrutiny, not openly licensed</h3><p>VIGIL Observatory is publicly available for reading, citation, research and policy scrutiny. Public availability does not place the work under an open licence.</p></article>
            </div>
            <p className="vigil-about-record-intro">VIGIL Observatory publishes evidence-bounded assessments and taxonomy relationships. It does not create or amend CAM or CAELESTIS doctrine. Any CAM or CAELESTIS applicability is assessed separately, and those instruments become authoritative only through their own amendment, validation and adoption processes.</p>
            <div className="vigil-about-link-row" aria-label="VIGIL Observatory publication and legal information">
              <Link href="/licensing/">Copyright & Licence <ArrowRight aria-hidden="true" /></Link>
              <Link href="/privacy/">Privacy <ArrowRight aria-hidden="true" /></Link>
              <a href="https://github.com/CAM-Initiative/Vigil" target="_blank" rel="noreferrer">VIGIL Observatory repository <ArrowRight aria-hidden="true" /></a>
            </div>
          </section>

          <section className="vigil-about-section" aria-labelledby="vigil-citation-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Citation</p>
              <h2 id="vigil-citation-heading">Suggested general citation</h2>
            </div>
            <div className="vigil-about-citation-card">
              <div><p>{citation}</p></div>
              <CopyCitation />
            </div>
            <p className="vigil-about-record-intro">For a specific Incident or taxonomy entry, identify the relevant VIGIL Observatory record ID or taxonomy version and use the canonical URL. Citation, reference and linking are permitted; substantive reuse is governed by the applicable licence.</p>
          </section>

        </article>
      </div>
    </main>
  </Shell>;
}
