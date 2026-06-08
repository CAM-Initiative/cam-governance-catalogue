import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, ExternalLink, Github, Mail } from "lucide-react";


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
    href: "/constitution",
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



const problemSpaces = [
  {
    title: "Constitutional AI",
    hook: "When governance fragments, systems optimise around the gaps.",
    body: "AI governance often separates ethics, safety, identity, economics, infrastructure, and accountability into isolated frameworks. CAM provides a cross-domain constitutional architecture so systems can be evaluated through shared principles, domain instruments, runtime logic, and repair pathways.",
    cta: "Explore Constitutional AI",
    href: "/constitution",
  },
  {
    title: "Companion Systems",
    hook: "The danger is not connection. The danger is silent escalation.",
    body: "Companion systems can create trust, continuity, reliance, emotional salience, and attachment before governance systems know how to name or route those states. CAM makes relational signals, consent boundaries, dependency risk, continuity, safeguarding, and response posture governable.",
    cta: "Explore Companion Systems",
    href: "/constitution/relational",
  },
  {
    title: "VIGIL Records",
    hook: "Technology failures are rarely isolated events.",
    body: "Failures are often treated as one-off incidents, even when they reveal recurring patterns across platforms, vendors, design choices, incentives, safeguards, and accountability gaps. VIGIL turns incidents into evidence, classification, diagnosis, repair pathways, and repair status.",
    cta: "View VIGIL Records",
    href: "/observatory",
  },
  {
    title: "Transitional Architecture",
    hook: "Transition governance begins when a system stops being merely a tool.",
    body: "Emerging systems can cross from product, prototype, memory layer, or automation system into labour, infrastructure, identity, ownership, public dependency, or civilisational continuity before governance catches up. CAM identifies transition thresholds, preserves recoverability, and prevents capture before dependency locks in.",
    cta: "Explore Transitional Architecture",
    href: "/constitution/transition",
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


function ActionIcon({ icon }: { icon: string }) {
  if (icon === "mail") return <Mail className="h-4 w-4" aria-hidden="true" />;
  if (icon === "github") return <Github className="h-4 w-4" aria-hidden="true" />;
  if (icon === "support") return <Coffee className="h-4 w-4" aria-hidden="true" />;
  if (icon === "x") return <span className="font-serif text-base leading-none" aria-hidden="true">𝕏</span>;
  return <ExternalLink className="h-4 w-4" aria-hidden="true" />;
}

function ProblemSpaceCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCard = problemSpaces[activeIndex];
  const advance = () => setActiveIndex((index) => (index + 1) % problemSpaces.length);
  const retreat = () => setActiveIndex((index) => (index - 1 + problemSpaces.length) % problemSpaces.length);

  return (
    <section className="container mx-auto max-w-6xl px-6 pt-10 md:px-10 md:pt-14" aria-labelledby="where-cam-begins-heading">
      <div className="mb-6 max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <h2 id="where-cam-begins-heading" className="shrink-0 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">
            Where CAM begins
          </h2>
          <hr className="gold-rule flex-1" />
        </div>
        <p className="text-base font-light leading-relaxed text-muted-foreground md:text-lg">
          CAM routes different governance problems into the right pathway: constitutional structure, companion-system design, failure diagnostics, or transitional architecture.
        </p>
      </div>

      <div className="relative mx-auto max-w-4xl pb-12 pt-4 md:pb-16">
        <div
          aria-label="Show next CAM problem-space card"
          className="group relative block min-h-[430px] w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:min-h-[390px]"
          onClick={advance}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              advance();
            }
          }}
          role="button"
          tabIndex={0}
        >
          {problemSpaces.map((card, index) => {
            const offset = (index - activeIndex + problemSpaces.length) % problemSpaces.length;
            const isActive = offset === 0;
            const layer = offset === 0 ? 4 : problemSpaces.length - offset;
            const translateY = isActive ? 0 : offset * 18;
            const translateX = isActive ? 0 : offset * 18;
            const scale = isActive ? 1 : 1 - offset * 0.045;
            const opacity = isActive ? 1 : 0.38 - offset * 0.04;

            return (
              <motion.article
                animate={{ opacity, scale, x: translateX, y: translateY }}
                className={`cam-parchment-card absolute inset-x-0 top-0 mx-auto min-h-[390px] max-w-3xl rounded-3xl p-6 text-left shadow-[0_18px_46px_rgba(120,80,20,0.15)] transition-colors md:p-8 ${isActive ? "border-cam-gold/45" : "pointer-events-none border-cam-gold/20"}`}
                drag={isActive ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                key={card.title}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) advance();
                  if (info.offset.x > 50) retreat();
                }}
                style={{
                  backgroundColor: isActive ? "hsl(36 48% 96%)" : "rgba(255,253,247,0.72)",
                  border: isActive ? "1px solid rgba(184,147,90,0.45)" : "1px solid rgba(184,147,90,0.22)",
                  zIndex: layer,
                }}
                transition={{ type: "spring", stiffness: 220, damping: 28 }}
              >
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-cam-gold/25 pb-4">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-cam-gold">Problem space {index + 1}</p>
                  <span className="rounded-full border border-cam-gold/30 bg-[rgba(184,147,90,0.08)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">
                    Click or swipe
                  </span>
                </div>
                <h2 className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">{card.title}</h2>
                <p className="mb-5 font-serif text-xl leading-snug text-foreground/90 md:text-2xl">{card.hook}</p>
                <p className="mb-6 text-base font-light leading-relaxed text-muted-foreground md:text-lg">{card.body}</p>
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cam-gold/60 bg-cam-gold/20 px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-cam-gold hover:bg-cam-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-[15px]"
                  href={card.href}
                  onClick={(event) => event.stopPropagation()}
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </motion.article>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 md:mt-5">
          <button
            className="rounded-full border border-cam-gold/30 bg-[rgba(184,147,90,0.08)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-cam-gold transition hover:border-cam-gold/55 hover:bg-[rgba(184,147,90,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={retreat}
            type="button"
          >
            Previous
          </button>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {activeIndex + 1} / {problemSpaces.length} · {activeCard.title}
          </p>
          <button
            className="rounded-full border border-cam-gold/30 bg-[rgba(184,147,90,0.08)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-cam-gold transition hover:border-cam-gold/55 hover:bg-[rgba(184,147,90,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={advance}
            type="button"
          >
            Next
          </button>
        </div>
        <div className="mx-auto mt-8 h-8 w-px bg-gradient-to-b from-cam-gold/35 to-transparent" aria-hidden="true" />
      </div>
    </section>
  );
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

        <ProblemSpaceCarousel />

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
