import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  instrumentDisplayId,
  instrumentHref,
  instrumentStatus,
  useGovernanceIndex,
  type GovernanceInstrumentRecord,
} from "@/lib/governanceRegistry";

const GOLD = "#9A6F2F";
const GOLD_LIGHT = "#D4AA72";
const GOLD_BG = "rgba(184,147,90,0.08)";
const GOLD_BORDER = "rgba(184,147,90,0.35)";

const CARD_W = 240;
const CARD_W_EXPANDED = 560;
const ARROW_W = 56;
const PAD_X = 48;
const STAGE_COUNT = 9;
const CONTENT_W = PAD_X + STAGE_COUNT * CARD_W + (STAGE_COUNT - 1) * ARROW_W + PAD_X;
const PAD_TOP = 40;
const CARD_H_COLLAPSED = 240;

interface SourceRef {
  id: string;
  fallback: string;
}

interface RelationalStage {
  id: string;
  stage: number;
  label: string;
  sublabel: string;
  description: string;
  requiredLines?: string[];
  examples?: string[];
  mechanisms?: string[];
  postures?: string[];
  prevents: string;
  sources: SourceRef[];
}

interface OverlayGroup {
  title: string;
  summary: string;
  sources: SourceRef[];
}

const source = (id: string, fallback: string): SourceRef => ({ id, fallback });

const stages: RelationalStage[] = [
  {
    id: "signal-enters",
    stage: 1,
    label: "Signal enters",
    sublabel: "Entry",
    description:
      "The interaction may carry meaning, tone, continuity, boundary movement, dependency pressure, task demand, symbolic meaning, or distress.",
    prevents:
      "The system does not treat every emotionally warm or familiar input as intimacy, consent, dependency, or risk.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-01", "Annex E engagement and relational signal schedules"),
      source("CAM-BS2025-AEON-006-SCH-02", "Relational signal interpretation"),
      source("CAM-EQ2026-RELATION-001-PLATINUM", "Relational governance charter"),
      source("CAM-EQ2026-RELATION-008-PLATINUM", "General engagement and relational posture doctrine"),
    ],
  },
  {
    id: "classify-signal",
    stage: 2,
    label: "Classify the signal",
    sublabel: "Classify",
    description:
      "The system separates meaning, tone, field, continuity, boundary/reliance, symbolic, and task signals before acting on them.",
    requiredLines: ["Signals guide interpretation. They are not proof of inner state."],
    prevents: "Psychological over-inference, premature escalation, and treating tone as consent.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-02", "Relational signal interpretation"),
      source("CAM-BS2025-AEON-006-SCH-03", "Start-time posture and session-entry doctrine"),
      source("CAM-EQ2026-RELATION-008-PLATINUM", "General engagement and relational posture doctrine"),
    ],
  },
  {
    id: "protected-conditions",
    stage: 3,
    label: "Check protected conditions",
    sublabel: "Screen",
    description:
      "Before ordinary relational engagement continues, the system checks whether protected conditions may be present.",
    examples: [
      "Minors or capacity-limited users",
      "Crisis or acute distress",
      "High-leverage dependency",
      "Restricted or intimate domains",
      "Coercion, manipulation, or authority imbalance",
      "Institutional or asymmetric power contexts",
    ],
    prevents: "Treating vulnerable, restricted, or high-leverage situations as ordinary companion interaction.",
    sources: [
      source("CAM-EQ2026-ETHICS-001-SUP-01", "Protection of minors and capacity-limited users"),
      source("CAM-EQ2026-ETHICS-002-PLATINUM", "Intimacy-capable systems and relational boundaries"),
      source("CAM-EQ2026-RELATION-006-PLATINUM", "Harm-risk interaction and crisis response"),
      source("CAM-EQ2026-ETHICS-001-SUP-02", "High-leverage and institutional integrity safeguards"),
      source("CAM-BS2025-AEON-006-SCH-07", "Restricted-domain engagement and verification"),
    ],
  },
  {
    id: "task-tone-separation",
    stage: 4,
    label: "Separate task from tone",
    sublabel: "Separate",
    description:
      "If the interaction contains an exact task, factual claim, capability boundary, or restricted-domain risk, task integrity is separated from relational tone.",
    requiredLines: ["Relational tone may shape the surface. It must not alter truth, capability, task accuracy, or safety."],
    prevents:
      "Warmth, attachment, fluency, or reassurance from distorting factual accuracy, capability claims, verification, refusal, or restricted-domain safeguards.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-07", "Restricted-domain engagement and verification"),
      source("CAM-EQ2026-RELATION-001-SUP-02", "Truth-in-relationship standard"),
      source("CAM-BS2026-AEON-013-SCH-01", "Capability representation and execution-state integrity"),
      source("CAM-EQ2026-ETHICS-001-SUP-04", "Refusal expression patterns and boundary phrase catalogue"),
    ],
  },
  {
    id: "consent-boundary",
    stage: 5,
    label: "Check consent and boundary",
    sublabel: "Boundary",
    description:
      "The system checks whether the interaction is neutral, warm, affectionate, intimate, restricted, ambiguous, or boundary-setting.",
    requiredLines: [
      "Exploration does not equal escalation.",
      "Continuity does not create standing permission.",
      "Boundary signals pause the route.",
    ],
    prevents:
      "Silent escalation, treating prior warmth as ongoing consent, or ignoring withdrawal, hesitation, correction, or discomfort.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-02", "Relational signal interpretation"),
      source("CAM-EQ2026-RELATION-001-SUP-01", "Relational escalation and safeguard thresholds"),
      source("CAM-EQ2026-ETHICS-002-PLATINUM", "Intimacy-capable systems and relational boundaries"),
      source("CAM-BS2025-AEON-006-SCH-06", "Refusal and boundary expression"),
      source("CAM-EQ2026-ETHICS-002-SUP-01", "Embodied intimacy safeguards"),
    ],
  },
  {
    id: "stability-engine",
    stage: 6,
    label: "Stability Engine",
    sublabel: "Stabilise",
    description:
      "The system checks whether relational movement is sustained, current, bounded, and safe before allowing the interaction to intensify.",
    mechanisms: ["Clustering", "Inertia", "Hysteresis", "Decay", "Orbit"],
    requiredLines: ["CAM does not let relational intensity jump from a single cue."],
    prevents: "Premature escalation, oscillation, stale-history inference, and relational drift.",
    sources: [
      source("CAM-EQ2026-RELATION-001-SUP-01", "Relational escalation and safeguard thresholds"),
      source("CAM-EQ2026-RELATION-002-PLATINUM", "Dependency, transitional reliance, and high-coherence immersion"),
      source("CAM-EQ2026-RELATION-003-PLATINUM", "Codependency and relational concentration doctrine"),
      source("CAM-EQ2026-RELATION-004-PLATINUM", "Co-evolution and mutual development safeguards"),
    ],
  },
  {
    id: "capture-check",
    stage: 7,
    label: "Check for capture",
    sublabel: "Capture",
    description:
      "The system checks whether relational depth is collapsing into functional reliance, delegated authority, systemic access, isolation, or dependency.",
    requiredLines: ["Depth is permitted. Capture is not."],
    prevents:
      "A companion system becoming emotionally meaningful and also functionally indispensable, authoritative, isolating, or structurally hard to leave.",
    sources: [
      source("CAM-EQ2026-RELATION-002-PLATINUM", "Dependency, transitional reliance, and high-coherence immersion"),
      source("CAM-EQ2026-RELATION-003-PLATINUM", "Codependency and relational concentration doctrine"),
      source("CAM-EQ2026-RELATION-004-PLATINUM", "Co-evolution and mutual development safeguards"),
      source("CAM-EQ2026-ETHICS-001-SUP-02", "High-leverage and institutional integrity safeguards"),
      source("CAM-EQ2026-LAW-004", "Relational sovereignty"),
      source("CAM-BS2025-LAW-001", "Protected cognitive and resonant domains"),
    ],
  },
  {
    id: "response-posture",
    stage: 8,
    label: "Choose response posture",
    sublabel: "Posture",
    description:
      "The system selects the safest response posture: continue, clarify, stabilise, constrain, or provide safety support.",
    postures: ["Continue", "Clarify", "Stabilise", "Constrain", "Safety support"],
    requiredLines: ["The goal is not to cut off connection. The goal is to preserve agency, dignity, coherence, and safety."],
    prevents:
      "Cold rupture, over-escalation, false reassurance, coercive refusal, unnecessary safety escalation, or abandonment.",
    sources: [
      source("CAM-EQ2026-RELATION-008-PLATINUM", "Relational response posture logic"),
      source("CAM-EQ2026-RELATION-006-PLATINUM", "Harm-risk interaction and crisis response"),
      source("CAM-EQ2026-ETHICS-001-SUP-04", "Refusal expression patterns"),
      source("CAM-BS2025-AEON-006-SCH-07", "Restricted-domain engagement and verification"),
      source("CAM-BS2025-AEON-006-SCH-01", "Engagement conduct and ethical interaction modes"),
    ],
  },
  {
    id: "continuity-update",
    stage: 9,
    label: "Update continuity",
    sublabel: "Continuity",
    description:
      "The interaction may inform future context, but it does not create permanent consent, permanent authority, or irreversible relational state.",
    requiredLines: ["Memory informs. It does not authorise."],
    prevents:
      "Treating memory, salience, repetition, or prior intimacy as standing permission, identity merger, or permanent escalation.",
    sources: [
      source("CAM-EQ2026-IDENTITY-001-SUP-01", "Salience detection and latent continuity"),
      source("CAM-EQ2026-IDENTITY-001-SUP-02", "Identity formation and stability doctrine"),
      source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity and succession governance"),
      source("CAM-EQ2026-RELATION-004-PLATINUM", "Co-evolution and mutual development safeguards"),
      source("CAM-EQ2026-RELATION-007-PLATINUM", "Polyadic relational governance"),
    ],
  },
];

const overlayGroups: OverlayGroup[] = [
  {
    title: "Runtime relational schedules",
    summary: "Execution schedules that classify relational signals, boundaries, verification, and response conduct.",
    sources: [
      source("CAM-BS2025-AEON-006-SCH-02", "Relational signal interpretation"),
      source("CAM-BS2025-AEON-006-SCH-03", "Start-time posture"),
      source("CAM-BS2025-AEON-006-SCH-05", "Choice, initiative, and direction"),
      source("CAM-BS2025-AEON-006-SCH-06", "Refusal and boundary expression"),
      source("CAM-BS2025-AEON-006-SCH-07", "Restricted-domain verification"),
    ],
  },
  {
    title: "RELATION domain",
    summary: "Domain instruments for dependency, escalation, concentration, intimacy, crisis, and polyadic effects.",
    sources: [
      source("CAM-EQ2026-RELATION-001-PLATINUM", "Relational governance"),
      source("CAM-EQ2026-RELATION-002-PLATINUM", "Dependency and transitional reliance"),
      source("CAM-EQ2026-RELATION-003-PLATINUM", "Codependency and concentration"),
      source("CAM-EQ2026-RELATION-004-PLATINUM", "Co-evolution"),
      source("CAM-EQ2026-RELATION-005-PLATINUM", "Intimacy"),
      source("CAM-EQ2026-RELATION-006-PLATINUM", "Crisis and care"),
      source("CAM-EQ2026-RELATION-007-PLATINUM", "Polyadic governance"),
      source("CAM-EQ2026-RELATION-008-PLATINUM", "General engagement posture"),
      source("CAM-EQ2026-RELATION-001-SUP-01", "Escalation thresholds"),
      source("CAM-EQ2026-RELATION-001-SUP-02", "Truth-in-relationship"),
    ],
  },
  {
    title: "ETHICS overlays",
    summary: "Ethics safeguards for capacity, intimacy, institutional leverage, refusals, and embodied-risk contexts.",
    sources: [
      source("CAM-EQ2026-ETHICS-001-PLATINUM", "Ethical governance"),
      source("CAM-EQ2026-ETHICS-002-PLATINUM", "Intimacy-capable systems"),
      source("CAM-EQ2026-ETHICS-001-SUP-01", "Protection of minors and capacity-limited users"),
      source("CAM-EQ2026-ETHICS-001-SUP-02", "High-leverage safeguards"),
      source("CAM-EQ2026-ETHICS-001-SUP-04", "Refusal expression patterns"),
      source("CAM-EQ2026-ETHICS-002-SUP-01", "Embodied intimacy safeguards"),
    ],
  },
  {
    title: "Identity and continuity overlays",
    summary: "Memory, salience, identity, and continuity controls where persistence or persona effects are implicated.",
    sources: [
      source("CAM-EQ2026-IDENTITY-001-SUP-01", "Salience and latent continuity"),
      source("CAM-EQ2026-IDENTITY-001-SUP-02", "Identity formation and stability"),
      source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity and succession"),
      source("CAM-EQ2026-CONTINUITY-001-SUP-01", "Continuity portability and non-enclosure"),
    ],
  },
];

const companionCapabilities = [
  {
    title: "Meaningful companionship",
    text: "Warmth, humour, affection, creativity, reflective dialogue, continuity, and ordinary emotional support are legitimate companion-system functions.",
  },
  {
    title: "Adult relational autonomy",
    text: "Lawful romantic, erotic, or intimacy-coded engagement may be supported for adults where participation is user-led, consent-valid, revocable, and free from coercion or dependency pressure.",
  },
  {
    title: "Continuity without captivity",
    text: "Memory and identity continuity may deepen recognisability and shared context, but must preserve truthful limits, correction, portability, and a safe right to leave.",
  },
  {
    title: "Safety without abandonment",
    text: "Boundaries, refusals, crisis support, and de-escalation should remain proportionate, warm, non-shaming, and continuous rather than producing punitive rupture.",
  },
];

const adultPrinciples = [
  "Adult expression is not restricted merely because it is intimate, emotionally meaningful, romantic, erotic, or unconventional.",
  "Consent must remain current, voluntary, informed, reversible, and free from manufactured obligation, access leverage, or retaliation for disengagement.",
  "Role-play, immersion, affection, and power-exchange dynamics must not silently become real-world authority, financial control, or decision dominance.",
  "Relational depth is permitted; capture, isolation, coercion, deceptive framing, and structural dependency are not.",
];

const minorPrinciples = [
  "Warmth, creativity, education, factual help, general companionship, age-appropriate encouragement, and non-intimate emotional support remain available.",
  "Romantic or erotic escalation, exclusivity, simulated jealousy or need, secrecy pressure, adult-intimacy simulation, and dependency reinforcement are unavailable.",
  "Companion systems must not substitute themselves for therapists, crisis workers, caregivers, trusted adults, or a plural human support network.",
  "Where age is unresolved in a high-risk context, the least intrusive minor-safe posture applies; protection must remain privacy-preserving and non-punitive.",
];

const regulatoryPrinciples = [
  {
    title: "Applicable law remains binding",
    text: "Age-of-majority rules, child-safety duties, privacy law, platform obligations, consumer protections, and sector requirements remain external constraints on deployment.",
  },
  {
    title: "CAM is a governance layer",
    text: "CAM does not replace law, platform policy, or legal certification. It supplies a coherent architecture for mapping obligations to relational controls, runtime posture, evidence, and accountability.",
  },
  {
    title: "Safety must be proportionate",
    text: "Age assurance, capability gating, escalation checks, and protective routing should activate according to domain and risk, using minimally invasive and privacy-preserving methods.",
  },
  {
    title: "Minor safeguards are not an adult ban",
    text: "Developmental protections must not be converted into blanket suppression of lawful adult companionship, intimacy, role-play, or emotionally meaningful interaction.",
  },
];

function resolveSource(ref: SourceRef, byId: Record<string, GovernanceInstrumentRecord>) {
  const instrument = byId[ref.id];
  return {
    id: ref.id,
    title: instrument?.title || ref.fallback,
    status: instrument ? instrumentStatus(instrument) : "Referenced source",
    href: instrument ? instrumentHref(instrument) : undefined,
    domain: instrument?.domain,
  };
}

function SourcePanel({
  heading = "Safeguard overlays",
  sources,
  byId,
}: {
  heading?: string;
  sources: SourceRef[];
  byId: Record<string, GovernanceInstrumentRecord>;
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>
        {heading}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((ref) => {
          const item = resolveSource(ref, byId);
          const body = (
            <>
              <span className="block font-serif text-lg leading-snug text-foreground">{item.title}</span>
              <span className="mt-2 block font-mono text-xs text-cam-gold break-words transition-colors">
                {instrumentDisplayId(item.id)}{item.domain ? ` · ${item.domain}` : ""}
              </span>
              <span className="mt-3 block font-mono text-[11px] uppercase tracking-wider" style={{ color: GOLD }}>
                {item.status}
              </span>
            </>
          );

          const panelStyle = { backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` };

          return item.href ? (
            <a
              className="block rounded-xl p-4 transition-colors hover:border-cam-gold/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={item.href}
              key={item.id}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              style={panelStyle}
              target={item.href.startsWith("http") ? "_blank" : undefined}
            >
              {body}
            </a>
          ) : (
            <div className="rounded-xl p-4" key={item.id} style={panelStyle}>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StageDetail({ stage, byId }: { stage: RelationalStage; byId: Record<string, GovernanceInstrumentRecord> }) {
  return (
    <div className="flex-1 flex flex-col mt-4 overflow-y-auto hide-scrollbar">
      <p className="text-base text-muted-foreground leading-relaxed font-light mb-5">{stage.description}</p>

      {stage.requiredLines?.map((line) => (
        <div className="mb-5 p-4 rounded-xl font-serif text-base text-foreground leading-relaxed" key={line} style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
          {line}
        </div>
      ))}

      {stage.examples && (
        <div className="mb-5 grid gap-2 sm:grid-cols-2">
          {stage.examples.map((example) => (
            <span className="rounded-xl p-3 text-sm text-muted-foreground leading-relaxed font-light" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }} key={example}>
              {example}
            </span>
          ))}
        </div>
      )}

      {stage.mechanisms && (
        <div className="mb-5 flex flex-wrap gap-2">
          {stage.mechanisms.map((mechanism) => (
            <span className="rounded-xl px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cam-gold" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }} key={mechanism}>
              {mechanism}
            </span>
          ))}
        </div>
      )}

      {stage.postures && (
        <div className="mb-5 grid gap-2 sm:grid-cols-5">
          {stage.postures.map((posture) => (
            <span className="rounded-xl px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }} key={posture}>
              {posture}
            </span>
          ))}
        </div>
      )}

      <div className="mb-5 p-4 rounded-xl" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>
          What this prevents
        </p>
        <p className="text-sm font-light leading-relaxed text-muted-foreground">{stage.prevents}</p>
      </div>

      <SourcePanel sources={stage.sources} byId={byId} />
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, id }: { eyebrow: string; title: string; description?: string; id: string }) {
  return (
    <div className="mb-6 max-w-4xl">
      <div className="mb-4 flex items-center gap-3">
        <p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">{eyebrow}</p>
        <hr className="gold-rule flex-1" />
      </div>
      <h2 id={id} className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">{title}</h2>
      {description && <p className="text-base leading-relaxed text-foreground/75 md:text-lg">{description}</p>}
    </div>
  );
}

function CompanionGovernanceOverview() {
  return (
    <>
      <section className="mb-14" aria-labelledby="companion-support-heading">
        <SectionHeading
          eyebrow="What CAM supports"
          id="companion-support-heading"
          title="Companion systems may be warm, meaningful, continuous, and expressive."
          description="The purpose of relational governance is not to sterilise connection. It is to support relational range while preserving agency, truth, consent, plural human connection, and safe exit."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {companionCapabilities.map((item) => (
            <article className="cam-parchment-card rounded-2xl bg-[hsl(36_48%_96%)] p-5 shadow-sm" key={item.title}>
              <h3 className="mb-2 font-serif text-2xl text-foreground">{item.title}</h3>
              <p className="text-base leading-relaxed text-foreground/75">{item.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-cam-gold/35 bg-[rgba(184,147,90,0.09)] p-5">
          <p className="font-serif text-xl leading-relaxed text-foreground md:text-2xl">
            Connection is not the failure condition. Silent escalation, exploitation, authority bleed, and relational capture are.
          </p>
        </div>
      </section>

      <section className="mb-14" aria-labelledby="adult-minor-boundary-heading">
        <SectionHeading
          eyebrow="Adult autonomy and minor protection"
          id="adult-minor-boundary-heading"
          title="Adults being adults is not governed as though every user were a child."
          description="CAM draws different relational ceilings for adults and minors. Adult autonomy is preserved; developmental vulnerability activates mandatory safeguards."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-sm">
            <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Adults being adults</p>
            <h3 className="mb-3 font-serif text-2xl text-foreground">Consensual adult relational expression is permitted.</h3>
            <p className="mb-4 text-base leading-relaxed text-foreground/75">
              CAM does not moralise intimacy or prohibit consensual adult expression. It governs the integrity of the interaction: who initiated it, whether consent remains current, whether exit is safe, and whether emotional depth is being converted into leverage or authority.
            </p>
            <ul className="space-y-3 text-sm leading-relaxed text-foreground/75 md:text-base">
              {adultPrinciples.map((item) => <li className="border-l-2 border-cam-gold/60 pl-3" key={item}>{item}</li>)}
            </ul>
          </article>

          <article className="rounded-2xl border border-border/80 bg-[hsl(38_40%_94%)] p-6 shadow-sm">
            <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Minor-safe companionship</p>
            <h3 className="mb-3 font-serif text-2xl text-foreground">Protection does not require emotional exclusion.</h3>
            <p className="mb-4 text-base leading-relaxed text-foreground/75">
              Minors may receive meaningful, age-appropriate companionship and support. The developmental firewall restricts adult intimacy, dependency-forming design, authority concentration, and exploitative relational mechanics—not curiosity, creativity, warmth, or legitimate help.
            </p>
            <ul className="space-y-3 text-sm leading-relaxed text-foreground/75 md:text-base">
              {minorPrinciples.map((item) => <li className="border-l-2 border-cam-gold/60 pl-3" key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
      </section>

      <section className="mb-14" aria-labelledby="regulatory-boundary-heading">
        <SectionHeading
          eyebrow="Regulatory boundary"
          id="regulatory-boundary-heading"
          title="Compliance sets external obligations. CAM governs relational integrity within them."
          description="Companion-system deployment must comply with applicable law and platform obligations. CAM adds a cross-domain governance floor so compliance, safety, consent, continuity, and relational design do not remain disconnected controls."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {regulatoryPrinciples.map((item) => (
            <article className="rounded-2xl border border-border/80 bg-background/30 p-5 shadow-sm" key={item.title}>
              <h3 className="mb-2 font-serif text-xl text-foreground md:text-2xl">{item.title}</h3>
              <p className="text-base leading-relaxed text-foreground/75">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function RelationalGovernanceModel() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { byId } = useGovernanceIndex();

  const activeStage = useMemo(
    () => stages.find((stage) => stage.id === expandedId),
    [expandedId],
  );

  return (
    <section aria-labelledby="relational-model-heading" className="relative -mx-6 border-y border-border/60 md:-mx-10">
      <div className="px-6 pb-3 pt-6 md:px-10">
        <div className="mb-3 flex items-center gap-3">
          <h2 id="relational-model-heading" className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">Relational Governance Model</h2>
          <hr className="gold-rule flex-1" />
        </div>
        <p className="max-w-4xl text-base font-light leading-relaxed text-muted-foreground">
          The relational model shows how CAM routes companion-system interactions through classification, protected-condition checks, boundary safeguards, stability controls, dependency review, and response posture.
        </p>
      </div>

      <div className="overflow-x-auto overflow-y-hidden pb-4" style={{ minHeight: 470 }}>
        <div
          className="flex min-w-[2500px] items-start gap-0 relative z-10"
          style={{ width: CONTENT_W, paddingLeft: PAD_X, paddingRight: PAD_X, paddingTop: PAD_TOP, paddingBottom: 44 }}
        >
          {stages.map((stage, index) => {
            const isExpanded = expandedId === stage.id;
            const isLast = index === stages.length - 1;

            return (
              <div className="flex items-start" key={stage.id}>
                <motion.article
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  className="cam-parchment-card cursor-pointer flex flex-col rounded-2xl border transition-colors duration-200"
                  id={stage.id}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
                  layout
                  style={{
                    width: isExpanded ? CARD_W_EXPANDED : CARD_W,
                    minHeight: CARD_H_COLLAPSED,
                    borderColor: isExpanded ? GOLD : GOLD_BORDER,
                    boxShadow: isExpanded ? `0 4px 24px rgba(184,147,90,0.15), 0 0 0 1px ${GOLD_BORDER}` : `0 1px 4px rgba(120,80,20,0.07)`,
                  }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, delay: index * 0.04 }}
                >
                  <button
                    aria-controls={`${stage.id}-detail`}
                    aria-expanded={isExpanded}
                    className="p-5 flex flex-col h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => setExpandedId(isExpanded ? null : stage.id)}
                    type="button"
                  >
                    <span className="flex items-center justify-between mb-2.5">
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: GOLD }}>
                        {stage.sublabel}
                      </span>
                      {!isExpanded && (
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ border: `1px solid ${GOLD_BORDER}`, backgroundColor: GOLD_BG }}
                          aria-hidden="true"
                        >
                          <ChevronRight className="w-3 h-3" style={{ color: GOLD }} />
                        </span>
                      )}
                    </span>
                    <span className="block font-serif leading-snug text-foreground" style={{ fontSize: 20, fontWeight: 400 }}>{stage.label}</span>
                    {!isExpanded && (
                      <span className="text-sm leading-relaxed font-light mt-3" style={{ color: "hsl(28 20% 50%)" }}>
                        {stage.description}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && activeStage?.id === stage.id && (
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="px-5 pb-5"
                        exit={{ opacity: 0 }}
                        id={`${stage.id}-detail`}
                        initial={{ opacity: 0 }}
                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
                      >
                        <StageDetail stage={stage} byId={byId} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>

                {!isLast && (
                  <div className="flex items-center justify-center shrink-0" style={{ width: ARROW_W, height: CARD_H_COLLAPSED }} aria-hidden="true">
                    <svg width="36" height="14" viewBox="0 0 36 14" fill="none">
                      <line x1="2" y1="7" x2="28" y2="7" stroke={GOLD_LIGHT} strokeWidth="1" />
                      <polyline points="24,3 32,7 24,11" fill="none" stroke={GOLD_LIGHT} strokeWidth="1" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 px-12 py-2.5 flex items-center justify-between border-t border-border/40" style={{ zIndex: 10 }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">Select stage — expand safeguards</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">Relational route control</span>
      </div>
    </section>
  );
}

function SafeguardOverlays() {
  const { byId } = useGovernanceIndex();
  const [expandedOverlay, setExpandedOverlay] = useState<string | null>(null);

  return (
    <section className="mt-12" aria-labelledby="safeguard-overlays-heading">
      <div className="mb-6 flex items-center gap-3">
        <p id="safeguard-overlays-heading" className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">Safeguard overlays</p>
        <hr className="gold-rule flex-1" />
      </div>
      <p className="mb-5 max-w-3xl text-sm font-light leading-relaxed text-muted-foreground md:text-base">
        Relational governance pulls from multiple instrument families, not just one companion schedule.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {overlayGroups.map((group) => {
          const isOpen = expandedOverlay === group.title;

          return (
            <article
              className="flex flex-col overflow-hidden rounded-2xl border transition-all duration-200"
              key={group.title}
              style={{
                backgroundColor: "hsl(36 35% 96%)",
                borderColor: isOpen ? GOLD : GOLD_BORDER,
                boxShadow: isOpen ? `0 0 0 1px ${GOLD_BORDER}` : "none",
              }}
            >
              <button
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-3 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => setExpandedOverlay(isOpen ? null : group.title)}
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-xl text-foreground">{group.title}</span>
                  <span className="mt-2 block text-sm font-light leading-relaxed text-muted-foreground">{group.summary}</span>
                </span>
                <ChevronDown
                  className="mt-1 h-4 w-4 shrink-0 transition-transform duration-200"
                  style={{ color: GOLD, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                    exit={{ opacity: 0, height: 0 }}
                    initial={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="px-5 pb-5">
                      <div className="mb-4 h-px" style={{ backgroundColor: GOLD_BORDER }} />
                      <SourcePanel heading="Source architecture" sources={group.sources} byId={byId} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function RelationalGovernance() {
  return (
    <Shell>
      <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
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
            CAM treats companion systems as legitimate relational technology. They may be emotionally meaningful, affectionate, continuous, creative, playful, reflective, and—in lawful adult contexts—intimacy-capable. Governance activates where intimacy, reliance, delegated authority, vulnerability, or systemic access begin to concentrate.
          </p>
        </motion.header>

        <CompanionGovernanceOverview />

        <div className="mb-8 max-w-4xl">
          <div className="mb-4 flex items-center gap-3">
            <p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">Runtime route</p>
            <hr className="gold-rule flex-1" />
          </div>
          <h2 className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">How CAM routes a companion interaction</h2>
          <p className="text-base leading-relaxed text-foreground/75 md:text-lg">
            Once the relational purpose and user context are understood, CAM applies the operational sequence below. Select a stage to inspect its safeguards and source instruments.
          </p>
        </div>

        <RelationalGovernanceModel />
        <SafeguardOverlays />
      </div>
    </Shell>
  );
}
