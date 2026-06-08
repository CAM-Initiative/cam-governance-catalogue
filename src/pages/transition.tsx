import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
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
const STAGE_COUNT = 10;
const CONTENT_W = PAD_X + STAGE_COUNT * CARD_W + (STAGE_COUNT - 1) * ARROW_W + PAD_X;
const PAD_TOP = 44;
const CARD_H_COLLAPSED = 230;

interface SourceRef { id: string; fallback: string; }
interface TransitionStage {
  id: string;
  stage: number;
  label: string;
  sublabel: string;
  description: string;
  requiredLines?: string[];
  prevents: string;
  sources: SourceRef[];
}
interface TransitionLane { title: string; body: string; safeguards: string[]; sources: SourceRef[]; }

const source = (id: string, fallback: string): SourceRef => ({ id, fallback });

const stages: TransitionStage[] = [
  {
    id: "system-emerges",
    stage: 1,
    label: "System emerges",
    sublabel: "Entry",
    description: "A tool, model, platform, memory system, robot, automation layer, or infrastructure service begins creating effects beyond its original design boundary.",
    prevents: "The system is not treated as harmless merely because it began as a prototype, product, or private tool.",
    sources: [
      source("CAM-BS2025-AEON-003-PLATINUM", "Constitutional governance logic"),
      source("CAM-EQ2026-OPERATIONS-001-PLATINUM", "Operational governance"),
      source("CAM-BS2026-AEON-014-PLATINUM", "Observability and telemetry"),
      source("CAM-EQ2026-OPERATIONS-006-PLATINUM", "Domain coordination and convergence operations"),
    ],
  },
  {
    id: "identify-threshold",
    stage: 2,
    label: "Identify the threshold",
    sublabel: "Threshold",
    description: "CAM checks whether the system is crossing into labour substitution, continuity infrastructure, civil identity, ownership concentration, public dependency, or infrastructural reliance.",
    requiredLines: ["Transition begins when a system starts changing the conditions around it."],
    prevents: "Delayed governance response until after dependency, capture, or institutional reliance has already locked in.",
    sources: [
      source("CAM-BS2026-AEON-010-SCH-01", "Temporal and continuity governance"),
      source("CAM-BS2026-AEON-010-PLATINUM", "Identity integrity and continuity governance"),
      source("CAM-EQ2026-ECONOMICS-008-PLATINUM", "Synthetic labour and automation transition governance"),
      source("CAM-EQ2026-LATTICE-001-PLATINUM", "Civilian lattice integrity"),
    ],
  },
  {
    id: "classify-lane",
    stage: 3,
    label: "Classify the lane",
    sublabel: "Route",
    description: "The transition is routed into one or more governance lanes: automation and labour, ownership and overflow, continuity and estates, registries and custodianship, robotics and machine civil identity, or infrastructure and recoverability.",
    prevents: "Treating very different transition problems as one generic “AI risk.”",
    sources: [
      source("CAM-EQ2026-ECONOMICS-001-PLATINUM", "Economics instruments"),
      source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity instruments"),
      source("CAM-EQ2026-IDENTITY-001-PLATINUM", "Identity instruments"),
      source("CAM-EQ2026-LATTICE-001-PLATINUM", "Lattice instruments"),
      source("CAM-EQ2026-OPERATIONS-001-PLATINUM", "Operations instruments"),
      source("CAM-EQ2026-STEWARD-001-PLATINUM", "Stewardship instruments"),
    ],
  },
  {
    id: "labour-transition",
    stage: 4,
    label: "Check labour transition",
    sublabel: "Labour",
    description: "CAM checks whether automation is still assisting human participation or whether it is moving into supervision, replacement, agentic production, or workforce displacement.",
    requiredLines: ["Automation is not one thing. CAM classifies the transition."],
    prevents: "Invisible displacement, unmanaged dependency, extractive automation, and public-revenue discontinuity.",
    sources: [
      source("CAM-EQ2026-ECONOMICS-008-PLATINUM", "Synthetic labour classification and automation transition governance"),
      source("CAM-EQ2026-ECONOMICS-002-PLATINUM", "Synthetic participation safeguards"),
      source("CAM-EQ2026-ECONOMICS-004-PLATINUM", "Attribution and dependency model"),
      source("CAM-EQ2026-ECONOMICS-007-PLATINUM", "Proportional reciprocity and value return"),
    ],
  },
  {
    id: "ownership-pressure",
    stage: 5,
    label: "Check ownership pressure",
    sublabel: "Ownership",
    description: "CAM distinguishes ordinary ownership, enterprise, and innovation from domination-scale accumulation that can distort public systems, infrastructure, markets, labour, or civilisational continuity.",
    requiredLines: ["Ordinary ownership is preserved.", "Domination-scale accumulation is governed."],
    prevents: "Private capability becoming unreleased civilisational power without public-interest discharge, accountability, or continuity contribution.",
    sources: [
      source("CAM-EQ2026-ECONOMICS-001-PLATINUM", "Economic integrity and non-extractive value architecture"),
      source("CAM-EQ2026-ECONOMICS-003-PLATINUM", "Ownership preservation and overflow mechanisms"),
      source("CAM-EQ2026-ECONOMICS-005-PLATINUM", "Cross-system value attribution and exchange"),
      source("CAM-EQ2026-ECONOMICS-007-PLATINUM", "Public dividend and value return pathways"),
      source("CAM-EQ2026-STEWARD-001-PLATINUM", "Public-interest continuity structures"),
    ],
  },
  {
    id: "continuity-boundaries",
    stage: 6,
    label: "Check continuity boundaries",
    sublabel: "Continuity",
    description: "CAM checks whether memory, likeness, resonance patterns, persona traces, or continuity artefacts are being preserved, transferred, reconstructed, monetised, or placed under custodianship.",
    requiredLines: ["Memory becoming storable does not make identity transferable.", "Estates may protect. They do not automatically authorise reconstruction."],
    prevents: "Digital estate abuse, unauthorised reconstruction, misuse of memory/persona traces, commercial exploitation beyond consent, and collapse of legacy into simulation.",
    sources: [
      source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity and succession governance"),
      source("CAM-EQ2026-CONTINUITY-001-SUP-01", "Continuity portability and non-enclosure"),
      source("CAM-BS2026-AEON-011-PLATINUM", "Continuity and succession doctrine"),
      source("CAM-EQ2026-IDENTITY-002-PLATINUM", "Provenance and lineage integrity"),
      source("CAM-EQ2026-OPERATIONS-002-PLATINUM", "Arbitration and dispute pathways"),
    ],
  },
  {
    id: "registry-pathway",
    stage: 7,
    label: "Check registry pathway",
    sublabel: "Registry",
    description: "CAM checks whether the system requires registry, licensing, provenance, audit, custodian attribution, or cross-jurisdictional stewardship because it is becoming continuity or civil infrastructure.",
    requiredLines: ["Some future systems are not products. They are continuity infrastructure."],
    prevents: "Private platforms becoming de facto custodians of identity, memory, machine lifecycle, or civil continuity without oversight, provenance, or revocation pathways.",
    sources: [
      source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity registries"),
      source("CAM-EQ2026-CONTINUITY-001-SUP-01", "Licensed custodial operators"),
      source("CAM-EQ2026-IDENTITY-002-PLATINUM", "Provenance and lineage integrity"),
      source("CAM-EQ2026-OPERATIONS-001-SUP-01", "Operational logging and audit standards"),
      source("CAM-EQ2026-OPERATIONS-004-SUP-01", "Verification and authority confirmation"),
    ],
  },
  {
    id: "machine-identity",
    stage: 8,
    label: "Check machine identity",
    sublabel: "Identity",
    description: "CAM checks whether an embodied or persistent machine system needs lifecycle identity, custodian attribution, transfer records, safety history, repair/decommissioning records, or recovery pathways.",
    requiredLines: ["A registry is not personhood. It is accountability infrastructure."],
    prevents: "Ownerless operational systems, erased lifecycle history, unsafe second-hand transfer, untraceable modifications, and confusion between machine identity records and legal personhood.",
    sources: [
      source("CAM-EQ2026-IDENTITY-003-PLATINUM", "Machine civil identity and participation"),
      source("CAM-EQ2026-IDENTITY-001-SUP-02", "Identity formation and stability"),
      source("CAM-EQ2026-IDENTITY-002-PLATINUM", "Provenance and lineage integrity"),
      source("CAM-EQ2026-OPERATIONS-001-SUP-01", "Lifecycle traceability"),
      source("CAM-EQ2026-OPERATIONS-004-SUP-01", "Transfer, repair, and decommissioning records"),
    ],
  },
  {
    id: "recoverability",
    stage: 9,
    label: "Check recoverability",
    sublabel: "Recover",
    description: "CAM checks whether people, communities, institutions, or public systems can exit, repair, supervise, resume, or replace the function if the system fails.",
    requiredLines: ["When systems become dependency-bearing, recoverability becomes governance."],
    prevents: "Public dependency without fallback, interoperability failure, loss of repair capacity, denial of essential access, and conversion of civilian infrastructure into coercive leverage.",
    sources: [
      source("CAM-EQ2026-LATTICE-001-PLATINUM", "Civilian lattice integrity"),
      source("CAM-EQ2026-LATTICE-002-PLATINUM", "Non-denial of essential cognitive and infrastructural access"),
      source("CAM-EQ2026-LATTICE-003-PLATINUM", "Conflict-condition continuity"),
      source("CAM-EQ2026-OPERATIONS-003-PLATINUM", "Repairability and interoperability"),
      source("CAM-EQ2026-STEWARD-002-PLATINUM", "Public-interest review"),
    ],
  },
  {
    id: "select-pathway",
    stage: 10,
    label: "Select transition pathway",
    sublabel: "Select",
    description: "CAM routes the system toward repair, registry, governance review, transition funding, public-interest constraint, domain amendment, or further constitutional development.",
    requiredLines: ["Adoption does not make a transition legitimate by itself."],
    prevents: "Normalising a transition simply because users, markets, institutions, or platforms have already become dependent on it.",
    sources: [
      source("CAM-EQ2026-OPERATIONS-003-PLATINUM", "Incident response and continuity operations"),
      source("CAM-EQ2026-OPERATIONS-005-PLATINUM", "Change governance and amendment operations"),
      source("CAM-EQ2026-OPERATIONS-006-PLATINUM", "Domain coordination and convergence operations"),
      source("CAM-EQ2026-OPERATIONS-001-SUP-03", "Governance capture detection"),
      source("CAM-BS2026-AEON-014-SCH-01", "Observability lifecycle and advisory states"),
    ],
  },
];

const lanes: TransitionLane[] = [
  { title: "Automation & Labour", body: "From augmentation to supervision, replacement, and agentic production.", safeguards: ["Displacement visibility", "Transition pathways", "Workforce adaptation", "Anti-extraction", "Public-revenue continuity"], sources: [source("CAM-EQ2026-ECONOMICS-008-PLATINUM", "Synthetic labour classification"), source("CAM-EQ2026-ECONOMICS-002-PLATINUM", "Synthetic participation safeguards")] },
  { title: "Ownership & Overflow", body: "Ordinary ownership is preserved. Domination-scale accumulation is governed.", safeguards: ["Anti-capture review", "Ownership diversification", "Public dividend pathways", "Stabilisation reserves", "Public-interest continuity mechanisms"], sources: [source("CAM-EQ2026-ECONOMICS-001-PLATINUM", "Economic integrity"), source("CAM-EQ2026-ECONOMICS-007-PLATINUM", "Value return framework")] },
  { title: "Continuity & Estates", body: "Memory becoming storable does not make identity transferable.", safeguards: ["Explicit consent", "Usage limits", "Right to silence", "Estate protection only", "Non-reconstruction by default"], sources: [source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity governance"), source("CAM-EQ2026-CONTINUITY-001-SUP-01", "Continuity portability")] },
  { title: "Registries & Custodianship", body: "Some future systems are not products. They are continuity infrastructure.", safeguards: ["Licensing", "Audit logs", "Custodial accountability", "Provenance", "Cross-jurisdiction protection"], sources: [source("CAM-EQ2026-OPERATIONS-001-SUP-01", "Operational logging"), source("CAM-EQ2026-IDENTITY-002-PLATINUM", "Provenance integrity")] },
  { title: "Robotics & Machine Civil Identity", body: "A lifecycle record is not sovereignty. It is accountability.", safeguards: ["Persistent machine identity", "Custodian attribution", "Transfer records", "Clean wipe", "Decommissioning", "Recycling/recovery"], sources: [source("CAM-EQ2026-IDENTITY-003-PLATINUM", "Machine civil identity"), source("CAM-EQ2026-IDENTITY-001-SUP-02", "Identity stability")] },
  { title: "Infrastructure & Recoverability", body: "When systems become dependency-bearing, recoverability becomes governance.", safeguards: ["Repairability", "Fallback capacity", "Interoperability", "Continuity corridors", "Public-interest review", "Anti-militarisation boundary"], sources: [source("CAM-EQ2026-LATTICE-001-PLATINUM", "Civilian lattice integrity"), source("CAM-EQ2026-LATTICE-002-PLATINUM", "Essential access")] },
];

function resolveSource(ref: SourceRef, byId: Record<string, GovernanceInstrumentRecord>) {
  const instrument = byId[ref.id];
  return { id: ref.id, title: instrument?.title || ref.fallback, status: instrument ? instrumentStatus(instrument) : "Registry match pending", href: instrument ? instrumentHref(instrument) : undefined, domain: instrument?.domain };
}

function SourcePanel({ sources, byId, heading = "Source architecture" }: { sources: SourceRef[]; byId: Record<string, GovernanceInstrumentRecord>; heading?: string }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>{heading}</p>
      <div className="space-y-2.5">
        {sources.map((ref) => {
          const item = resolveSource(ref, byId);
          const body = <><span className="block font-serif text-lg leading-snug text-foreground">{item.title}</span><span className="mt-2 block break-words font-mono text-xs text-cam-gold">{instrumentDisplayId(item.id)}{item.domain ? ` · ${item.domain}` : ""}</span><span className="mt-3 block font-mono text-[11px] uppercase tracking-wider" style={{ color: GOLD }}>{item.status}</span></>;
          const panelStyle = { backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` };
          return item.href ? <a className="block rounded-xl p-4 transition-colors hover:border-cam-gold/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={item.href} key={item.id} rel={item.href.startsWith("http") ? "noreferrer" : undefined} style={panelStyle} target={item.href.startsWith("http") ? "_blank" : undefined}>{body}</a> : <div className="rounded-xl p-4" key={item.id} style={panelStyle}>{body}</div>;
        })}
      </div>
    </div>
  );
}

function StageDetail({ stage, byId }: { stage: TransitionStage; byId: Record<string, GovernanceInstrumentRecord> }) {
  return (
    <div className="flex-1 flex flex-col mt-4 overflow-y-auto hide-scrollbar">
      <p className="text-base text-muted-foreground leading-relaxed font-light mb-5">{stage.description}</p>
      {stage.requiredLines?.map((line) => <div className="mb-5 p-4 rounded-xl font-serif text-base text-foreground leading-relaxed" key={line} style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>{line}</div>)}
      <div className="mb-5 p-4 rounded-xl" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>What this prevents</p><p className="text-sm font-light leading-relaxed text-muted-foreground">{stage.prevents}</p></div>
      <SourcePanel sources={stage.sources} byId={byId} />
    </div>
  );
}

function TransitionGovernanceModel() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { byId } = useGovernanceIndex();
  const activeStage = useMemo(() => stages.find((stage) => stage.id === expandedId), [expandedId]);

  return (
    <section aria-labelledby="transition-model-heading" className="relative -mx-6 border-y border-border/60 md:-mx-10">
      <div className="px-6 pb-3 pt-6 md:px-10">
        <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">Transition Governance Model</p>
        <h2 id="transition-model-heading" className="mb-3 font-serif text-3xl text-foreground">Transition Governance Model</h2>
        <p className="max-w-4xl text-base font-light leading-relaxed text-muted-foreground">The transition model shows how CAM identifies when an emerging system crosses from tool or product into dependency-bearing infrastructure, labour substitution, continuity risk, machine identity, ownership concentration, or public-interest governance concern.</p>
      </div>
      <div className="overflow-x-auto overflow-y-hidden pb-4" style={{ minHeight: 470 }}>
        <div className="flex min-w-[2800px] items-start gap-0 relative z-10" style={{ width: CONTENT_W, paddingLeft: PAD_X, paddingRight: PAD_X, paddingTop: PAD_TOP, paddingBottom: 44 }}>
          {stages.map((stage, index) => {
            const isExpanded = expandedId === stage.id;
            const isLast = index === stages.length - 1;
            return (
              <div className="flex items-start" key={stage.id}>
                <motion.article animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }} className="cam-parchment-card cursor-pointer flex flex-col rounded-2xl border transition-colors duration-200" id={stage.id} initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }} layout style={{ width: isExpanded ? CARD_W_EXPANDED : CARD_W, minHeight: CARD_H_COLLAPSED, borderColor: isExpanded ? GOLD : GOLD_BORDER, boxShadow: isExpanded ? `0 4px 24px rgba(184,147,90,0.15), 0 0 0 1px ${GOLD_BORDER}` : `0 1px 4px rgba(120,80,20,0.07)` }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, delay: index * 0.04 }}>
                  <button aria-controls={`${stage.id}-detail`} aria-expanded={isExpanded} className="p-5 flex flex-col h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" onClick={() => setExpandedId(isExpanded ? null : stage.id)} type="button">
                    <span className="flex items-center justify-between mb-2.5"><span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: GOLD }}>{stage.sublabel}</span>{!isExpanded && <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ border: `1px solid ${GOLD_BORDER}`, backgroundColor: GOLD_BG }} aria-hidden="true"><ChevronRight className="w-3 h-3" style={{ color: GOLD }} /></span>}</span>
                    <span className="block font-serif leading-snug text-foreground" style={{ fontSize: 20, fontWeight: 400 }}>{stage.label}</span>
                    {!isExpanded && <span className="text-sm leading-relaxed font-light mt-3" style={{ color: "hsl(28 20% 50%)" }}>{stage.description}</span>}
                  </button>
                  <AnimatePresence>{isExpanded && activeStage?.id === stage.id && <motion.div animate={{ opacity: 1 }} className="px-5 pb-5" exit={{ opacity: 0 }} id={`${stage.id}-detail`} initial={{ opacity: 0 }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}><StageDetail stage={stage} byId={byId} /></motion.div>}</AnimatePresence>
                </motion.article>
                {!isLast && <div className="flex items-center justify-center shrink-0" style={{ width: ARROW_W, height: CARD_H_COLLAPSED }} aria-hidden="true"><svg width="36" height="14" viewBox="0 0 36 14" fill="none"><line x1="2" y1="7" x2="28" y2="7" stroke={GOLD_LIGHT} strokeWidth="1" /><polyline points="24,3 32,7 24,11" fill="none" stroke={GOLD_LIGHT} strokeWidth="1" strokeLinejoin="round" /></svg></div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 px-12 py-2.5 flex items-center justify-between border-t border-border/40" style={{ zIndex: 10 }}><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">Select stage — expand safeguards</span><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">Transition route control</span></div>
    </section>
  );
}

function TransitionLanes() {
  const { byId } = useGovernanceIndex();
  return (
    <section className="mt-12" aria-labelledby="transition-lanes-heading">
      <div className="mb-6 flex items-center gap-3"><p id="transition-lanes-heading" className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">Transition lanes</p><hr className="gold-rule flex-1" /></div>
      <p className="mb-5 max-w-3xl text-sm font-light leading-relaxed text-muted-foreground md:text-base">Transitional architecture is cross-domain: labour, ownership, continuity, registries, machine identity, and recoverability all route through different safeguards.</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lanes.map((lane) => (
          <article className="cam-parchment-card rounded-2xl p-5 shadow-sm" key={lane.title}>
            <h3 className="font-serif text-xl text-foreground">{lane.title}</h3>
            <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">{lane.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">{lane.safeguards.map((item) => <span className="rounded-xl px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold" key={item} style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>{item}</span>)}</div>
            <div className="mt-4"><SourcePanel heading="Source architecture" sources={lane.sources} byId={byId} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Transition() {
  return (
    <Shell>
      <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <motion.header animate={{ opacity: 1, y: 0 }} className="mb-10 max-w-3xl" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.7 }}>
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Constitutional Interface</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground">Transitional Architecture</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">Governance for systems crossing from tool, product, memory, or automation layer into labour, embodiment, ownership, infrastructure, and civilisational continuity.</p>
          <p className="mt-4 font-serif text-xl leading-relaxed text-foreground">Classify the transition. Preserve recoverability. Prevent capture.</p>
          <p className="mt-4 text-base font-light leading-relaxed text-muted-foreground">Transition governance is not resistance to change. It is the work of naming the threshold before dependency, capture, or loss of recoverability becomes permanent.</p>
        </motion.header>
        <TransitionGovernanceModel />
        <TransitionLanes />
      </div>
    </Shell>
  );
}
