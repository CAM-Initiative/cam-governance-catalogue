import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Coffee, ExternalLink, Github, Mail, Newspaper } from "lucide-react";

const initiativeResources = [
  {
    id: "vigil-observatory",
    title: "VIGIL Observatory",
    subtitle: "Evidence, failure taxonomy & public datasets",
    purpose: "Case Files grouped through the VIGIL Runtime & Governance Failure Taxonomy, with source evidence, governance requirements, repair history and public data.",
    href: "/observatory/cases",
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
      className="cam-parchment-card rounded-2xl border border-cam-gold/35 p-4 shadow-xl"
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.7, delay: 0.1 }}
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
    <section className="py-12 md:py-16" aria-labelledby="evidence-repair-heading">
      <div className="container mx-auto max-w-6xl px-6 md:px-10">
        <SectionLabel>VIGIL: Evidence to Repair</SectionLabel>
        <h2 id="evidence-repair-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
          Turn real-world AI failures into evidence for accountable repair.
        </h2>
        <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground md:text-lg">
          <p>
            VIGIL is an evidence-to-repair system for AI governance. It captures safety incidents and governance failures, diagnoses the control breakdown, maps the evidence to required safeguards, and supports traceable runtime repair and verification.
          </p>
          <p>
            Cases are grouped through the <strong className="font-semibold text-foreground">VIGIL Runtime &amp; Governance Failure Taxonomy</strong>, a shared classification standard that distinguishes structural failure mechanisms from their manifestations, causes, severity, evidence state and repair responsibility. This makes recurring failure patterns comparable across different systems and deployment contexts.
          </p>
        </div>
        <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-cam-gold/40 bg-card/75 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/60 hover:text-foreground" href="/observatory/about">
          Explore VIGIL
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function PolicyPapersPanel() {
  return (
    <section className="border-y border-border/60 bg-[hsl(38_40%_94%)]" aria-labelledby="policy-papers-home-heading" id="policy-papers">
      <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <SectionLabel>Policy</SectionLabel>
        <h2 id="policy-papers-home-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
          Turn governance architecture into practical public policy.
        </h2>
        <p className="text-[17px] leading-relaxed text-muted-foreground md:text-lg">
          CAM Initiative policy work translates governance principles, evidence and emerging technology risks into concrete proposals for legislation, regulation, public administration and institutional design.
        </p>
        <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-cam-gold/40 bg-card/75 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/60 hover:text-foreground" href="/observatory/knowledge-base/policy">
          Explore Policy Papers
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
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
      <main className="overflow-hidden">
        <section className="border-b border-border/60 bg-[hsl(38_40%_93%)]">
          <div className="container mx-auto grid w-full max-w-[100rem] gap-12 px-5 py-14 sm:px-6 md:gap-16 md:px-8 md:py-20 lg:grid-cols-[minmax(0,1.35fr)_minmax(27rem,0.85fr)] lg:items-center xl:gap-20">
            <motion.div animate={{ opacity: 1, y: 0 }} className="max-w-none" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.7 }}>
              <p className="mb-4 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">CAM Initiative · Open AI Governance</p>
              <h1 className="mb-5 max-w-5xl text-foreground">
                <span className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_1px_minmax(0,0.9fr)] sm:items-center sm:gap-6">
                  <span className="block">
                    <span className="block whitespace-nowrap font-serif text-5xl leading-[0.98] tracking-[0.06em] sm:text-6xl md:text-7xl">CAELESTIS</span>
                    <span className="mt-2 block font-serif text-3xl leading-tight tracking-normal sm:text-4xl md:text-5xl">Architecture Model</span>
                  </span>
                  <span className="hidden h-24 w-px bg-cam-gold/35 sm:block" aria-hidden="true" />
                  <span className="block border-t border-cam-gold/35 pt-4 sm:border-t-0 sm:pt-0">
                    <span className="block font-serif text-4xl leading-[0.98] tracking-[0.045em] sm:text-5xl md:text-6xl">VIGIL</span>
                    <span className="mt-2 block font-mono text-sm font-semibold uppercase tracking-[0.18em] text-cam-gold sm:text-base">Observatory</span>
                  </span>
                </span>
              </h1>
              <hr className="gold-rule mb-5 w-24" />
              <p className="mb-8 font-mono text-sm uppercase tracking-[0.18em] text-cam-gold md:text-[15px]">
                Understanding systems. Supporting compliance. Diagnosing failures. Navigating change.
              </p>
              <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-foreground/80 md:text-xl">
                <p>
                  The CAM Initiative brings together AI governance architecture, regulatory and standards alignment, relational safeguards, technology-failure diagnostics, and public-interest governance for emerging systems.
                </p>
                <p>
                  It helps institutions, practitioners, researchers, and system designers interpret obligations, identify governance gaps, strengthen operational assurance, and connect real-world evidence to accountable repair.
                </p>
              </div>
            </motion.div>
            <ExploreGovernancePanel />
          </div>
        </section>

        <EvidenceRepairLoop />
        <PolicyPapersPanel />
        <ConnectPanel />
      </main>
    </Shell>
  );
}
