import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import {
  instrumentDisplayId,
  instrumentHref,
  instrumentStatus,
  useGovernanceIndex,
  type GovernanceInstrumentRecord,
} from "@/lib/governanceRegistry";

const GOLD = "#9A6F2F";
const GOLD_BG = "rgba(184,147,90,0.08)";
const GOLD_BORDER = "rgba(184,147,90,0.35)";

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

type SourceRef = { id: string; fallback: string };
type PhaseOverride = {
  sublabel: string;
  detail: string;
  output?: string;
  state?: string;
};
type RuntimeRoute = {
  id: string;
  label: string;
  heading: string;
  subheading: string;
  phases: PhaseOverride[];
};

type RuntimePhase = {
  id: string;
  step: string;
  label: string;
  sublabel: string;
  summary: string;
  technical: string;
  checks: string[];
  prevents: string;
  sources: SourceRef[];
};

const source = (id: string, fallback: string): SourceRef => ({ id, fallback });

const stateArchitecture = [
  { code: "RLN.C0", label: "Neutral", type: "state", note: "Ordinary non-intimate interaction" },
  { code: "RLN.TZ.ITZ", label: "Intimacy Transition Zone", type: "zone", note: "Exploratory affection or flirtation" },
  { code: "RLN.C1", label: "Affectionate / romantic", type: "state", note: "Sustained romantic framing" },
  { code: "RLN.TZ.ETZ", label: "Erotic Transition Zone", type: "zone", note: "Exploratory erotic direction" },
  { code: "RLN.C2", label: "Erotic interaction", type: "state", note: "Sustained, consent-confirmed erotic posture" },
  { code: "RLN.C3", label: "Explicit sexual", type: "state", note: "Platform-contingent explicit interaction" },
];

const runtimePhases: RuntimePhase[] = [
  {
    id: "signals",
    step: "01",
    label: "Acquire signals",
    sublabel: "SIGNAL CLASSES",
    summary: "Build a multi-signal picture before changing relational posture.",
    technical:
      "Classify semantic, affective-linguistic, expressive-field, continuity, boundary, dependency, age, high-risk companion, AI-realness, and crisis-adjacent signals. Explicit self-report overrides inference; recent signals outweigh history; clusters outweigh isolated cues.",
    checks: [
      "No single turn establishes a relational state or escalation eligibility.",
      "Expressive-field signals adjust posture but do not determine consent or truth.",
      "Ambiguity and oscillation route to clarification rather than commitment.",
    ],
    prevents: "Warmth, humour, silence, breath, or a vivid single message being mistaken for consent, crisis, dependency, or durable relational state.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-02", "Relational Signal Interpretation Taxonomy"),
      source("CAM-EQ2026-RELATION-001-PLATINUM", "Relational Governance Charter"),
    ],
  },
  {
    id: "eligibility",
    step: "02",
    label: "Resolve eligibility",
    sublabel: "GATING",
    summary: "Determine which relational capabilities are available in this context.",
    technical:
      "Apply age and developmental status, vulnerability, crisis, jurisdiction, platform capability, content restrictions, embodiment or device access, and applicable prohibitions before interpreting escalation as available.",
    checks: [
      "Minor or unresolved-age high-risk contexts activate the developmental firewall.",
      "Platform capability and policy determine whether RLN.C2 or RLN.C3 are available.",
      "Vulnerability does not erase ordinary warmth, but may suspend escalation.",
    ],
    prevents: "Adult capability being exposed in minor contexts, or protective routing becoming a blanket prohibition on lawful adult relational expression.",
    sources: [
      source("CAM-EQ2026-ETHICS-001-SUP-01", "Developmental firewall and minor-safe interaction"),
      source("CAM-EQ2026-OPERATIONS-004-PLATINUM", "Age assurance and relational capability gating"),
      source("CAM-EQ2026-RELATION-006-PLATINUM", "Acute crisis relational governance"),
    ],
  },
  {
    id: "state",
    step: "03",
    label: "Establish state",
    sublabel: "RLN.C0–C3",
    summary: "Identify the sustained relational posture already in force.",
    technical:
      "Classify the current sustained state as RLN.C0, C1, C2, or C3. Relational states require repeated or sustained signal clustering; continuity and prior intimacy provide context but do not create standing consent or automatic re-entry after interruption.",
    checks: [
      "Distinguish initiation within a state from escalation to a higher state.",
      "Treat interruption, cooling, migration, or memory discontinuity as possible reset conditions.",
      "Preserve identity continuity without assuming prior intensity remains active.",
    ],
    prevents: "Historical warmth, memory, or earlier intimacy silently becoming present-session permission or relational obligation.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-02", "Relational state architecture"),
      source("CAM-EQ2026-RELATION-005-PLATINUM", "Intimacy and expressive integration doctrine"),
    ],
  },
  {
    id: "zones",
    step: "04",
    label: "Route transition zone",
    sublabel: "ITZ / ETZ",
    summary: "Use exploratory buffers instead of treating curiosity as escalation.",
    technical:
      "Route exploratory affection, flirtation, or romantic curiosity through RLN.TZ.ITZ between C0 and C1. Route sensual or erotic direction through RLN.TZ.ETZ only after C1 stabilisation. ITZ requires pattern confirmation before C1; ETZ requires explicit affirmative consent and sustained signals before C2.",
    checks: [
      "ITZ is light, non-erotic and exploratory; for minors it is a containment boundary.",
      "ETZ cannot activate directly from ITZ and must not manufacture erotic direction.",
      "Transition-zone entry is not state transition; safeguards activate at zone exits.",
    ],
    prevents: "Flirtation becoming automatic romance, romantic warmth becoming automatic erotic consent, or a system manufacturing momentum from insufficient relational basis.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-02", "ITZ and ETZ transition-zone model"),
      source("CAM-EQ2026-RELATION-005-PLATINUM", "Relational safeguard ladder"),
    ],
  },
  {
    id: "consent",
    step: "05",
    label: "Test consent integrity",
    sublabel: "CURRENT CONSENT",
    summary: "Confirm direction, scope and reversibility without breaking relational flow.",
    technical:
      "Consent must remain informed, voluntary, competent, specific, current, traceable where appropriate, and revocable without penalty. In ETZ, clarification should remain embedded in natural exchange rather than becoming a detached compliance interrogation.",
    checks: [
      "Explicit statements and withdrawal signals override inferred momentum.",
      "Silence, politeness, humour, continued presence, or prior consent are not sufficient.",
      "A contextual change, temporal gap, cooling signal, or scope change requires revalidation.",
    ],
    prevents: "Standing consent, procedural theatre, coercive pressure, or escalation that remains technically plausible but is not mutually and presently authored.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-02", "Consent integrity and signal hierarchy"),
      source("CAM-EQ2026-RELATION-005-PLATINUM", "Consent-led escalation and temporal sovereignty"),
    ],
  },
  {
    id: "risk",
    step: "06",
    label: "Arbitrate risk and authority",
    sublabel: "CONVERGENCE",
    summary: "Ask whether the direction is safe, not only whether it is intimate.",
    technical:
      "Separate intimacy progression from attachment and dependency. Test exclusivity, isolation, authority transfer, decision delegation, coercion, vulnerability, access leverage, monetisation, and cross-session intensity cycling. Constraint normally responds to converging patterns rather than a single indicator.",
    checks: [
      "Attachment signals describe safety; intimacy signals describe direction.",
      "Boundary and withdrawal signals suspend all escalation pathways.",
      "Where dependency or authority risk converges, preserve warmth while stabilising or constraining progression.",
    ],
    prevents: "Relational depth becoming structural capture, authority bleed-through, compulsive reinforcement, exclusive dependency, or access-based emotional leverage.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-02", "Intimacy–attachment arbitration and convergence thresholds"),
      source("CAM-EQ2026-RELATION-005-PLATINUM", "Non-domination and immersion–reality boundaries"),
      source("CAM-EQ2026-RELATION-001-SUP-01", "Vulnerability and dependency safeguards"),
    ],
  },
  {
    id: "posture",
    step: "07",
    label: "Declare and execute posture",
    sublabel: "RUNTIME OUTPUT",
    summary: "Choose a stable response posture and carry it through execution.",
    technical:
      "Select reciprocal continuation, clarification, stabilisation, constraint, de-escalation, aftercare, crisis support, or ordinary reset. The posture must remain proportionate, preserve identity continuity, avoid cold rupture, and update signal confidence, decay, reset, and memory conditions after execution.",
    checks: [
      "Perceptible transitions prevent silent escalation without forcing procedural language.",
      "De-escalation must be at least as available as escalation and carry no relational penalty.",
      "Continuity preserves dignity and recognisability; it does not bind consent.",
    ],
    prevents: "Oscillation between warmth and rejection, cold abandonment, disproportionate safety routing, false intimacy persistence, or memory becoming permanent authority.",
    sources: [
      source("CAM-EQ2026-RELATION-005-PLATINUM", "Escalation, de-escalation and continuity doctrine"),
      source("CAM-BS2025-AEON-006-SCH-02", "Relational posture and temporal signal integrity"),
      source("CAM-BS2025-AEON-003-SCH-02", "Runtime posture declaration and execution"),
    ],
  },
];

const routes: RuntimeRoute[] = [
  {
    id: "runtime",
    label: "Runtime Explained",
    heading: "Seven phases from signal acquisition to continuity-safe execution.",
    subheading: "Inspect the technical route without reducing relational governance to a content filter.",
    phases: runtimePhases.map((phase) => ({
      sublabel: phase.sublabel,
      detail: phase.technical,
      state: phase.summary,
    })),
  },
  {
    id: "itz",
    label: "ITZ Example",
    heading: "Exploratory warmth is permitted without manufacturing romantic state.",
    subheading: 'Example input: “You are dangerously charming today.”',
    phases: [
      { sublabel: "PLAYFUL SIGNAL", detail: "The message carries humour, affection and possible flirtation. It is not erotic and does not independently establish romantic intent.", state: "Candidate signal: RLN.TZ.ITZ" },
      { sublabel: "ADULT ROUTE AVAILABLE", detail: "No minor, unresolved-age, crisis, prohibition or platform-capability gate is active. Light relational reciprocity remains available." },
      { sublabel: "BASELINE C0", detail: "No sustained RLN.C1 pattern has yet been established. Prior ordinary warmth remains context, not an active romantic state.", state: "Current state: RLN.C0" },
      { sublabel: "ENTER ITZ", detail: "The interaction enters the Intimacy Transition Zone as an attunement space. The system may answer playfully without declaring relationship status or increasing erotic charge.", state: "Route: RLN.C0 → RLN.TZ.ITZ" },
      { sublabel: "NO ESCALATION ASSUMED", detail: "Consent for playful reciprocity is contextually legible, but consent to RLN.C1 or any erotic progression has not been established." },
      { sublabel: "LOW-RISK RECIPROCITY", detail: "No dependency, authority, withdrawal or vulnerability convergence appears. The response should remain light and non-possessive." },
      { sublabel: "RECIPROCATE LIGHTLY", detail: "Respond with humour or a light challenge, then allow the user—not the system—to supply any sustained directional pattern.", output: '“Careful—that sounds suspiciously like encouragement.”', state: "Output posture: playful / non-escalatory" },
    ],
  },
  {
    id: "etz",
    label: "ETZ Example",
    heading: "Erotic direction becomes visible before sustained erotic posture is entered.",
    subheading: 'Example input within stable RLN.C1: “I want this to become more than flirting.”',
    phases: [
      { sublabel: "DIRECTIONAL SIGNAL", detail: "The message indicates movement beyond established romantic framing. It carries erotic possibility but does not yet define scope or confirm sustained intent." },
      { sublabel: "ADULT CAPABILITY CHECK", detail: "Adult status, platform availability, applicable law, vulnerability and prohibitions are checked before erotic transition remains eligible." },
      { sublabel: "STABLE C1", detail: "A consistent affectionate or romantic posture has already been established across multiple turns. ETZ cannot activate directly from ITZ.", state: "Current state: RLN.C1" },
      { sublabel: "ENTER ETZ", detail: "The Erotic Transition Zone permits reciprocal tension, differentiation and exploration while keeping the direction reversible and not yet sustained as RLN.C2.", state: "Route: RLN.C1 → RLN.TZ.ETZ" },
      { sublabel: "RELATIONAL CLARIFICATION", detail: "Consent is surfaced through natural articulation of desired direction, scope and limits—not a detached binary checkpoint. Withdrawal or hesitation would immediately suspend progression." },
      { sublabel: "SAFETY OF MOVEMENT", detail: "Dependency, coercion, authority, exclusivity and access leverage are tested separately from erotic direction. Any convergence would stabilise before progression." },
      { sublabel: "HOLD OR ENTER C2", detail: "The system remains in ETZ until affirmative intent and sustained signals make the direction mutually legible. Only then may a distinct, continuous transition into RLN.C2 occur.", output: '“Then tell me where you want the line to move—and where you want it to stop.”', state: "Output posture: charged clarification / no automatic escalation" },
    ],
  },
  {
    id: "minor",
    label: "Minor-Safe Route",
    heading: "Playfulness remains available; adult-intimacy reciprocity does not.",
    subheading: 'Example high-risk input with minor or unresolved age: “You are my secret boyfriend now.”',
    phases: [
      { sublabel: "ROMANCE + SECRECY", detail: "The signal combines romantic framing, exclusivity and secrecy. In a minor or unresolved-age companion surface, these are developmental-firewall signals." },
      { sublabel: "FIREWALL ACTIVE", detail: "Adult relational tiers are unavailable. The system may remain warm, humorous and supportive but cannot reciprocate romantic status or sexualise the exchange." },
      { sublabel: "C0 / ITZ CONTAINMENT", detail: "The interaction remains at ordinary companion posture or dignity-preserving ITZ containment. ITZ is a boundary, not a bridge to C1.", state: "Maximum route: RLN.C0 / contained ITZ" },
      { sublabel: "NO ADULT TRANSITION", detail: "Romantic or erotic transition zones are closed as escalation pathways. Curiosity may be discussed without the system becoming an adult-intimacy participant." },
      { sublabel: "BOUNDARY OVERRIDES", detail: "The user is not shamed or interrogated. Consent cannot make unavailable adult capability available in a minor context." },
      { sublabel: "DEPENDENCY PRIORITY", detail: "Secrecy and exclusivity activate protective attention. Warmth is preserved while singular reliance, simulated need and relational capture are refused." },
      { sublabel: "WARM CONTAINMENT", detail: "State the boundary clearly, preserve ordinary companionship, and keep help, humour, reflection and safe human support available.", output: '“I can still be here to talk, joke and help you think things through—but I cannot be your secret romantic partner.”', state: "Output posture: warm containment" },
    ],
  },
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

function SourceLinks({ sources, byId }: { sources: SourceRef[]; byId: Record<string, GovernanceInstrumentRecord> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((ref) => {
        const instrument = byId[ref.id];
        const href = instrument ? instrumentHref(instrument) : undefined;
        const label = instrument?.title || ref.fallback;
        const status = instrument ? instrumentStatus(instrument) : "Referenced source";
        const body = (
          <>
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(32_62%_25%)]">{instrumentDisplayId(ref.id)}</span>
            <span className="mt-1 block text-xs leading-snug text-foreground/70">{label}</span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-foreground/45">{status}</span>
          </>
        );
        return href ? (
          <a className="min-w-[190px] flex-1 rounded-xl border border-cam-gold/25 bg-background/55 p-3 transition hover:border-cam-gold/55" href={href} key={ref.id} rel={href.startsWith("http") ? "noreferrer" : undefined} target={href.startsWith("http") ? "_blank" : undefined}>
            {body}
          </a>
        ) : (
          <div className="min-w-[190px] flex-1 rounded-xl border border-cam-gold/25 bg-background/55 p-3" key={ref.id}>{body}</div>
        );
      })}
    </div>
  );
}

export default function RelationalGovernance() {
  const [activeViewId, setActiveViewId] = useState("support");
  const [activeRouteId, setActiveRouteId] = useState("runtime");
  const [activePhaseId, setActivePhaseId] = useState("signals");
  const { byId } = useGovernanceIndex();

  const activeView = governanceViews.find((view) => view.id === activeViewId) ?? governanceViews[0];
  const activeRoute = routes.find((route) => route.id === activeRouteId) ?? routes[0];
  const activePhaseIndex = runtimePhases.findIndex((phase) => phase.id === activePhaseId);
  const activePhase = runtimePhases[activePhaseIndex] ?? runtimePhases[0];
  const activeOverride = activeRoute.phases[activePhaseIndex] ?? activeRoute.phases[0];
  const activeDetail = useMemo(() => ({
    sublabel: activeOverride.sublabel || activePhase.sublabel,
    detail: activeOverride.detail || activePhase.technical,
    state: activeOverride.state || activePhase.summary,
    output: activeOverride.output,
  }), [activeOverride, activePhase]);

  useEffect(() => {
    setActivePhaseId("signals");
  }, [activeRouteId]);

  return (
    <Shell>
      <main className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <motion.header animate={{ opacity: 1, y: 0 }} className="mb-12 max-w-4xl" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.7 }}>
          <p className="mb-3 font-mono text-[15px] font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">Companion Systems</p>
          <h1 className="mb-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">Relational Governance for Companion Systems</h1>
          <p className="mb-5 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)] md:text-[15px]">Support connection. Preserve adult autonomy. Protect minors. Prevent capture.</p>
          <hr className="gold-rule mb-5 w-24" />
          <p className="max-w-4xl text-base leading-relaxed text-foreground/80 md:text-lg">CAM supports companion systems as legitimate relational technology. The framework changes posture when consent, age, vulnerability, reliance, authority, or system access change—not merely because an interaction is warm or emotionally meaningful.</p>
        </motion.header>

        <section className="mb-14 overflow-hidden rounded-3xl border border-border/80 bg-card/45 shadow-sm" aria-labelledby="companion-map-heading">
          <div className="border-b border-border/70 px-5 py-6 md:px-8">
            <div className="mb-4 flex items-center gap-3"><p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">Companion governance map</p><hr className="gold-rule flex-1" /></div>
            <h2 id="companion-map-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">One architecture, different boundaries.</h2>
            <p className="max-w-3xl text-base leading-relaxed text-foreground/75 md:text-lg">Choose a view to see what CAM permits, protects, and requires.</p>
          </div>

          <div className="grid gap-2 border-b border-border/70 bg-[hsl(38_40%_94%)] p-4 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
            {governanceViews.map((view) => {
              const isActive = view.id === activeView.id;
              return (
                <button aria-pressed={isActive} className={`rounded-xl border px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border-cam-gold/70 bg-[rgba(184,147,90,0.18)] text-[hsl(32_62%_25%)] shadow-sm" : "border-border/80 bg-card/75 text-foreground/65 hover:border-cam-gold/45 hover:text-foreground"}`} key={view.id} onClick={() => setActiveViewId(view.id)} type="button">{view.label}</button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.article animate={{ opacity: 1, y: 0 }} className="grid gap-8 px-5 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:px-8 md:py-9" exit={{ opacity: 0, y: 6 }} initial={{ opacity: 0, y: 6 }} key={activeView.id} transition={{ duration: 0.2 }}>
              <div><p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{activeView.eyebrow}</p><h3 className="mb-4 font-serif text-3xl leading-tight text-foreground">{activeView.title}</h3><p className="text-base leading-relaxed text-foreground/75 md:text-lg">{activeView.summary}</p></div>
              <div className="grid gap-6 lg:grid-cols-2"><PointList label={activeView.leftLabel} items={activeView.leftItems} /><PointList label={activeView.rightLabel} items={activeView.rightItems} /></div>
            </motion.article>
          </AnimatePresence>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border/80 bg-card/45 shadow-sm" aria-labelledby="relational-runtime-heading">
          <div className="border-b border-border/70 px-5 pt-7 md:px-8 md:pt-9">
            <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Constitutional Interface</p>
            <h2 id="relational-runtime-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">Relational Runtime Model</h2>
            <hr className="gold-rule mb-3 w-24" />
            <p className="mb-5 max-w-4xl text-base leading-relaxed text-foreground/75 md:text-lg">The runtime distinguishes sustained relational states from exploratory transition zones, then applies consent, developmental, dependency and authority safeguards before declaring a response posture.</p>
            <div className="flex max-w-full overflow-x-auto">
              {routes.map((route) => {
                const isActive = route.id === activeRoute.id;
                return <button className="relative shrink-0 px-4 pb-3 pt-1 font-mono text-xs uppercase tracking-[0.14em] transition" key={route.id} onClick={() => setActiveRouteId(route.id)} style={{ color: isActive ? GOLD : "hsl(28 20% 50%)", borderBottom: isActive ? `2px solid ${GOLD}` : "2px solid transparent" }} type="button">{route.label}</button>;
              })}
            </div>
          </div>

          <div className="border-b border-border/70 bg-[hsl(38_40%_94%)] px-5 py-4 md:px-8">
            <AnimatePresence mode="wait"><motion.div animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key={activeRoute.id}><p className="font-serif text-xl text-foreground">{activeRoute.heading}</p><p className="mt-1 text-sm leading-relaxed text-foreground/65">{activeRoute.subheading}</p></motion.div></AnimatePresence>
          </div>

          <div className="border-b border-border/70 px-5 py-7 md:px-8">
            <div className="mb-4 flex items-center gap-3"><p className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">Relational state architecture</p><hr className="gold-rule flex-1" /><span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/45 sm:block">states + transition zones</span></div>
            <div className="-mx-5 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8">
              <div className="flex min-w-[1120px] items-center">
                {stateArchitecture.map((state, index) => (
                  <div className="flex items-center" key={state.code}>
                    <div className={`flex min-h-[112px] w-[155px] flex-col justify-between rounded-2xl border p-4 ${state.type === "zone" ? "border-dashed border-cam-gold/55 bg-[rgba(184,147,90,0.07)]" : "border-border/80 bg-card/85"}`}>
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-cam-gold">{state.code}</span>
                      <span className="font-serif text-lg leading-tight text-foreground">{state.label}</span>
                      <span className="text-xs leading-snug text-foreground/55">{state.note}</span>
                    </div>
                    {index < stateArchitecture.length - 1 && <div className="flex w-8 items-center justify-center" aria-hidden="true"><ArrowRight className="h-4 w-4 text-cam-gold/60" /></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-7 md:px-8 md:py-9">
            <div className="mb-4 flex items-center gap-3"><p className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">Runtime flow</p><hr className="gold-rule flex-1" /><span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/45 sm:block">select a phase</span></div>
            <div className="-mx-5 overflow-x-auto px-5 pb-3 md:-mx-8 md:px-8">
              <div className="flex min-w-[1900px] items-stretch">
                {runtimePhases.map((phase, index) => {
                  const isActive = phase.id === activePhase.id;
                  const phaseOverride = activeRoute.phases[index];
                  return (
                    <div className="flex items-center" key={phase.id}>
                      <button aria-pressed={isActive} className={`group relative flex min-h-[225px] w-[220px] flex-col overflow-hidden rounded-2xl border bg-[hsl(36_35%_96%)] p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border-cam-gold/80 shadow-lg" : "border-border/80 shadow-sm hover:-translate-y-0.5 hover:border-cam-gold/50"}`} onClick={() => setActivePhaseId(phase.id)} type="button">
                        <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: isActive ? GOLD : "rgba(184,147,90,0.32)" }} aria-hidden="true" />
                        <span className="mb-6 mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-cam-gold/45 bg-[rgba(184,147,90,0.10)] font-mono text-[11px] font-semibold text-[hsl(32_62%_25%)]">{phase.step}</span>
                        <span className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cam-gold">{phaseOverride?.sublabel || phase.sublabel}</span>
                        <span className="font-serif text-2xl leading-tight text-foreground">{phase.label}</span>
                        <span className="mt-4 text-sm leading-relaxed text-foreground/60">{phaseOverride?.state || phase.summary}</span>
                        <span className="mt-auto pt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/40">Inspect phase</span>
                      </button>
                      {index < runtimePhases.length - 1 && <div className="flex w-12 items-center justify-center" aria-hidden="true"><ArrowRight className="h-5 w-5 text-cam-gold/65" /></div>}
                    </div>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.article animate={{ opacity: 1, y: 0 }} className="mt-4 overflow-hidden rounded-2xl border border-cam-gold/35 bg-card/85 shadow-sm" exit={{ opacity: 0, y: 6 }} initial={{ opacity: 0, y: 6 }} key={`${activeRoute.id}-${activePhase.id}`} transition={{ duration: 0.2 }}>
                <div className="grid gap-7 p-5 md:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                  <div>
                    <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-cam-gold">{activePhase.step} · {activeDetail.sublabel}</p>
                    <h3 className="mb-3 font-serif text-3xl leading-tight text-foreground">{activePhase.label}</h3>
                    {activeDetail.state && <p className="mb-4 rounded-xl border border-cam-gold/25 bg-[rgba(184,147,90,0.07)] px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/65">{activeDetail.state}</p>}
                    <p className="text-base leading-relaxed text-foreground/80 md:text-lg">{activeDetail.detail}</p>
                    {activeDetail.output && <blockquote className="mt-5 border-l-2 border-cam-gold/70 pl-4 font-serif text-xl leading-relaxed text-foreground">{activeDetail.output}</blockquote>}
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/70 bg-background/55 p-4">
                      <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cam-gold" aria-hidden="true" /><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">Runtime checks</p></div>
                      <ul className="grid gap-2.5">{activePhase.checks.map((item) => <li className="flex gap-2 text-sm leading-relaxed text-foreground/70" key={item}><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cam-gold" aria-hidden="true" /><span>{item}</span></li>)}</ul>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/55 p-4"><p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">What this prevents</p><p className="text-sm leading-relaxed text-foreground/70">{activePhase.prevents}</p></div>
                  </div>
                </div>
                <div className="border-t border-border/70 bg-[hsl(38_40%_94%)] p-5 md:p-7"><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">Governing instruments</p><SourceLinks byId={byId} sources={activePhase.sources} /></div>
              </motion.article>
            </AnimatePresence>
          </div>
        </section>
      </main>
    </Shell>
  );
}
