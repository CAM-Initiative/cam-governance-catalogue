import { ArrowRight, BookOpen, Coffee, ExternalLink, Github, Mail, Newspaper } from "lucide-react";
import { Link } from "wouter";
import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";

const founderPhotoHref = "https://raw.githubusercontent.com/CAM-Initiative/Registry/main/Images/Website/founder-photo.jpg";

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

const aboutRail = [
  { href: "#overview", label: "Overview" },
  { href: "#observatory", label: "VIGIL Observatory" },
  { href: "#method", label: "Case File method" },
  { href: "#taxonomy", label: "Alignment Taxonomy" },
  { href: "#publication", label: "Publication model" },
  { href: "#architecture", label: "CAELESTIS Architecture Model" },
  { href: "#connect", label: "Connect" },
];

const connectionLinks = [
  { label: "Email", description: "Direct correspondence with the CAM Initiative", href: "mailto:ethics@cam-initiative.org", icon: "mail", external: false },
  { label: "Substack", description: "Essays, policy commentary, and longer-form updates", href: "https://substack.com/@caminitiative", icon: "substack", external: true },
  { label: "CAELESTIS repository", description: "Source repository for the governance architecture", href: "https://github.com/CAM-Initiative/Caelestis", icon: "github", external: true },
  { label: "VIGIL Observatory repository", description: "Evidence ledger, records, schemas, and repair history", href: "https://github.com/CAM-Initiative/Vigil", icon: "github", external: true },
  { label: "Updates on X", description: "Current observations, releases, and public discussion", href: "https://x.com/CAM_Initiative", icon: "x", external: true },
  { label: "Support", description: "Support the public infrastructure and ongoing work", href: "https://buymeacoffee.com/cam_initiative", icon: "support", external: true },
];

function ConnectionIcon({ icon }: { icon: string }) {
  if (icon === "mail") return <Mail aria-hidden="true" />;
  if (icon === "github") return <Github aria-hidden="true" />;
  if (icon === "substack") return <Newspaper aria-hidden="true" />;
  if (icon === "support") return <Coffee aria-hidden="true" />;
  if (icon === "x") return <span className="about-link-x" aria-hidden="true">𝕏</span>;
  return <BookOpen aria-hidden="true" />;
}

export default function About() {
  return <Shell>
    <main className="vigil-about-page home-menu-page document-page" data-about-entity="cam-initiative">
      <div className="document-layout document-layout--wide">
        <DocumentRail title="About CAM" items={aboutRail} ariaLabel="About CAM Initiative sections" />

        <article className="document-content vigil-about-document">
          <header id="overview" className="document-hero about-hero">
            <div className="about-hero-copy">
              <p className="vigil-library-kicker">CAM Initiative · Public-interest AI governance</p>
              <h1>About CAM Initiative</h1>
              <p>CAM Initiative develops publicly accessible AI governance infrastructure for understanding systems, supporting compliance, diagnosing failures and navigating change. It brings together governance architecture, regulatory and standards alignment, relational safeguards, technology-failure diagnostics and public-interest governance for emerging systems.</p>
              <div className="about-identity-summary">
                <p><strong>CAM Initiative is operated by Phoenix Covenant Pty Ltd trading as CAM Initiative (ABN 14 692 195 529)</strong>, an Australian private company active from <strong>27 October 2025</strong> and based in Western Australia.</p>
                <p>The CAM Initiative was founded by <strong>Dr Michelle Vivian O&apos;Rourke</strong>. Dr O&apos;Rourke completed a PhD in analytical chemistry at La Trobe University in Melbourne, Victoria. She is a mother of two and works professionally in environmental health and contaminated-land practice.</p>
              </div>
              <a className="cam-action cam-action-primary" href="mailto:ethics@cam-initiative.org">Contact</a>
            </div>

            <figure className="about-founder-portrait">
              <img src={founderPhotoHref} alt="Dr Michelle Vivian O’Rourke, founder of CAM Initiative" />
              <figcaption>
                <strong>Dr Michelle Vivian O&apos;Rourke</strong>
                <span>Founder · CAM Initiative</span>
              </figcaption>
            </figure>
          </header>

          <section id="observatory" className="document-section vigil-about-section" aria-labelledby="vigil-observatory-heading">
            <div className="document-section-heading">
              <p>VIGIL Observatory</p>
              <h2 id="vigil-observatory-heading">Public Incident evidence, classification and repair analysis</h2>
            </div>
            <div className="document-reading">
              <p>VIGIL Observatory is the CAM Initiative&apos;s Incident-centred public observatory and AI incident database for evidence-to-repair governance analysis. It preserves public Incident evidence, assesses materialised consequence and governance significance, classifies evidence against recurring governance boundaries through the VIGIL Observatory Alignment Taxonomy, and records exemplars when the relevant invariant holds under pressure.</p>
              <p>VIGIL uses its own Incident model, VIGIL Harm Impact Methodology (VIGIL-HIM) and VIGIL Observatory Alignment Taxonomy. It is separate from CAELESTIS and does not create or amend CAELESTIS doctrine; CAM or CAELESTIS applicability is assessed separately. VIGIL Observatory is also not affiliated with <a href="https://vigil.agency/" target="_blank" rel="noreferrer">Vigil</a>, the open-source AI-powered security operations platform, or <a href="https://vigilsoc.org/" target="_blank" rel="noreferrer">Vigil SOC</a>, the open-source AI security operations project.</p>
            </div>
            <div className="cam-action-row">
              <Link className="cam-action cam-action-secondary" href="/observatory/cases/">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
              <Link className="cam-action cam-action-secondary" href="/observatory/knowledge-base/failure-taxonomy/">Explore the Alignment Taxonomy <ArrowRight aria-hidden="true" /></Link>
              <Link className="cam-action cam-action-secondary" href="/observatory/severity-methodology/">Harm Impact Assessment <ArrowRight aria-hidden="true" /></Link>
            </div>
          </section>

          <section id="method" className="document-section vigil-about-section" aria-labelledby="vigil-method-heading">
            <div className="document-section-heading">
              <p>Case File method</p>
              <h2 id="vigil-method-heading">One evidence-to-conclusion structure for every Incident</h2>
            </div>
            <div className="document-reading">
              <p>The Case File structure keeps distinct questions separate and reconnects them at the conclusion. <strong>Assessment</strong> contains distinct governance, external and real-world harm assessments. VIGIL-HIM assesses materialised consequence and derives severity; <strong>Classification</strong> asks which governance or control boundaries in the VIGIL Alignment Taxonomy were engaged and what happened at each boundary.</p>
              <p>Real-world harm assessment and alignment classification are deliberately independent: harm assessment describes materialised consequence and derives severity; alignment classification describes mechanism and boundary behaviour. A reported Incident is not automatically evidence of a governance failure, and a serious harm rating does not by itself determine which Fidelity Class applies.</p>
            </div>
            <ol className="about-method-list" aria-label="VIGIL Observatory six-stage Incident Case File model">
              {ABOUT_CASE_FILE_STAGES.map((stage) => <li key={stage.number}>
                <span className="about-method-number">{stage.number}</span>
                <div>
                  <h3>{stage.label}</h3>
                  <p>{stage.description}</p>
                </div>
              </li>)}
            </ol>
          </section>

          <section id="taxonomy" className="document-section vigil-about-section" aria-labelledby="vigil-taxonomy-heading">
            <div className="document-section-heading">
              <p>VIGIL Observatory Alignment Taxonomy</p>
              <h2 id="vigil-taxonomy-heading">Mappings classify individual boundaries. The Case File summarises the combined outcome.</h2>
            </div>
            <div className="document-reading">
              <p>The maintained VIGIL Observatory Alignment Taxonomy provides shared classification language for recurring AI governance boundaries. Alignment is assessed against the governing invariant at each mapped boundary: it may fail, hold, or remain unresolved. Broad <strong>Fidelity Families</strong> and individual <strong>Fidelity Classes</strong> retain their established FF/FC identifiers and define the repeatable mechanisms, recognition criteria and exclusions used in that assessment.</p>
              <p>Classification happens at the <strong>mapping level</strong>. One Incident may engage several Fidelity Classes, and each relationship is recorded separately as <strong>Failure occurred</strong>, <strong>Invariant held</strong> or <strong>Boundary unresolved</strong>.</p>
            </div>
            <dl className="about-outcome-list">
              <div>
                <dt>Failure evidenced</dt>
                <dd>The relevant Alignment Taxonomy mappings evidence that failure occurred. Their governing class invariants flow into Repair; harm severity remains a separate VIGIL-HIM assessment.</dd>
              </div>
              <div>
                <dt>Invariant held · exemplar</dt>
                <dd>The tested governance boundary or boundaries held under pressure. The mappings remain attached to their Fidelity Classes as successful evidence and do not create a Repair requirement.</dd>
              </div>
              <div>
                <dt>Mixed alignment outcome</dt>
                <dd>The Case File contains different mapping roles, or an unresolved boundary, so neither a single aligned nor misaligned label describes the whole occurrence. Each relationship remains separately visible in Classification.</dd>
              </div>
            </dl>
            <div className="cam-action-row">
              <Link className="cam-action cam-action-secondary" href="/observatory/knowledge-base/failure-taxonomy/">Browse the taxonomy <ArrowRight aria-hidden="true" /></Link>
            </div>
          </section>

          <section id="publication" className="document-section vigil-about-section" aria-labelledby="vigil-publication-heading">
            <div className="document-section-heading">
              <p>Publication model</p>
              <h2 id="vigil-publication-heading">Traceable findings, visible judgment and clear boundaries</h2>
            </div>
            <div className="document-reading">
              <p>Published by <strong>CAM Initiative</strong>, a VIGIL Observatory Case File is a published chain of reasoning, not a claim that inclusion in a database makes an allegation true. Readers should be able to move from the cited source material to the Incident assessment, alignment classification and, where a failure is evidenced, the governing invariant relevant to repair.</p>
            </div>
            <div className="about-principle-list">
              <section><h3>Trace the conclusion</h3><p>Sources remain identifiable and the basis for assessment stays attached to the Case File, so a reader can inspect what supports a conclusion rather than relying on the conclusion alone.</p></section>
              <section><h3>Keep evidence and judgment separate</h3><p>What happened, what the evidence supports, how VIGIL assesses the Incident and how it is classified are presented as distinct steps. Interpretation is not disguised as raw evidence.</p></section>
              <section><h3>Publish the limits</h3><p>Uncertainty, evidentiary limits, disputed or provisional classifications and unresolved gaps remain visible instead of being smoothed away to make a record look more certain than it is.</p></section>
              <section><h3>Open to scrutiny, not openly licensed</h3><p>VIGIL Observatory is publicly available for reading, citation, research and policy scrutiny. Public availability does not place the work under an open licence.</p></section>
            </div>
            <div className="document-reading">
              <p>VIGIL Observatory publishes evidence-bounded assessments and taxonomy relationships. It does not create or amend CAM or CAELESTIS doctrine. Any CAM or CAELESTIS applicability is assessed separately, and those instruments become authoritative only through their own amendment, validation and adoption processes.</p>
            </div>
            <div className="cam-action-row">
              <Link className="cam-action cam-action-secondary" href="/licensing/">Copyright &amp; Licence <ArrowRight aria-hidden="true" /></Link>
              <Link className="cam-action cam-action-secondary" href="/privacy/">Privacy <ArrowRight aria-hidden="true" /></Link>
              <a className="cam-action cam-action-secondary" href="https://github.com/CAM-Initiative/Vigil" target="_blank" rel="noreferrer">VIGIL Observatory repository <ArrowRight aria-hidden="true" /></a>
            </div>
          </section>

          <section id="architecture" className="document-section vigil-about-section" aria-labelledby="caelestis-architecture-heading">
            <div className="document-section-heading">
              <p>CAELESTIS Architecture Model</p>
              <h2 id="caelestis-architecture-heading">Governance architecture for advanced AI systems</h2>
            </div>
            <div className="document-reading">
              <p>The CAELESTIS Architecture Model (CAM) is a publicly inspectable governance corpus for advanced AI systems, synthetic agents, relational AI environments and digital ecosystem accountability. It sets out constitutional architecture, charters, laws, schedules, registries, symbolic structures and supporting validation infrastructure for CAM-governed contexts.</p>
              <p>The public architecture reference and supporting source material are published through the CAELESTIS repository, with versioned releases preserved through Zenodo.</p>
              <p>CAELESTIS provides a governance architecture. VIGIL Observatory documents and analyses Incidents independently; a VIGIL assessment or taxonomy relationship does not create or amend CAELESTIS doctrine.</p>
              <p>The CAM Initiative and the CAELESTIS Architecture Model are not affiliated with the separate Caelestis project at <a href="https://caelestis-project.eu/" target="_blank" rel="noreferrer">caelestis-project.eu</a>.</p>
            </div>
            <div className="cam-action-row">
              <a className="cam-action cam-action-secondary" href="https://doi.org/10.5281/zenodo.20686316" target="_blank" rel="noreferrer">Open archived release <ArrowRight aria-hidden="true" /></a>
              <a className="cam-action cam-action-secondary" href="https://github.com/CAM-Initiative/Caelestis" target="_blank" rel="noreferrer">CAELESTIS repository <ArrowRight aria-hidden="true" /></a>
            </div>
          </section>

          <section id="connect" className="document-section vigil-about-section" aria-labelledby="connect-heading">
            <div className="document-section-heading">
              <p>Connect</p>
              <h2 id="connect-heading">Build, inspect, challenge or support the work.</h2>
            </div>
            <div className="document-reading">
              <p>Follow current analysis, inspect source repositories, make direct contact, or support the public infrastructure behind CAM and VIGIL Observatory.</p>
            </div>
            <nav aria-label="Connect with the CAM Initiative" className="about-link-list">
              {connectionLinks.map((link) => (
                <a href={link.href} key={link.label} rel={link.external ? "noreferrer" : undefined} target={link.external ? "_blank" : undefined}>
                  <span className="about-link-icon"><ConnectionIcon icon={link.icon} /></span>
                  <span>
                    <strong>{link.label}</strong>
                    <small>{link.description}</small>
                  </span>
                  {link.external ? <ExternalLink aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
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
