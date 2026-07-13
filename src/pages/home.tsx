import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, ExternalLink, Github, Mail } from "lucide-react";

const pathways = [
  {
    id: "constitutional-ai",
    marker: "Pathway 01",
    title: "Constitutional AI",
    description: "Cross-domain governance instruments for accountable AI systems, institutions, platforms, and public-interest infrastructure.",
    cta: "Explore the governance catalogue",
    href: "/catalogue",
  },
  {
    id: "companion-systems",
    marker: "Pathway 02",
    title: "Companion Systems",
    description: "Relational governance for continuity, consent, dependency, agency, safeguarding, and response posture.",
    cta: "Explore relational governance",
    href: "/constitution/relational",
  },
  {
    id: "failures-evidence-repair",
    marker: "Pathway 03",
    title: "Evidence and Repair",
    description: "A public ledger connecting observed failures, evidence, classification, accountability gaps, and repair activity.",
    cta: "Browse the VIGIL Ledger",
    href: "/observatory",
  },
  {
    id: "transitional-architecture",
    marker: "Pathway 04",
    title: "Transitional Architecture",
    description: "Governance for emerging systems crossing into labour, infrastructure, ownership, continuity, and public dependency.",
    cta: "Explore transitional architecture",
    href: "/constitution/transition",
  },
];

const evidenceRepairSteps = [
  { label: "Observe", text: "Identify a real-world signal, incident, or governance breakdown." },
  { label: "Record", text: "Preserve evidence, context, and the affected system." },
  { label: "Classify", text: "Map the signal to a repeatable failure or governance pattern." },
  { label: "Diagnose", text: "Locate the design, accountability, or implementation gap." },
  { label: "Repair", text: "Connect the evidence to a patch, safeguard, standard, or proposal." },
  { label: "Learn", text: "Feed the repair back into future governance and system design." },
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
      <p className="shrink-0 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">{children}</p>
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

function EvidenceRepairLoop() {
  return (
    <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" aria-labelledby="evidence-repair-heading">
      <SectionLabel>Evidence to repair</SectionLabel>
      <div className="mb-7 max-w-3xl">
        <h2 id="evidence-repair-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">
          Failures should become evidence for repair.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
          VIGIL preserves what happened. CAM provides the governance structure needed to diagnose the gap and carry a repair forward.
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
    </section>
  );
}

export default function Home() {
  return (
    <Shell>
      <main className="overflow-hidden">
        <section className="border-b border-border/60 bg-[hsl(38_40%_93%)]">
          <div className="container mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
            <motion.div animate={{ opacity: 1, y: 0 }} className="max-w-5xl" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.7 }}>
              <div className="mb-7 flex items-center gap-3">
                <hr className="gold-rule w-16" />
                <p className="font-mono text-[15px] uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">CAM Initiative</p>
              </div>
              <h1 className="mb-6 max-w-5xl font-serif text-5xl leading-[1.03] text-foreground md:text-7xl">
                Governance infrastructure for AI systems that must remain accountable and repairable.
              </h1>
              <p className="max-w-4xl text-lg leading-relaxed text-foreground/80 md:text-xl">
                CAM connects constitutional governance, relational safeguards, public evidence, and repair pathways across multiple AI domains.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/catalogue" label="Explore CAM" primary />
                <ButtonLink href="/observatory" label="Browse the VIGIL Ledger" />
              </div>
            </motion.div>
          </div>
        </section>

        <EvidenceRepairLoop />

        <section className="container mx-auto max-w-6xl px-6 pb-12 pt-4 md:px-10 md:pb-16" aria-labelledby="pathways-heading">
          <SectionLabel>Four pathways into CAM</SectionLabel>
          <p id="pathways-heading" className="mb-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Enter through the part of the architecture most relevant to your work.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {pathways.map((pathway) => (
              <article className="flex h-full flex-col rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cam-gold/55 hover:shadow-md" id={pathway.id} key={pathway.id}>
                <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{pathway.marker}</p>
                <h3 className="mb-3 font-serif text-2xl leading-snug text-foreground">{pathway.title}</h3>
                <p className="mb-5 flex-1 text-base leading-relaxed text-foreground/75">{pathway.description}</p>
                <ButtonLink href={pathway.href} label={pathway.cta} />
              </article>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" id="connect">
          <SectionLabel>Connect</SectionLabel>
          <article className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-sm md:flex md:items-center md:justify-between md:gap-10 md:p-8">
            <div className="max-w-2xl">
              <h2 className="mb-3 font-serif text-3xl leading-snug text-foreground">Work with the CAM Initiative</h2>
              <p className="text-base leading-relaxed text-foreground/75">
                Review the governance corpus, contribute evidence to VIGIL, collaborate on standards and research, or support the public infrastructure that keeps the work accessible.
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
