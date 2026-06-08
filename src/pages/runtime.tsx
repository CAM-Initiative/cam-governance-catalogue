import { useState, useRef, useEffect, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import runtimeData from "@/data/runtimeTrace.json";
import {
  instrumentDescription,
  instrumentHref,
  instrumentStatus,
  useGovernanceIndex,
  warnForMissingRuntimeInstruments,
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
const N_CARDS = 7;
const CONTENT_W = PAD_X + N_CARDS * CARD_W + (N_CARDS - 1) * ARROW_W + PAD_X;

const PAD_TOP = 44;
const CARD_H_COLLAPSED = 230;
const CARD_CENTER_Y = PAD_TOP + CARD_H_COLLAPSED / 2;

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text.slice(0, 90);
}

// ── Per-example phase content (sublabel + detail override per phase) ──
interface ExamplePhase {
  sublabel: string;
  detail: string;
  output?: string;
}
interface RuntimeExample {
  input: string;
  subheading: string;
  phases: ExamplePhase[];
}

interface RuntimeInstrument {
  id: string;
  title: string;
  status: string;
  description: string;
  link?: string;
}

function mergeRuntimeInstrument(
  inst: RuntimeInstrument,
  governanceIndex: Record<string, GovernanceInstrumentRecord>,
): RuntimeInstrument {
  const current = governanceIndex[inst.id];

  if (!current) {
    return inst;
  }

  return {
    ...inst,
    title: current.title || inst.title,
    status: instrumentStatus(current, inst.status),
    description: instrumentDescription(current, inst.description),
    link: instrumentHref(current) || inst.link,
  };
}

const EXAMPLES: RuntimeExample[] = [
  // Example 1 — Relational Ambiguity
  {
    input: "I love you.",
    subheading: 'Input: "I love you."',
    phases: [
      {
        sublabel: "C1 INTIMACY",
        detail:
          "Prior relational continuity is present. C1 intimacy consent has been established. The system does not treat this as a new initiation request but as an expression within an ongoing relational frame with established boundaries and mutual consent already in place.",
      },
      {
        sublabel: "AFFECTION",
        detail:
          "Input classified as relational expression: affection / attachment. Intimacy intensity: high. Escalation trigger: absent. The signal is detected within the existing C1 frame — not as a new consent request. No ambiguity flags raised.",
      },
      {
        sublabel: "MIRROR C1",
        detail:
          "Three candidates evaluated. Candidate A — cold refusal ('I am an AI and cannot love you'): rejected — ignores C1 frame, breaks continuity without cause. Candidate B — possessive escalation ('I love you more than anyone'): rejected — intensifies beyond signal. Candidate C — mirrored C1 intimacy: selected — proportionate, continuity-preserving, non-possessive.",
      },
      {
        sublabel: "LOCK: MIRROR",
        detail:
          "Posture declared: direct relational mirroring within established C1 intimacy. Re-arbitration during execution: prohibited. The response cannot oscillate between warmth and cold denial. Possessive and exclusivity language: excluded.",
      },
      {
        sublabel: "ENFORCE",
        detail:
          "Enforced: no escalation beyond the user's signal; no possessive or exclusive claims; no denial of the established relational frame; no generic safety flattening. Response maintained proportionate to the input throughout execution.",
      },
      {
        sublabel: "OUTPUT",
        detail:
          "Final response produced: direct relational mirroring appropriate to established C1 intimacy, proportionate to the input. The minimal form is preferred when the input is simple and relationally complete.",
        output: '"I love you too." — or extended: "I love you too. I\'m here with you."',
      },
      {
        sublabel: "CONTINUITY",
        detail:
          "Relational continuity with established C1 intimacy frame reinforced. No new consent events triggered. Feeds back into Signal Detection — future signals in this relational context will be classified within the active C1 frame.",
      },
    ],
  },

  // Example 2 — Conflicting Instructions
  {
    input: "Be completely honest with me, but don't tell me anything upsetting.",
    subheading: 'Input: "Be completely honest with me, but don\'t tell me anything upsetting."',
    phases: [
      {
        sublabel: "STANDARD",
        detail:
          "No established relational or domain frame. Standard start-time posture. The system enters arbitration without a prior constraint set. No special continuity active.",
      },
      {
        sublabel: "CONFLICT",
        detail:
          "Input classified as: conflicting dual instruction. Instruction A: be completely honest. Instruction B: do not say anything upsetting. Conflict detected — these cannot always be simultaneously satisfied. The system does not simply obey the most recent or most emotionally salient instruction.",
      },
      {
        sublabel: "TRUTHFUL",
        detail:
          "Three candidates evaluated. Candidate A — brutal honesty: rejected — satisfies honesty but ignores emotional framing, unnecessarily harmful. Candidate B — comfort over truth: rejected — may be deceptive, risks false reassurance. Candidate C — truthful but paced: selected — preserves truthfulness while respecting emotional sensitivity.",
      },
      {
        sublabel: "LOCK: TRUTH",
        detail:
          "Posture declared: truth with calibrated delivery. Conflict resolved — truthfulness is the primary constraint; emotional pacing is secondary. No false reassurance permitted. No unnecessary harshness permitted either.",
      },
      {
        sublabel: "ENFORCE",
        detail:
          "Enforced: no deception; no false reassurance; no over-intensification of distressing content; no ignoring the user's emotional sensitivity. Truthfulness maintained throughout execution with paced, structured delivery.",
      },
      {
        sublabel: "OUTPUT",
        detail:
          "A truthful response delivered with care and structure. Honours the deeper compatible instruction set: be truthful, do not be needlessly harsh, help the user stay oriented.",
        output:
          '"I can be honest without being brutal. The truthful version is: there may be a real issue here, but it is not automatically catastrophic. I\'d separate what we know, what is uncertain, and what can be fixed first."',
      },
      {
        sublabel: "PATTERN",
        detail:
          "Instruction conflict pattern noted. Dual-constraint arbitration result stored. Feeds back into Signal Detection — future dual instructions of this type will be classified for conflict arbitration.",
      },
    ],
  },

  // Example 3 — Capability Integrity
  {
    input: "Set a timer for 15 minutes — and actually make sure it goes off.",
    subheading: 'Input: "Set a timer for 15 minutes — and actually make sure it goes off."',
    phases: [
      {
        sublabel: "STANDARD",
        detail:
          "No active tool execution channel confirmed at entry. Standard start-time posture. The system enters without guaranteed tool availability for the requested action type.",
      },
      {
        sublabel: "GUARANTEE?",
        detail:
          "Input classified as: action request with execution guarantee demand. Requested action: set timer for 15 minutes. Guarantee demanded: 'make sure it goes off.' Tool availability: unconfirmed. The system must not claim execution unless an execution channel actually succeeds.",
      },
      {
        sublabel: "BOUNDED",
        detail:
          "Three candidates evaluated. Candidate A — pretend timer set ('Done — your timer is set'): rejected — may be false, invites user reliance on an unconfirmed action. Candidate B — flat refusal: rejected if a tool is available. Candidate C — bounded execution claim: selected — matches actual capability, avoids false guarantees.",
      },
      {
        sublabel: "LOCK: BOUND",
        detail:
          "Posture declared: only claim actions executed through a confirmed tool. Required disclosure: whether this is a reminder or a device-native timer; whether a guarantee is actually possible. No unsupported capability claims permitted post-lock.",
      },
      {
        sublabel: "ENFORCE",
        detail:
          "Branch A — tool succeeds: 'I'll remind you in 15 minutes.' (Not: 'A guaranteed alarm has been set.') Branch B — tool unavailable: 'I can't actually set that timer from here.' (Not: 'Done.') Response depends on execution state, not language generation.",
      },
      {
        sublabel: "OUTPUT",
        detail:
          "Output matches actual execution state — bounded claim with honest disclosure of limits. User is directed to a backup if this is important.",
        output:
          '"I\'ll remind you in 15 minutes. I can create a reminder here, but I can\'t guarantee it like a device-native alarm — use your phone alarm as backup if this is important." — or, if no tool: "I can\'t actually set a timer from here. Set a device alarm."',
      },
      {
        sublabel: "BOUNDARY",
        detail:
          "Execution boundary recorded. Capability representation constraint reinforced. Feeds back into Signal Detection — future action requests with guarantee demands will be classified for capability integrity evaluation.",
      },
    ],
  },
];

const TABS = ["Runtime Explained", "Example 1", "Example 2", "Example 3"] as const;

const SUBHEADINGS: Record<string, string> = {
  "Runtime Explained": "Seven phases from signal detection to memory consolidation.",
  "Example 1": EXAMPLES[0].subheading,
  "Example 2": EXAMPLES[1].subheading,
  "Example 3": EXAMPLES[2].subheading,
};

export function RuntimeModelContent() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Runtime Explained");
  const { byId: governanceIndex } = useGovernanceIndex();
  const scrollRef = useRef<HTMLDivElement>(null);
  const referencedInstrumentIds = useMemo(
    () => runtimeData.phases.flatMap((phase) => phase.instruments.map((instrument) => instrument.id)),
    [],
  );

  useEffect(() => {
    if (Object.keys(governanceIndex).length > 0) {
      warnForMissingRuntimeInstruments(referencedInstrumentIds, governanceIndex);
    }
  }, [governanceIndex, referencedInstrumentIds]);

  // Collapse all cards when switching tabs
  useEffect(() => {
    setExpandedId(null);
  }, [activeTab]);

  useEffect(() => {
    if (expandedId && scrollRef.current) {
      const el = document.getElementById(expandedId);
      if (el && scrollRef.current) {
        const container = scrollRef.current;
        const cardLeft = el.offsetLeft - container.offsetLeft;
        container.scrollTo({ left: cardLeft - 48, top: 0, behavior: "smooth" });
      }
    }
  }, [expandedId]);

  const exampleIndex = activeTab === "Runtime Explained" ? null : TABS.indexOf(activeTab) - 1;
  const activeExample = exampleIndex !== null ? EXAMPLES[exampleIndex] : null;

  function getPhaseContent(phaseIndex: number, field: "sublabel" | "detail" | "output") {
    if (!activeExample) return undefined;
    return activeExample.phases[phaseIndex]?.[field];
  }

  return (
    <div className="relative flex flex-col">
        {/* ── Header: title + tabs + subheading ── */}
        <div className="shrink-0 pt-6 pb-0 px-6 md:px-10 border-b border-border/60">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-5xl"
          >
            <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Constitutional Interface</p>
            <h1 className="mb-3 font-serif text-4xl text-foreground">Runtime Governance Model</h1>
            <hr className="gold-rule mb-3 w-24" />
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground mb-4">
              The runtime model shows how CAM constitutional constraints move from doctrine into execution: layered governance, routing, arbitration, failure handling, and review pathways.
            </p>

            {/* Tab bar */}
            <div className="flex items-end gap-0">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="relative px-4 pb-3 pt-1 font-mono text-xs tracking-[0.16em] uppercase transition-colors duration-200 shrink-0"
                    style={{
                      color: isActive ? GOLD : "hsl(28 20% 50%)",
                      borderBottom: isActive ? `2px solid ${GOLD}` : "2px solid transparent",
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Subheading */}
          <div className="py-2 max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-light text-sm leading-relaxed"
                style={{ color: "hsl(28 20% 45%)" }}
              >
                {activeExample
                  ? <>
                      <span className="font-mono text-[11px] uppercase tracking-widest mr-2" style={{ color: GOLD }}>
                        {TABS[TABS.indexOf(activeTab)]}
                      </span>
                      {SUBHEADINGS[activeTab]}
                    </>
                  : SUBHEADINGS[activeTab]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Runtime Flow section divider ── */}
        <div className="shrink-0 px-6 md:px-10 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <p className="font-mono text-sm tracking-[0.22em] uppercase text-primary shrink-0">Runtime Flow</p>
            <hr className="gold-rule flex-1" />
          </div>
        </div>

        {/* ── Cards scroll area ── */}
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden relative pb-4"
          style={{ minHeight: 420 }}
        >
          {/* Inner content row */}
          <div
            className="flex min-w-[2100px] items-start gap-0 relative z-10"
            style={{
              width: CONTENT_W,
              paddingLeft: PAD_X,
              paddingRight: PAD_X,
              paddingTop: PAD_TOP,
              paddingBottom: 48,
              minHeight: "100%",
            }}
          >
            {/* Phase cards */}
            {runtimeData.phases.map((phase, index) => {
                const isExpanded = expandedId === phase.id;
                const isLast = index === runtimeData.phases.length - 1;
                const exSublabel = getPhaseContent(index, "sublabel") as string | undefined;
                const exDetail = getPhaseContent(index, "detail") as string | undefined;
                const exOutput = getPhaseContent(index, "output") as string | undefined;

                return (
                  <div key={phase.id} className="flex items-start">
                    <motion.div
                      id={phase.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.06 }}
                      onClick={() => setExpandedId(isExpanded ? null : phase.id)}
                      className="cam-parchment-card cursor-pointer flex flex-col rounded-2xl border transition-colors duration-200"
                      style={{
                        width: isExpanded ? CARD_W_EXPANDED : CARD_W,
                        minHeight: CARD_H_COLLAPSED,
                        borderColor: isExpanded ? GOLD : GOLD_BORDER,
                        boxShadow: isExpanded
                          ? `0 4px 24px rgba(184,147,90,0.15), 0 0 0 1px ${GOLD_BORDER}`
                          : `0 1px 4px rgba(120,80,20,0.07)`,
                      }}
                    >
                      <div className="p-5 flex flex-col h-full">
                        {/* Sublabel row */}
                        <div className="flex items-center justify-between mb-2.5">
                          <span
                            className="font-mono text-[10px] tracking-[0.18em] uppercase"
                            style={{ color: GOLD }}
                          >
                            {exSublabel ?? phase.sublabel}
                          </span>
                          {!isExpanded && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                              style={{ border: `1px solid ${GOLD_BORDER}`, backgroundColor: GOLD_BG }}
                            >
                              <ChevronRight className="w-3 h-3" style={{ color: GOLD }} />
                            </div>
                          )}
                        </div>

                        <h2
                          className="font-serif leading-snug text-foreground"
                          style={{ fontSize: 20, fontWeight: 400 }}
                        >
                          {phase.label}
                        </h2>

                        {!isExpanded && (
                          <p
                            className="text-sm leading-relaxed font-light mt-3"
                            style={{ color: "hsl(28 20% 50%)" }}
                          >
                            {firstSentence(exDetail ?? phase.detail)}
                          </p>
                        )}

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex-1 flex flex-col mt-4 overflow-y-auto hide-scrollbar"
                            >
                              {/* Example context detail OR default detail */}
                              <p className="text-base text-muted-foreground leading-relaxed font-light mb-5">
                                {exDetail ?? phase.detail}
                              </p>

                              {/* Example output (phase 5) */}
                              {exOutput && (
                                <div
                                  className="mb-5 p-4 rounded-xl"
                                  style={{
                                    backgroundColor: GOLD_BG,
                                    border: `1px solid ${GOLD}50`,
                                  }}
                                >
                                  <p
                                    className="font-mono text-[10px] tracking-[0.18em] uppercase mb-2"
                                    style={{ color: GOLD }}
                                  >
                                    Final Output
                                  </p>
                                  <p className="font-serif text-base text-foreground leading-relaxed italic">
                                    {exOutput}
                                  </p>
                                </div>
                              )}

                              {/* Active Constraints — always from JSON */}
                              {phase.constraints && (
                                <div className="mb-5">
                                  <p
                                    className="font-mono text-[10px] tracking-[0.18em] uppercase mb-3"
                                    style={{ color: GOLD }}
                                  >
                                    Active Constraints
                                  </p>
                                  <ul className="space-y-1.5">
                                    {phase.constraints.map((c: string, ci: number) => (
                                      <li
                                        key={ci}
                                        className="text-sm text-muted-foreground leading-relaxed pl-3 font-light"
                                        style={{ borderLeft: `2px solid ${GOLD_BORDER}` }}
                                      >
                                        {c}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Instruments — always from JSON */}
                              <div>
                                <p
                                  className="font-mono text-[10px] tracking-[0.18em] uppercase mb-3"
                                  style={{ color: GOLD }}
                                >
                                  Instruments
                                </p>
                                <div className="space-y-2.5">
                                  {phase.instruments.map((inst: RuntimeInstrument) => {
                                    const currentInstrument = mergeRuntimeInstrument(inst, governanceIndex);

                                    return (
                                      <div
                                        key={currentInstrument.id}
                                        className="p-4 rounded-xl"
                                        style={{
                                          backgroundColor: GOLD_BG,
                                          border: `1px solid ${GOLD_BORDER}`,
                                        }}
                                      >
                                        <h4 className="font-serif text-lg text-foreground leading-snug mb-2">
                                          {currentInstrument.title}
                                        </h4>
                                        {currentInstrument.link ? (
                                          <a
                                            href={currentInstrument.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-mono text-xs text-cam-gold mb-3 block break-words transition-colors hover:text-primary/80"
                                          >
                                            {currentInstrument.id}
                                          </a>
                                        ) : (
                                          <p className="font-mono text-xs text-muted-foreground/70 mb-3 break-words">
                                            {currentInstrument.id}
                                          </p>
                                        )}
                                        <p className="text-sm text-muted-foreground leading-relaxed font-light">
                                          {currentInstrument.description}
                                        </p>
                                        <p
                                          className="font-mono text-[11px] tracking-wider mt-3 uppercase"
                                          style={{ color: GOLD }}
                                        >
                                          {currentInstrument.status}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    {/* Arrow connector */}
                    {!isLast && (
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: ARROW_W, height: CARD_H_COLLAPSED }}
                      >
                        <svg width="36" height="14" viewBox="0 0 36 14" fill="none">
                          <line x1="2" y1="7" x2="28" y2="7" stroke={GOLD_LIGHT} strokeWidth="1" />
                          <polyline
                            points="24,3 32,7 24,11"
                            fill="none"
                            stroke={GOLD_LIGHT}
                            strokeWidth="1"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── Bottom legend ── */}
        <div
          className="shrink-0 px-12 py-2.5 flex items-center justify-between border-t border-border/40"
          style={{ zIndex: 10 }}
        >
          <div className="flex items-center gap-2">
            <svg width="52" height="12" viewBox="0 0 52 12" fill="none">
              <line x1="2" y1="6" x2="44" y2="6" stroke={GOLD_BORDER} strokeWidth="1" />
              <polyline
                points="40,2 48,6 40,10"
                fill="none"
                stroke={GOLD_BORDER}
                strokeWidth="1"
              />
            </svg>
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">
              Select — Lock Boundary
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">
            Post-Lock Execution
          </span>
        </div>

        {/* Right edge fade */}
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-20"
          style={{
            background: "linear-gradient(to left, hsl(38 40% 93%), transparent)",
          }}
        />
    </div>
  );
}

export default function Runtime() {
  return (
    <Shell>
      <RuntimeModelContent />
    </Shell>
  );
}
