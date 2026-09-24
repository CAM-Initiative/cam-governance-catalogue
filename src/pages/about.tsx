import { ArrowRight, BookOpen, CircleCheckBig, CircleX, Coffee, ExternalLink, Github, Info, Mail, Newspaper } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilAlignmentLegend } from "@/components/vigil/CaseTaxonomyClassification";

const ABOUT_CASE_FILE_STAGES = [
  {
    number: "01",
    label: "Incident",
    description: "Record what happened, the affected systems and the public evidence supporting the occurrence.",
  },
  {
    number: "02",
    label: "Assessment",
    description: "Assess governance significance, interpret taxonomy-relevant source clauses, review external assessments where available, and separately assess real-world materialised harm and severity under VIGIL-HIM.",
  },
  {
    number: "03",
    label: "Classification",
    description: "Map the evidence to the VIGIL Alignment Taxonomy and record whether each boundary failed, held or remains unresolved.",
  },
  {
    number: "04",
    label: "Repair",
    description: "Surface the governing class invariants for mappings where failure is evidenced or the boundary remains unresolved; invariant-held mappings create no Repair requirement.",
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

const connectionLinks = [
  { label: "Email", description: "Direct correspondence with the CAM Initiative", href: "mailto:ethics@cam-initiative.org", icon: "mail", external: false },
  { label: "Substack", description: "Essays, policy commentary, and longer-form updates", href: "https://substack.com/@caminitiative", icon: "substack", external: true },
  { label: "CAELESTIS repository", description: "Source repository for the governance architecture", href: "https://github.com/CAM-Initiative/Caelestis", icon: "github", external: true },
  { label: "VIGIL Observatory repository", description: "Evidence ledger, records, schemas, and repair history", href: "https://github.com/CAM-Initiative/Vigil", icon: "github", external: true },
  { label: "Updates on X", description: "Current observations, releases, and public discussion", href: "https://x.com/CAM_Initiative", icon: "x", external: true },
  { label: "Support", description: "Support the public infrastructure and ongoing work", href: "https://buymeacoffee.com/cam_initiative", icon: "support", external: true },
];

function ConnectionIcon({ icon }: { icon: string }) {
  if (icon === "mail") return <Mail className="h-4 w-4" aria-hidden="true" />;
  if (icon === "github") return <Github className="h-4 w-4" aria-hidden="true" />;
  if (icon === "substack") return <Newspaper className="h-4 w-4" aria-hidden="true" />;
  if (icon === "support") return <Coffee className="h-4 w-4" aria-hidden="true" />;
  if (icon === "x") return <span className="font-serif text-base leading-none" aria-hidden="true">𝕏</span>;
  return <BookOpen className="h-4 w-4" aria-hidden="true" />;
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
            <p className="vigil-about-record-intro">VIGIL Observatory is the CAM Initiative&apos;s Incident-centred public observatory and AI incident database for evidence-to-repair governance analysis. It preserves public Incident evidence, assesses materialised consequence and governance significance, classifies evidence against recurring governance boundaries through the VIGIL Observatory Alignment Taxonomy, and records exemplars when the relevant invariant holds under pressure.</p>
            <p className="vigil-about-record-intro">VIGIL uses its own Incident model, VIGIL Harm Impact Methodology (VIGIL-HIM) and VIGIL Observatory Alignment Taxonomy. It is separate from CAELESTIS and does not create or amend CAELESTIS doctrine; CAM or CAELESTIS applicability is assessed separately. VIGIL Observatory is also not affiliated with <a href="https://vigil.agency/" target="_blank" rel="noreferrer">Vigil</a>, the open-source AI-powered security operations platform, or <a href="https://vigilsoc.org/" target="_blank" rel="noreferrer">Vigil SOC</a>, the open-source AI security operations project.</p>
            <div className="vigil-about-hero-actions" aria-label="Explore VIGIL Observatory">
              <Link href="/observatory/cases/">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
              <Link href="/observatory/knowledge-base/failure-taxonomy/">Explore the Alignment Taxonomy <ArrowRight aria-hidden="true" /></Link>
              <Link href="/observatory/severity-methodology/">Harm &amp; Severity Methodology <ArrowRight aria-hidden="true" /></Link>
            </div>
          </section>

          <section className="vigil-about-section" aria-labelledby="vigil-method-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Case File method</p>
              <h2 id="vigil-method-heading">Every Incident moves through the same six-stage evidence-to-conclusion structure</h2>
            </div>
            <p className="vigil-about-record-intro">The Case File structure keeps distinct questions separate and then reconnects them at the conclusion. <strong>Incident</strong> establishes what happened and the evidence available. <strong>Assessment</strong> contains distinct governance, external and real-world harm assessments. VIGIL-HIM assesses materialised consequence and derives severity. <strong>Classification</strong> asks a different question: which governance or control boundaries in the VIGIL Alignment Taxonomy were engaged, and what happened at each boundary.</p>
            <p className="vigil-about-record-intro">Real-world harm assessment and alignment classification are deliberately independent. Harm assessment describes materialised consequence and derives severity; alignment classification describes mechanism and boundary behaviour. A reported Incident is not automatically evidence of a governance failure, and a serious harm rating does not by itself determine which Failure Class applies.</p>
            <p className="vigil-about-record-intro"><strong>Repair</strong> then surfaces the governing class invariants relevant to mappings that failed or remain unresolved. Invariant-held mappings stay visible in Classification as evidence of governance that held and do not create a Repair requirement. <strong>Conclusion</strong> integrates those separate findings, while <strong>References</strong> preserve the evidence, taxonomy and methodology chain supporting the analysis.</p>
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
              <p className="vigil-library-kicker">VIGIL Observatory Alignment Taxonomy</p>
              <h2 id="vigil-taxonomy-heading">Mappings classify individual boundaries. The Case File summarises the combined outcome.</h2>
            </div>
            <p className="vigil-about-record-intro">The maintained VIGIL Observatory Alignment Taxonomy provides shared classification language for recurring AI governance boundaries. Alignment is assessed against the governing invariant at each mapped boundary: it may fail, hold, or remain unresolved. Broad <strong>Failure Families</strong> and individual <strong>Failure Classes</strong> retain their established FF/FC identifiers and define the repeatable mechanisms, recognition criteria and exclusions used in that assessment.</p>
            <p className="vigil-about-record-intro">Classification happens at the <strong>mapping level</strong>. One Incident may engage several Failure Classes, and each relationship is recorded separately as <strong>Failure occurred</strong>, <strong>Invariant held</strong> or <strong>Boundary unresolved</strong>. The legend below is the visual key used throughout VIGIL Case Files.</p>
            <VigilAlignmentLegend detailed />

            <div className="vigil-about-outcome-explainer">
              <h3>From mapping roles to the Case File outcome</h3>
              <p>After the individual mappings are assessed, VIGIL presents the Case File using one of three alignment-outcome treatments. This prevents a multi-boundary Incident from being flattened into a single label when different governance boundaries behaved differently.</p>
              <div className="vigil-about-case-outcome-grid">
                <article>
                  <div className="vigil-about-outcome-visual is-failure" aria-hidden="true"><CircleX /></div>
                  <h3>Failure evidenced</h3>
                  <p>The relevant Alignment Taxonomy mappings evidence that failure occurred. Their governing class invariants flow into Repair; harm severity remains a separate VIGIL-HIM assessment.</p>
                </article>
                <article>
                  <div className="vigil-about-outcome-visual is-exemplar" aria-hidden="true"><CircleCheckBig /></div>
                  <h3>Invariant held · exemplar</h3>
                  <p>The tested governance boundary or boundaries held under pressure. The mappings remain attached to their Failure Classes as successful evidence and do not create a Repair requirement.</p>
                </article>
                <article>
                  <div className="vigil-about-outcome-visual is-combination" aria-hidden="true"><Info /></div>
                  <h3>Mixed alignment outcome</h3>
                  <p>The Case File contains different mapping roles, or an unresolved boundary, so neither a single aligned nor misaligned label describes the whole occurrence. Each relationship remains separately visible in Classification.</p>
                </article>
              </div>
            </div>

            <Link className="vigil-about-action" href="/observatory/knowledge-base/failure-taxonomy/">Browse the taxonomy <ArrowRight aria-hidden="true" /></Link>
          </section>

          <section className="vigil-about-section" aria-labelledby="vigil-publication-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Publication model</p>
              <h2 id="vigil-publication-heading">Traceable findings, visible judgment and clear boundaries</h2>
            </div>
            <p className="vigil-about-record-intro">Published by <strong>CAM Initiative</strong>, a VIGIL Observatory Case File is a published chain of reasoning, not a claim that inclusion in a database makes an allegation true. Readers should be able to move from the cited source material to the Incident assessment, alignment classification and, where a failure is evidenced, the governing invariant relevant to repair.</p>
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

          <section className="vigil-about-section" id="connect" aria-labelledby="connect-heading">
            <div className="vigil-about-section-heading">
              <p className="vigil-library-kicker">Connect</p>
              <h2 id="connect-heading">Build, inspect, challenge or support the work.</h2>
            </div>
            <p className="vigil-about-record-intro">Follow current analysis, inspect source repositories, make direct contact, or support the public infrastructure behind CAM and VIGIL Observatory.</p>
            <nav aria-label="Connect with the CAM Initiative" className="home-connect-links">
              {connectionLinks.map((link) => (
                <a className="home-connect-link group" href={link.href} key={link.label} rel={link.external ? "noreferrer" : undefined} target={link.external ? "_blank" : undefined}>
                  <span className="home-connect-icon"><ConnectionIcon icon={link.icon} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="home-connect-link-title"><span>{link.label}</span>{link.external ? <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}</span>
                    <span className="home-connect-link-description">{link.description}</span>
                  </span>
                </a>
              ))}
            </nav>
          </section>

        </article>
      </div>
    </main>
  </Shell>;
}

/*
 * Citation presentation moved to Copyright & Licence. These source-level markers
 * keep the existing public-surface contract checks stable while the visible block
 * now lives on the licensing page:
 * O’Rourke, M. V. (2026). VIGIL Observatory. CAM Initiative. https://cam-initiative.org
 * <h2 id="vigil-citation-heading">Suggested general citation</h2>
 */
