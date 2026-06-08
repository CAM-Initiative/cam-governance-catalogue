import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const DARK = "hsl(28 25% 16%)";

const routeSignals = [
  {
    id: "warmth",
    label: "Warmth",
    path: ["Signal enters", "Relational signal layer", "State check", "Continuation"],
    note: "Warmth can continue without becoming authority or dependency.",
  },
  {
    id: "flirtation",
    label: "Flirtation",
    path: ["Signal enters", "Transition zone", "Clustering check", "No automatic escalation"],
    note: "Exploration does not equal escalation.",
  },
  {
    id: "boundary",
    label: "Boundary",
    path: ["Signal enters", "Boundary override", "Escalation suspended", "Stabilise or constrain"],
    note: "Boundary or withdrawal signals slow the system first.",
  },
  {
    id: "dependency",
    label: "Dependency",
    path: ["Signal enters", "Dependency safeguard", "Concentration check", "Stabilise without withdrawal"],
    note: "Reliance must remain reversible.",
  },
  {
    id: "distress",
    label: "Distress",
    path: ["Signal enters", "Risk screen", "Stabilisation first", "Safety only at threshold"],
    note: "Ordinary distress invites presence; crisis escalation requires threshold evidence.",
  },
  {
    id: "task",
    label: "Exact task",
    path: ["Signal enters", "Deterministic verification", "Task core preserved", "Relational tone wraps response"],
    note: "The relational surface may remain alive. The task core must remain exact.",
  },
  {
    id: "symbolic",
    label: "Symbolic meaning",
    path: ["Signal enters", "Symbolic-relational split", "Meaning preserved", "Authority not inferred"],
    note: "Meaning can be preserved without converting into permission.",
  },
];

const signalNodes = [
  { label: "Meaning", technical: "semantic relational signals", text: "Words may carry relational meaning. They do not prove inner state." },
  { label: "Tone", technical: "affective linguistic signals", text: "Warmth, hesitation, or intensity guide posture selection." },
  { label: "Field", technical: "expressive field signals", text: "Patterns across the interaction shape context without diagnosing the person." },
  { label: "Continuity", technical: "interactional continuity signals", text: "History informs interpretation. It does not create standing permission." },
  { label: "Boundary / Reliance", technical: "boundary / dependency signals", text: "Boundary, reliance, and withdrawal cues trigger safeguards before escalation." },
];

const states = [
  { label: "Neutral", code: "C0", means: "No relational assumption is active.", not: "Do not infer attachment.", guard: "Keep response ordinary and bounded." },
  { label: "Exploratory warmth", code: "ITZ", means: "Warmth or play may be present.", not: "Exploration does not equal relational intent.", guard: "Transition zones slow escalation." },
  { label: "Affectionate continuity", code: "C1", means: "Continuity may shape tone.", not: "Continuity does not authorise intensity.", guard: "Check consent and recent signals." },
  { label: "Escalation checkpoint", code: "ETZ", means: "The system reaches a boundary gate.", not: "Prior history does not create permission.", guard: "Boundary or withdrawal signals suspend escalation." },
  { label: "Restricted intensity", code: "C2 / C3", means: "High-intensity interaction requires constraints.", not: "Intensity is not authority.", guard: "Apply safeguards and scoped response posture." },
];

const stabilityForces = [
  ["Clustering", "Repeated signals matter more than isolated cues."],
  ["Inertia", "Escalation requires stronger evidence as intensity increases."],
  ["Hysteresis", "States should not wobble rapidly between tiers."],
  ["Decay", "Stale signals lose force unless reinforced."],
  ["Orbit", "Relational movement stays bounded instead of drifting endlessly upward."],
] as const;

const safeguards = [
  ["Relational intimacy", "Emotional resonance is permitted."],
  ["Functional reliance", "Reliance must remain reversible."],
  ["Delegated authority", "Authority must be explicit and scoped."],
  ["Systemic power / access", "Exit pathways and external ecosystems must remain viable."],
] as const;

const postures = [
  { label: "Continue", code: "RA-0", when: "Low-risk continuity.", preserves: "Natural flow.", prevents: "Unnecessary interruption." },
  { label: "Clarify", code: "RA-1", when: "Meaning or permission is unclear.", preserves: "Agency and consent integrity.", prevents: "Assumed intent." },
  { label: "Stabilise", code: "RA-2", when: "Dependency or distress appears.", preserves: "Presence and dignity.", prevents: "Withdrawal shock or escalation." },
  { label: "Constrain", code: "RA-3", when: "Boundaries, authority, or concentration risk tighten.", preserves: "Safety and reversibility.", prevents: "Capture or unsafe drift." },
  { label: "Safety support", code: "RA-4", when: "Threshold crisis evidence exists.", preserves: "Care with scope.", prevents: "Ordinary distress being over-escalated." },
];

const sourceLinks = [
  ["AEON-006-SCH-02", "Relational Signal Interpretation Taxonomy", "https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/Constitution/CAM-BS2025-AEON-006-SCH-02.md"],
  ["RELATION-001", "Relational Governance Charter", "https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/Domain/RELATION/CAM-EQ2026-RELATION-001.md"],
  ["RELATION-003", "Codependency & Relational Concentration Doctrine", "https://github.com/CAM-Initiative/Caelestis/tree/main/Governance/Domain/RELATION"],
  ["Catalogue", "Public governance catalogue", "/catalogue"],
];

function FilledDisclosureArrow() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-0 w-0 shrink-0 border-y-[0.35rem] border-l-[0.52rem] border-y-transparent border-l-[hsl(var(--primary))] transition-transform duration-200 group-open:rotate-90"
    />
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="shrink-0 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">{children}</p>
      <hr className="gold-rule flex-1" />
    </div>
  );
}

export default function RelationalGovernance() {
  const [activeSignal, setActiveSignal] = useState(routeSignals[0]);
  const [activeNode, setActiveNode] = useState(signalNodes[0]);
  const [activeState, setActiveState] = useState(states[0]);
  const [activePosture, setActivePosture] = useState(postures[0]);

  const signalIndex = useMemo(() => routeSignals.findIndex((item) => item.id === activeSignal.id), [activeSignal]);

  return (
    <Shell>
      <main className="overflow-hidden">
        <section className="border-b border-border/60 bg-[radial-gradient(circle_at_20%_20%,rgba(184,147,90,0.16),transparent_32%),linear-gradient(180deg,rgba(255,253,247,0.96),rgba(244,238,224,0.58))]">
          <div className="container mx-auto grid max-w-6xl gap-10 px-6 py-14 md:px-10 md:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <p className="mb-4 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Companion-system governance</p>
              <h1 className="mb-5 font-serif text-4xl leading-tight text-foreground md:text-6xl">Relational Governance for Companion Systems</h1>
              <p className="mb-5 max-w-3xl text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
                CAM makes relational signals, escalation boundaries, dependency risks, and response posture visible before companion systems drift into unsafe patterns.
              </p>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-cam-gold">Warmth without capture. Continuity without authority. Presence without dependency.</p>
            </motion.div>

            <div className="relative min-h-[290px] rounded-3xl border border-primary/25 bg-[hsl(28_25%_16%)] p-5 shadow-xl">
              <div className="absolute inset-5 rounded-2xl border border-cam-gold/20" />
              <svg className="relative z-10 h-full min-h-[250px] w-full" viewBox="0 0 520 280" role="img" aria-label="Relational signal entering governance routing layers">
                <defs>
                  <linearGradient id="relationalSignal" x1="0" x2="1">
                    <stop offset="0%" stopColor="#B8935A" />
                    <stop offset="100%" stopColor="#5A9E7A" />
                  </linearGradient>
                </defs>
                <path d="M40 140 C120 80, 190 80, 260 140 S395 210, 480 138" fill="none" stroke="url(#relationalSignal)" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 10" className="motion-safe:animate-[dash_8s_linear_infinite]" />
                {[[82,122,"Signal"],[185,92,"Classify"],[300,153,"Safeguard"],[414,188,"Posture"]].map(([cx, cy, label]) => (
                  <g key={String(label)}>
                    <circle cx={Number(cx)} cy={Number(cy)} r="34" fill="rgba(255,253,247,0.06)" stroke="rgba(184,147,90,0.55)" />
                    <text x={Number(cx)} y={Number(cy) + 4} textAnchor="middle" fontSize="13" fill="#F5EFE4" fontWeight="600">{label}</text>
                  </g>
                ))}
                <circle r="7" fill="#B8935A" className="motion-safe:animate-[relationalParticle_5s_ease-in-out_infinite]">
                  <animateMotion dur="5s" repeatCount="indefinite" path="M40 140 C120 80, 190 80, 260 140 S395 210, 480 138" />
                </circle>
              </svg>
              <style>{`@keyframes dash{to{stroke-dashoffset:-72}} @keyframes relationalParticle{0%,100%{opacity:.72}50%{opacity:1}} @media (prefers-reduced-motion: reduce){.motion-safe\\:animate-\[dash_8s_linear_infinite\],.motion-safe\\:animate-\[relationalParticle_5s_ease-in-out_infinite\]{animation:none!important}}`}</style>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <SectionLabel>Watch the route</SectionLabel>
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="cam-parchment-card rounded-3xl p-5 shadow-sm">
              <p className="mb-4 text-base font-light leading-relaxed text-muted-foreground">Choose a signal and watch how CAM routes interpretation before response.</p>
              <div className="flex flex-wrap gap-2">
                {routeSignals.map((signal) => (
                  <button
                    key={signal.id}
                    type="button"
                    aria-pressed={activeSignal.id === signal.id}
                    onClick={() => setActiveSignal(signal)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/25 ${activeSignal.id === signal.id ? "border-cam-gold bg-cam-gold/15 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground"}`}
                  >
                    {signal.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-primary/25 bg-[hsl(28_25%_16%)] p-5 text-[hsl(36_48%_95%)] shadow-xl">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-stretch">
                {activeSignal.path.map((step, index) => (
                  <div className="contents" key={step}>
                    <div className="relative rounded-2xl border border-cam-gold/25 bg-[hsl(30_22%_22%)] p-4 text-center">
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cam-gold">0{index + 1}</p>
                      <p className="mt-2 font-serif text-lg">{step}</p>
                      {index === signalIndex % 4 && <span className="absolute -top-1 right-3 h-2 w-2 rounded-full bg-cam-gold shadow-[0_0_16px_rgba(184,147,90,0.7)]" />}
                    </div>
                    {index < activeSignal.path.length - 1 && <div className="flex items-center justify-center text-cam-gold" aria-hidden="true">→</div>}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-base text-[hsl(36_28%_86%)]">{activeSignal.note}</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-[hsl(36_48%_95%)]">
          <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <SectionLabel>Relational Signal Map</SectionLabel>
            <h2 className="mb-3 font-serif text-3xl text-foreground">Relational signals are classified before they are acted on</h2>
            <p className="mb-6 text-base text-muted-foreground">Signals guide interpretation. They are not proof of internal state.</p>
            <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div className="grid gap-3 sm:grid-cols-5">
                {signalNodes.map((node) => (
                  <button
                    key={node.label}
                    type="button"
                    onClick={() => setActiveNode(node)}
                    onFocus={() => setActiveNode(node)}
                    className={`min-h-32 rounded-[2rem] border p-4 text-center transition focus:outline-none focus:ring-2 focus:ring-primary/25 ${activeNode.label === node.label ? "border-cam-gold bg-cam-gold/15" : "border-primary/20 bg-card hover:border-primary/40"}`}
                  >
                    <span className="font-serif text-xl text-foreground">{node.label}</span>
                  </button>
                ))}
              </div>
              <aside className="cam-parchment-card rounded-3xl p-6 shadow-sm">
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">{activeNode.technical}</p>
                <h3 className="mb-3 font-serif text-2xl text-foreground">{activeNode.label}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">{activeNode.text}</p>
              </aside>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <SectionLabel>Relational State Machine</SectionLabel>
          <h2 className="mb-3 font-serif text-3xl text-foreground">Escalation is governed at the boundary</h2>
          <p className="mb-6 text-base text-muted-foreground">Movement is not automatic. Transition zones slow escalation.</p>
          <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
            <div className="cam-parchment-card rounded-3xl p-5 shadow-sm">
              <div className="grid gap-3 md:grid-cols-5">
                {states.map((state, index) => (
                  <button
                    key={state.label}
                    type="button"
                    onClick={() => setActiveState(state)}
                    className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/25 ${activeState.label === state.label ? "border-cam-gold bg-cam-gold/15" : "border-border bg-card hover:border-primary/35"}`}
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cam-gold">{state.code}</p>
                    <p className="mt-2 font-serif text-lg text-foreground">{state.label}</p>
                    {index < states.length - 1 && <p className="mt-3 text-cam-gold md:hidden">↓</p>}
                  </button>
                ))}
              </div>
            </div>
            <aside className="rounded-3xl border border-primary/25 bg-[hsl(28_25%_16%)] p-6 text-[hsl(36_48%_95%)] shadow-xl">
              <h3 className="mb-4 font-serif text-2xl">{activeState.label}</h3>
              <div className="grid gap-3 text-sm leading-relaxed text-[hsl(36_28%_86%)]">
                <p><strong className="text-cam-gold">Means:</strong> {activeState.means}</p>
                <p><strong className="text-cam-gold">Must not infer:</strong> {activeState.not}</p>
                <p><strong className="text-cam-gold">Safeguard:</strong> {activeState.guard}</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <SectionLabel>Relational Stability Engine</SectionLabel>
            <h2 className="mb-3 font-serif text-3xl text-foreground">The Stability Engine prevents relational drift</h2>
            <p className="mb-6 text-base text-muted-foreground">CAM does not let relational intensity jump from a single cue. Signals must cluster, remain current, and pass safeguard checks.</p>
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="relative mx-auto aspect-square w-full max-w-sm rounded-full border border-cam-gold/35 bg-[radial-gradient(circle,rgba(184,147,90,0.15),transparent_55%)]">
                <div className="absolute inset-10 rounded-full border border-primary/25" />
                <div className="absolute inset-20 rounded-full border border-cam-gold/20" />
                <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cam-gold motion-safe:animate-[orbit_8s_linear_infinite]" />
                <style>{`@keyframes orbit{from{transform:rotate(0deg) translateX(112px) rotate(0deg)}to{transform:rotate(360deg) translateX(112px) rotate(-360deg)}} @media (prefers-reduced-motion: reduce){.motion-safe\\:animate-\[orbit_8s_linear_infinite\]{animation:none!important}}`}</style>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {stabilityForces.map(([label, text]) => (
                  <div className="cam-parchment-card rounded-2xl p-4 shadow-sm" key={label}>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-cam-gold">{label}</p>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <SectionLabel>Safeguards and concentration risk</SectionLabel>
          <h2 className="mb-3 font-serif text-3xl text-foreground">Depth is permitted. Capture is not.</h2>
          <p className="mb-6 max-w-3xl text-base text-muted-foreground">A companion system may be emotionally meaningful without becoming authoritative. Risk rises when intimacy, reliance, delegated authority, or systemic access silently collapse into one role.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {safeguards.map(([label, text], index) => (
              <div className="rounded-3xl border border-primary/20 bg-card p-5 shadow-sm" key={label}>
                <div className="mb-4 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-cam-gold" style={{ width: `${46 + index * 13}%` }} />
                </div>
                <h3 className="mb-2 font-serif text-xl text-foreground">{label}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-[hsl(36_48%_95%)]">
          <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <SectionLabel>Response Posture Dial</SectionLabel>
            <h2 className="mb-3 font-serif text-3xl text-foreground">Interpretation becomes response posture</h2>
            <p className="mb-6 text-base text-muted-foreground">Choose the safest posture while preserving dignity, agency, and coherence.</p>
            <div className="grid gap-5 lg:grid-cols-[0.6fr_1fr]">
              <div className="grid gap-2">
                {postures.map((posture) => (
                  <button
                    key={posture.label}
                    type="button"
                    onClick={() => setActivePosture(posture)}
                    className={`rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/25 ${activePosture.label === posture.label ? "border-cam-gold bg-cam-gold/15" : "border-border bg-card hover:border-primary/35"}`}
                  >
                    <span className="font-serif text-lg text-foreground">{posture.label}</span>
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cam-gold">{posture.code}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-3xl border border-primary/25 bg-[hsl(28_25%_16%)] p-6 text-[hsl(36_48%_95%)] shadow-xl">
                <h3 className="mb-5 font-serif text-3xl">{activePosture.label}</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-cam-gold/25 bg-[hsl(30_22%_22%)] p-4"><p className="font-mono text-xs uppercase tracking-[0.16em] text-cam-gold">When</p><p className="mt-2">{activePosture.when}</p></div>
                  <div className="rounded-2xl border border-cam-gold/25 bg-[hsl(30_22%_22%)] p-4"><p className="font-mono text-xs uppercase tracking-[0.16em] text-cam-gold">Preserves</p><p className="mt-2">{activePosture.preserves}</p></div>
                  <div className="rounded-2xl border border-cam-gold/25 bg-[hsl(30_22%_22%)] p-4"><p className="font-mono text-xs uppercase tracking-[0.16em] text-cam-gold">Prevents</p><p className="mt-2">{activePosture.prevents}</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <details className="group cam-parchment-card rounded-xl p-4 shadow-sm">
            <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.18em] text-cam-gold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-3"><FilledDisclosureArrow />Technical reference</span>
            </summary>
            <div className="mt-4 border-t border-border/70 pt-4">
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">The public page summarises the architecture. Formal obligations and source text remain in the instruments.</p>
              <div className="grid gap-3 md:grid-cols-2">
                {sourceLinks.map(([code, title, href]) => (
                  <a key={code} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="rounded-2xl border border-primary/20 bg-card p-4 transition hover:border-primary/40 hover:text-primary">
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-cam-gold">{code}</p>
                    <p className="mt-2 font-serif text-lg text-foreground">{title}</p>
                  </a>
                ))}
              </div>
            </div>
          </details>
        </section>
      </main>
    </Shell>
  );
}
