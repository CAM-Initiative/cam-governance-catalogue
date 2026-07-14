import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ChevronDown } from "lucide-react";
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

const GOLD_BG = "rgba(184,147,90,0.06)";

const constitutionalStack = [
  {
    id: "layer-00",
    layer: "00",
    label: "Substrate",
    color: "#8A6427",
    groupKey: "substrateLaws",
    description: "The broadest civilisational constraints: protected domains, non-commodification, sovereign loops, and relational sovereignty. Every lower layer must remain compatible with these invariants.",
    specificity: "Least explicit · highest-order constraints",
  },
  {
    id: "layer-01",
    layer: "01",
    label: "Constitution",
    color: "#69518F",
    groupKey: "constitution",
    description: "The supreme constitutional framework establishing authority, legitimacy, stewardship, continuity, ethical floors, jurisdiction, and the conditions under which governance may validly operate.",
    specificity: "Constitutional authority and governing invariants",
  },
  {
    id: "layer-02",
    layer: "02",
    label: "Annexes",
    color: "#3F708B",
    groupKey: "annexes",
    description: "Constitutional extensions that open major governance areas such as runtime logic, ethics, contribution recognition, identity, security, epistemic integrity, and observability.",
    specificity: "Major constitutional domains and constraints",
  },
  {
    id: "layer-03",
    layer: "03",
    label: "Domain Charters",
    color: "#3F7B61",
    groupKey: "domainCharters",
    description: "Specialised governance for security, relationships, mental privacy, economics, continuity, operations, arbitration, civilian infrastructure, identity, and stewardship.",
    specificity: "Problem-specific governance and domain duties",
  },
  {
    id: "layer-04",
    layer: "04",
    label: "Runtime Schedules",
    color: "#9B5B2E",
    groupKey: "runtimeSchedules",
    description: "Sequenced execution requirements translating constitutional constraints into classification, routing, arbitration, posture, tool use, refusal, containment, and review behaviour.",
    specificity: "Operational sequencing and runtime execution",
  },
  {
    id: "layer-05",
    layer: "05",
    label: "Supporting Instruments",
    color: "#87473F",
    groupKey: "supporting",
    description: "The most explicit layer: appendices, supplements, taxonomies, standards, operational procedures, metadata rules, assurance records, and implementation guidance.",
    specificity: "Most explicit · implementation and assurance detail",
  },
] as const;

const pyramidWidths = [18, 34, 50, 66, 82, 100];

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
    return <p className="text-sm font-light leading-relaxed text-muted-foreground">The governance registry is temporarily unavailable in this preview.</p>;
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
              <ChevronDown
                className="mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform"
                style={{ color: layerColor, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                  exit={{ opacity: 0, height: 0 }}
                  initial={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="mx-3 mb-2 rounded-b-xl px-3 py-3 text-sm font-light leading-relaxed text-muted-foreground"
                    style={{ backgroundColor: `${layerColor}08`, borderLeft: `2px solid ${layerColor}30` }}
                  >
                    {description && <p>{description}</p>}
                    {href ? (
                      <a
                        className="mt-3 block break-words font-mono text-[11px] uppercase tracking-[0.14em] text-cam-gold transition-colors hover:text-foreground"
                        href={href}
                        rel={href.startsWith("http") ? "noreferrer" : undefined}
                        target={href.startsWith("http") ? "_blank" : undefined}
                      >
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

export default function Constitution() {
  const [activeLayerId, setActiveLayerId] = useState("layer-00");
  const [expandedInstrument, setExpandedInstrument] = useState<string | null>(null);
  const { instruments, loading, error } = useGovernanceIndex();
  const groups = useMemo(() => groupGovernanceInstruments(instruments), [instruments]);

  useEffect(() => {
    warnForUngroupedConstitutionInstruments(groups);
  }, [groups]);

  const activeLayer = constitutionalStack.find((layer) => layer.id === activeLayerId) ?? constitutionalStack[0];

  function instrumentsForLayer(groupKey: GovernanceGroupKey): GovernanceInstrumentRecord[] {
    return groups[groupKey];
  }

  function selectLayer(layerId: string) {
    setActiveLayerId(layerId);
    setExpandedInstrument(null);
  }

  return (
    <Shell>
      <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-14 max-w-3xl"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Aeon Tier Governance</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground md:text-5xl">The Constitution</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            The supreme governing architecture for advanced intelligence systems. Broad civilisational constraints become increasingly explicit through constitutional, domain, runtime, and supporting instruments.
          </p>
        </motion.div>

        <section className="mb-16" aria-labelledby="governance-stack-heading">
          <motion.div
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-3"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">Governance Stack</p>
            <hr className="gold-rule flex-1" />
          </motion.div>

          <div className="mb-8 max-w-4xl">
            <h2 id="governance-stack-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">From broad constitutional principle to explicit implementation.</h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              The stack begins with the least specific, most general constraints. Each lower layer adds interpretation, domain context, execution logic, and implementation detail without overriding the layers above it.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card/45 p-5 shadow-sm md:p-8">
            <div className="mb-5 grid items-center gap-3 text-center sm:grid-cols-[1fr_auto_1fr] sm:text-left">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/50">Broad constitutional principle</p>
              <div className="flex items-center justify-center gap-2 text-cam-gold" aria-hidden="true">
                <ArrowDown className="h-4 w-4" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">Increasing specificity</span>
                <ArrowDown className="h-4 w-4" />
              </div>
              <p className="text-right font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/50 sm:block">Explicit implementation</p>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="mx-auto grid w-full min-w-[620px] max-w-3xl justify-items-center gap-[3px] py-2">
                {constitutionalStack.map((layer, index) => {
                  const isActive = layer.id === activeLayer.id;
                  const width = pyramidWidths[index];
                  const previousWidth = index === 0 ? 0 : pyramidWidths[index - 1];
                  const topInset = ((width - previousWidth) / (2 * width)) * 100;

                  return (
                    <motion.button
                      animate={{ opacity: isActive ? 1 : 0.84 }}
                      aria-pressed={isActive}
                      className="group relative flex min-h-[68px] items-center justify-center overflow-hidden px-5 py-3 text-center text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cam-gold/35"
                      key={layer.id}
                      onClick={() => selectLayer(layer.id)}
                      style={{
                        width: `${width}%`,
                        backgroundColor: layer.color,
                        clipPath: `polygon(${topInset}% 0%, ${100 - topInset}% 0%, 100% 100%, 0% 100%)`,
                        filter: isActive ? `drop-shadow(0 5px 9px ${layer.color}55)` : "none",
                      }}
                      transition={{ duration: 0.18 }}
                      type="button"
                    >
                      <span>
                        <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75">Layer {layer.layer}</span>
                        <span className="block font-serif text-base leading-tight sm:text-xl">{layer.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.article
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-2xl border bg-[hsl(36_35%_96%)] p-5 shadow-sm md:p-7"
                exit={{ opacity: 0, y: 6 }}
                initial={{ opacity: 0, y: 6 }}
                key={activeLayer.id}
                style={{ borderColor: `${activeLayer.color}70` }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid gap-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
                  <div>
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: activeLayer.color }}>Layer {activeLayer.layer}</p>
                        <h3 className="font-serif text-3xl leading-tight text-foreground">{activeLayer.label}</h3>
                      </div>
                      <span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: activeLayer.color }} aria-hidden="true" />
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground md:text-base">{activeLayer.description}</p>
                    <p className="rounded-xl border px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/60" style={{ borderColor: `${activeLayer.color}35`, backgroundColor: `${activeLayer.color}08` }}>
                      {activeLayer.specificity}
                    </p>
                  </div>

                  <div className="min-w-0 border-t border-border/70 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                    <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/65">Instruments in this layer</p>
                    <div className="max-h-[460px] overflow-y-auto pr-1">
                      <InstrumentList
                        instruments={instrumentsForLayer(activeLayer.groupKey)}
                        layerColor={activeLayer.color}
                        expandedInstrument={expandedInstrument}
                        onToggle={(id) => setExpandedInstrument(expandedInstrument === id ? null : id)}
                        loading={loading}
                        error={error}
                        showDomain={activeLayer.groupKey === "domainCharters" || activeLayer.groupKey === "supporting"}
                      />
                    </div>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </section>

        <div className="-mx-6 md:-mx-10" id="runtime-model">
          <RuntimeModelContent />
        </div>
      </div>
    </Shell>
  );
}
