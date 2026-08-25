import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Coffee, ExternalLink, Github, Mail, Newspaper } from "lucide-react";

const CAM_HERO = "https://raw.githubusercontent.com/CAM-Initiative/Registry/ab54240387ec4856b99c91a7dfe73d159914d309/Images/CAM_HERO.png";
const VIGIL_HERO = "https://raw.githubusercontent.com/CAM-Initiative/Registry/ab54240387ec4856b99c91a7dfe73d159914d309/Images/VIGIL_HERO.png";

const initiativeResources = [
  {
    id: "vigil-observatory",
    title: "VIGIL Observatory",
    subtitle: "Evidence, taxonomy & governance knowledge",
    purpose: "Case Files, the VIGIL AI Governance Failure Taxonomy, governance standards, policy materials and source-linked public research.",
    href: "/observatory/knowledge-base",
  },
  {
    id: "datasets",
    title: "Datasets",
    subtitle: "Machine-readable governance reference data",
    purpose: "Downloadable VIGIL source, standards and requirement datasets for independent analysis and reuse.",
    href: "/datasets",
  },
];

const externalResources = [
  {
    label: "AI Regulations Tracker",
    description: "Compare AI laws, regulatory proposals and policy developments across jurisdictions.",
    href: "https://regulations.ai/",
  },
  {
    label: "AI Incident Database",
    description: "Search reported AI incidents and harms documented across systems, sectors and jurisdictions.",
    href: "https://incidentdatabase.ai/",
  },
  {
    label: "OECD AI Incidents Monitor",
    description: "Review internationally monitored AI incidents, hazards and emerging risk patterns.",
    href: "https://oecd.ai/en/incidents",
  },
  {
    label: "NIST AI Resource Center",
    description: "Access NIST AI risk-management frameworks, profiles, guidance and supporting resources.",
    href: "https://airc.nist.gov/",
  },
];

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

function ExploreGovernancePanel() {
  return (
    <motion.aside
      animate={{ opacity: 1, y: 0 }}
      aria-label="Explore AI governance"
      className="home-governance-panel cam-parchment-card rounded-2xl border border-cam-gold/35 p-4 shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.55, delay: 0.05 }}
    >
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-cam-gold/30 pb-3">
        <p className="font-mono text-base font-semibold uppercase tracking-[0.16em] text-cam-gold">Explore AI Governance</p>
        <span className="h-2 w-2 rounded-full bg-cam-gold/80" aria-hidden="true" />
      </div>

      <div className="grid gap-2">
        {initiativeResources.map((resource) => (
          <a
            className="home-governance-card group rounded-lg border border-cam-gold/20 bg-card/55 px-3 py-2.5 transition hover:border-cam-gold/45 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={resource.href}
            key={resource.id}
          >
            <span className="flex items-center justify-between gap-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-cam-gold">
              <span>{resource.title}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
            <span className="home-governance-detail block">
              <span className="mt-1.5 block font-mono text-[13px] font-semibold uppercase tracking-[0.1em] text-cam-gold">{resource.subtitle}</span>
              <span className="mt-2 block text-[15px] leading-relaxed text-muted-foreground">{resource.purpose}</span>
            </span>
          </a>
        ))}
      </div>

      <div className="mt-4 border-t border-cam-gold/25 pt-3">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">External tools</p>
        <div className="grid gap-2">
          {externalResources.map((resource) => (
            <a
              className="home-governance-card group rounded-lg border border-cam-gold/20 bg-card/55 px-3 py-2.5 transition hover:border-cam-gold/45 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={resource.href}
              key={resource.label}
              rel="noreferrer"
              target="_blank"
            >
              <span className="flex items-center justify-between gap-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-cam-gold">
                <span>{resource.label}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
              <span className="home-governance-detail mt-2 block text-[15px] leading-relaxed text-muted-foreground">{resource.description}</span>
            </a>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}

function EvidenceRepairLoop() {
  return (
    <section className="home-rail-section" aria-labelledby="evidence-repair-heading">
      <SectionLabel>VIGIL: Evidence to Repair</SectionLabel>
      <h2 id="evidence-repair-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
        Turn real-world AI failures into evidence for accountable repair.
      </h2>
      <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground md:text-lg">
        <p>
          VIGIL is an evidence-to-repair system for AI governance. It captures safety incidents and governance failures, diagnoses the control breakdown, maps the evidence to required safeguards, and supports traceable runtime repair and verification.
        </p>
        <p>
          Cases are grouped through the <strong className="font-semibold text-foreground">VIGIL AI Governance Failure Taxonomy</strong>, which separates broad failure families from specific failure classes so recurring mechanisms can be compared across systems and deployment contexts.
        </p>
      </div>
      <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-cam-gold/40 bg-card/75 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/60 hover:text-foreground" href="/observatory/about">
        Explore VIGIL
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
    <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" id="connect">
      <SectionLabel>Connect</SectionLabel>
      <article className="cam-parchment-card rounded-3xl border border-cam-gold/35 p-5 shadow-xl md:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="max-w-2xl">
            <h2 className="mb-4 font-serif text-3xl leading-snug text-foreground md:text-4xl">Connect with the CAM Initiative</h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              Follow current analysis, read longer-form policy and governance commentary, inspect the source repositories, make direct contact, or support the public infrastructure that keeps CAM and VIGIL accessible.
            </p>
          </div>

          <nav aria-label="Connect with the CAM Initiative" className="overflow-hidden rounded-2xl border border-cam-gold/30 bg-[hsl(36_48%_96%)] shadow-sm">
            <div className="grid sm:grid-cols-2">
              {connectionLinks.map((link, index) => (
                <a
                  className={`group flex min-h-24 items-start gap-3 p-4 transition hover:bg-[hsl(36_52%_93%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                    index % 2 === 0 ? "sm:border-r sm:border-cam-gold/25" : ""
                  } ${index < connectionLinks.length - 2 ? "border-b border-cam-gold/25" : ""}`}
                  href={link.href}
                  key={link.label}
                  rel={link.external ? "noreferrer" : undefined}
                  target={link.external ? "_blank" : undefined}
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cam-gold/35 bg-card text-cam-gold">
                    <ConnectionIcon icon={link.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-serif text-xl leading-tight text-foreground">{link.label}</span>
                      {link.external ? <ExternalLink className="h-3.5 w-3.5 shrink-0 text-foreground/45 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /> : <ArrowRight className="h-3.5 w-3.5 shrink-0 text-foreground/45 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-foreground/65">{link.description}</span>
                  </span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      </article>
    </section>
  );
}

export default function Home() {
  return (
    <Shell>
      <main className="home-page overflow-hidden">
        <section className="home-identity-hero" aria-labelledby="home-identity-heading">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto w-full max-w-[100rem] px-5 py-12 sm:px-6 md:px-8 md:py-16 lg:py-20"
            initial={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.7 }}
          >
            <p className="home-identity-kicker">CAM Initiative · Open AI Governance</p>
            <h1 id="home-identity-heading" className="sr-only">CAELESTIS Architecture Model and VIGIL Observatory</h1>
            <div className="home-identity-artwork" aria-hidden="true">
              <img src={CAM_HERO} alt="" className="home-identity-image" />
              <span className="home-identity-divider" />
              <img src={VIGIL_HERO} alt="" className="home-identity-image" />
            </div>
            <p className="home-identity-tagline">Understanding systems. Supporting compliance. Diagnosing failures. Navigating change.</p>
          </motion.div>
        </section>

        <section className="home-main-rail" aria-label="CAM Initiative overview and navigation">
          <div className="container mx-auto grid max-w-6xl gap-9 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
            <div className="home-sticky-governance">
              <ExploreGovernancePanel />
            </div>

            <div className="home-main-copy">
              <section className="home-about-section" aria-labelledby="home-about-heading">
                <SectionLabel>CAM Initiative</SectionLabel>
                <h2 id="home-about-heading" className="mb-5 font-serif text-3xl leading-tight text-foreground md:text-4xl">Open AI governance infrastructure for understanding systems and making failure visible.</h2>
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
              <PolicyPapersPanel />
            </div>
          </div>
        </section>

        <ConnectPanel />
      </main>
    </Shell>
  );
}
