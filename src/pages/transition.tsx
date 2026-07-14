import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
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

interface SourceRef { id: string; fallback: string; }
interface TransitionLane {
  id: string;
  label: string;
  eyebrow: string;
  summary: string;
  prevents: string;
  considerations: string[];
  sources: SourceRef[];
}

const source = (id: string, fallback: string): SourceRef => ({ id, fallback });

const lanes: TransitionLane[] = [
  {
    id: "frontier-jurisdiction",
    label: "Frontier AI & Jurisdictional Fragmentation",
    eyebrow: "Sovereign variation",
    summary:
      "Frontier systems develop across uneven legal regimes, product categories, model-release practices, institutional settings, and public-risk domains before shared governance expectations stabilise.",
    prevents:
      "Treating jurisdictional fragmentation as either a reason for no coordination or a mandate to override sovereign authority without higher-order justification.",
    considerations: ["Respect sovereign jurisdiction", "Identify cross-border effects", "Escalate only where continuity, dignity, or civilian protection constraints justify arbitration"],
    sources: [
      source("CAM-BS2025-AEON-003-PLATINUM", "Constitutional governance logic"),
      source("CAM-EQ2026-OPERATIONS-005-PLATINUM", "Change governance and amendment operations"),
      source("CAM-EQ2026-OPERATIONS-006-PLATINUM", "Domain coordination and convergence operations"),
      source("CAM-EQ2026-STEWARD-002-PLATINUM", "Public-interest review"),
    ],
  },
  {
    id: "automation-labour",
    label: "Automation, Robotics & Labour Transition",
    eyebrow: "Synthetic labour",
    summary:
      "Robotics, automation layers, agentic production, and synthetic labour can move from augmentation into supervision, substitution, displacement, and public-revenue disruption.",
    prevents:
      "Invisible displacement, unmanaged dependency, extractive automation, and loss of public participation in the benefits of capability gains.",
    considerations: ["Classify augmentation vs replacement", "Preserve workforce adaptation pathways", "Track reciprocity and value return"],
    sources: [
      source("CAM-EQ2026-ECONOMICS-008-PLATINUM", "Synthetic labour and automation transition governance"),
      source("CAM-EQ2026-ECONOMICS-002-PLATINUM", "Synthetic participation safeguards"),
      source("CAM-EQ2026-ECONOMICS-004-PLATINUM", "Attribution and dependency model"),
      source("CAM-EQ2026-ECONOMICS-007-PLATINUM", "Proportional reciprocity and value return"),
    ],
  },
  {
    id: "ownership-concentration",
    label: "Ownership, Wealth & Power Concentration",
    eyebrow: "Distribution",
    summary:
      "Frontier capability can preserve innovation and enterprise, but it can also concentrate ownership, data control, labour power, infrastructure access, and strategic leverage at domination scale.",
    prevents:
      "Capability gains becoming unreleased civilisational power without public-interest discharge, accountability, distribution, or continuity contribution.",
    considerations: ["Preserve ordinary ownership", "Govern domination-scale accumulation", "Route overflow into public-interest continuity mechanisms"],
    sources: [
      source("CAM-EQ2026-ECONOMICS-001-PLATINUM", "Economic integrity and non-extractive value architecture"),
      source("CAM-EQ2026-ECONOMICS-003-PLATINUM", "Ownership preservation and overflow mechanisms"),
      source("CAM-EQ2026-ECONOMICS-007-PLATINUM", "Public dividend and value return pathways"),
      source("CAM-EQ2026-STEWARD-001-PLATINUM", "Public-interest continuity structures"),
    ],
  },
  {
    id: "civilian-lattice",
    label: "Civilian Lattice & Infrastructure Continuity",
    eyebrow: "Recoverability",
    summary:
      "Civilian digital infrastructure, AI services, communications, identity systems, payments, cloud platforms, and future robotics networks can become dependency-bearing systems and points of coercive leverage.",
    prevents:
      "State or platform weaponisation of essential civilian infrastructure, denial of access, interoperability failure, and loss of repair or fallback capacity.",
    considerations: ["Protect civilian access", "Maintain fallback and repair capacity", "Separate public infrastructure from coercive leverage"],
    sources: [
      source("CAM-EQ2026-LATTICE-001-PLATINUM", "Civilian lattice integrity"),
      source("CAM-EQ2026-LATTICE-002-PLATINUM", "Non-denial of essential cognitive and infrastructural access"),
      source("CAM-EQ2026-LATTICE-003-PLATINUM", "Conflict-condition continuity"),
      source("CAM-EQ2026-OPERATIONS-003-PLATINUM", "Repairability and interoperability"),
    ],
  },
  {
    id: "continuity-identity",
    label: "Continuity, Identity & Registries",
    eyebrow: "Custodianship",
    summary:
      "Memory systems, persona traces, machine lifecycle records, custodial registries, and identity infrastructure can become continuity infrastructure before law, consent, and accountability mechanisms are settled.",
    prevents:
      "Private platforms becoming de facto custodians of memory, identity, machine lifecycle, or civil continuity without provenance, revocation, audit, or custodial accountability.",
    considerations: ["Memory is not automatic authority", "Registry is accountability infrastructure", "Custodianship requires provenance and exit"],
    sources: [
      source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity and succession governance"),
      source("CAM-EQ2026-CONTINUITY-001-SUP-01", "Continuity portability and non-enclosure"),
      source("CAM-EQ2026-IDENTITY-002-PLATINUM", "Provenance and lineage integrity"),
      source("CAM-EQ2026-IDENTITY-003-PLATINUM", "Machine civil identity and participation"),
    ],
  },
  {
    id: "long-horizon-integration",
    label: "Long-Horizon Civilisational Integration",
    eyebrow: "Stewardship",
    summary:
      "Disruptive systems can become embedded in public life before civic participation, institutional adaptation, continuity planning, and constitutional learning have caught up.",
    prevents:
      "Normalising transitions simply because markets, platforms, states, or users have already become dependent on them.",
    considerations: ["Preserve public participation", "Keep recoverability before lock-in", "Route unresolved tensions into constitutional review"],
    sources: [
      source("CAM-EQ2026-STEWARD-001-PLATINUM", "Public-interest continuity structures"),
      source("CAM-EQ2026-STEWARD-003-PLATINUM", "Long-horizon stewardship"),
      source("CAM-BS2026-AEON-014-SCH-01", "Observability lifecycle and advisory states"),
      source("CAM-EQ2026-OPERATIONS-001-SUP-03", "Governance capture detection"),
    ],
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

function SourcePanel({ sources, byId }: { sources: SourceRef[]; byId: Record<string, GovernanceInstrumentRecord> }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>Source architecture</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {sources.map((ref) => {
          const item = resolveSource(ref, byId);
          const body = <><span className="block font-serif text-base leading-snug text-foreground">{item.title}</span><span className="mt-2 block break-words font-mono text-[11px] text-cam-gold">{instrumentDisplayId(item.id)}{item.domain ? ` · ${item.domain}` : ""}</span><span className="mt-2 block font-mono text-[10px] uppercase tracking-wider" style={{ color: GOLD }}>{item.status}</span></>;
          const panelStyle = { backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` };
          return item.href ? <a className="block rounded-xl p-3 transition-colors hover:border-cam-gold/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={item.href} key={item.id} rel={item.href.startsWith("http") ? "noreferrer" : undefined} style={panelStyle} target={item.href.startsWith("http") ? "_blank" : undefined}>{body}</a> : <div className="rounded-xl p-3" key={item.id} style={panelStyle}>{body}</div>;
        })}
      </div>
    </div>
  );
}

export default function Transition() {
  const [expandedLane, setExpandedLane] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { byId } = useGovernanceIndex();

  return (
    <Shell>
      <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <motion.header animate={{ opacity: 1, y: 0 }} className="mb-10 max-w-3xl" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.7 }}>
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Constitutional Interface</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground">Transitional Architecture</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">Governance for systems crossing from tool, product, memory, or automation layer into labour, embodiment, ownership, infrastructure, and civilisational continuity.</p>
          <p className="mt-4 font-mono text-sm uppercase tracking-[0.18em] text-cam-gold">Classify the transition. Preserve recoverability. Prevent capture.</p>
        </motion.header>

        <section className="mb-12 rounded-3xl p-6 shadow-sm md:p-8" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-cam-gold">Central thesis</p>
          <h2 className="mb-4 font-serif text-3xl leading-tight text-foreground">Transitional Architecture</h2>
          <div className="space-y-4 text-base font-light leading-relaxed text-muted-foreground md:text-lg">
            <p>Transitional Architecture governs the period where disruptive technologies become embedded in labour, infrastructure, identity, ownership, public dependency, and civilisational continuity before institutions have fully adapted.</p>
            <p className="text-foreground/85">Transition governance is not resistance to change. It is the work of preserving recoverability, accountability, distribution, and civic continuity while disruptive systems become part of society.</p>
            <p>CAM respects sovereign jurisdictional authority. However, the framework recognises that certain global or civilisational risks may require arbitration where sovereign interests conflict with higher-order continuity, dignity, or civilian protection constraints.</p>
          </div>
        </section>

        <section aria-labelledby="transition-map-heading">
          <div className="mb-6 flex items-center gap-3">
            <h2 id="transition-map-heading" className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">Long-Horizon Transition Map</h2>
            <hr className="gold-rule flex-1" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lanes.map((lane) => {
              const isOpen = expandedLane === lane.id;
              return (
                <article
                  className="flex flex-col overflow-hidden rounded-2xl border transition-all duration-200"
                  key={lane.id}
                  style={{ backgroundColor: "hsl(36 35% 96%)", borderColor: isOpen ? GOLD : GOLD_BORDER, boxShadow: isOpen ? `0 4px 24px rgba(184,147,90,0.15), 0 0 0 1px ${GOLD_BORDER}` : "0 1px 4px rgba(120,80,20,0.07)" }}
                >
                  <button
                    aria-expanded={isOpen}
                    className="flex min-h-64 w-full flex-col p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => setExpandedLane(isOpen ? null : lane.id)}
                    type="button"
                  >
                    <span className="mb-3 flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>{lane.eyebrow}</span>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ border: `1px solid ${GOLD_BORDER}`, backgroundColor: GOLD_BG }}>
                        <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ color: GOLD, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </span>
                    </span>
                    <span className="block font-serif text-2xl leading-snug text-foreground">{lane.label}</span>
                    <span className="mt-4 block flex-1 text-sm font-light leading-relaxed text-muted-foreground">{lane.summary}</span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div animate={{ opacity: 1, height: "auto" }} className="overflow-hidden" exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}>
                        <div className="px-5 pb-5">
                          <div className="mb-4 h-px" style={{ backgroundColor: GOLD_BORDER }} />
                          <div className="mb-5 rounded-xl p-4" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
                            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>What this prevents</p>
                            <p className="text-sm font-light leading-relaxed text-muted-foreground">{lane.prevents}</p>
                          </div>
                          <div className="mb-5 flex flex-wrap gap-2">
                            {lane.considerations.map((item) => (
                              <span className="rounded-xl px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold" key={item} style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>{item}</span>
                            ))}
                          </div>
                          <SourcePanel sources={lane.sources} byId={byId} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </Shell>
  );
}
