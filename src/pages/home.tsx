import type { ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, ExternalLink, Github, Mail } from "lucide-react";

const GOLD_BORDER = "rgba(184,147,90,0.3)";
const panelStyle = { backgroundColor: "rgba(255,253,247,0.62)", border: `1px solid ${GOLD_BORDER}` };
const citationPanelStyle = { backgroundColor: "rgba(184,147,90,0.07)", border: `1px solid ${GOLD_BORDER}` };

const pathways = [
  {
    id: "constitutional-ai",
    marker: "Pathway 01",
    title: "Constitutional AI Across Multiple Domains",
    panelTitle: "Constitutional AI",
    purpose: "Cross-domain governance for AI systems, institutions, platforms, and accountability.",
    description:
      "Cross-domain governance for AI systems, institutions, platforms, accountability structures, and public-interest technology governance across relational, economic, identity, ethics, operational, and frontier domains.",
    cta: "Explore Constitutional AI",
    href: "/catalogue",
  },
  {
    id: "companion-systems",
    marker: "Pathway 02",
    title: "Companion System Design",
    panelTitle: "Companion Systems",
    purpose: "Relational governance for companion systems, continuity, dependency, agency, consent, and harm prevention.",
    description:
      "Governance work on relational AI and companion systems, including attachment, continuity, dependency, identity, agency, consent, safeguarding, and harm prevention.",
    cta: "Explore Companion Systems",
    href: "/constitution/relational",
  },
  {
    id: "failures-evidence-repair",
    marker: "Pathway 03",
    title: "Failures, Evidence, and Repair",
    panelTitle: "VIGIL Records",
    purpose: "Failure records, evidence, classification, accountability gaps, and repair pathways.",
    description:
      "Use VIGIL to examine real-world technology failures, preserve evidence, classify harms, identify accountability gaps, and connect failures to repair pathways.",
    cta: "Explore Evidence-to-Repair Ledger",
    href: "/observatory",
  },
  {
    id: "transitional-architecture",
    marker: "Pathway 04",
    title: "Transitional Architecture",
    panelTitle: "Transitional Architecture",
    purpose: "Governance for emerging systems crossing into labour, infrastructure, continuity, and public dependency.",
    description:
      "Governance tools for emerging systems, institutional adaptation, frontier-system design, labour, infrastructure, continuity, and public dependency.",
    cta: "Explore Transitional Architecture",
    href: "/constitution/transition",
  },
];

const audiences = [
  {
    label: "Regulators & Standards Bodies",
    text: "Use CAM and VIGIL to identify recurring governance failures, search failure records by platform or vendor where filtering is available, review known failure patterns, examine failure classification and accountability gaps, and inspect repair status, patch notes, standards implications, or governance implications for known failures.",
  },
  {
    label: "Journalists & Researchers",
    text: "Use CAM to trace evidence, patterns, classification logic, institutional implications, and recurring governance failures across technology systems.",
  },
  {
    label: "AI Practitioners & Companion-System Designers",
    text: "Use CAM to design safer relational systems, reduce foreseeable harm, and build accountability into technical, product, and governance design.",
  },
  {
    label: "Civil Society & Institutions",
    text: "Use CAM to understand emerging risks, map adaptation pathways, address accountability problems, and plan for frontier-system challenges.",
  },
];


const actionLinks = [
  { label: "Email", href: "mailto:ethics@cam-initiative.org", icon: "mail", external: false },
  { label: "Updates", href: "https://x.com/CAM_Initiative", icon: "x", external: true },
  { label: "CAM", href: "https://github.com/CAM-Initiative/Caelestis", icon: "github", external: true },
  { label: "VIGIL", href: "https://github.com/CAM-Initiative/Vigil", icon: "github", external: true },
  { label: "Support", href: "https://buymeacoffee.com/cam_initiative", icon: "support", external: true },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="shrink-0 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">
        {children}
      </p>
      <hr className="gold-rule flex-1" />
    </div>
  );
}

function ButtonLink({ href, label, variant = "secondary" }: { href: string; label: string; variant?: string }) {
  const isPrimary = variant === "primary";
  return (
    <a
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-[15px] ${
        isPrimary
          ? "border border-cam-gold/60 bg-cam-gold/20 text-foreground shadow-sm hover:bg-cam-gold/30 hover:border-cam-gold"
          : "border border-primary/25 bg-card/75 text-foreground hover:border-primary/45 hover:text-primary"
      }`}
      href={href}
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

function CollapsiblePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group cam-parchment-card rounded-xl p-3 text-sm shadow-sm transition hover:border-primary/30 hover:bg-[hsl(36_48%_96%)]">
      <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.18em] text-cam-gold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background [&::-webkit-details-marker]:hidden">
        <span className="inline-flex w-full items-center gap-3">
          <span className="inline-block h-0 w-0 shrink-0 border-y-[0.35rem] border-l-[0.52rem] border-y-transparent border-l-[hsl(var(--primary))] transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
          <span>{title}</span>
        </span>
      </summary>
      <div className="mt-3 border-t border-border/70 pt-3 text-base font-light leading-relaxed text-muted-foreground md:text-lg">
        {children}
      </div>
    </details>
  );
}

function ActionIcon({ icon }: { icon: string }) {
  if (icon === "mail") return <Mail className="h-4 w-4" aria-hidden="true" />;
  if (icon === "github") return <Github className="h-4 w-4" aria-hidden="true" />;
  if (icon === "support") return <Coffee className="h-4 w-4" aria-hidden="true" />;
  if (icon === "x") return <span className="font-serif text-base leading-none" aria-hidden="true">𝕏</span>;
  return <ExternalLink className="h-4 w-4" aria-hidden="true" />;
}

export default function Home() {
  return (
    <Shell>
      <main className="overflow-hidden">
        <section className="relative overflow-hidden border-b border-border/60 bg-[hsl(38_40%_93%)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-45">
            <svg className="absolute left-1/2 top-8 h-[360px] w-[720px] -translate-x-1/2 text-cam-gold md:left-[38%] md:top-10" viewBox="0 0 720 360" fill="none">
              <path d="M60 88 H246 C282 88 288 126 324 126 H642" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" />
              <path d="M84 176 H208 C252 176 270 220 314 220 H618" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1" />
              <path d="M120 262 H268 C312 262 328 298 372 298 H586" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
              <path d="M160 54 V318" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
              <path d="M328 42 V330" stroke="currentColor" strokeOpacity="0.10" strokeWidth="1" />
              <path d="M512 70 V318" stroke="currentColor" strokeOpacity="0.10" strokeWidth="1" />
              <circle cx="246" cy="88" r="4" fill="currentColor" fillOpacity="0.28" />
              <circle cx="324" cy="126" r="4" fill="currentColor" fillOpacity="0.24" />
              <circle cx="314" cy="220" r="4" fill="currentColor" fillOpacity="0.22" />
              <circle cx="372" cy="298" r="4" fill="currentColor" fillOpacity="0.18" />
            </svg>
          </div>
          <div className="container relative mx-auto grid max-w-6xl gap-8 px-6 py-14 md:px-10 md:py-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.7 }}
            >
              <div className="mb-7 flex items-center gap-3">
                <hr className="gold-rule w-16" />
                <p className="font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">
                  CAM Initiative
                </p>
              </div>
              <h1 className="mb-5 font-serif text-5xl leading-[1.02] text-foreground md:text-7xl">
                Governance Architecture
              </h1>
              <p className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-cam-gold md:text-[15px]">
                Understanding failures. Designing governance. Navigating change.
              </p>
              <div className="max-w-3xl space-y-5 text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
                <p>
                  The CAM Initiative brings together four connected functions: constitutional AI governance, companion-system design, technology failure diagnostics, and transitional architecture for emerging systems.
                </p>
                <p>
                  Together, they turn observed failures into structured diagnosis, repair pathways, and safer governance design across multiple domains.
                </p>
              </div>
            </motion.div>

            <motion.aside
              animate={{ opacity: 1, y: 0 }}
              className="cam-parchment-card rounded-2xl border border-cam-gold/30 p-4 shadow-xl"
              initial={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              aria-label="Pathway control panel"
            >
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-cam-gold/25 pb-3">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-cam-gold">Pathway control</p>
                <span className="h-2 w-2 rounded-full bg-cam-gold/70" aria-hidden="true" />
              </div>
              <div className="grid gap-2">
                {pathways.map((pathway) => (
                  <a
                    className="group rounded-xl border border-cam-gold/20 bg-[rgba(184,147,90,0.08)] p-3 transition hover:border-cam-gold/50 hover:bg-[rgba(184,147,90,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    href={pathway.href}
                    key={pathway.id}
                  >
                    <span className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-serif text-lg leading-tight text-foreground">{pathway.panelTitle}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-cam-gold transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                    <span className="block text-sm font-light leading-snug text-muted-foreground">{pathway.purpose}</span>
                  </a>
                ))}
              </div>
            </motion.aside>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 pt-10 md:px-10 md:pt-14">
          <div className="cam-parchment-card relative overflow-hidden rounded-3xl p-6 shadow-sm md:p-8" style={citationPanelStyle}>
            <div className="border-l-2 pl-5 md:pl-6" style={{ borderColor: GOLD_BORDER }}>
              <h2 className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
                Technology failures are rarely isolated events.
              </h2>
              <div className="max-w-4xl space-y-4 text-base font-light leading-relaxed text-muted-foreground md:text-lg">
                <p>
                  They often reveal repeating patterns: failed safeguards, weak accountability, dependency drift, incentive conflict, evidence gaps, institutional unreadiness, or transition pressure.
                </p>
                <p className="text-foreground/85">
                  CAM classifies those patterns and routes them into the right governance pathway: constitutional structure, companion-system design, VIGIL failure records, or transitional architecture.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-8 h-10 w-px bg-gradient-to-b from-cam-gold/35 to-transparent md:left-10" aria-hidden="true" />
          </div>
          <div className="mx-8 h-8 border-l border-cam-gold/30 md:mx-10" aria-hidden="true" />
        </section>

        <section className="container mx-auto max-w-6xl px-6 pb-12 pt-8 md:px-10 md:pb-16 md:pt-10" aria-labelledby="pathways-heading">
          <SectionLabel>Four pathways into CAM</SectionLabel>
          <p id="pathways-heading" className="mb-6 max-w-3xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">
            Each pathway gives a different entry point into the same governance architecture.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {pathways.map((pathway) => (
              <article
                className="cam-parchment-card flex h-full scroll-mt-24 flex-col rounded-2xl bg-[hsl(36_48%_96%)] p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-cam-gold/55 hover:bg-[rgba(184,147,90,0.12)] hover:shadow-[0_12px_32px_rgba(120,80,20,0.14)]"
                id={pathway.id}
                key={pathway.id}
              >
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">
                  {pathway.marker}
                </p>
                <h3 className="mb-3 font-serif text-2xl leading-snug text-foreground">
                  {pathway.title}
                </h3>
                <p className="mb-5 flex-1 text-base font-light leading-relaxed text-muted-foreground">
                  {pathway.description}
                </p>
                <ButtonLink href={pathway.href} label={pathway.cta} />
              </article>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" id="connect">
          <SectionLabel>Connect</SectionLabel>
          <article className="cam-parchment-card rounded-3xl bg-[hsl(36_48%_96%)] p-5 shadow-sm md:p-6">
            <h2 className="mb-3 font-serif text-2xl leading-snug text-foreground md:text-3xl">
              Contact, follow, and support
            </h2>
            <p className="mb-4 max-w-3xl text-sm font-light leading-relaxed text-muted-foreground md:text-base">
              For citation, collaboration, reuse, governance enquiries, repository inspection, or public-interest support.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {actionLinks.map((link) => (
                <a
                  aria-label={link.icon === "github" ? `${link.label} on GitHub` : link.label}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cam-gold/25 bg-[rgba(184,147,90,0.08)] px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary md:text-[15px]"
                  href={link.href}
                  key={link.label}
                  rel={link.external ? "noreferrer" : undefined}
                  target={link.external ? "_blank" : undefined}
                >
                  <ActionIcon icon={link.icon} />
                  <span>{link.label}</span>
                  {link.external && <ExternalLink className="h-3.5 w-3.5 opacity-55" aria-hidden="true" />}
                </a>
              ))}
            </div>
          </article>
        </section>

      </main>
    </Shell>
  );
}
