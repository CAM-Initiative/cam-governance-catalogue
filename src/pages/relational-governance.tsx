import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  instrumentDisplayId,
  instrumentHref,
  instrumentStatus,
  useGovernanceIndex,
  type GovernanceInstrumentRecord,
} from "@/lib/governanceRegistry";

const GOLD = "#B8935A";
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

function resolveSource(ref: SourceRef, byId: Record<string, GovernanceInstrumentRecord>) {
  const instrument = byId[ref.id];
  return {
    id: ref.id,
    title: instrument?.title || ref.fallback,
    status: instrument ? instrumentStatus(instrument) : "Registry match pending",
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
    <div className="rounded-xl p-4" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>
        {heading}
      </p>
      <div className="space-y-2.5">
        {sources.map((ref) => {
          const item = resolveSource(ref, byId);
          const body = (
            <>
              <span className="block font-serif text-base leading-snug text-foreground">{item.title}</span>
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                {instrumentDisplayId(item.id)}{item.domain ? ` · ${item.domain}` : ""} · {item.status}
              </span>
            </>
          );

          return item.href ? (
            <a
              className="block rounded-lg border border-cam-gold/20 bg-card/60 px-3 py-2 transition-colors hover:border-cam-gold/45 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={item.href}
              key={item.id}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              target={item.href.startsWith("http") ? "_blank" : undefined}
            >
              {body}
            </a>
          ) : (
            <div className="rounded-lg border border-cam-gold/20 bg-card/60 px-3 py-2" key={item.id}>
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
    <div className="flex flex-1 flex-col overflow-y-auto hide-scrollbar">
      <p className="mb-4 text-base font-light leading-relaxed text-muted-foreground">{stage.description}</p>

      {stage.requiredLines?.map((line) => (
        <div className="mb-3 rounded-xl p-3 font-serif text-base leading-relaxed text-foreground" key={line} style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
          {line}
        </div>
      ))}

      {stage.examples && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {stage.examples.map((example) => (
            <span className="rounded-lg border border-cam-gold/20 bg-card/60 px-3 py-2 text-sm text-muted-foreground" key={example}>
              {example}
            </span>
          ))}
        </div>
      )}

      {stage.mechanisms && (
        <div className="mb-4 flex flex-wrap gap-2">
          {stage.mechanisms.map((mechanism) => (
            <span className="rounded-full border border-cam-gold/25 bg-[rgba(184,147,90,0.10)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-cam-gold" key={mechanism}>
              {mechanism}
            </span>
          ))}
        </div>
      )}

      {stage.postures && (
        <div className="mb-4 grid gap-2 sm:grid-cols-5">
          {stage.postures.map((posture) => (
            <span className="rounded-lg border border-cam-gold/25 bg-[rgba(184,147,90,0.10)] px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold" key={posture}>
              {posture}
            </span>
          ))}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-border bg-background/35 p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>
          What this prevents
        </p>
        <p className="text-sm font-light leading-relaxed text-muted-foreground">{stage.prevents}</p>
      </div>

      <SourcePanel sources={stage.sources} byId={byId} />
    </div>
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
        <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">Relational Governance Model</p>
        <h2 id="relational-model-heading" className="mb-3 font-serif text-3xl text-foreground">Relational Governance Model</h2>
        <p className="max-w-4xl text-base font-light leading-relaxed text-muted-foreground">
          The relational model shows how CAM routes companion-system interactions through classification, protected-condition checks, boundary safeguards, stability controls, dependency review, and response posture.
        </p>
      </div>

      <div className="overflow-x-auto overflow-y-hidden pb-4" style={{ minHeight: 470 }}>
        <div
          className="relative z-10 flex min-w-[2500px] items-start gap-0"
          style={{ width: CONTENT_W, paddingLeft: PAD_X, paddingRight: PAD_X, paddingTop: PAD_TOP, paddingBottom: 44 }}
        >
          {stages.map((stage, index) => {
            const isExpanded = expandedId === stage.id;
            const isLast = index === stages.length - 1;

            return (
              <div className="flex items-start" key={stage.id}>
                <motion.article
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  className="cam-parchment-card flex flex-col rounded-2xl border transition-colors duration-200"
                  id={stage.id}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
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
                    className="flex h-full min-h-[inherit] w-full flex-col p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => setExpandedId(isExpanded ? null : stage.id)}
                    type="button"
                  >
                    <span className="mb-3 flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>
                        Stage {stage.stage} · {stage.sublabel}
                      </span>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: isExpanded ? GOLD : GOLD_LIGHT }} aria-hidden="true" />
                    </span>
                    <span className="block font-serif text-2xl leading-tight text-foreground">{stage.label}</span>
                    {!isExpanded && (
                      <span className="mt-3 block text-sm font-light leading-relaxed text-muted-foreground">
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
                  <div className="flex shrink-0 items-center justify-center" style={{ width: ARROW_W, height: CARD_H_COLLAPSED }} aria-hidden="true">
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

      <div className="flex items-center justify-between border-t border-border/40 px-6 py-2.5 md:px-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">Select stage — expand safeguards</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">Relational route control</span>
      </div>
    </section>
  );
}

function SafeguardOverlays() {
  const { byId } = useGovernanceIndex();

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
        {overlayGroups.map((group) => (
          <article className="cam-parchment-card rounded-2xl p-5 shadow-sm" key={group.title}>
            <h3 className="font-serif text-xl text-foreground">{group.title}</h3>
            <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">{group.summary}</p>
            <div className="mt-4">
              <SourcePanel heading="Source architecture" sources={group.sources} byId={byId} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function RelationalGovernance() {
  return (
    <Shell>
      <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 max-w-3xl"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Constitutional Interface</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground">Relational Governance for Companion Systems</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            CAM routes relational signals through consent, boundary, stability, dependency, ethics, and continuity safeguards before response posture is selected.
          </p>
          <p className="mt-4 font-serif text-xl leading-relaxed text-foreground">
            Warmth without capture. Continuity without authority. Presence without dependency.
          </p>
        </motion.div>

        <RelationalGovernanceModel />
        <SafeguardOverlays />
      </div>
    </Shell>
  );
}
