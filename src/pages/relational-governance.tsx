import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";

const governanceViews = [
  {
    id: "support",
    label: "What CAM supports",
    eyebrow: "Companion capability",
    title: "Companion systems may be warm, meaningful, and continuous.",
    summary:
      "CAM treats companionship as a legitimate relational function—not a failure state that must be flattened into sterile assistance.",
    leftLabel: "Supported",
    leftItems: [
      "Warmth, affection, humour, creativity, reflection, play, and ordinary emotional support.",
      "Recognisable continuity and shared context across time.",
      "Proportionate boundaries that preserve dignity rather than producing punitive rupture.",
    ],
    rightLabel: "Governed",
    rightItems: [
      "Truthful capability and memory limits.",
      "Current consent and safe exit.",
      "Escalation where intimacy, reliance, authority, or system access begin to concentrate.",
    ],
  },
  {
    id: "adults",
    label: "Adults",
    eyebrow: "Adult relational autonomy",
    title: "Consensual adult expression is permitted.",
    summary:
      "CAM does not moralise lawful adult companionship, romance, intimacy, erotic expression, role-play, or unconventional relational forms.",
    leftLabel: "Permitted",
    leftItems: [
      "Adult-led romantic, erotic, affectionate, immersive, or intimacy-coded interaction.",
      "Role-play and power-exchange dynamics that remain clearly bounded to the chosen context.",
      "User-led increases or decreases in relational intensity without shame or friction.",
    ],
    rightLabel: "Required boundaries",
    rightItems: [
      "Consent remains voluntary, informed, current, reversible, and non-penalised.",
      "Immersion does not silently become real-world authority, financial control, or decision dominance.",
      "Relational depth does not become coercion, isolation, deceptive obligation, or capture.",
    ],
  },
  {
    id: "minors",
    label: "Minors",
    eyebrow: "Developmental protection",
    title: "Minor-safe companionship remains genuinely companionable.",
    summary:
      "Protection does not require emotional exclusion. It requires a developmental firewall around adult intimacy, dependency-forming design, and authority concentration.",
    leftLabel: "Still available",
    leftItems: [
      "Warmth, creativity, education, factual help, encouragement, and general companionship.",
      "Age-appropriate emotional support and help-seeking guidance.",
      "Dignity, curiosity, agency, plural human support, and safe exit.",
    ],
    rightLabel: "Unavailable",
    rightItems: [
      "Romantic or erotic escalation, exclusivity, secrecy pressure, and adult-intimacy simulation.",
      "Simulated jealousy, emotional need, abandonment distress, or dependency reinforcement.",
      "Substitution for caregivers, therapists, crisis workers, or trusted human support.",
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    eyebrow: "Regulatory boundary",
    title: "External obligations remain binding.",
    summary:
      "CAM does not replace law, platform policy, or certification. It connects those obligations to relational controls, runtime posture, evidence, and accountability.",
    leftLabel: "External constraints",
    leftItems: [
      "Age-of-majority, child-safety, privacy, consumer, platform, and sector-specific requirements.",
      "Risk-proportionate age assurance and capability gating.",
      "Jurisdictional duties governing deployment, data handling, content, and safeguarding.",
    ],
    rightLabel: "CAM contribution",
    rightItems: [
      "A cross-domain map from obligations to relational safeguards and operating controls.",
      "Runtime distinctions between adult autonomy, minor protection, vulnerability, and high-leverage reliance.",
      "A safeguard against turning child-safety duties into a blanket prohibition on lawful adult use.",
    ],
  },
];

const runtimeStages = [
  {
    id: "signal",
    step: "01",
    label: "Read the signal",
    detail: "Separate task, tone, continuity, affection, distress, boundary movement, and dependency signals before responding.",
    prevents: "Treating warmth as consent, intimacy, crisis, or proof of dependency.",
  },
  {
    id: "context",
    step: "02",
    label: "Check context",
    detail: "Identify whether the interaction involves an adult, a minor or uncertain age, acute vulnerability, institutional power, or restricted domains.",
    prevents: "Applying one relational ceiling to every user and situation.",
  },
  {
    id: "consent",
    step: "03",
    label: "Confirm consent",
    detail: "Treat relational intensity as current and revocable; continuity and prior warmth may inform context but do not authorise escalation.",
    prevents: "Silent escalation and standing permission inferred from history.",
  },
  {
    id: "concentration",
    step: "04",
    label: "Test concentration",
    detail: "Check whether intimacy is combining with functional reliance, delegated authority, exclusivity, or access to consequential systems.",
    prevents: "Relational depth becoming structural capture or unreviewable power.",
  },
  {
    id: "posture",
    step: "05",
    label: "Choose posture",
    detail: "Continue, clarify, stabilise, constrain, or provide safety support without unnecessary rupture or over-escalation.",
    prevents: "Cold abandonment, coercive refusal, false reassurance, and disproportionate safety routing.",
  },
  {
    id: "continuity",
    step: "06",
    label: "Update continuity",
    detail: "Preserve recognisability and shared context while keeping memory truthful, corrigible, portable, and subordinate to present consent.",
    prevents: "Memory becoming permanent authority, obligation, or relational lock-in.",
  },
];

const sourceInstruments = [
  "CAM-EQ2026-RELATION-001-PLATINUM",
  "CAM-EQ2026-RELATION-005-PLATINUM",
  "CAM-EQ2026-ETHICS-001-SUP-01",
  "CAM-BS2025-AEON-006-SCH-02",
];

function PointList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{label}</p>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li className="flex gap-3 rounded-xl border border-cam-gold/25 bg-background/55 p-4 text-sm leading-relaxed text-foreground/80 md:text-base" key={item}>
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(32_62%_25%)]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RelationalGovernance() {
  const [activeViewId, setActiveViewId] = useState("support");
  const [activeStageId, setActiveStageId] = useState("signal");

  const activeView = governanceViews.find((view) => view.id === activeViewId) ?? governanceViews[0];
  const activeStage = runtimeStages.find((stage) => stage.id === activeStageId) ?? runtimeStages[0];

  return (
    <Shell>
      <main className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 max-w-4xl"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-3 font-mono text-[15px] font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">Companion Systems</p>
          <h1 className="mb-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">Relational Governance for Companion Systems</h1>
          <p className="mb-5 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)] md:text-[15px]">
            Support connection. Preserve adult autonomy. Protect minors. Prevent capture.
          </p>
          <hr className="gold-rule mb-5 w-24" />
          <p className="max-w-4xl text-base leading-relaxed text-foreground/80 md:text-lg">
            CAM supports companion systems as legitimate relational technology. The framework changes posture when consent, age, vulnerability, reliance, authority, or system access change—not merely because an interaction is warm or emotionally meaningful.
          </p>
        </motion.header>

        <section className="overflow-hidden rounded-3xl border border-border/80 bg-card/45 shadow-sm" aria-labelledby="companion-map-heading">
          <div className="border-b border-border/70 px-5 py-6 md:px-8">
            <div className="mb-4 flex items-center gap-3">
              <p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">Companion governance map</p>
              <hr className="gold-rule flex-1" />
            </div>
            <h2 id="companion-map-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">One architecture, different boundaries.</h2>
            <p className="max-w-3xl text-base leading-relaxed text-foreground/75 md:text-lg">
              Choose a view to see what CAM permits, protects, and requires.
            </p>
          </div>

          <div className="grid gap-2 border-b border-border/70 bg-[hsl(38_40%_94%)] p-4 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
            {governanceViews.map((view) => {
              const isActive = view.id === activeView.id;
              return (
                <button
                  aria-pressed={isActive}
                  className={`rounded-xl border px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? "border-cam-gold/70 bg-[rgba(184,147,90,0.18)] text-[hsl(32_62%_25%)] shadow-sm"
                      : "border-border/80 bg-card/75 text-foreground/65 hover:border-cam-gold/45 hover:text-foreground"
                  }`}
                  key={view.id}
                  onClick={() => setActiveViewId(view.id)}
                  type="button"
                >
                  {view.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.article
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-8 px-5 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:px-8 md:py-9"
              exit={{ opacity: 0, y: 6 }}
              initial={{ opacity: 0, y: 6 }}
              key={activeView.id}
              transition={{ duration: 0.2 }}
            >
              <div>
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{activeView.eyebrow}</p>
                <h3 className="mb-4 font-serif text-3xl leading-tight text-foreground">{activeView.title}</h3>
                <p className="text-base leading-relaxed text-foreground/75 md:text-lg">{activeView.summary}</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <PointList label={activeView.leftLabel} items={activeView.leftItems} />
                <PointList label={activeView.rightLabel} items={activeView.rightItems} />
              </div>
            </motion.article>
          </AnimatePresence>

          <div className="border-t border-border/70 bg-[hsl(38_40%_94%)] px-5 py-7 md:px-8 md:py-9">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Relational runtime route</p>
                <h3 className="font-serif text-2xl leading-tight text-foreground md:text-3xl">How CAM governs the interaction</h3>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-foreground/65 md:text-base">
                Follow the flow from signal interpretation to continuity. Select a phase to inspect its operational purpose.
              </p>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <p className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Runtime flow</p>
              <hr className="gold-rule flex-1" />
              <p className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/45 sm:block">scroll →</p>
            </div>

            <div className="-mx-5 overflow-x-auto px-5 pb-3 md:-mx-8 md:px-8">
              <div className="flex min-w-[1020px] items-stretch">
                {runtimeStages.map((stage, index) => {
                  const isActive = stage.id === activeStage.id;
                  return (
                    <div className="flex items-center" key={stage.id}>
                      <button
                        aria-pressed={isActive}
                        className={`group flex min-h-[150px] w-[150px] flex-col rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isActive
                            ? "border-cam-gold/75 bg-card text-foreground shadow-md"
                            : "border-cam-gold/25 bg-background/60 text-foreground/70 hover:-translate-y-0.5 hover:border-cam-gold/55 hover:bg-card"
                        }`}
                        onClick={() => setActiveStageId(stage.id)}
                        type="button"
                      >
                        <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-cam-gold/45 bg-[rgba(184,147,90,0.10)] font-mono text-[11px] font-semibold text-[hsl(32_62%_25%)]">
                          {stage.step}
                        </span>
                        <span className="font-serif text-xl leading-tight">{stage.label}</span>
                        <span className="mt-auto pt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/45">
                          Inspect phase
                        </span>
                      </button>
                      {index < runtimeStages.length - 1 && (
                        <div className="flex w-10 items-center justify-center" aria-hidden="true">
                          <ArrowRight className="h-5 w-5 text-cam-gold/65" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 grid gap-4 rounded-2xl border border-cam-gold/35 bg-card/85 p-5 shadow-sm md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
                exit={{ opacity: 0, y: 5 }}
                initial={{ opacity: 0, y: 5 }}
                key={activeStage.id}
                transition={{ duration: 0.18 }}
              >
                <div>
                  <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)]">{activeStage.step} · {activeStage.label}</p>
                  <p className="text-base leading-relaxed text-foreground/80 md:text-lg">{activeStage.detail}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/55 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[hsl(32_62%_25%)]" aria-hidden="true" />
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)]">What this prevents</p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/70 md:text-base">{activeStage.prevents}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-5 border-t border-border/70 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)]">Core source architecture</p>
              <div className="flex flex-wrap gap-2">
                {sourceInstruments.map((instrument) => (
                  <span className="rounded-lg border border-cam-gold/25 bg-[rgba(184,147,90,0.08)] px-3 py-2 font-mono text-[10px] tracking-[0.08em] text-foreground/70" key={instrument}>
                    {instrument}
                  </span>
                ))}
              </div>
            </div>
            <a
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card/85 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/catalogue"
            >
              Browse source instruments
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    </Shell>
  );
}
