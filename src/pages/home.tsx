import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, ExternalLink, Github, Mail } from "lucide-react";

const initiativeResources = [
  {
    id: "cam-catalogue",
    marker: "Core resource 01",
    title: "CAM Catalogue",
    purpose: "The constitutional corpus, governance domains, runtime schedules, safeguards, standards mappings, and operational instruments.",
    description: "Browse the published CAM governance corpus and inspect the constitutional, domain, runtime, ethics, security, continuity, economic, and operational instruments that make up the architecture.",
    cta: "Browse the CAM Catalogue",
    href: "/catalogue",
  },
  {
    id: "vigil-observatory",
    marker: "Core resource 02",
    title: "VIGIL Observatory",
    purpose: "Public evidence, observed failures, proposals, patch records, repair status, and post-patch monitoring.",
    description: "Explore the public ledger connecting real-world signals and failure modes to evidence, governance gaps, proposals, implemented patches, and continuing observation.",
    cta: "Browse the VIGIL Observatory",
    href: "/observatory",
  },
];

const externalResources = [
  { label: "AI Regulations Tracker", href: "https://regulations.ai/" },
  { label: "AI Incident Database", href: "https://incidentdatabase.ai/" },
  { label: "OECD AI Incidents Monitor", href: "https://oecd.ai/en/incidents" },
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
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(32_62%_25%)]">Explore AI Governance</p>
        <span className="h-2 w-2 rounded-full bg-cam-gold/80" aria-hidden="true" />
      </div>

      <div className="grid gap-2">
        {initiativeResources.map((resource) => (
          <a
            className="group rounded-xl border border-cam-gold/30 bg-[hsl(36_48%_96%)] p-4 transition hover:border-cam-gold/60 hover:bg-[hsl(36_52%_93%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href={resource.href}
            key={resource.id}
          >
            <span className="mb-1 flex items-center justify-between gap-3">
              <span className="font-serif text-xl leading-tight text-foreground">{resource.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[hsl(32_62%_25%)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
            <span className="block text-sm leading-snug text-foreground/75">{resource.purpose}</span>
          </a>
        ))}
      </div>

      <div className="mt-4 border-t border-cam-gold/25 pt-3">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/55">External tools</p>
        <div className="grid gap-2">
          {externalResources.map((resource) => (
            <a
              className="group flex items-center justify-between gap-3 rounded-lg border border-cam-gold/20 bg-card/55 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] transition hover:border-cam-gold/45 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={resource.href}
              key={resource.label}
              rel="noreferrer"
              target="_blank"
            >
              <span>{resource.label}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
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
        <ButtonLink href="/observatory" label="Browse the VIGIL Observatory" />
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
            <ExploreGovernancePanel />
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
              {initiativeResources.map((resource) => (
                <article className="cam-parchment-card flex h-full scroll-mt-24 flex-col rounded-2xl bg-[hsl(36_48%_96%)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cam-gold/55 hover:shadow-md" id={resource.id} key={resource.id}>
                  <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{resource.marker}</p>
                  <h3 className="mb-3 font-serif text-3xl leading-snug text-foreground">{resource.title}</h3>
                  <p className="mb-5 flex-1 text-base leading-relaxed text-foreground/75">{resource.description}</p>
                  <ButtonLink href={resource.href} label={resource.cta} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <EvidenceRepairLoop />

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" id="connect">
          <SectionLabel>Connect</SectionLabel>
          <article className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-sm md:p-8">
            <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(300px,0.85fr)] md:items-center">
              <div className="max-w-2xl">
                <h2 className="mb-3 font-serif text-3xl leading-snug text-foreground">Work with the CAM Initiative</h2>
                <p className="text-base leading-relaxed text-foreground/75">
                  Review the governance corpus, examine VIGIL records, collaborate on standards and research, or support the public infrastructure that keeps the work accessible.
                </p>
              </div>
              <div className="grid gap-3">
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cam-gold/55 bg-cam-gold/15 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-cam-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="mailto:ethics@cam-initiative.org"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>Email the CAM Initiative</span>
                </a>
                <div className="grid gap-2 sm:grid-cols-2">
                  {actionLinks.map((link) => (
                    <a
                      aria-label={link.icon === "github" ? `${link.label} on GitHub` : link.label}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-background/65 px-3 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/45 hover:text-primary"
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
              </div>
            </div>
          </article>
        </section>
      </main>
    </Shell>
  );
}
