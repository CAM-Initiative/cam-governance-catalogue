import { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { ExploreGovernanceRail } from "@/components/ExploreGovernanceRail";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, BookOpen, Coffee, Download, ExternalLink, Github, Mail, Newspaper } from "lucide-react";
import "@/home-premium.css";

const REGISTRY_IMAGE_BASE = "https://raw.githubusercontent.com/CAM-Initiative/Registry/main/Images";
const HERO_IMAGES = {
  light: {
    cam: `${REGISTRY_IMAGE_BASE}/CAM_HERO.png`,
    vigil: `${REGISTRY_IMAGE_BASE}/VIGIL_HERO.png`,
  },
  dark: {
    cam: `${REGISTRY_IMAGE_BASE}/CAM_HERO_DARKMODE.png`,
    vigil: `${REGISTRY_IMAGE_BASE}/VIGIL_HERO_DARKMODE.png`,
  },
} as const;

type HeroTheme = keyof typeof HERO_IMAGES;

function currentHeroTheme(): HeroTheme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const connectionLinks = [
  { label: "Email", description: "Direct correspondence with the CAM Initiative", href: "mailto:ethics@cam-initiative.org", icon: "mail", external: false },
  { label: "Substack", description: "Essays, policy commentary, and longer-form updates", href: "https://substack.com/@caminitiative", icon: "substack", external: true },
  { label: "CAELESTIS repository", description: "Source repository for the governance architecture", href: "https://github.com/CAM-Initiative/Caelestis", icon: "github", external: true },
  { label: "VIGIL Observatory repository", description: "Evidence ledger, records, schemas, and repair history", href: "https://github.com/CAM-Initiative/Vigil", icon: "github", external: true },
  { label: "Updates on X", description: "Current observations, releases, and public discussion", href: "https://x.com/CAM_Initiative", icon: "x", external: true },
  { label: "Support", description: "Support the public infrastructure and ongoing work", href: "https://buymeacoffee.com/cam_initiative", icon: "support", external: true },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">{children}</p>
      <hr className="gold-rule flex-1" />
    </div>
  );
}

function ConnectionIcon({ icon }: { icon: string }) {
  if (icon === "mail") return <Mail className="h-4 w-4" aria-hidden="true" />;
  if (icon === "github") return <Github className="h-4 w-4" aria-hidden="true" />;
  if (icon === "substack") return <Newspaper className="h-4 w-4" aria-hidden="true" />;
  if (icon === "support") return <Coffee className="h-4 w-4" aria-hidden="true" />;
  if (icon === "x") return <span className="font-serif text-base leading-none" aria-hidden="true">𝕏</span>;
  return <BookOpen className="h-4 w-4" aria-hidden="true" />;
}

const reveal = {
  initial: { opacity: 0, y: 34 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.28 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function PremiumHero() {
  const orbit = ["Source evidence", "Failure class", "Severity", "Environment", "Governance", "Repair"];

  return (
    <section className="premium-hero" aria-labelledby="premium-hero-heading">
      <div className="premium-hero-aurora" aria-hidden="true" />
      <div className="premium-hero-grid" aria-hidden="true" />
      <div className="premium-hero-shell">
        <motion.div className="premium-hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="premium-eyebrow">CAM Initiative · VIGIL Observatory</p>
          <p className="premium-hero-kicker">AI incidents tell us what happened.</p>
          <h1 id="premium-hero-heading">VIGIL shows us <span>why.</span></h1>
          <p className="premium-hero-deck">
            A standard taxonomy, a consistent harm scale, and a traceable evidence model turn isolated incidents into comparable intelligence about where AI systems fail.
          </p>
          <div className="premium-hero-actions">
            <a href="/observatory/cases/" className="premium-primary">Explore the evidence <ArrowRight aria-hidden="true" /></a>
            <a href="/observatory/knowledge-base/failure-taxonomy/" className="premium-secondary">See the taxonomy</a>
          </div>
        </motion.div>

        <motion.div className="diagnostic-orbit" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.16 }} aria-label="VIGIL diagnostic model">
          <div className="diagnostic-orbit-ring diagnostic-orbit-ring-outer" aria-hidden="true" />
          <div className="diagnostic-orbit-ring diagnostic-orbit-ring-inner" aria-hidden="true" />
          <div className="diagnostic-core">
            <span className="diagnostic-core-label">INCIDENT</span>
            <strong>What went wrong?</strong>
          </div>
          {orbit.map((item, index) => (
            <motion.div
              key={item}
              className={`diagnostic-node diagnostic-node-${index + 1}`}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.8 + index * 0.22, repeat: Infinity, ease: "easeInOut", delay: index * 0.18 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>{item}
            </motion.div>
          ))}
          <div className="diagnostic-scan" aria-hidden="true" />
        </motion.div>
      </div>
      <a href="#aha" className="premium-scroll-cue" aria-label="Scroll to see how VIGIL works"><span>See the diagnosis</span><ArrowDown aria-hidden="true" /></a>
    </section>
  );
}

function AhaSequence() {
  const stages = [
    { number: "01", label: "Observe", title: "What happened?", detail: "Preserve the incident and source-level evidence." },
    { number: "02", label: "Diagnose", title: "Why did it fail?", detail: "Resolve governance principles and classify the failure mechanism." },
    { number: "03", label: "Assess", title: "What did it do?", detail: "Measure materialised harm using a consistent impact methodology." },
    { number: "04", label: "Compare", title: "Where does it recur?", detail: "Find repeated mechanisms across systems, providers and environments." },
  ];

  return (
    <section id="aha" className="aha-section" aria-labelledby="aha-heading">
      <motion.div className="aha-intro" {...reveal}>
        <p className="premium-eyebrow">The aha moment</p>
        <h2 id="aha-heading">One incident is a story. <span>A standardised corpus becomes a pattern.</span></h2>
        <p>VIGIL applies the same analytical frame across incidents so evidence can be compared instead of merely collected.</p>
      </motion.div>

      <div className="aha-track">
        <div className="aha-spine" aria-hidden="true" />
        {stages.map((stage, index) => (
          <motion.article className="aha-stage" key={stage.number} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }}>
            <div className="aha-stage-number">{stage.number}</div>
            <div>
              <p className="aha-stage-label">{stage.label}</p>
              <h3>{stage.title}</h3>
              <p>{stage.detail}</p>
            </div>
            <ArrowRight className="aha-stage-arrow" aria-hidden="true" />
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function PatternField() {
  return (
    <section className="pattern-field" aria-labelledby="pattern-heading">
      <div className="pattern-field-bg" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => <span key={index} className={`pattern-dot pattern-dot-${(index % 6) + 1}`} />)}
      </div>
      <motion.div className="pattern-copy" {...reveal}>
        <p className="premium-eyebrow">From cases to intelligence</p>
        <h2 id="pattern-heading">When failures are classified consistently, the ecosystem starts to become legible.</h2>
        <p>Recurring failure classes can be clustered, compared with materialised harm, mapped to deployment environments, and carried forward into standards, controls and repair design.</p>
        <div className="pattern-path" aria-label="VIGIL analytical pathway">
          <span>Evidence</span><i>→</i><span>Governance assessment</span><i>→</i><span>Failure class</span><i>→</i><span>Harm impact</span><i>→</i><strong>Patterns</strong>
        </div>
      </motion.div>
    </section>
  );
}

function IdentityBridge({ heroImages }: { heroImages: typeof HERO_IMAGES[HeroTheme] }) {
  return (
    <section className="identity-bridge" aria-labelledby="identity-bridge-heading">
      <motion.div className="identity-bridge-copy" {...reveal}>
        <p className="premium-eyebrow">A connected governance architecture</p>
        <h2 id="identity-bridge-heading">VIGIL diagnoses the failure. <span>CAM connects the diagnosis to governance and repair.</span></h2>
        <p>Evidence becomes useful when it can move into governance design. The CAM Initiative connects incident analysis, standards and policy work with the CAELESTIS architecture model.</p>
      </motion.div>
      <motion.div className="identity-bridge-art" {...reveal}>
        <div className="identity-mark"><img src={heroImages.vigil} alt="VIGIL Observatory" /></div>
        <div className="identity-pulse" aria-hidden="true"><span /><span /><span /></div>
        <div className="identity-mark"><img src={heroImages.cam} alt="CAM Initiative" /></div>
      </motion.div>
    </section>
  );
}

function EvidenceRepairLoop() {
  return (
    <section className="home-rail-section" aria-labelledby="evidence-repair-heading">
      <SectionLabel>VIGIL Observatory · Evidence</SectionLabel>
      <h2 id="evidence-repair-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">Preserve what happened and make the evidence inspectable.</h2>
      <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground md:text-lg">
        <p>VIGIL Observatory is the CAM Initiative&apos;s public evidence and incident-analysis system. Its Case File registry preserves canonical incidents, source-level evidence, incident-level assessment and traceable repair history.</p>
        <p>It is the evidence layer in a connected governance architecture: <strong className="font-semibold text-foreground">Evidence → Assessment → Runtime Governance</strong>.</p>
      </div>
      <a className="premium-inline-link" href="/observatory/cases/">Explore the Observatory <ArrowRight aria-hidden="true" /></a>
    </section>
  );
}

function FailureTaxonomyPanel() {
  return (
    <section className="home-rail-section" aria-labelledby="failure-taxonomy-home-heading">
      <SectionLabel>VIGIL Observatory Failure Taxonomy · Classification</SectionLabel>
      <h2 id="failure-taxonomy-home-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">A common language for recurring AI failure mechanisms.</h2>
      <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground md:text-lg">
        <p>The VIGIL Observatory Failure Taxonomy groups evidence into Failure Families and selectable Failure Classes so recurring mechanisms can be classified, compared across systems, mapped to standards and controls, and carried forward into repair design.</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="premium-inline-link" href="/observatory/knowledge-base/failure-taxonomy/">Explore the Taxonomy <ArrowRight aria-hidden="true" /></a>
        <a className="premium-inline-link" href="https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/taxonomy/generated/VIGIL.Observatory.FailureTaxonomy.FullReference.pdf" target="_blank" rel="noreferrer">Download the PDF <Download aria-hidden="true" /></a>
      </div>
    </section>
  );
}

function DatasetsPanel() {
  return (
    <section className="home-rail-section" aria-labelledby="datasets-home-heading" id="datasets-home">
      <SectionLabel>Datasets</SectionLabel>
      <h2 id="datasets-home-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">Use the underlying governance data directly.</h2>
      <p className="text-[17px] leading-relaxed text-muted-foreground md:text-lg">The CAM Initiative publishes machine-readable governance reference data and archival releases for inspection, research and comparison. Access or download does not imply unrestricted reuse; see <a href="/licensing/" className="font-semibold underline decoration-primary/35 underline-offset-4">Copyright & Licence</a> for applicable terms.</p>
      <a className="premium-inline-link" href="/datasets/">Explore Datasets <ArrowRight aria-hidden="true" /></a>
    </section>
  );
}

function PolicyPapersPanel() {
  return (
    <section className="home-rail-section" aria-labelledby="policy-papers-home-heading" id="policy-papers">
      <SectionLabel>Policy</SectionLabel>
      <h2 id="policy-papers-home-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">Turn governance analysis into practical public policy.</h2>
      <p className="text-[17px] leading-relaxed text-muted-foreground md:text-lg">CAM Initiative policy work translates governance principles, evidence and emerging technology risks into concrete proposals for legislation, regulation, public administration and institutional design.</p>
      <a className="premium-inline-link" href="/observatory/knowledge-base/policy/">Explore Policy Papers <ArrowRight aria-hidden="true" /></a>
    </section>
  );
}

function ConnectPanel() {
  return (
    <section className="home-rail-section" id="connect" aria-labelledby="connect-heading">
      <SectionLabel>Connect</SectionLabel>
      <div className="home-connect-intro">
        <h2 id="connect-heading" className="mb-4 font-serif text-3xl leading-snug text-foreground md:text-4xl">Build, inspect, challenge or support the work.</h2>
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">Follow current analysis, inspect source repositories, make direct contact, or support the public infrastructure behind CAM and VIGIL Observatory.</p>
      </div>
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
  );
}

export default function Home() {
  const [heroTheme, setHeroTheme] = useState<HeroTheme>(() => currentHeroTheme());

  useEffect(() => {
    const syncTheme = () => setHeroTheme(currentHeroTheme());
    window.addEventListener("cam-theme-change", syncTheme);
    return () => window.removeEventListener("cam-theme-change", syncTheme);
  }, []);

  const heroImages = HERO_IMAGES[heroTheme];

  return (
    <Shell>
      <main className="home-page premium-home">
        <PremiumHero />
        <AhaSequence />
        <PatternField />
        <IdentityBridge heroImages={heroImages} />

        <section className="home-main-rail premium-main-rail" aria-label="CAM Initiative overview and navigation">
          <div className="home-main-rail-layout container mx-auto px-6 py-12 md:px-10 md:py-16">
            <div className="home-sticky-governance"><ExploreGovernanceRail /></div>
            <div className="home-main-copy">
              <motion.section className="home-about-section" aria-labelledby="home-about-heading" {...reveal}>
                <SectionLabel>CAM Initiative</SectionLabel>
                <h2 id="home-about-heading" className="mb-5 font-serif text-3xl leading-tight text-foreground md:text-4xl">Publicly accessible AI governance infrastructure for understanding systems and making failure visible.</h2>
                <div className="space-y-5 text-[17px] leading-relaxed text-foreground/80 md:text-lg">
                  <p>The CAM Initiative brings together AI governance architecture, regulatory and standards alignment, relational safeguards, technology-failure diagnostics, and public-interest governance for emerging systems.</p>
                  <p>It helps institutions, practitioners, researchers, and system designers interpret obligations, identify governance gaps, strengthen operational assurance, and connect real-world evidence to accountable repair.</p>
                </div>
              </motion.section>
              <EvidenceRepairLoop />
              <FailureTaxonomyPanel />
              <DatasetsPanel />
              <PolicyPapersPanel />
              <ConnectPanel />
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
