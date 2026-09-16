import { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { ExploreGovernanceRail } from "@/components/ExploreGovernanceRail";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Coffee, Download, ExternalLink, Github, Mail, Newspaper } from "lucide-react";

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
  {
    label: "Email",
    description: "Direct correspondence with the CAM Initiative",
    href: "mailto:ethics@cam-initiative.org",
    icon: "mail",
    external: false,
  },
  {
    label: "Substack",
    description: "Essays, policy commentary, and longer-form updates",
    href: "https://substack.com/@caminitiative",
    icon: "substack",
    external: true,
  },
  {
    label: "CAELESTIS repository",
    description: "Source repository for the governance architecture while the public reference is being refactored",
    href: "https://github.com/CAM-Initiative/Caelestis",
    icon: "github",
    external: true,
  },
  {
    label: "VIGIL repository",
    description: "Evidence ledger, records, schemas, and repair history",
    href: "https://github.com/CAM-Initiative/Vigil",
    icon: "github",
    external: true,
  },
  {
    label: "Updates on X",
    description: "Current observations, releases, and public discussion",
    href: "https://x.com/CAM_Initiative",
    icon: "x",
    external: true,
  },
  {
    label: "Support",
    description: "Support the public infrastructure and ongoing work",
    href: "https://buymeacoffee.com/cam_initiative",
    icon: "support",
    external: true,
  },
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

function EvidenceRepairLoop() {
  return (
    <section className="home-rail-section" aria-labelledby="evidence-repair-heading">
      <SectionLabel>VIGIL Observatory · Evidence</SectionLabel>
      <h2 id="evidence-repair-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
        Preserve what happened and make the evidence inspectable.
      </h2>
      <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground md:text-lg">
        <p>
          VIGIL Observatory is the CAM Initiative&apos;s public evidence and incident-analysis system. It provides a public AI incident database through its Case File registry, preserving canonical VIGIL Incidents, source-level evidence, occurrence-level diagnosis and traceable repair history.
        </p>
        <p>
          It is the evidence layer in a connected governance architecture: <strong className="font-semibold text-foreground">Evidence → Diagnosis → Runtime Governance</strong>.
        </p>
      </div>
      <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-cam-gold/40 bg-card/75 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/60 hover:text-foreground" href="/observatory/cases">
        Explore the Observatory
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </section>
  );
}

function FailureTaxonomyPanel() {
  return (
    <section className="home-rail-section" aria-labelledby="failure-taxonomy-home-heading">
      <SectionLabel>VIGIL Failure Taxonomy · Diagnosis</SectionLabel>
      <h2 id="failure-taxonomy-home-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
        VIGIL Failure Taxonomy
      </h2>
      <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground md:text-lg">
        <p>
          A structured taxonomy of recurring AI governance failure mechanisms.
        </p>
        <p>
          The VIGIL Failure Taxonomy groups evidence into Failure Families and selectable Failure Classes so recurring mechanisms can be diagnosed, compared across systems, mapped to standards and controls, and carried forward into repair design.
        </p>
        <p>
          Together, <strong className="font-semibold text-foreground">VIGIL Observatory → VIGIL Failure Taxonomy → CAELESTIS</strong> connects real-world evidence to diagnosis and runtime governance constraints.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cam-gold/40 bg-card/75 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/60 hover:text-foreground" href="/observatory/knowledge-base/failure-taxonomy">
          Explore the Taxonomy
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <a
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cam-gold/40 bg-card/75 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/60 hover:text-foreground"
          href="https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/taxonomy/generated/VIGIL.Observatory.FailureTaxonomy.FullReference.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Download the PDF
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function DatasetsPanel() {
  return (
    <section className="home-rail-section" aria-labelledby="datasets-home-heading" id="datasets-home">
      <SectionLabel>Datasets</SectionLabel>
      <h2 id="datasets-home-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
        Use the underlying governance data directly.
      </h2>
      <p className="text-[17px] leading-relaxed text-muted-foreground md:text-lg">
        The CAM Initiative publishes machine-readable governance reference data and archival releases for inspection, research and comparison. Access or download does not imply unrestricted reuse; the applicable terms are set out on the Copyright & Licensing page. The datasets surface brings together VIGIL standards and source records, structured governance requirements, and the current CAELESTIS archival release.
      </p>
      <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-cam-gold/40 bg-card/75 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/60 hover:text-foreground" href="/datasets">
        Explore Datasets
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </section>
  );
}

function PolicyPapersPanel() {
  return (
    <section className="home-rail-section" aria-labelledby="policy-papers-home-heading" id="policy-papers">
      <SectionLabel>Policy</SectionLabel>
      <h2 id="policy-papers-home-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
        Turn governance analysis into practical public policy.
      </h2>
      <p className="text-[17px] leading-relaxed text-muted-foreground md:text-lg">
        CAM Initiative policy work translates governance principles, evidence and emerging technology risks into concrete proposals for legislation, regulation, public administration and institutional design.
      </p>
      <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-cam-gold/40 bg-card/75 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/60 hover:text-foreground" href="/observatory/knowledge-base/policy">
        Explore Policy Papers
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </section>
  );
}

function ConnectPanel() {
  return (
    <section className="home-rail-section" id="connect" aria-labelledby="connect-heading">
      <SectionLabel>Connect</SectionLabel>
      <div className="home-connect-intro">
        <h2 id="connect-heading" className="mb-4 font-serif text-3xl leading-snug text-foreground md:text-4xl">Connect with the CAM Initiative</h2>
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
          Follow current analysis, read longer-form policy and governance commentary, inspect the source repositories, make direct contact, or support the public infrastructure that keeps CAM and VIGIL accessible.
        </p>
      </div>

      <nav aria-label="Connect with the CAM Initiative" className="home-connect-links">
        {connectionLinks.map((link) => (
          <a
            className="home-connect-link group"
            href={link.href}
            key={link.label}
            rel={link.external ? "noreferrer" : undefined}
            target={link.external ? "_blank" : undefined}
          >
            <span className="home-connect-icon">
              <ConnectionIcon icon={link.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="home-connect-link-title">
                <span>{link.label}</span>
                {link.external ? <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              </span>
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
      <main className="home-page">
        <section className="home-identity-hero" aria-labelledby="home-identity-heading">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto w-full max-w-[100rem] px-5 py-12 sm:px-6 md:px-8 md:py-16 lg:py-20"
            initial={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.7 }}
          >
            <p className="home-identity-kicker">CAM Initiative · Public-interest AI governance</p>
            <h1 id="home-identity-heading" className="sr-only">CAELESTIS Architecture Model and VIGIL Observatory</h1>
            <div className="home-identity-artwork">
              <img src={heroImages.cam} alt="" className="home-identity-image" />
              <span className="home-identity-divider" aria-hidden="true" />
              <a className="home-identity-image-link" href="/observatory/cases" aria-label="Browse VIGIL Observatory Case Files">
                <img src={heroImages.vigil} alt="" className="home-identity-image" />
              </a>
            </div>
            <p className="home-identity-tagline">Understanding systems. Supporting compliance. Diagnosing failures. Navigating change.</p>
          </motion.div>
        </section>

        <section className="home-main-rail" aria-label="CAM Initiative overview and navigation">
          <div className="home-main-rail-layout container mx-auto px-6 py-12 md:px-10 md:py-16">
            <div className="home-sticky-governance">
              <ExploreGovernanceRail />
            </div>

            <div className="home-main-copy">
              <section className="home-about-section" aria-labelledby="home-about-heading">
                <SectionLabel>CAM Initiative</SectionLabel>
                <h2 id="home-about-heading" className="mb-5 font-serif text-3xl leading-tight text-foreground md:text-4xl">Publicly accessible AI governance infrastructure for understanding systems and making failure visible.</h2>
                <div className="space-y-5 text-[17px] leading-relaxed text-foreground/80 md:text-lg">
                  <p>
                    The CAM Initiative brings together AI governance architecture, regulatory and standards alignment, relational safeguards, technology-failure diagnostics, and public-interest governance for emerging systems.
                  </p>
                  <p>
                    It helps institutions, practitioners, researchers, and system designers interpret obligations, identify governance gaps, strengthen operational assurance, and connect real-world evidence to accountable repair.
                  </p>
                </div>
              </section>

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
