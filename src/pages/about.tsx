import { useState } from "react";
import { ArrowRight, Check, CircleCheckBig, CircleX, Copy, Info } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilAlignmentLegend } from "@/components/vigil/CaseTaxonomyClassification";

const citation = "O’Rourke, M. V. (2026). VIGIL Observatory. CAM Initiative. https://cam-initiative.org";

const ABOUT_CASE_FILE_STAGES = [
  {
    number: "01",
    label: "Incident",
    description: "Record what happened, the affected systems and the public evidence supporting the occurrence.",
  },
  {
    number: "02",
    label: "Assessment",
    description: "Assess governance significance and apply VIGIL-HIM to materialised harm, severity and evidentiary limits.",
  },
  {
    number: "03",
    label: "Classification",
    description: "Map the evidence to the VIGIL Failure Taxonomy and record whether each boundary failed, held or remains unresolved.",
  },
  {
    number: "04",
    label: "Repair",
    description: "Surface the governing class invariants relevant to failure-occurrence and unresolved-boundary mappings; successful-invariant mappings create no Repair requirement.",
  },
  {
    number: "05",
    label: "Conclusion",
    description: "Integrate the evidence, harm assessment, taxonomy relationships and repair implications into a bounded VIGIL interpretation.",
  },
  {
    number: "06",
    label: "References",
    description: "Preserve the evidence sources, taxonomy records, methodology references and canonical Incident supporting the analysis.",
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
            <p className="vigil-about-record-intro">VIGIL uses its own Incident model, VIGIL Harm Impact Methodology (VIGIL-HIM) and VIGIL Observatory Failure Taxonomy. It is separate from CAELESTIS and does not create or amend CAELESTIS doctrine; CAM or CAELESTIS applicability is assessed separately. VIGIL Observatory is also not affiliated with <a href="https://vigil.agency/" target="_blank" rel="noreferrer">Vigil</a>, the open-source AI-powered security operations platform, or <a href="https://vigilsoc.org/" target="_blank" rel="noreferrer">Vigil SOC</a>, the open-source AI security operations project.</p>
            <div className="vigil-about-hero-actions" aria-label="Explore VIGIL Observatory">
              <Link href="/observatory/cases/">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
              <Link href="/observatory/knowledge-base/failure-taxonomy/">Explore the Failure Taxonomy <ArrowRight aria-hidden="true" /></Link>
              <Link href="/observatory/severity-methodology/">Harm &amp; Severity Methodology <ArrowRight aria-hidden="true" /></Link>
            </div>
          </section>

          <section className="vigil-about-section" aria-labelledby="vigil-method-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Case File method</p>
              <h2 id="vigil-method-heading">Every Incident moves through the same six-stage evidence-to-conclusion structure</h2>
            </div>
            <p className="vigil-about-record-intro">The Case File structure keeps distinct questions separate and then reconnects them at the conclusion. <strong>Incident</strong> establishes what happened and the evidence available. <strong>Assessment</strong> evaluates governance significance and uses VIGIL-HIM to classify materialised harm and severity. <strong>Classification</strong> asks a different question: which governance or control boundaries in the VIGIL Failure Taxonomy were engaged, and what happened at each boundary.</p>
            <p className="vigil-about-record-intro">Harm severity and taxonomy classification are deliberately independent. Severity describes consequence; taxonomy describes mechanism and boundary behaviour. A reported Incident is not automatically evidence of a governance failure, and a serious harm rating does not by itself determine which Failure Class applies.</p>
            <p className="vigil-about-record-intro"><strong>Repair</strong> then surfaces the governing class invariants relevant to mappings that failed or remain unresolved. Successful-invariant mappings stay visible in Classification as evidence of governance that held and do not create a Repair requirement. <strong>Conclusion</strong> integrates those separate findings, while <strong>References</strong> preserve the evidence, taxonomy and methodology chain supporting the analysis.</p>
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
              <h2 id="vigil-taxonomy-heading">Mappings classify individual boundaries. The Case File summarises the combined outcome.</h2>
            </div>
            <p className="vigil-about-record-intro">The maintained VIGIL Observatory Failure Taxonomy provides shared classification language for recurring AI governance and control-failure mechanisms. Broad <strong>Failure Families</strong> provide stable structure; individual <strong>Failure Classes</strong> define a repeatable mechanism, recognition criteria, exclusions and the governing invariant relevant to that boundary.</p>
            <p className="vigil-about-record-intro">Classification happens at the <strong>mapping level</strong>. One Incident may engage several Failure Classes, and each relationship is recorded separately as <strong>Failure occurred</strong>, <strong>Invariant held</strong> or <strong>Boundary unresolved</strong>. The legend below is the visual key used throughout VIGIL Case Files.</p>
            <VigilAlignmentLegend detailed />

            <div className="vigil-about-outcome-explainer">
              <h3>From mapping roles to the Case File outcome</h3>
              <p>After the individual mappings are assessed, VIGIL presents the Case File using one of three alignment-outcome treatments. This prevents a multi-boundary Incident from being flattened into a single label when different governance boundaries behaved differently.</p>
              <div className="vigil-about-case-outcome-grid">
                <article>
                  <div className="vigil-about-outcome-visual is-failure" aria-hidden="true"><CircleX /></div>
                  <h3>Failure-classified Incident</h3>
                  <p>The relevant taxonomy mappings evidence failure occurrence. Their governing class invariants flow into Repair; harm severity remains a separate VIGIL-HIM assessment.</p>
                </article>
                <article>
                  <div className="vigil-about-outcome-visual is-exemplar" aria-hidden="true"><CircleCheckBig /></div>
                  <h3>Successful-invariant exemplar</h3>
                  <p>The tested governance boundary or boundaries held under pressure. The mappings remain attached to their Failure Classes as successful evidence and do not create a Repair requirement.</p>
                </article>
                <article>
                  <div className="vigil-about-outcome-visual is-combination" aria-hidden="true"><Info /></div>
                  <h3>Combination · mixed alignment</h3>
                  <p>The Case File contains different mapping roles, or an unresolved boundary, so neither a single aligned nor misaligned label describes the whole occurrence. Each relationship remains separately visible in Classification.</p>
                </article>
              </div>
            </div>

            <div className="vigil-about-boundary-grid">
              <article><h3>Failure family</h3><p>The broad structural grouping: the governance boundary or system function involved.</p></article>
              <article><h3>Failure class</h3><p>The repeatable mechanism within a family, with its own definition, recognition criteria, exclusions and governing invariant.</p></article>
              <article><h3>Mapping role</h3><p>The evidentiary relationship between this Incident and one Failure Class: failure occurred, invariant held or boundary unresolved.</p></article>
              <article><h3>Case File outcome</h3><p>The summary treatment derived from all mapping roles together: failure-classified, successful-invariant exemplar or combination / mixed alignment.</p></article>
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
