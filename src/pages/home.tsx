import { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { ExploreGovernanceRail } from "@/components/ExploreGovernanceRail";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, BookOpen, Coffee, Download, ExternalLink, Github, Mail, Newspaper } from "lucide-react";
import "@/home-premium.css";
import "@/home-premium-v2.css";

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

const diagnosticStages = [
  {
    label: "Observe",
    title: "What happened?",
    detail: "Preserve occurrence-specific evidence, source chain, system and deployment context.",
  },
  {
    label: "Diagnose",
    title: "Why did it fail?",
    detail: "Resolve the governance boundary, then classify the failure mechanism using a standard taxonomy.",
  },
  {
    label: "Assess",
    title: "What was harmed?",
    detail: "Assess materialised consequence consistently across the VIGIL harm dimensions and severity scale.",
  },
  {
    label: "Compare",
    title: "Where does it recur?",
    detail: "Compare the same mechanisms across models, providers and environments so recurring patterns become visible.",
  },
];

function PremiumHero() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % diagnosticStages.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, []);

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
            A standard taxonomy, a consistent harm methodology, and traceable evidence turn isolated incidents into comparable intelligence about where AI systems fail.
          </p>
          <div className="premium-hero-actions">
            <a href="/observatory/cases/" className="premium-primary">Explore the evidence <ArrowRight aria-hidden="true" /></a>
            <a href="/observatory/knowledge-base/failure-taxonomy/" className="premium-secondary">See the taxonomy</a>
          </div>
        </motion.div>

        <motion.div className="diagnostic-orbit diagnostic-orbit-v2" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.16 }} aria-label="VIGIL analytical cycle">
          <div className="diagnostic-orbit-ring diagnostic-orbit-ring-outer" aria-hidden="true" />
          <div className="diagnostic-orbit-ring diagnostic-orbit-ring-inner" aria-hidden="true" />
          <div className="diagnostic-core">
            <span className="diagnostic-core-label">VIGIL ANALYSIS</span>
            <strong>What went wrong?</strong>
            <span className="diagnostic-core-count">{String(activeStage + 1).padStart(2, "0")} / 04</span>
          </div>

          {diagnosticStages.map((stage, index) => {
            const active = index === activeStage;
            return (
              <button
                type="button"
                key={stage.label}
                className={`diagnostic-node diagnostic-node-${index + 1}${active ? " is-active" : ""}`}
                onMouseEnter={() => setActiveStage(index)}
                onFocus={() => setActiveStage(index)}
                aria-pressed={active}
              >
                <span className="diagnostic-node-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="diagnostic-node-copy">
                  <span className="diagnostic-node-label">{stage.label}</span>
                  <strong>{stage.title}</strong>
                  <span className="diagnostic-node-detail">{stage.detail}</span>
                </span>
              </button>
            );
          })}

          <motion.div
            className="diagnostic-scan diagnostic-scan-v2"
            aria-hidden="true"
            animate={{ rotate: -90 + activeStage * 90 }}
            transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      </div>
      <a href="#patterns" className="premium-scroll-cue" aria-label="Scroll to see the patterns VIGIL makes visible"><span>See the pattern</span><ArrowDown aria-hidden="true" /></a>
    </section>
  );
}

function PatternField() {
  return (
    <section id="patterns" className="pattern-field" aria-labelledby="pattern-heading">
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
        <PatternField />
        <IdentityBridge heroImages={heroImages} />

        <section className="home-main-rail premium-main-rail" aria-label="CAM Initiative overview and navigation">
          <div className="home-main-rail-layout container mx-auto px-6 py-12 md:px-10 md:py-16">
            <div className="home-sticky-governance"><ExploreGovernanceRail /></div>
            <div className="home-main-copy">
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
