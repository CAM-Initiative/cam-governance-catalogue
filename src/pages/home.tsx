import type { ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, ExternalLink, Github, Mail } from "lucide-react";

const GOLD_BORDER = "rgba(184,147,90,0.3)";
const panelStyle = { backgroundColor: "rgba(255,253,247,0.62)", border: `1px solid ${GOLD_BORDER}` };

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
        <section className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,253,247,0.96),rgba(244,238,224,0.58))]">
          <div className="container mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20">
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
            </motion.div>
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
          <SectionLabel>Choose your pathway into CAM</SectionLabel>
          <h2 id="pathways-heading" className="mb-7 font-serif text-3xl leading-tight text-foreground md:text-4xl">
            Choose the governance pathway that matches the work.
          </h2>
          <div className="grid gap-6 [perspective:1400px] md:grid-cols-2 xl:grid-cols-4">
            {pathways.map((pathway, index) => {
              const depthClass = [
                "md:[transform:rotateY(-8deg)_translateZ(8px)]",
                "md:[transform:rotateY(-3deg)_translateZ(18px)]",
                "md:[transform:rotateY(3deg)_translateZ(18px)]",
                "md:[transform:rotateY(8deg)_translateZ(8px)]",
              ][index];

              return (
              <article
                className={`group flex h-full min-h-[360px] scroll-mt-24 flex-col rounded-3xl border border-cam-gold/25 bg-card/90 p-6 shadow-[0_24px_60px_rgba(80,55,20,0.12)] transition duration-300 [transform-style:preserve-3d] hover:shadow-[0_30px_80px_rgba(80,55,20,0.18)] focus-within:-translate-y-2 md:p-7 md:hover:[transform:translateY(-0.5rem)_rotateY(0deg)_translateZ(24px)] motion-reduce:transform-none ${depthClass}`}
                id={pathway.id}
                key={pathway.id}
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
              );
            })}
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
