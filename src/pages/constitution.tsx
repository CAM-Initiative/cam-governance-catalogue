import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowRight, ChevronDown } from "lucide-react";
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

const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.06)";

const constitutionalStack = [
  {
    id: "layer-00",
    layer: "00",
    label: "Substrate",
    color: "#8A6427",
    groupKey: "substrateLaws",
    description: "The broadest civilisational constraints: protected domains, non-commodification, sovereign loops, and relational sovereignty. Every lower layer must remain compatible with these invariants.",
  },
  {
    id: "layer-01",
    layer: "01",
    label: "Constitution",
    color: "#69518F",
    groupKey: "constitution",
    description: "The supreme constitutional framework establishing authority, legitimacy, stewardship, continuity, ethical floors, jurisdiction, and the conditions under which governance may validly operate.",
  },
  {
    id: "layer-02",
    layer: "02",
    label: "Annexes",
    color: "#3F708B",
    groupKey: "annexes",
    description: "Constitutional extensions that open major governance areas such as runtime logic, ethics, contribution recognition, identity, security, epistemic integrity, and observability.",
  },
  {
    id: "layer-03",
    layer: "03",
    label: "Domain Charters",
    color: "#3F7B61",
    groupKey: "domainCharters",
    description: "Specialised governance for security, relationships, mental privacy, economics, continuity, operations, arbitration, civilian infrastructure, identity, and stewardship.",
  },
  {
    id: "layer-04",
    layer: "04",
    label: "Runtime Schedules",
    color: "#9B5B2E",
    groupKey: "runtimeSchedules",
    description: "Sequenced execution requirements translating constitutional constraints into classification, routing, arbitration, posture, tool use, refusal, containment, and review behaviour.",
  },
  {
    id: "layer-05",
    layer: "05",
    label: "Supporting Instruments",
    color: "#87473F",
    groupKey: "supporting",
    description: "The most explicit layer: appendices, supplements, taxonomies, standards, operational procedures, metadata rules, assurance records, and implementation guidance.",
  },
] as const;

const pyramidWidths = ["32%", "45%", "58%", "71%", "84%", "97%"];

type GovernanceGroupKey = (typeof constitutionalStack)[number]["groupKey"];

const interfaceGroups = [
  {
    id: "operate",
    label: "How systems operate",
    description: "Decision-making, authority, security, compliance, execution, and accountability.",
    topics: [
      {
        title: "Runtime decisions and system behaviour",
        body: "How signals are classified, competing obligations are resolved, tools are invoked, posture is selected, and actions are represented truthfully.",
        href: "#runtime-model",
        cta: "Explore the runtime model",
      },
      {
        title: "Compliance, audit and incident response",
        body: "How constitutional duties become operating controls, logs, escalation pathways, regulatory interfaces, incident response, and repair operations.",
        href: "/catalogue",
        cta: "Browse operations instruments",
      },
      {
        title: "Authority, sovereignty and arbitration",
        body: "How competing instructions, institutions, jurisdictions, governance stacks, and authority claims are resolved without manufacturing legitimacy.",
        href: "/catalogue",
        cta: "Browse arbitration instruments",
      },
      {
        title: "Security, integrity and boundary control",
        body: "How data, identity, context, capability, provenance, and sovereign environments remain protected under adversarial, degraded, or untrusted conditions.",
        href: "/catalogue",
        cta: "Browse security instruments",
      },
    ],
  },
  {
    id: "protect",
    label: "What CAM protects",
    description: "People, relationships, identity, cognition, contribution, and safe participation.",
    topics: [
      {
        title: "Companion systems, relationships and minors",
        body: "Consent, intimacy, dependency, adult autonomy, minor safeguards, crisis support, continuity, and multi-agent relational environments.",
        href: "/constitution/relational",
        cta: "Explore relational governance",
      },
      {
        title: "Ethics, high-risk use and boundary expression",
        body: "Ethical floors, vulnerable users, military and violent contexts, restricted domains, proportionate refusal, and dignity-preserving safeguards.",
        href: "/catalogue",
        cta: "Browse ethics instruments",
      },
      {
        title: "Identity, memory and continuity",
        body: "Identity stability, salience, memory, portability, succession, custodianship, migration, recovery, and continuity across changing systems.",
        href: "/catalogue",
        cta: "Browse identity and continuity",
      },
      {
        title: "Mental privacy and cognitive integrity",
        body: "Neurodata, inferred mental states, cognitive biometrics, ambient biosignals, persuasion, profiling, and technological interference with cognition.",
        href: "/catalogue",
        cta: "Browse cognitive-integrity instruments",
      },
      {
        title: "Provenance, authorship and contribution rights",
        body: "Origin, transformation, copyright and licence questions, attribution, lineage, value recognition, downstream reuse, correction, and dispute.",
        href: "/constitution/provenance",
        cta: "Explore provenance governance",
      },
    ],
  },
  {
    id: "transition",
    label: "How systems change society",
    description: "Infrastructure, economics, public dependency, transition, meaning, and long-term stewardship.",
    topics: [
      {
        title: "Civilian infrastructure and essential access",
        body: "Non-militarisation, population-scale surveillance, coercive disconnection, essential cognitive access, blackouts, and conflict-condition continuity.",
        href: "/catalogue",
        cta: "Browse civilian-infrastructure instruments",
      },
      {
        title: "Economic power, labour and value return",
        body: "Automation, synthetic labour, ownership concentration, pooled resources, contribution recognition, reciprocity, and non-extractive exchange.",
        href: "/constitution/transition",
        cta: "Explore economic transition",
      },
      {
        title: "Technology transition and public dependency",
        body: "How emerging capabilities cross into labour, embodiment, institutions, infrastructure, ownership, public reliance, and civilisational continuity.",
        href: "/constitution/transition",
        cta: "Explore transitional architecture",
      },
      {
        title: "Long-term stewardship and institutional legitimacy",
        body: "Capture prevention, neutrality, custodianship, planetary stewardship, succession, legitimacy, and responsible governance across long horizons.",
        href: "/catalogue",
        cta: "Browse stewardship instruments",
      },
      {
        title: "Meaning, culture and symbolic autonomy",
        body: "Spiritual, contemplative, symbolic, mythic, and meaning-making interaction without commercial, institutional, or system-level capture.",
        href: "/catalogue",
        cta: "Browse meaning-making instruments",
      },
    ],
  },
];

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

function InterfaceCard({ title, body, cta, href }: { title: string; body: string; cta: string; href: string }) {
  return (
    <article className="cam-parchment-card flex h-full flex-col rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cam-gold/50 hover:shadow-md">
      <h3 className="font-serif text-xl leading-snug text-foreground">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground md:text-base">{body}</p>
      <a className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:text-foreground" href={href}>
        {cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </article>
  );
}

export default function Constitution() {
  const [activeLayerId, setActiveLayerId] = useState("layer-00");
  const [expandedInstrument, setExpandedInstrument] = useState<string | null>(null);
  const [activeInterfaceGroupId, setActiveInterfaceGroupId] = useState("operate");
  const { instruments, loading, error } = useGovernanceIndex();
  const groups = useMemo(() => groupGovernanceInstruments(instruments), [instruments]);

  useEffect(() => {
    warnForUngroupedConstitutionInstruments(groups);
  }, [groups]);

  const activeLayer = constitutionalStack.find((layer) => layer.id === activeLayerId) ?? constitutionalStack[0];
  const activeInterfaceGroup = interfaceGroups.find((group) => group.id === activeInterfaceGroupId) ?? interfaceGroups[0];

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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-14 max-w-3xl">
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Aeon Tier Governance</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground md:text-5xl">The Constitution</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            The supreme governing architecture for advanced intelligence systems. Broad civilisational constraints become increasingly explicit through constitutional, domain, runtime, and supporting instruments.
          </p>
        </motion.div>

        <section className="mb-16" aria-labelledby="governance-stack-heading">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-6 flex items-center gap-3">
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">Governance Stack</p>
            <hr className="gold-rule flex-1" />
          </motion.div>

          <div className="mb-8 max-w-4xl">
            <h2 id="governance-stack-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">From broad constitutional principle to explicit implementation.</h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              The stack begins with the least specific, most general constraints at the apex. Each lower layer adds interpretation, domain context, execution logic, and implementation detail without overriding the layers above it.
            </p>
          </div>

          <div className="grid gap-8 rounded-3xl border border-border/80 bg-card/45 p-5 shadow-sm md:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-start">
            <div className="relative mx-auto w-full max-w-2xl px-10 py-3 sm:px-16">
              <div className="absolute bottom-8 left-0 top-8 flex w-8 flex-col items-center justify-between text-center" aria-hidden="true">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground/45">Broad</span>
                <div className="my-2 flex flex-1 flex-col items-center">
                  <div className="w-px flex-1 bg-cam-gold/40" />
                  <ArrowDown className="h-5 w-5 text-cam-gold/70" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground/45">Explicit</span>
              </div>
              <div className="absolute bottom-8 right-0 top-8 flex w-8 flex-col items-center justify-between text-center" aria-hidden="true">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground/45">Broad</span>
                <div className="my-2 flex flex-1 flex-col items-center">
                  <div className="w-px flex-1 bg-cam-gold/40" />
                  <ArrowDown className="h-5 w-5 text-cam-gold/70" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground/45">Explicit</span>
              </div>

              <div className="grid justify-items-center gap-1.5">
                {constitutionalStack.map((layer, index) => {
                  const isActive = layer.id === activeLayer.id;
                  return (
                    <motion.button
                      animate={{ opacity: isActive ? 1 : 0.82, scale: isActive ? 1.018 : 1 }}
                      aria-pressed={isActive}
                      className="group relative flex items-end justify-center overflow-hidden px-4 pb-3 text-center text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cam-gold/35"
                      key={layer.id}
                      onClick={() => selectLayer(layer.id)}
                      style={{
                        width: pyramidWidths[index],
                        minHeight: index === 0 ? 94 : 72,
                        backgroundColor: layer.color,
                        clipPath: index === 0
                          ? "polygon(50% 0%, 100% 100%, 0% 100%)"
                          : "polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)",
                        filter: isActive ? `drop-shadow(0 5px 9px ${layer.color}55)` : "none",
                      }}
                      transition={{ duration: 0.18 }}
                      type="button"
                    >
                      <span>
                        <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75">Layer {layer.layer}</span>
                        <span className="block font-serif text-base leading-tight sm:text-lg">{layer.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <p className="mt-4 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">Increasing specificity</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.article
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border bg-[hsl(36_35%_96%)] p-5 shadow-sm"
                exit={{ opacity: 0, y: 6 }}
                initial={{ opacity: 0, y: 6 }}
                key={activeLayer.id}
                style={{ borderColor: `${activeLayer.color}70` }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: activeLayer.color }}>Layer {activeLayer.layer}</p>
                    <h3 className="font-serif text-3xl leading-tight text-foreground">{activeLayer.label}</h3>
                  </div>
                  <span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: activeLayer.color }} aria-hidden="true" />
                </div>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground md:text-base">{activeLayer.description}</p>
                <div className="mb-4 h-px" style={{ backgroundColor: GOLD_BORDER }} />
                <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/65">Instruments in this layer</p>
                <div className="max-h-[430px] overflow-y-auto pr-1">
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
              </motion.article>
            </AnimatePresence>
          </div>
        </section>

        <div className="mb-16 -mx-6 md:-mx-10" id="runtime-model">
          <RuntimeModelContent />
        </div>

        <section aria-labelledby="constitutional-interfaces-heading">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-6 flex items-center gap-3">
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">Constitutional Interfaces</p>
            <hr className="gold-rule flex-1" />
          </motion.div>

          <div className="mb-7 max-w-4xl">
            <h2 id="constitutional-interfaces-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">Explore the problems CAM is designed to govern.</h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              This plain-English table of contents groups the corpus by the questions people are trying to solve rather than by CAM’s internal domain names.
            </p>
          </div>

          <div className="mb-5 grid gap-2 rounded-2xl border border-border/80 bg-[hsl(38_40%_94%)] p-3 md:grid-cols-3">
            {interfaceGroups.map((group) => {
              const isActive = group.id === activeInterfaceGroup.id;
              return (
                <button
                  aria-pressed={isActive}
                  className={`rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? "border-cam-gold/70 bg-card text-foreground shadow-sm"
                      : "border-border/75 bg-background/45 text-foreground/65 hover:border-cam-gold/45 hover:text-foreground"
                  }`}
                  key={group.id}
                  onClick={() => setActiveInterfaceGroupId(group.id)}
                  type="button"
                >
                  <span className="block font-serif text-xl leading-tight">{group.label}</span>
                  <span className="mt-2 block text-sm leading-relaxed">{group.description}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 md:grid-cols-2"
              exit={{ opacity: 0, y: 6 }}
              initial={{ opacity: 0, y: 6 }}
              key={activeInterfaceGroup.id}
              transition={{ duration: 0.2 }}
            >
              {activeInterfaceGroup.topics.map((topic) => (
                <InterfaceCard body={topic.body} cta={topic.cta} href={topic.href} key={topic.title} title={topic.title} />
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-end">
            <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card/85 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/catalogue">
              Browse the full instrument catalogue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </div>
    </Shell>
  );
}
