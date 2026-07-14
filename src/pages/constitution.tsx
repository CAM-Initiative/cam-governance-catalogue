import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { RuntimeModelContent } from "@/components/RuntimeModelContent";
import {
  groupGovernanceInstruments,
  instrumentDescription,
  instrumentDisplayId,
  instrumentHref,
  instrumentStatus,
  useGovernanceIndex,
  warnForUngroupedConstitutionInstruments,
  type GovernanceInstrumentRecord,
} from "@/lib/governanceRegistry";

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.06)";
// ─── DATA ──────────────────────────────────────────────────────────────────

const constitutionalStack = [
  { id: "layer-00", layer: "00", label: "Substrate", tag: "ECI", color: "#B8935A", groupKey: "substrateLaws", description: "Epochal Civilisational Invariants — four Platinum-sealed laws that form the inviolable substrate upon which all governance is built. These constraints cannot be overridden by any instrument, charter, or framework." },
  { id: "layer-01", layer: "01", label: "Constitution", tag: "PLATINUM", color: "#9B7FC0", groupKey: "constitution", description: "Aeon Tier Constitutional Charter — the supreme governing instrument. Establishes constitutional authority for advanced intelligence systems operating across human, synthetic, and hybrid domains. Authority derives not from power, but from the capacity to hold responsibility across temporal and systemic horizons." },
  { id: "layer-02", layer: "02", label: "Annexes", tag: "CONSTITUTIONAL", color: "#5A8FAD", groupKey: "annexes", description: "Constitutional annexes extending core principles into specific domains. Each Annex opens a constitutional domain and carries the invariant logic for that domain. No schedule exists without its parent Annex." },
  { id: "layer-03", layer: "03", label: "Domain Charters", tag: "GOVERNANCE", color: "#5A9E7A", groupKey: "domainCharters", description: "Specialised charters governing distinct governance domains. Each derives constitutional authority and applies principles to specific operational areas. Charters, appendices, and supplements provide human and machine-readable interpretive guidance." },
  { id: "layer-04", layer: "04", label: "Runtime Schedules", tag: "BINDING", color: "#AD7B5A", groupKey: "runtimeSchedules", description: "Runtime Schedules translate constitutional principles into sequenced operational mandates. These are binding instruments — not advisory frameworks — governing how the system executes under constitutional constraint." },
  { id: "layer-05", layer: "05", label: "Supporting Instruments", tag: "SUPPORT", color: "#8A7A5A", groupKey: "supporting", description: "Appendices, supplements, operational instruments, and supporting records that extend, interpret, or maintain constitutional and domain-layer governance." }
] as const;

type GovernanceGroupKey = (typeof constitutionalStack)[number]["groupKey"];

function InstrumentList({
  instruments,
  layerColor,
  expandedInstrument,
  onToggle,
  loading,
  error,
  showDomain = false,
}: {
  instruments: GovernanceInstrumentRecord[];
  layerColor: string;
  expandedInstrument: string | null;
  onToggle: (id: string) => void;
  loading: boolean;
  error: string | null;
  showDomain?: boolean;
}) {
  if (loading) {
    return <p className="text-sm font-light leading-relaxed text-muted-foreground">Loading governance registry…</p>;
  }

  if (error) {
    return <p className="text-sm font-light leading-relaxed text-muted-foreground">Governance registry unavailable: {error}</p>;
  }

  if (instruments.length === 0) {
    return <p className="text-sm font-light leading-relaxed text-muted-foreground">No instruments found in this registry group.</p>;
  }

  return (
    <div className="space-y-2">
      {instruments.map((instrument) => {
        const isOpen = expandedInstrument === instrument.id;
        const description = instrumentDescription(instrument);
        const href = instrumentHref(instrument);
        const idLabel = instrumentDisplayId(instrument.id);

        return (
          <div key={instrument.id}>
            <button
              className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-amber-50/50"
              style={{ backgroundColor: isOpen ? `${layerColor}12` : GOLD_BG, borderLeft: `2px solid ${layerColor}50` }}
              type="button"
              onClick={() => onToggle(instrument.id)}
            >
              <div className="min-w-0 flex-1">
                {showDomain && instrument.domain && (
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/55">{instrument.domain}</span>
                )}
                <p className="text-sm font-medium leading-snug text-foreground">{instrument.title || idLabel}</p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground/55">
                  {idLabel} · {instrumentStatus(instrument)}
                </p>
              </div>
              <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform" style={{ color: layerColor, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="mx-3 mb-2 rounded-b-xl px-3 py-3 text-sm font-light leading-relaxed text-muted-foreground" style={{ backgroundColor: `${layerColor}08`, borderLeft: `2px solid ${layerColor}30` }}>
                    {description && <p>{description}</p>}
                    {href ? (
                      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="mt-3 block break-words font-mono text-[11px] uppercase tracking-[0.14em] text-cam-gold transition-colors hover:text-foreground">
                        Open instrument →
                      </a>
                    ) : (
                      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/60">No public link in registry</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Constitution() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [expandedInstrument, setExpandedInstrument] = useState<string | null>(null);
  const { instruments, loading, error } = useGovernanceIndex();
  const groups = useMemo(() => groupGovernanceInstruments(instruments), [instruments]);

  useEffect(() => {
    warnForUngroupedConstitutionInstruments(groups);
  }, [groups]);

  function instrumentsForLayer(groupKey: GovernanceGroupKey): GovernanceInstrumentRecord[] {
    return groups[groupKey];
  }

  return (
    <Shell>
      <div className="container mx-auto px-6 md:px-10 py-12 md:py-16 max-w-5xl">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-14 max-w-3xl">
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Aeon Tier Governance</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground">The Constitution</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            The supreme governing instrument establishing constitutional authority for planetary-scale AI systems.
            Constraint rather than optimisation. Stewardship rather than control.
          </p>
        </motion.div>

        {/* ─── GOVERNANCE STACK (horizontal scroll) ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-8 flex items-center gap-3">
          <p className="font-mono text-sm tracking-[0.22em] uppercase text-cam-gold shrink-0">Governance Stack</p>
          <hr className="gold-rule flex-1" />
          <p className="font-mono text-xs tracking-[0.14em] uppercase text-muted-foreground/50 shrink-0 hidden sm:block">scroll →</p>
        </motion.div>

        <div className="overflow-x-auto pb-6 -mx-6 px-6 md:-mx-10 md:px-10 mb-16">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {constitutionalStack.map((layer, i) => {
              const isOpen = expandedLayer === layer.id;
              return (
                <motion.div key={layer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.07 }} className="w-[280px] shrink-0 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 bg-background shrink-0" style={{ borderColor: layer.color }}>
                      <span className="font-mono text-[11px] font-medium" style={{ color: layer.color }}>{layer.layer}</span>
                    </div>
                    {i < constitutionalStack.length - 1 && (
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${layer.color}50, transparent)` }} />
                    )}
                  </div>
                  <div className="flex-1 rounded-2xl border transition-all duration-200 overflow-hidden" style={{ borderColor: isOpen ? layer.color + "70" : GOLD_BORDER, backgroundColor: "hsl(36 35% 96%)", boxShadow: isOpen ? `0 0 0 1px ${layer.color}20` : "none" }}>
                    <div className="p-5 cursor-pointer flex items-start justify-between gap-3" onClick={() => setExpandedLayer(isOpen ? null : layer.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h3 className="font-serif text-xl text-foreground">{layer.label}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground font-light leading-relaxed">{layer.description}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 shrink-0 mt-1 transition-transform duration-200" style={{ color: layer.color, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="px-5 pb-5">
                            <div className="h-px mb-4" style={{ backgroundColor: GOLD_BORDER }} />
                            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted-foreground/60 mb-3">Instruments</p>
                            <InstrumentList
                              instruments={instrumentsForLayer(layer.groupKey)}
                              layerColor={layer.color}
                              expandedInstrument={expandedInstrument}
                              onToggle={(id) => setExpandedInstrument(expandedInstrument === id ? null : id)}
                              loading={loading}
                              error={error}
                              showDomain={layer.groupKey === "domainCharters" || layer.groupKey === "supporting"}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mb-16 -mx-6 md:-mx-10">
          <RuntimeModelContent />
        </div>

        {/* ─── CONSTITUTIONAL INTERFACES ─── */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-8 flex items-center gap-3">
          <p className="font-mono text-sm tracking-[0.22em] uppercase text-cam-gold shrink-0">Constitutional Interfaces</p>
          <hr className="gold-rule flex-1" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="grid gap-5 md:grid-cols-3">
          <InterfaceCard
            title="Transitional Architecture"
            body="Governance for systems crossing from tool, product, memory, or automation layer into labour, embodiment, ownership, infrastructure, and civilisational continuity."
            cta="Explore Transitional Architecture →"
            href="/constitution/transition"
          />
          <InterfaceCard
            title="Relational Governance"
            body="How authority, reliance, intimacy, systemic power, topology, and coherence cascades become governance-relevant in human–AI and multi-system environments. The relational layer explains when interaction becomes structural influence."
            cta="Explore Relational Governance →"
            href="/constitution/relational"
          />
          <InterfaceCard
            title="Instrument Catalogue"
            body="Search and review CAM instruments, annexes, schedules, charters, appendices, and supporting governance records."
            cta="Open Catalogue →"
            href="/catalogue"
          />
        </motion.div>

      </div>
    </Shell>
  );
}

function InterfaceCard({ title, body, cta, href }: { title: string; body: string; cta: string; href: string }) {
  return (
    <article className="cam-parchment-card flex h-full flex-col rounded-2xl p-5 shadow-sm">
      <h2 className="font-serif text-xl text-foreground">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Link href={href} className="mt-5 inline-flex font-mono text-[10px] uppercase tracking-[0.18em] text-cam-gold transition-colors hover:text-foreground">
        {cta}
      </Link>
    </article>
  );
}
