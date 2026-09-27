import { ArrowRight, BookOpen, Coffee, ExternalLink, Github, Mail, Newspaper } from "lucide-react";
import { Link } from "wouter";
import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";

// Canonical public portrait asset is maintained in CAM-Initiative/Registry.
const founderPhotoHref = "https://raw.githubusercontent.com/CAM-Initiative/Registry/main/Images/Website/founder-photo.jpg";

const aboutRail = [
  { href: "#overview", label: "Overview" },
  { href: "#observatory", label: "VIGIL Observatory" },
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
              <p>VIGIL uses its own Incident model, VIGIL Harm Impact Methodology (VIGIL-HIM) and VIGIL Observatory Alignment Taxonomy. The Alignment Taxonomy uses the CAELESTIS Architecture Model as a source for taxonomy development and evaluation, while VIGIL remains an independent Incident-analysis system; VIGIL assessments and taxonomy relationships do not create or amend CAELESTIS doctrine.</p>
              <p>VIGIL Observatory is also not affiliated with <a href="https://vigil.agency/" target="_blank" rel="noreferrer">Vigil</a>, the open-source AI-powered security operations platform, or <a href="https://vigilsoc.org/" target="_blank" rel="noreferrer">Vigil SOC</a>, the open-source AI security operations project.</p>
              <p>The CAM Initiative and the CAELESTIS Architecture Model are not affiliated with the separate Caelestis project at <a href="https://caelestis-project.eu/" target="_blank" rel="noreferrer">caelestis-project.eu</a>.</p>
            </div>
            <div className="cam-action-row">
              <Link className="cam-action cam-action-secondary" href="/observatory/cases/">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
              <Link className="cam-action cam-action-secondary" href="/observatory/knowledge-base/failure-taxonomy/">Explore the Alignment Taxonomy <ArrowRight aria-hidden="true" /></Link>
              <Link className="cam-action cam-action-secondary" href="/observatory/severity-methodology/">Harm Impact Assessment <ArrowRight aria-hidden="true" /></Link>
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
