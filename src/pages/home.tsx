import type { ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, ExternalLink, Github, Mail } from "lucide-react";

const GOLD_BORDER = "rgba(184,147,90,0.3)";
const panelStyle = { backgroundColor: "rgba(255,253,247,0.62)", border: `1px solid ${GOLD_BORDER}` };

const heroButtons = [
  { label: "Explore Constitutional AI", href: "/catalogue", variant: "primary" },
  { label: "Explore Companion Systems", href: "/constitution/relational", variant: "secondary" },
  { label: "Explore Evidence-to-Repair Ledger", href: "/observatory", variant: "secondary" },
  { label: "Explore Transitional Architecture", href: "#transition-architecture", variant: "secondary" },
];

const pathways = [
  {
    id: "constitutional-ai",
    marker: "Pathway 01",
    title: "Constitutional AI Across Multiple Domains",
    description:
      "Explore CAM’s cross-domain governance architecture for AI systems, institutions, platforms, accountability structures, and public-interest technology governance across relational, economic, identity, ethics, operational, and transition domains.",
    cta: "Explore Constitutional AI",
    href: "/catalogue",
  },
  {
    id: "companion-systems",
    marker: "Pathway 02",
    title: "Companion System Design",
    description:
      "Explore CAM’s governance work on relational AI and companion systems, including attachment, continuity, dependency, identity, agency, consent, safeguarding, and harm prevention.",
    cta: "Explore Companion Systems",
    href: "/constitution/relational",
  },
  {
    id: "failures-evidence-repair",
    marker: "Pathway 03",
    title: "Failures, Evidence, and Repair",
    description:
      "Use VIGIL to examine real-world technology failures, preserve evidence, classify harms, identify accountability gaps, and connect failures to repair pathways.",
    cta: "Explore Evidence-to-Repair Ledger",
    href: "/observatory",
  },
  {
    id: "transition-architecture",
    marker: "Pathway 04",
    title: "Transition and Emerging Frontier Development",
    description:
      "Explore governance tools for emerging technologies, institutional adaptation, frontier-system design, and responsible transition before new forms of failure become locked in.",
    cta: "Explore Transitional Architecture",
    href: "/catalogue",
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
    text: "Use CAM to understand emerging risks, map adaptation pathways, address accountability problems, and plan for transition challenges.",
  },
];


const actionLinks = [
  { label: "Email", href: "mailto:ethics@cam-initiative.org", icon: "mail", external: false },
  { label: "Updates", href: "https://x.com/CAM_Initiative", icon: "x", external: true },
  { label: "CAM Governance", href: "https://github.com/CAM-Initiative/Caelestis", icon: "github", external: true },
  { label: "VIGIL Governance", href: "https://github.com/CAM-Initiative/Vigil", icon: "github", external: true },
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
        <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_18%_18%,rgba(184,147,90,0.18),transparent_30%),linear-gradient(180deg,rgba(255,253,247,0.96),rgba(244,238,224,0.58))]">
          <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
            <svg className="h-full w-full" viewBox="0 0 1200 620" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heroRoute" x1="0" x2="1">
                  <stop offset="0%" stopColor="rgba(184,147,90,0.1)" />
                  <stop offset="50%" stopColor="rgba(184,147,90,0.45)" />
                  <stop offset="100%" stopColor="rgba(73,112,91,0.28)" />
                </linearGradient>
              </defs>
              <path d="M80 420 C270 260, 360 520, 560 330 S820 165, 1120 260" fill="none" stroke="url(#heroRoute)" strokeWidth="2" strokeDasharray="10 12" />
              <path d="M160 145 H520 M230 210 H670 M105 288 H430 M760 120 V470 M900 170 V520" stroke="rgba(184,147,90,0.18)" strokeWidth="1" />
              {[160, 300, 520, 760, 900, 1040].map((x, index) => (
                <circle key={x} cx={x} cy={index % 2 ? 210 : 288} r="5" fill="rgba(184,147,90,0.55)" />
              ))}
            </svg>
          </div>

          <div className="container relative mx-auto grid max-w-6xl gap-9 px-6 py-14 md:px-10 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="relative max-w-4xl"
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.7 }}
            >
              <div className="mb-7 flex items-center gap-3">
                <hr className="gold-rule w-16" />
                <p className="font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">
                  CAM Initiative
                </p>
              </div>
              <div className="relative rounded-[2rem] border border-cam-gold/20 bg-background/45 p-5 backdrop-blur-[1px] md:p-7">
                <div className="absolute -inset-3 -z-10 rounded-[2.3rem] border border-cam-gold/10" aria-hidden="true" />
                <h1 className="mb-5 font-serif text-5xl leading-[1.02] text-foreground md:text-7xl">
                  Governance Architecture
                </h1>
                <p className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-cam-gold md:text-[15px]">
                  Understanding failures. Designing governance. Navigating transition.
                </p>
                <div className="max-w-3xl space-y-5 text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
                  <p>
                    CAM Initiative develops governance frameworks for AI systems, companion systems, technology failure response, and emerging frontier transitions.
                  </p>
                  <p>
                    It turns observed failures into structured diagnosis, repair pathways, and safer governance design across multiple domains.
                  </p>
                </div>
              </div>
            </motion.div>

            <aside className="rounded-3xl border border-cam-gold/30 bg-[hsl(28_25%_16%)] p-5 text-[hsl(36_48%_95%)] shadow-2xl" aria-label="Choose a pathway">
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-cam-gold">Enter the architecture</p>
                <span className="h-2 w-2 rounded-full bg-cam-gold shadow-[0_0_18px_rgba(184,147,90,0.8)]" aria-hidden="true" />
              </div>
              <div className="grid gap-3">
                {[
                  ["Constitutional AI", "Cross-domain governance for AI systems, institutions, platforms, and accountability structures.", "Explore Constitutional AI", "/catalogue"],
                  ["Companion Systems", "Relational governance for companion systems, attachment, continuity, dependency, agency, consent, and harm prevention.", "Explore Companion Systems", "/constitution/relational"],
                  ["VIGIL Records", "Observed failures, evidence, classification, accountability gaps, and repair pathways.", "Explore Evidence-to-Repair Ledger", "/observatory"],
                  ["Transitional Architecture", "Governance tools for emerging technologies, institutional adaptation, frontier systems, and transition planning.", "Explore Transitional Architecture", "/catalogue"],
                ].map(([title, purpose, label, href]) => (
                  <a key={title} href={href} className="group rounded-2xl border border-cam-gold/20 bg-[hsl(30_22%_22%)] p-4 transition hover:border-cam-gold/55 hover:bg-[hsl(30_22%_25%)] focus:outline-none focus:ring-2 focus:ring-cam-gold/40">
                    <span className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-serif text-xl text-[hsl(36_48%_95%)]">{title}</span>
                      <span className="text-cam-gold transition group-hover:translate-x-1" aria-hidden="true">→</span>
                    </span>
                    <span className="block text-sm leading-relaxed text-[hsl(36_28%_82%)]">{purpose}</span>
                    <span className="mt-3 block font-mono text-[11px] uppercase tracking-[0.16em] text-cam-gold">{label}</span>
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <SectionLabel>Why the CAM Initiative exists</SectionLabel>
          <div className="rounded-3xl p-6 md:p-8" style={panelStyle}>
            <h2 className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
              Technology failures are rarely isolated events.
            </h2>
            <div className="max-w-4xl space-y-4 text-base font-light leading-relaxed text-muted-foreground md:text-lg">
              <p>
                They often reveal recurring failures of governance, design, incentives, accountability, relational safety, institutional readiness, or transition planning.
              </p>
              <p>
                CAM provides a way to identify the pattern, classify the harm, map the accountability gap, and design repair before failures become entrenched.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 pb-12 md:px-10 md:pb-16" aria-labelledby="pathways-heading">
          <SectionLabel>Four pathways into CAM</SectionLabel>
          <h2 id="pathways-heading" className="mb-7 font-serif text-3xl leading-tight text-foreground md:text-4xl">
            Choose the governance pathway that matches the work.
          </h2>
          <div className="grid auto-rows-fr gap-5 lg:grid-cols-2">
            {pathways.map((pathway) => (
              <article
                className="flex h-full scroll-mt-24 flex-col rounded-3xl p-6 shadow-sm md:p-7"
                id={pathway.id}
                key={pathway.id}
                style={panelStyle}
              >
                <div className="flex-1">
                  <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-cam-gold">
                    {pathway.marker}
                  </p>
                  <h3 className="mb-4 font-serif text-2xl leading-snug text-foreground md:text-3xl">
                    {pathway.title}
                  </h3>
                  <p className="mb-5 text-base font-light leading-relaxed text-muted-foreground md:text-lg">
                    {pathway.description}
                  </p>
                </div>

                {/* TODO: Create a dedicated Transitional Architecture page; this entry currently routes to the catalogue as the closest supported route. */}
                <div className="mt-2 pt-2">
                  <ButtonLink href={pathway.href} label={pathway.cta} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-[hsl(36_48%_95%)]">
          <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <SectionLabel>Who this is for</SectionLabel>
            <div className="grid gap-3">
              {audiences.map((audience) => (
                <CollapsiblePanel key={audience.label} title={audience.label}>
                  <p>{audience.text}</p>
                </CollapsiblePanel>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" id="connect">
          <SectionLabel>Connect</SectionLabel>
          <article className="rounded-3xl border border-border bg-card/75 p-6 shadow-sm md:p-8">
            <h2 className="mb-3 font-serif text-2xl leading-snug text-foreground md:text-3xl">
              Contact, follow, and support
            </h2>
            <p className="mb-5 text-base font-light leading-relaxed text-muted-foreground md:text-lg">
              For ethics, governance, citation, reuse, collaboration, public-interest enquiries, repository inspection, or independent maintenance support, use the links below.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {actionLinks.map((link) => (
                <a
                  aria-label={link.icon === "github" ? `${link.label} on GitHub` : link.label}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[15px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary md:text-base"
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
