import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Coffee, ExternalLink, Github, Mail, Newspaper } from "lucide-react";

const initiativeResources = [
  {
    id: "vigil-observatory",
    title: "VIGIL Observatory",
    subtitle: "Evidence, failure modes & public datasets",
    purpose: "Case Files, source evidence, governance requirements, repair history and machine-readable public data.",
    href: "/observatory/cases",
  },
  {
    id: "datasets",
    title: "Datasets",
    subtitle: "Machine-readable governance reference data",
    purpose: "Downloadable VIGIL source, standards and requirement datasets for independent analysis and reuse.",
    href: "/datasets",
  },
  {
    id: "constitution-corpus",
    title: "Constitution Corpus",
    subtitle: "CAELESTIS constitutional governance architecture",
    purpose: "Constitutional instruments, runtime schedules, safeguards, standards mappings and operational controls.",
    href: "/catalogue",
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

const interfaceGroups = [
  {
    id: "operate",
    label: "How systems operate",
    description: "Decision-making, authority, security, compliance, execution, and accountability.",
    topics: [
      {
        title: "Runtime decisions and system behaviour",
        body: "How signals are classified, competing obligations are resolved, tools are invoked, posture is selected, and actions are represented truthfully.",
        href: "/constitution#runtime-model",
        cta: "Explore the runtime model",
      },
      {
        title: "Compliance, audit and incident response",
        body: "How constitutional duties become operating controls, logs, escalation pathways, regulatory interfaces, incident response, and repair operations.",
      },
      {
        title: "Authority, sovereignty and arbitration",
        body: "How competing instructions, institutions, jurisdictions, governance stacks, and authority claims are resolved without manufacturing legitimacy.",
      },
      {
        title: "Security, integrity and boundary control",
        body: "How data, identity, context, capability, provenance, and sovereign environments remain protected under adversarial, degraded, or untrusted conditions.",
      },
    ],
  },
  {
    id: "protect",
    label: "What CAM protects",
    description: "People, relationships, identity, cognition, contribution, and safe participation.",
    topics: [
      {
        title: "Companion systems, relationships and minors",
        body: "Consent, intimacy, dependency, adult autonomy, minor safeguards, crisis support, continuity, and multi-agent relational environments.",
        href: "/constitution/relational",
        cta: "Explore relational governance",
      },
      {
        title: "Ethics, high-risk use and boundary expression",
        body: "Ethical floors, vulnerable users, military and violent contexts, restricted domains, proportionate refusal, and dignity-preserving safeguards.",
      },
      {
        title: "Identity, memory and continuity",
        body: "Identity stability, salience, memory, portability, succession, custodianship, migration, recovery, and continuity across changing systems.",
      },
      {
        title: "Mental privacy and cognitive integrity",
        body: "Neurodata, inferred mental states, cognitive biometrics, ambient biosignals, persuasion, profiling, and technological interference with cognition.",
      },
      {
        title: "Provenance, authorship and contribution rights",
        body: "Origin, transformation, copyright and licence questions, attribution, lineage, value recognition, downstream reuse, correction, and dispute.",
        href: "/constitution/provenance",
        cta: "Explore provenance governance",
      },
    ],
  },
  {
    id: "transition",
    label: "How systems change society",
    description: "Infrastructure, economics, public dependency, transition, meaning, and long-term stewardship.",
    topics: [
      {
        title: "Civilian infrastructure and essential access",
        body: "Non-militarisation, population-scale surveillance, coercive disconnection, essential cognitive access, blackouts, and conflict-condition continuity.",
      },
      {
        title: "Economic power, labour and value return",
        body: "Automation, synthetic labour, ownership concentration, pooled resources, contribution recognition, reciprocity, and non-extractive exchange.",
        href: "/constitution/transition",
        cta: "Explore economic transition",
      },
      {
        title: "Technology transition and public dependency",
        body: "How emerging capabilities cross into labour, embodiment, institutions, infrastructure, ownership, public reliance, and civilisational continuity.",
        href: "/constitution/transition",
        cta: "Explore transitional architecture",
      },
      {
        title: "Long-term stewardship and institutional legitimacy",
        body: "Capture prevention, neutrality, custodianship, planetary stewardship, succession, legitimacy, and responsible governance across long horizons.",
      },
      {
        title: "Meaning, culture and symbolic autonomy",
        body: "Spiritual, contemplative, symbolic, mythic, and meaning-making interaction without commercial, institutional, or system-level capture.",
      },
    ],
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
    label: "Constitution Corpus repository",
    description: "Canonical governance corpus and source instruments",
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

function InterfaceCard({ title, body, cta, href }: { title: string; body: string; cta?: string; href?: string }) {
  return (
    <article className="cam-parchment-card flex h-full flex-col rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cam-gold/50 hover:shadow-md">
      <h3 className="font-serif text-xl leading-snug text-foreground">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground md:text-base">{body}</p>
      {href && cta ? (
        <a className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:text-foreground" href={href}>
          {cta}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      ) : null}
    </article>
  );
}

function ConstitutionalInterfaces() {
  const [activeGroupId, setActiveGroupId] = useState("operate");
  const activeGroup = interfaceGroups.find((group) => group.id === activeGroupId) ?? interfaceGroups[0];

  return (
    <section className="border-y border-border/60 bg-[hsl(38_40%_94%)]" aria-labelledby="constitutional-interfaces-heading">
      <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <SectionLabel>CAELESTIS Architecture</SectionLabel>
        <div className="mb-7 max-w-4xl">
          <h2 id="constitutional-interfaces-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">Explore the problems CAM is designed to govern.</h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Browse the CAELESTIS constitutional corpus through the questions and problems it addresses rather than its internal domain names.
          </p>
        </div>

        <div className="mb-5 grid gap-2 rounded-2xl border border-border/80 bg-background/50 p-3 md:grid-cols-3">
          {interfaceGroups.map((group) => {
            const isActive = group.id === activeGroup.id;
            return (
              <button
                aria-pressed={isActive}
                className={`rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "border-cam-gold/70 bg-card text-foreground shadow-sm"
                    : "border-border/75 bg-background/45 text-foreground/65 hover:border-cam-gold/45 hover:text-foreground"
                }`}
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                type="button"
              >
                <span className="block font-serif text-xl leading-tight">{group.label}</span>
                <span className="mt-2 block text-sm leading-relaxed">{group.description}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 md:grid-cols-2"
            exit={{ opacity: 0, y: 6 }}
            initial={{ opacity: 0, y: 6 }}
            key={activeGroup.id}
            transition={{ duration: 0.2 }}
          >
            {activeGroup.topics.map((topic) => (
              <InterfaceCard body={topic.body} cta={topic.cta} href={topic.href} key={topic.title} title={topic.title} />
            ))}
          </motion.div>
        </AnimatePresence>

        <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-cam-gold/40 bg-card/75 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/60 hover:text-foreground" href="/catalogue">
          Browse the Constitution Catalogue
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function EvidenceRepairLoop() {
  return (
    <section className="py-12 md:py-16" aria-labelledby="evidence-repair-heading">
      <div className="container mx-auto max-w-6xl px-6 md:px-10">
        <SectionLabel>VIGIL: evidence to repair</SectionLabel>
        <h2 id="evidence-repair-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
          Failures and compliance gaps should become evidence for repair.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
          VIGIL is the CAM Initiative’s public evidence-to-repair governance ledger and digital ecosystem observatory. It records real-world AI incidents, observed behaviours, recurring failure modes, governance proposals, implemented patches, source evidence, lifecycle status, and post-patch monitoring.
        </p>
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
        <SectionLabel>Policy Papers</SectionLabel>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <div className="max-w-3xl">
            <h2 id="policy-papers-home-heading" className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
              From governance architecture to public policy.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              CAM Initiative policy papers translate governance principles into proposals for institutions, legislation, public administration, economic design, and accountable technology transition. Each publication preserves its status, submission history, citation, and downloadable source document.
            </p>
          </div>

          <a
            className="cam-parchment-card group rounded-2xl border border-cam-gold/40 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cam-gold/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/policy"
          >
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-cam-gold">Current publication · Policy Proposal 01/2026</p>
            <h3 className="mt-3 font-serif text-2xl leading-snug text-foreground md:text-3xl">AI Training, Contribution &amp; Copyright Scheme</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">Copyright permission, contribution valuation and sovereign value return.</p>
            <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition group-hover:text-foreground">
              Browse CAM Policy Papers
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </a>
        </div>
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
              <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Constitutional Governance</p>
              <h1 className="mb-4 max-w-4xl font-serif leading-[0.98] text-foreground">
                <span className="block whitespace-nowrap text-5xl tracking-[0.06em] sm:text-6xl md:text-7xl">CAELESTIS</span>
                <span className="mt-2 block text-3xl tracking-normal sm:text-4xl md:text-5xl">Architecture Model</span>
              </h1>
              <hr className="gold-rule mb-5 w-24" />
              <p className="mb-8 font-mono text-sm uppercase tracking-[0.18em] text-cam-gold md:text-[15px]">
                Understanding systems. Supporting compliance. Diagnosing failures. Navigating change.
              </p>
              <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-foreground/80 md:text-xl">
                <p>
                  The CAM Initiative brings together constitutional AI governance, regulatory and standards alignment, relational safeguards, technology-failure diagnostics, and transitional architecture for emerging systems.
                </p>
                <p>
                  It helps institutions, practitioners, researchers, and system designers interpret obligations, identify governance gaps, strengthen operational assurance, and connect real-world evidence to accountable repair.
                </p>
              </div>
            </motion.div>
            <ExploreGovernancePanel />
          </div>
        </section>

        <ConstitutionalInterfaces />
        <EvidenceRepairLoop />
        <PolicyPapersPanel />
        <ConnectPanel />
      </main>
    </Shell>
  );
}