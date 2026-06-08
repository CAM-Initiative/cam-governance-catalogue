import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.07)";
const GREEN_BG = "rgba(73,112,91,0.08)";
const panelStyle = { backgroundColor: "rgba(255,253,247,0.62)", border: `1px solid ${GOLD_BORDER}` };
const goldPanelStyle = { backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` };

const heroButtons = [
  { label: "Explore Governance AI", href: "#governance-ai", variant: "primary" },
  { label: "Explore Companion Systems", href: "#companion-systems", variant: "secondary" },
  { label: "View VIGIL Records", href: "/vigil", variant: "secondary" },
  { label: "Explore Transitional Architecture", href: "#transition-architecture", variant: "secondary" },
];

const pathways = [
  {
    id: "governance-ai",
    marker: "Pathway 01",
    title: "Governance AI Across Multiple Domains",
    description:
      "Explore CAM’s cross-domain governance architecture for AI systems, institutions, platforms, accountability structures, and public-interest technology governance across relational, economic, identity, ethics, operational, and transition domains.",
    cta: "Explore Governance AI",
    href: "/constitution",
  },
  {
    id: "companion-systems",
    marker: "Pathway 02",
    title: "Companion System Design",
    description:
      "Explore CAM’s governance work on relational AI and companion systems, including attachment, continuity, dependency, identity, agency, consent, safeguarding, and harm prevention.",
    cta: "Explore Companion Systems",
    href: "/constitution/relational",
    note: {
      label: "Featured instrument note",
      text: "Includes advanced companion-system governance work such as AEON-006-SCH-02.",
      href: "https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/Constitution/CAM-BS2025-AEON-006-SCH-02.md",
    },
  },
  {
    id: "failures-evidence-repair",
    marker: "Pathway 03",
    title: "Failures, Evidence, and Repair",
    description:
      "Use VIGIL to examine real-world technology failures, preserve evidence, classify harms, identify accountability gaps, and connect failures to repair pathways.",
    cta: "View VIGIL Records",
    href: "/vigil",
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

const repairSteps = [
  { label: "Observe", text: "Identify a real-world incident, harm, or governance breakdown." },
  { label: "Record", text: "Preserve evidence and context." },
  { label: "Classify", text: "Map the failure against CAM domains and taxonomy." },
  { label: "Diagnose", text: "Identify design failures, accountability gaps, and governance weaknesses." },
  { label: "Repair", text: "Propose patches, standards, safeguards, or institutional responses." },
  { label: "Learn", text: "Feed the pattern back into future-system design and transition planning." },
];

const audiences = [
  {
    label: "Regulators & Standards Bodies",
    text: "Use CAM to identify recurring governance failures, accountability gaps, and repair needs across AI systems and technology platforms.",
  },
  {
    label: "Journalists & Researchers",
    text: "Use CAM to trace evidence, patterns, classification logic, and institutional implications of technology failure.",
  },
  {
    label: "AI Practitioners & Companion-System Designers",
    text: "Use CAM to design safer relational systems, reduce foreseeable harm, and build accountability into technical and governance design.",
  },
  {
    label: "Civil Society & Institutions",
    text: "Use CAM to understand emerging risks, map adaptation pathways, address accountability problems, and plan for transition challenges.",
  },
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

export default function Home() {
  return (
    <Shell>
      <main className="overflow-hidden">
        <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(184,147,90,0.13),transparent_34%),linear-gradient(180deg,rgba(255,253,247,0.95),rgba(244,238,224,0.52))]">
          <div className="container mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end"
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.7 }}
            >
              <div>
                <div className="mb-7 flex items-center gap-3">
                  <hr className="gold-rule w-16" />
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-cam-gold">
                    CAM Initiative
                  </p>
                </div>
                <p className="mb-4 font-mono text-sm uppercase tracking-[0.2em] text-primary/80">
                  Understanding failures. Designing governance. Navigating transition.
                </p>
                <h1 className="mb-6 max-w-4xl font-serif text-5xl leading-[1.02] text-foreground md:text-7xl">
                  Governance AI Architecture
                </h1>
                <p className="max-w-3xl text-lg font-light leading-relaxed text-muted-foreground md:text-2xl">
                  CAM Initiative develops governance architecture for AI systems, companion systems, technology failure response, and emerging frontier transitions across multiple domains.
                </p>
                <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">
                  CAM turns technology failure into governance learning, repair pathways, and safer future-system design.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
                  {heroButtons.map((button) => (
                    <ButtonLink key={button.label} {...button} />
                  ))}
                </div>
              </div>

              <aside className="rounded-3xl p-6 shadow-sm" style={goldPanelStyle} aria-label="CAM orientation ledger">
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-cam-gold">
                  Public entry points
                </p>
                <div className="space-y-4">
                  {pathways.map((pathway) => (
                    <a
                      className="block rounded-2xl border border-primary/15 bg-card/60 p-4 transition hover:border-primary/35 hover:text-primary"
                      href={`#${pathway.id}`}
                      key={pathway.id}
                    >
                      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                        {pathway.marker}
                      </p>
                      <p className="font-serif text-lg leading-snug text-foreground">{pathway.title}</p>
                    </a>
                  ))}
                </div>
              </aside>
            </motion.div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <SectionLabel>Why CAM exists</SectionLabel>
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
          <div className="grid gap-5 lg:grid-cols-2">
            {pathways.map((pathway) => (
              <article
                className="scroll-mt-24 rounded-3xl p-6 shadow-sm md:p-7"
                id={pathway.id}
                key={pathway.id}
                style={panelStyle}
              >
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-cam-gold">
                  {pathway.marker}
                </p>
                <h3 className="mb-4 font-serif text-2xl leading-snug text-foreground md:text-3xl">
                  {pathway.title}
                </h3>
                <p className="mb-5 text-base font-light leading-relaxed text-muted-foreground md:text-lg">
                  {pathway.description}
                </p>

                {pathway.id === "failures-evidence-repair" && (
                  <div className="mb-5 rounded-2xl border border-primary/20 p-4" style={{ backgroundColor: GREEN_BG }}>
                    <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.18em] text-primary">
                      CAM + VIGIL
                    </p>
                    <div className="space-y-2 text-[15px] font-light leading-relaxed text-muted-foreground md:text-base">
                      <p>CAM is the governance architecture. VIGIL is the failure observatory.</p>
                      <p>
                        Together, CAM and VIGIL convert observed failure into structured diagnosis, governance learning, repair pathways, and safer future-system design.
                      </p>
                    </div>
                  </div>
                )}

                {pathway.note && (
                  <a
                    className="mb-5 block rounded-2xl border border-cam-gold/35 bg-cam-gold/10 p-4 transition hover:border-cam-gold/70 hover:text-primary"
                    href={pathway.note.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <p className="mb-1 font-mono text-[12px] uppercase tracking-[0.18em] text-cam-gold">
                      {pathway.note.label}
                    </p>
                    <p className="text-[15px] font-light leading-relaxed text-muted-foreground md:text-base">
                      {pathway.note.text}
                    </p>
                  </a>
                )}

                {/* TODO: Create a dedicated Companion Systems page that surfaces AEON-006-SCH-02 directly rather than using the relational governance route as the public entry point. */}
                {/* TODO: Create a dedicated Transitional Architecture page; this entry currently routes to the catalogue as the closest supported route. */}
                <ButtonLink href={pathway.href} label={pathway.cta} />
              </article>
            ))}
          </div>

          <details className="mt-5 rounded-3xl p-6 shadow-sm md:p-7" style={goldPanelStyle}>
            <summary className="cursor-pointer font-serif text-2xl leading-snug text-foreground marker:text-cam-gold">
              About VIGIL
            </summary>
            <div className="mt-5 space-y-5">
              <p className="max-w-4xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">
                VIGIL is the failure observatory connected to CAM. It records observed incidents, harms, design failures, accountability gaps, evidence, and repair status.
              </p>
              <div>
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-cam-gold">
                  From evidence to repair: Observe → Record → Classify → Diagnose → Repair → Learn
                </p>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
                  {repairSteps.map((step, index) => (
                    <div className="contents" key={step.label}>
                      <div className="rounded-2xl border border-primary/20 bg-card/60 p-4">
                        <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.18em] text-cam-gold">
                          {step.label}
                        </p>
                        <p className="text-[15px] font-light leading-relaxed text-muted-foreground">
                          {step.text}
                        </p>
                      </div>
                      {index < repairSteps.length - 1 && (
                        <div className="flex items-center justify-center text-cam-gold/75" aria-hidden="true">
                          <span className="hidden lg:inline">→</span>
                          <span className="lg:hidden">↓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </section>

        <section className="border-y border-border/60 bg-card/30">
          <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <SectionLabel>Who this is for</SectionLabel>
            <div className="overflow-hidden rounded-3xl border border-primary/20 bg-background/75 shadow-sm">
              {audiences.map((audience, index) => (
                <div
                  className="grid gap-3 border-b border-border/60 p-5 last:border-b-0 md:grid-cols-[0.42fr_1fr] md:gap-6 md:p-6"
                  key={audience.label}
                >
                  <div>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cam-gold">
                      Audience {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="font-serif text-xl leading-snug text-foreground">{audience.label}</h3>
                  </div>
                  <p className="text-base font-light leading-relaxed text-muted-foreground md:text-lg">
                    {audience.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" id="use-cite-licence">
          <SectionLabel>Use and attribution</SectionLabel>
          <div className="rounded-3xl p-6 shadow-sm md:p-8" style={panelStyle}>
            <h2 className="mb-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
              Use, Cite, or Licence CAM
            </h2>
            <div className="max-w-4xl space-y-4 text-base font-light leading-relaxed text-muted-foreground md:text-lg">
              <p>
                CAM Initiative is published as a public-facing governance architecture. Use of CAM materials requires attribution and must respect the applicable licence terms.
              </p>
              <p>
                A formal licensing pathway is being developed to support legitimate institutional, commercial, and implementation use.
              </p>
              <p className="font-medium text-foreground">Attribution is required.</p>
              <p>
                A future licence pathway can provide a legitimate route for organisations that want to use, adapt, implement, or build with CAM materials.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/about#citation-public-access" label="Cite CAM" variant="primary" />
              <ButtonLink href="/about#citation-public-access" label="Review Licence Pathway" />
              <ButtonLink href="/about#connect" label="Contact / Get Involved" />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 pb-14 md:px-10 md:pb-20">
          <div className="rounded-3xl border border-primary/20 bg-card/65 p-6 md:p-8">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-cam-gold">
              Formal architecture
            </p>
            <h2 className="mb-4 font-serif text-2xl leading-snug text-foreground md:text-3xl">
              Need the constitutional or runtime detail?
            </h2>
            <p className="max-w-3xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">
              The homepage is now a public entry point. Detailed constitutional framing, formal principles, and runtime translation remain available through the Constitution and Runtime Model pages.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/constitution" label="Open Constitution" />
              <ButtonLink href="/constitution/runtime" label="Open Runtime Model" />
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-card/75 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-[15px]"
                href="https://github.com/CAM-Initiative/Caelestis"
                rel="noreferrer"
                target="_blank"
              >
                Inspect Repository
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
