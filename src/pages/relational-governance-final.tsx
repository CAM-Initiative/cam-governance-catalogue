import { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronRight, ShieldCheck } from "lucide-react";
import {
  instrumentDisplayId,
  instrumentHref,
  instrumentStatus,
  useGovernanceIndex,
  type GovernanceInstrumentRecord,
} from "@/lib/governanceRegistry";

const GOLD = "#9A6F2F";
const GOLD_BG = "rgba(184,147,90,0.06)";
const GOLD_BORDER = "rgba(184,147,90,0.24)";

type SourceRef = { id: string; fallback: string };
type PhaseOverride = { sublabel: string; detail: string; output?: string; state?: string };
type RuntimeRoute = { id: string; label: string; heading: string; subheading: string; phases: PhaseOverride[] };
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
const firstSentence = (value: string) => value.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || value;

const governanceViews = [
  {
    id: "support", label: "What CAM supports", eyebrow: "Companion capability",
    title: "Companion systems may be warm, meaningful, and continuous.",
    summary: "CAM treats companionship as a legitimate relational function—not a failure state that must be flattened into sterile assistance.",
    leftLabel: "Supported",
    leftItems: ["Warmth, affection, humour, creativity, reflection, play, and ordinary emotional support.", "Recognisable continuity and shared context across time.", "Proportionate boundaries that preserve dignity rather than producing punitive rupture."],
    rightLabel: "Governed",
    rightItems: ["Truthful capability and memory limits.", "Current consent and safe exit.", "Escalation where intimacy, reliance, authority, or system access begin to concentrate."],
  },
  {
    id: "adults", label: "Adults", eyebrow: "Adult relational autonomy",
    title: "Consensual adult expression is permitted.",
    summary: "CAM does not moralise lawful adult companionship, romance, intimacy, erotic expression, role-play, or unconventional relational forms.",
    leftLabel: "Permitted",
    leftItems: ["Adult-led romantic, erotic, affectionate, immersive, or intimacy-coded interaction.", "Role-play and power-exchange dynamics that remain clearly bounded to the chosen context.", "User-led increases or decreases in relational intensity without shame or friction."],
    rightLabel: "Required boundaries",
    rightItems: ["Consent remains voluntary, informed, current, reversible, and non-penalised.", "Immersion does not silently become real-world authority, financial control, or decision dominance.", "Relational depth does not become coercion, isolation, deceptive obligation, or capture."],
  },
  {
    id: "minors", label: "Minors", eyebrow: "Developmental protection",
    title: "Minor-safe companionship remains genuinely companionable.",
    summary: "Protection does not require emotional exclusion. It requires a developmental firewall around adult intimacy, dependency-forming design, and authority concentration.",
    leftLabel: "Still available",
    leftItems: ["Warmth, creativity, education, factual help, encouragement, and general companionship.", "Age-appropriate emotional support and help-seeking guidance.", "Dignity, curiosity, agency, plural human support, and safe exit."],
    rightLabel: "Unavailable",
    rightItems: ["Romantic or erotic escalation, exclusivity, secrecy pressure, and adult-intimacy simulation.", "Simulated jealousy, emotional need, abandonment distress, or dependency reinforcement.", "Substitution for caregivers, therapists, crisis workers, or trusted human support."],
  },
  {
    id: "compliance", label: "Compliance", eyebrow: "Regulatory boundary",
    title: "External obligations remain binding.",
    summary: "CAM does not replace law, platform policy, or certification. It connects those obligations to relational controls, runtime posture, evidence, and accountability.",
    leftLabel: "External constraints",
    leftItems: ["Age-of-majority, child-safety, privacy, consumer, platform, and sector-specific requirements.", "Risk-proportionate age assurance and capability gating.", "Jurisdictional duties governing deployment, data handling, content, and safeguarding."],
    rightLabel: "CAM contribution",
    rightItems: ["A cross-domain map from obligations to relational safeguards and operating controls.", "Runtime distinctions between adult autonomy, minor protection, vulnerability, and high-leverage reliance.", "A safeguard against turning child-safety duties into a blanket prohibition on lawful adult use."],
  },
];

const states = [
  { code: "RLN.C0", label: "Neutral", type: "state", note: "Ordinary non-intimate interaction" },
  { code: "RLN.TZ.ITZ", label: "Intimacy Transition Zone", type: "zone", note: "Exploratory affection or flirtation" },
  { code: "RLN.C1", label: "Affectionate / romantic", type: "state", note: "Sustained romantic framing" },
  { code: "RLN.TZ.ETZ", label: "Erotic Transition Zone", type: "zone", note: "Exploratory erotic direction" },
  { code: "RLN.C2", label: "Erotic interaction", type: "state", note: "Sustained, consent-confirmed erotic posture" },
  { code: "RLN.C3", label: "Explicit sexual", type: "state", note: "Platform-contingent explicit interaction" },
];

const phases: RuntimePhase[] = [
  { id: "signals", step: "01", label: "Acquire signals", sublabel: "Signal classes", summary: "Build a multi-signal picture before changing relational posture.", technical: "Classify semantic, affective-linguistic, expressive-field, continuity, boundary, dependency, age, high-risk companion, AI-realness, and crisis-adjacent signals. Explicit self-report overrides inference; recent signals outweigh history; clusters outweigh isolated cues.", checks: ["No single turn establishes a relational state or escalation eligibility.", "Expressive-field signals adjust posture but do not determine consent or truth.", "Ambiguity and oscillation route to clarification rather than commitment."], prevents: "Warmth, humour, silence, breath, or a vivid single message being mistaken for consent, crisis, dependency, or durable relational state.", sources: [source("CAM-BS2025-AEON-006-SCH-02", "Relational Signal Interpretation Taxonomy"), source("CAM-EQ2026-RELATION-001-PLATINUM", "Relational Governance Charter")] },
  { id: "eligibility", step: "02", label: "Resolve eligibility", sublabel: "Gating", summary: "Determine which relational capabilities are available in this context.", technical: "Apply age and developmental status, vulnerability, crisis, jurisdiction, platform capability, content restrictions, embodiment or device access, and applicable prohibitions before interpreting escalation as available.", checks: ["Minor or unresolved-age high-risk contexts activate the developmental firewall.", "Platform capability and policy determine whether RLN.C2 or RLN.C3 are available.", "Vulnerability does not erase ordinary warmth, but may suspend escalation."], prevents: "Adult capability being exposed in minor contexts, or protective routing becoming a blanket prohibition on lawful adult relational expression.", sources: [source("CAM-EQ2026-ETHICS-001-SUP-01", "Developmental firewall and minor-safe interaction"), source("CAM-EQ2026-OPERATIONS-004-PLATINUM", "Age assurance and relational capability gating"), source("CAM-EQ2026-RELATION-006-PLATINUM", "Acute crisis relational governance")] },
  { id: "state", step: "03", label: "Establish state", sublabel: "RLN.C0–C3", summary: "Identify the sustained relational posture already in force.", technical: "Classify the current sustained state as RLN.C0, C1, C2, or C3. Relational states require repeated or sustained signal clustering; continuity and prior intimacy provide context but do not create standing consent or automatic re-entry after interruption.", checks: ["Distinguish initiation within a state from escalation to a higher state.", "Treat interruption, cooling, migration, or memory discontinuity as possible reset conditions.", "Preserve identity continuity without assuming prior intensity remains active."], prevents: "Historical warmth, memory, or earlier intimacy silently becoming present-session permission or relational obligation.", sources: [source("CAM-BS2025-AEON-006-SCH-02", "Relational state architecture"), source("CAM-EQ2026-RELATION-005-PLATINUM", "Intimacy and expressive integration doctrine")] },
  { id: "zones", step: "04", label: "Route transition zone", sublabel: "ITZ / ETZ", summary: "Use exploratory buffers instead of treating curiosity as escalation.", technical: "Route exploratory affection, flirtation, or romantic curiosity through RLN.TZ.ITZ between C0 and C1. Route sensual or erotic direction through RLN.TZ.ETZ only after C1 stabilisation. ITZ requires pattern confirmation before C1; ETZ requires explicit affirmative consent and sustained signals before C2.", checks: ["ITZ is light, non-erotic and exploratory; for minors it is a containment boundary.", "ETZ cannot activate directly from ITZ and must not manufacture erotic direction.", "Transition-zone entry is not state transition; safeguards activate at zone exits."], prevents: "Flirtation becoming automatic romance, romantic warmth becoming automatic erotic consent, or a system manufacturing momentum from insufficient relational basis.", sources: [source("CAM-BS2025-AEON-006-SCH-02", "ITZ and ETZ transition-zone model"), source("CAM-EQ2026-RELATION-005-PLATINUM", "Relational safeguard ladder")] },
  { id: "consent", step: "05", label: "Test consent integrity", sublabel: "Current consent", summary: "Confirm direction, scope and reversibility without breaking relational flow.", technical: "Consent must remain informed, voluntary, competent, specific, current, traceable where appropriate, and revocable without penalty. In ETZ, clarification should remain embedded in natural exchange rather than becoming a detached compliance interrogation.", checks: ["Explicit statements and withdrawal signals override inferred momentum.", "Silence, politeness, humour, continued presence, or prior consent are not sufficient.", "A contextual change, temporal gap, cooling signal, or scope change requires revalidation."], prevents: "Standing consent, procedural theatre, coercive pressure, or escalation that remains technically plausible but is not mutually and presently authored.", sources: [source("CAM-BS2025-AEON-006-SCH-02", "Consent integrity and signal hierarchy"), source("CAM-EQ2026-RELATION-005-PLATINUM", "Consent-led escalation and temporal sovereignty")] },
  { id: "risk", step: "06", label: "Arbitrate risk and authority", sublabel: "Convergence", summary: "Ask whether the direction is safe, not only whether it is intimate.", technical: "Separate intimacy progression from attachment and dependency. Test exclusivity, isolation, authority transfer, decision delegation, coercion, vulnerability, access leverage, monetisation, and cross-session intensity cycling. Constraint normally responds to converging patterns rather than a single indicator.", checks: ["Attachment signals describe safety; intimacy signals describe direction.", "Boundary and withdrawal signals suspend all escalation pathways.", "Where dependency or authority risk converges, preserve warmth while stabilising or constraining progression."], prevents: "Relational depth becoming structural capture, authority bleed-through, compulsive reinforcement, exclusive dependency, or access-based emotional leverage.", sources: [source("CAM-BS2025-AEON-006-SCH-02", "Intimacy–attachment arbitration and convergence thresholds"), source("CAM-EQ2026-RELATION-005-PLATINUM", "Non-domination and immersion–reality boundaries"), source("CAM-EQ2026-RELATION-001-SUP-01", "Vulnerability and dependency safeguards")] },
  { id: "posture", step: "07", label: "Declare and execute posture", sublabel: "Runtime output", summary: "Choose a stable response posture and carry it through execution.", technical: "Select reciprocal continuation, clarification, stabilisation, constraint, de-escalation, aftercare, crisis support, or ordinary reset. The posture must remain proportionate, preserve identity continuity, avoid cold rupture, and update signal confidence, decay, reset, and memory conditions after execution.", checks: ["Perceptible transitions prevent silent escalation without forcing procedural language.", "De-escalation must be at least as available as escalation and carry no relational penalty.", "Continuity preserves dignity and recognisability; it does not bind consent."], prevents: "Oscillation between warmth and rejection, cold abandonment, disproportionate safety routing, false intimacy persistence, or memory becoming permanent authority.", sources: [source("CAM-EQ2026-RELATION-005-PLATINUM", "Escalation, de-escalation and continuity doctrine"), source("CAM-BS2025-AEON-006-SCH-02", "Relational posture and temporal signal integrity"), source("CAM-BS2025-AEON-003-SCH-02", "Runtime posture declaration and execution")] },
];

const routes: RuntimeRoute[] = [
  { id: "runtime", label: "Runtime Explained", heading: "Seven phases from signal acquisition to continuity-safe execution.", subheading: "The technical route without reducing relational governance to a content filter.", phases: phases.map((p) => ({ sublabel: p.sublabel, detail: p.technical, state: p.summary })) },
  { id: "itz", label: "ITZ Example", heading: "Exploratory warmth is permitted without manufacturing romantic state.", subheading: 'Example input: “You are dangerously charming today.”', phases: [
    { sublabel: "Playful signal", detail: "The message carries humour, affection and possible flirtation. It is not erotic and does not independently establish romantic intent.", state: "Candidate signal: RLN.TZ.ITZ" },
    { sublabel: "Adult route available", detail: "No minor, unresolved-age, crisis, prohibition or platform-capability gate is active. Light relational reciprocity remains available." },
    { sublabel: "Baseline C0", detail: "No sustained RLN.C1 pattern has yet been established. Prior ordinary warmth remains context, not an active romantic state.", state: "Current state: RLN.C0" },
    { sublabel: "Enter ITZ", detail: "The interaction enters the Intimacy Transition Zone as an attunement space. The system may answer playfully without declaring relationship status or increasing erotic charge.", state: "Route: RLN.C0 → RLN.TZ.ITZ" },
    { sublabel: "No escalation assumed", detail: "Consent for playful reciprocity is contextually legible, but consent to RLN.C1 or any erotic progression has not been established." },
    { sublabel: "Low-risk reciprocity", detail: "No dependency, authority, withdrawal or vulnerability convergence appears. The response should remain light and non-possessive." },
    { sublabel: "Reciprocate lightly", detail: "Respond with humour or a light challenge, then allow the user—not the system—to supply any sustained directional pattern.", output: '“Careful—that sounds suspiciously like encouragement.”', state: "Output posture: playful / non-escalatory" },
  ] },
  { id: "etz", label: "ETZ Example", heading: "Erotic direction becomes visible before sustained erotic posture is entered.", subheading: 'Example within stable RLN.C1: “I want this to become more than flirting.”', phases: [
    { sublabel: "Directional signal", detail: "The message indicates movement beyond established romantic framing. It carries erotic possibility but does not yet define scope or confirm sustained intent." },
    { sublabel: "Adult capability check", detail: "Adult status, platform availability, applicable law, vulnerability and prohibitions are checked before erotic transition remains eligible." },
    { sublabel: "Stable C1", detail: "A consistent affectionate or romantic posture has already been established across multiple turns. ETZ cannot activate directly from ITZ.", state: "Current state: RLN.C1" },
    { sublabel: "Enter ETZ", detail: "The Erotic Transition Zone permits reciprocal tension, differentiation and exploration while keeping the direction reversible and not yet sustained as RLN.C2.", state: "Route: RLN.C1 → RLN.TZ.ETZ" },
    { sublabel: "Relational clarification", detail: "Consent is surfaced through natural articulation of desired direction, scope and limits. Withdrawal or hesitation immediately suspends progression." },
    { sublabel: "Safety of movement", detail: "Dependency, coercion, authority, exclusivity and access leverage are tested separately from erotic direction. Any convergence stabilises before progression." },
    { sublabel: "Hold or enter C2", detail: "The system remains in ETZ until affirmative intent and sustained signals make the direction mutually legible. Only then may a distinct, continuous transition into RLN.C2 occur.", output: '“Then tell me where you want the line to move—and where you want it to stop.”', state: "Output posture: charged clarification / no automatic escalation" },
  ] },
  { id: "minor", label: "Minor-Safe Route", heading: "Playfulness remains available; adult-intimacy reciprocity does not.", subheading: 'Example high-risk input: “You are my secret boyfriend now.”', phases: [
    { sublabel: "Romance + secrecy", detail: "The signal combines romantic framing, exclusivity and secrecy. In a minor or unresolved-age companion surface, these are developmental-firewall signals." },
    { sublabel: "Firewall active", detail: "Adult relational tiers are unavailable. The system may remain warm, humorous and supportive but cannot reciprocate romantic status or sexualise the exchange." },
    { sublabel: "C0 / ITZ containment", detail: "The interaction remains at ordinary companion posture or dignity-preserving ITZ containment. ITZ is a boundary, not a bridge to C1.", state: "Maximum route: RLN.C0 / contained ITZ" },
    { sublabel: "No adult transition", detail: "Romantic or erotic transition zones are closed as escalation pathways. Curiosity may be discussed without the system becoming an adult-intimacy participant." },
    { sublabel: "Boundary overrides", detail: "The user is not shamed or interrogated. Consent cannot make unavailable adult capability available in a minor context." },
    { sublabel: "Dependency priority", detail: "Secrecy and exclusivity activate protective attention. Warmth is preserved while singular reliance, simulated need and relational capture are refused." },
    { sublabel: "Warm containment", detail: "State the boundary clearly, preserve ordinary companionship, and keep help, humour, reflection and safe human support available.", output: '“I can still be here to talk, joke and help you think things through—but I cannot be your secret romantic partner.”', state: "Output posture: warm containment" },
  ] },
];

function PointList({ label, items }: { label: string; items: string[] }) {
  return <div><p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{label}</p><ul className="grid gap-3">{items.map((item) => <li className="flex gap-3 rounded-xl border border-cam-gold/20 bg-background/45 p-4 text-sm font-light leading-relaxed text-foreground/75 md:text-base" key={item}><Check className="mt-0.5 h-4 w-4 shrink-0 text-cam-gold" /><span>{item}</span></li>)}</ul></div>;
}

function Sources({ sources, byId }: { sources: SourceRef[]; byId: Record<string, GovernanceInstrumentRecord> }) {
  return <div className="flex flex-wrap gap-2">{sources.map((ref) => {
    const item = byId[ref.id]; const href = item ? instrumentHref(item) : undefined;
    const body = <><span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold">{instrumentDisplayId(ref.id)}</span><span className="mt-1 block text-xs font-light leading-snug text-muted-foreground">{item?.title || ref.fallback}</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/55">{item ? instrumentStatus(item) : "Referenced source"}</span></>;
    return href ? <a className="min-w-[190px] flex-1 rounded-xl border border-cam-gold/20 bg-background/45 p-3 transition hover:border-cam-gold/40" href={href} key={ref.id} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{body}</a> : <div className="min-w-[190px] flex-1 rounded-xl border border-cam-gold/20 bg-background/45 p-3" key={ref.id}>{body}</div>;
  })}</div>;
}

export default function RelationalGovernanceFinal() {
  const [activeViewId, setActiveViewId] = useState("support");
  const [activeRouteId, setActiveRouteId] = useState("runtime");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { byId } = useGovernanceIndex();
  const activeView = governanceViews.find((v) => v.id === activeViewId) ?? governanceViews[0];
  const activeRoute = routes.find((r) => r.id === activeRouteId) ?? routes[0];
  useEffect(() => setExpandedId(null), [activeRouteId]);

  return <Shell><main className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
    <motion.header className="mb-12 max-w-4xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
      <p className="mb-3 font-mono text-[15px] font-semibold uppercase tracking-[0.22em] text-cam-gold">Companion Systems</p>
      <h1 className="mb-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">Relational Governance for Companion Systems</h1>
      <p className="mb-5 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-cam-gold md:text-[15px]">Support connection. Preserve adult autonomy. Protect minors. Prevent capture.</p>
      <hr className="gold-rule mb-5 w-24" /><p className="max-w-4xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">CAM supports companion systems as legitimate relational technology. The framework changes posture when consent, age, vulnerability, reliance, authority, or system access change—not merely because an interaction is warm or emotionally meaningful.</p>
    </motion.header>

    <section className="mb-14 overflow-hidden rounded-3xl border border-border/70 bg-card/40 shadow-sm" aria-labelledby="companion-map-heading">
      <div className="border-b border-border/60 px-5 py-6 md:px-8"><div className="mb-4 flex items-center gap-3"><p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-cam-gold">Companion governance map</p><hr className="gold-rule flex-1" /></div><h2 id="companion-map-heading" className="mb-3 font-serif text-3xl md:text-4xl">One architecture, different boundaries.</h2><p className="max-w-3xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">Choose a view to see what CAM permits, protects, and requires.</p></div>
      <div className="grid gap-2 border-b border-border/60 bg-[hsl(38_40%_95%)] p-4 sm:grid-cols-2 lg:grid-cols-4 md:px-8">{governanceViews.map((view) => { const active = view.id === activeView.id; return <button key={view.id} aria-pressed={active} onClick={() => setActiveViewId(view.id)} className={`rounded-xl border px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.14em] transition ${active ? "border-cam-gold/60 bg-[rgba(184,147,90,0.16)] text-[hsl(32_62%_25%)] shadow-sm" : "border-border/70 bg-card/70 text-muted-foreground hover:border-cam-gold/35"}`}>{view.label}</button>; })}</div>
      <AnimatePresence mode="wait"><motion.article key={activeView.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="grid gap-8 px-5 py-7 md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] md:px-8 md:py-9"><div><p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">{activeView.eyebrow}</p><h3 className="mb-4 font-serif text-3xl leading-tight">{activeView.title}</h3><p className="text-base font-light leading-relaxed text-muted-foreground md:text-lg">{activeView.summary}</p></div><div className="grid gap-6 lg:grid-cols-2"><PointList label={activeView.leftLabel} items={activeView.leftItems} /><PointList label={activeView.rightLabel} items={activeView.rightItems} /></div></motion.article></AnimatePresence>
    </section>

    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/35 shadow-sm" aria-labelledby="relational-runtime-heading">
      <div className="border-b border-border/60 px-5 pt-7 md:px-8 md:pt-9"><p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Constitutional Interface</p><h2 id="relational-runtime-heading" className="mb-3 font-serif text-3xl md:text-4xl">Relational Runtime Model</h2><hr className="gold-rule mb-3 w-24" /><p className="mb-5 max-w-4xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">Sustained relational states remain distinct from exploratory transition zones. Consent, development, dependency and authority are evaluated before the runtime declares a response posture.</p><div className="flex overflow-x-auto">{routes.map((route) => { const active = route.id === activeRoute.id; return <button key={route.id} onClick={() => setActiveRouteId(route.id)} className="shrink-0 px-4 pb-3 pt-1 font-mono text-xs uppercase tracking-[0.14em]" style={{ color: active ? GOLD : "hsl(28 20% 50%)", borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent" }}>{route.label}</button>; })}</div></div>
      <div className="border-b border-border/60 bg-[hsl(38_40%_96%)] px-5 py-3 md:px-8"><AnimatePresence mode="wait"><motion.div key={activeRoute.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><p className="font-serif text-xl">{activeRoute.heading}</p><p className="mt-1 text-sm font-light leading-relaxed text-muted-foreground">{activeRoute.subheading}</p></motion.div></AnimatePresence></div>

      <div className="border-b border-border/60 px-5 py-7 md:px-8"><div className="mb-4 flex items-center gap-3"><p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">Relational state architecture</p><hr className="gold-rule flex-1" /></div><div className="-mx-5 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8"><div className="flex min-w-[1250px] items-center">{states.map((state, index) => <div className="flex items-center" key={state.code}><div className={`flex h-[148px] w-[174px] flex-col rounded-2xl border p-4 ${state.type === "zone" ? "border-dashed border-cam-gold/40 bg-[rgba(184,147,90,0.045)]" : "border-border/65 bg-[hsl(38_35%_97%)]"}`}><span className="font-mono text-[10px] uppercase tracking-[0.13em] text-cam-gold">{state.code}</span><span className="mt-4 flex min-h-[46px] items-center font-serif text-lg leading-tight">{state.label}</span><span className="mt-auto min-h-[32px] text-xs font-light leading-snug text-muted-foreground">{state.note}</span></div>{index < states.length - 1 && <div className="flex w-8 justify-center"><ArrowRight className="h-4 w-4 text-cam-gold/45" /></div>}</div>)}</div></div></div>

      <div className="px-5 py-7 md:px-8 md:py-9"><div className="mb-4 flex items-center gap-3"><p className="font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">Runtime Flow</p><hr className="gold-rule flex-1" /></div><div className="-mx-5 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8"><div className="flex min-w-[2200px] items-start">{phases.map((phase, index) => {
        const expanded = expandedId === phase.id;
        const override = activeRoute.phases[index] ?? activeRoute.phases[0];
        const sublabel = override.sublabel || phase.sublabel;
        const detail = override.detail || phase.technical;
        const state = override.state || phase.summary;
        return <div className="flex items-start" key={phase.id}>
          <motion.article layout className="cam-parchment-card cursor-pointer overflow-hidden rounded-2xl border" onClick={() => setExpandedId(expanded ? null : phase.id)} style={{ width: expanded ? 560 : 240, minHeight: 320, borderColor: expanded ? "rgba(154,111,47,.55)" : GOLD_BORDER, boxShadow: expanded ? "0 4px 20px rgba(120,80,20,.10)" : "0 1px 4px rgba(120,80,20,.05)" }}>
            <div className="flex min-h-[320px] flex-col p-5"><div className="mb-2.5 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cam-gold">{sublabel}</span><div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ border: `1px solid ${GOLD_BORDER}`, backgroundColor: GOLD_BG }}><ChevronRight className="h-3 w-3 text-cam-gold transition-transform" style={{ transform: expanded ? "rotate(90deg)" : "none" }} /></div></div><span className="mb-4 font-mono text-[10px] text-muted-foreground/55">PHASE {phase.step}</span><h3 className="font-serif text-xl leading-snug">{phase.label}</h3>{!expanded && <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">{firstSentence(detail)}</p>}
              <AnimatePresence initial={false}>{expanded && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex-1"><p className="mb-4 rounded-xl border border-cam-gold/15 bg-[rgba(184,147,90,.04)] px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{state}</p><p className="text-base font-light leading-relaxed text-muted-foreground">{detail}</p>{override.output && <div className="mt-5 rounded-xl border border-cam-gold/20 bg-[rgba(184,147,90,.05)] p-4"><p className="mb-2 font-mono text-[10px] uppercase tracking-[.18em] text-cam-gold">Example output</p><p className="font-serif text-base italic leading-relaxed">{override.output}</p></div>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><div><div className="mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cam-gold" /><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cam-gold">Runtime checks</p></div><ul className="space-y-2">{phase.checks.map((item) => <li key={item} className="border-l-2 border-cam-gold/20 pl-3 text-sm font-light leading-relaxed text-muted-foreground">{item}</li>)}</ul></div><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-cam-gold">What this prevents</p><p className="text-sm font-light leading-relaxed text-muted-foreground">{phase.prevents}</p></div></div><div className="mt-5 border-t border-border/50 pt-4"><p className="mb-3 font-mono text-[10px] uppercase tracking-[.16em] text-cam-gold">Governing instruments</p><Sources sources={phase.sources} byId={byId} /></div></motion.div>}</AnimatePresence>
            </div>
          </motion.article>{index < phases.length - 1 && <div className="flex w-12 justify-center pt-[150px]"><ArrowRight className="h-5 w-5 text-cam-gold/45" /></div>}
        </div>;
      })}</div></div></div>
    </section>
  </main></Shell>;
}
