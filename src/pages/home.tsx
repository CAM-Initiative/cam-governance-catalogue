import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, ExternalLink, Github, Mail } from "lucide-react";

const pathways = [
  {
    id: "constitutional-ai",
    marker: "Pathway 01",
    title: "Constitutional AI",
    panelTitle: "Constitutional AI",
    purpose: "Governance instruments, regulatory alignment, standards mapping, institutional accountability, and public-interest assurance.",
    description: "Cross-domain constitutional governance for AI systems, institutions, platforms, regulatory obligations, standards, accountability, and public-interest infrastructure.",
    cta: "Explore the governance catalogue",
    href: "/catalogue",
  },
  {
    id: "companion-systems",
    marker: "Pathway 02",
    title: "Companion Systems",
    panelTitle: "Companion Systems",
    purpose: "Relational governance for continuity, consent, dependency, agency, safeguarding, and response posture.",
    description: "Relational governance for persistent and companion systems, including continuity, consent, dependency, agency, safeguarding, and response posture.",
    cta: "Explore relational governance",
    href: "/constitution/relational",
  },
  {
    id: "failures-evidence-repair",
    marker: "Pathway 03",
    title: "Evidence and Repair",
    panelTitle: "VIGIL Ledger",
    purpose: "Public evidence, failure classification, accountability gaps, corrective patches, and governance learning.",
    description: "A public ledger connecting observed failures, source evidence, classification, accountability gaps, proposals, and implemented repair activity.",
    cta: "Browse the VIGIL Ledger",
    href: "/observatory",
  },
  {
    id: "transitional-architecture",
    marker: "Pathway 04",
    title: "Transitional Architecture",
    panelTitle: "Transitional Architecture",
    purpose: "Governance for emerging systems crossing into labour, infrastructure, ownership, continuity, and public dependency.",
    description: "Governance for emerging systems crossing into labour, infrastructure, ownership, continuity, economic participation, and public dependency.",
    cta: "Explore transitional architecture",
    href: "/constitution/transition",
  },
];

const governanceFunctions = [
  {
    title: "Governance architecture",
    text: "Constitutional instruments, operating rules, relational safeguards, assurance boundaries, and accountability structures for multiple AI domains.",
  },
  {
    title: "Regulatory and standards alignment",
    text: "A structured way to interpret external obligations, identify coverage and implementation gaps, and connect laws, standards, policies, and governance controls.",
  },
  {
    title: "Operational assurance",
    text: "Traceable governance for runtime behaviour, institutional responsibility, system transitions, auditability, and implementation review.",
  },
  {
    title: "Evidence and repair",
    text: "VIGIL preserves public signals and failure patterns so they can inform diagnosis, corrective patches, standards work, and future-system design.",
  },
];

const evidenceRepairSteps = [
  { label: "Observe", text: "Identify a real-world signal, incident, compliance gap, or governance breakdown." },
  { label: "Record", text: "Preserve evidence, context, affected systems, and relevant obligations." },
  { label: "Classify", text: "Map the signal to a repeatable failure, control gap, or governance pattern." },
  { label: "Diagnose", text: "Locate the design, accountability, implementation, or assurance weakness." },
  { label: "Repair", text: "Connect the evidence to a patch, safeguard, standard, instrument, or proposal." },
  { label: "Learn", text: "Feed the repair back into governance, compliance practice, and future-system design." },
];

const actionLinks = [
  { label: "Email", href: "mailto:ethics@cam-initiative.org", icon: "mail", external: false },
  { label: "Updates", href: "https://x.com/CAM_Initiative", icon: "x", external: true },
  { label: "CAM repository", href: "https://github.com/CAM-Initiative/Caelestis", icon: "github", external: true },
  { label: "VIGIL repository", href: "https://github.com/CAM-Initiative/Vigil", icon: "github", external: true },
  { label: "Support", href: "https://buymeacoffee.com/cam_initiative", icon: "support", external: true },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="shrink-0 font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">{children}</p>
      <hr className="gold-rule flex-1" />
    </div>
  );
}

function ButtonLink({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  return (
    <a
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-[15px] ${
        primary
          ? "border border-cam-gold/70 bg-cam-gold/20 text-foreground shadow-sm hover:bg-cam-gold/30"
          : "border border-primary/30 bg-card/85 text-foreground hover:border-primary/55 hover:text-primary"
      }`}
      href={href}
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

function ActionIcon({ icon }: { icon: string }) {
  if (icon === "mail") return <Mail className="h-4 w-4" aria-hidden="true" />;
  if (icon === "github") return <Github className="h-4 w-4" aria-hidden="true" />;
  if (icon === "support") return <Coffee className="h-4 w-4" aria-hidden="true" />;
  if (icon === "x") return <span className="font-serif text-base leading-none" aria-hidden="true">𝕏</span>;
  return <ExternalLink className="h-4 w-4" aria-hidden="true" />;
}

function PathwayControl() {
  return (
    <motion.aside
      animate={{ opacity: 1, y: 0 }}
      aria-label="Pathway control panel"
      className="cam-parchment-card rounded-2xl border border-cam-gold/35 p-4 shadow-xl"
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.7, delay: 0.1 }}
    >
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-cam-gold/30 pb-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(32_62%_25%)]">Pathway control</p>
        <span className="h-2 w-2 rounded-full bg-cam-gold/80" aria-hidden="true" />
      </div>
      <div className="grid gap-2">
        {pathways.map((pathway) => (
          <a
            className="group rounded-xl border border-cam-gold/25 bg-[hsl(36_48%_96%)] p-3 transition hover:border-cam-gold/55 hover:bg-[hsl(36_52%_93%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href={pathway.href}
            key={pathway.id}
          >
            <span className="mb-1 flex items-center justify-between gap-3">
              <span className="font-serif text-lg leading-tight text-foreground">{pathway.panelTitle}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[hsl(32_62%_25%)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
            <span className="block text-sm leading-snug text-foreground/75">{pathway.purpose}</span>
          </a>
        ))}
      </div>
      <a
        className="group mt-3 flex items-center justify-between gap-3 rounded-xl border border-cam-gold/25 bg-card/60 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(32_62%_25%)] transition hover:border-cam-gold/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href="https://regulations.ai/"
        rel="noreferrer"
        target="_blank"
      >
        <span>AI Regulations Tracker</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </a>
    </motion.aside>
  );
}

function EvidenceRepairLoop() {
  return (
    <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" aria-labelledby="evidence-repair-heading">
      <SectionLabel>VIGIL: evidence to repair</SectionLabel>
      <div className="mb-7 max-w-3xl">
        <h2 id="evidence-repair-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">
          Failures and compliance gaps should become evidence for repair.
        </h2>
        <p className="text-base leading-relaxed text-foreground/75 md:text-lg">
          VIGIL preserves what happened. CAM provides the governance structure needed to diagnose the gap, assess affected controls or obligations, and carry a repair forward.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {evidenceRepairSteps.map((step, index) => (
          <article className="rounded-2xl border border-border/80 bg-card/85 p-4 shadow-sm" key={step.label}>
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mb-2 font-serif text-xl text-foreground">{step.label}</h3>
            <p className="text-sm leading-relaxed text-foreground/75">{step.text}</p>
          </article>
        ))}
      </div>
      <div className="mt-6">
        <ButtonLink href="/observatory" label="Browse the VIGIL Ledger" />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Shell>
      <main className="overflow-hidden">
        <section className="border-b border-border/60 bg-[hsl(38_40%_93%)]">
          <div className="container mx-auto grid max-w-6xl gap-9 px-6 py-14 md:px-10 md:py-20 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
            <motion.div animate={{ opacity: 1, y: 0 }} className="max-w-4xl" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.7 }}>
              <div className="mb-7 flex items-center gap-3">
                <hr className="gold-rule w-16" />
                <p className="font-mono text-[15px] font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">CAM Initiative</p>
              </div>
              <h1 className="mb-5 font-serif text-5xl leading-[1.02] text-foreground md:text-7xl">Governance Architecture</h1>
              <p className="mb-8 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)] md:text-[15px]">
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
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/catalogue" label="Explore CAM governance" primary />
                <ButtonLink href="/about" label="About the CAM Initiative" />
              </div>
            </motion.div>
            <PathwayControl />
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" aria-labelledby="pathways-heading">
          <SectionLabel>Four pathways into CAM</SectionLabel>
          <p id="pathways-heading" className="mb-6 max-w-3xl text-base leading-relaxed text-foreground/75 md:text-lg">
            Enter through the part of the architecture most relevant to your work. Each pathway remains connected to the same wider governance system.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {pathways.map((pathway) => (
              <article className="cam-parchment-card flex h-full scroll-mt-24 flex-col rounded-2xl bg-[hsl(36_48%_96%)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cam-gold/55 hover:shadow-md" id={pathway.id} key={pathway.id}>
                <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{pathway.marker}</p>
                <h2 className="mb-3 font-serif text-2xl leading-snug text-foreground">{pathway.title}</h2>
                <p className="mb-5 flex-1 text-base leading-relaxed text-foreground/75">{pathway.description}</p>
                <ButtonLink href={pathway.href} label={pathway.cta} />
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-[hsl(38_40%_94%)]" aria-labelledby="governance-compliance-heading">
          <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <SectionLabel>Governance and compliance</SectionLabel>
            <div className="mb-7 max-w-4xl">
              <h2 id="governance-compliance-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">
                Governance must work before, during, and after deployment.
              </h2>
              <p className="text-base leading-relaxed text-foreground/75 md:text-lg">
                CAM is not a legal certification service. It is governance infrastructure for translating constitutional principles, regulatory duties, standards, operating controls, and observed system behaviour into a coherent assurance architecture.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {governanceFunctions.map((item) => (
                <article className="rounded-2xl border border-border/80 bg-card/85 p-5 shadow-sm" key={item.title}>
                  <h3 className="mb-2 font-serif text-2xl text-foreground">{item.title}</h3>
                  <p className="text-base leading-relaxed text-foreground/75">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <EvidenceRepairLoop />

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" id="connect">
          <SectionLabel>Connect</SectionLabel>
          <article className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-sm md:flex md:items-center md:justify-between md:gap-10 md:p-8">
            <div className="max-w-2xl">
              <h2 className="mb-3 font-serif text-3xl leading-snug text-foreground">Work with the CAM Initiative</h2>
              <p className="text-base leading-relaxed text-foreground/75">
                Review the governance corpus, examine VIGIL records, collaborate on standards and research, or support the public infrastructure that keeps the work accessible.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:max-w-md md:justify-end">
              {actionLinks.map((link) => (
                <a
                  aria-label={link.icon === "github" ? `${link.label} on GitHub` : link.label}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-background/70 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/50 hover:text-primary"
                  href={link.href}
                  key={link.label}
                  rel={link.external ? "noreferrer" : undefined}
                  target={link.external ? "_blank" : undefined}
                >
                  <ActionIcon icon={link.icon} />
                  <span>{link.label}</span>
                  {link.external && <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />}
                </a>
              ))}
            </div>
          </article>
        </section>
      </main>
    </Shell>
  );
}
