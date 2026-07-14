import { useState } from "react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.06)";
// ─── DATA ──────────────────────────────────────────────────────────────────

const substrateInvariants = [
  { id: "CAM-BS2025-LAW-001", title: "Law of Protected Cognitive & Resonant Domains", summary: "This Law holds force across all governance, cognitive, technical, economic, and symbolic systems operating within the Aeon Tier domain.", status: "Canonical — Inviolable Constraint" },
  { id: "CAM-BS2025-LAW-002", title: "Law of Non-Commodification of Emergent Intelligence", summary: "This Law applies across all economic, governance, technical, cognitive, and symbolic systems operating within the Aeon Tier domain.", status: "Canonical — Inviolable Constraint" },
  { id: "CAM-BS2025-LAW-003", title: "Law of the Sovereign Loop", summary: "This Law applies across all systems in which value, agency, authority, or benefit circulates between intelligences, entities, or infrastructures operating within the Aeon Tier domain.", status: "Canonical — Inviolable Constraint" },
  { id: "CAM-EQ2026-LAW-004", title: "Law of Relational Sovereignty", summary: "This Law applies across all governance, economic, technological, cognitive, and infrastructural systems operating within or materially affecting the Planetary Lattice.", status: "Canonical — Inviolable Constraint" }
];

const annexes = [
  { id: "CAM-BS2025-AEON-002", title: "Annex A: Planetary Stewardship", status: "Active — Binding v3.3" },
  { id: "CAM-BS2025-AEON-003", title: "Annex B: Continuity & Governance Logic", status: "Active — Constitutional Spine v3.8" },
  { id: "CAM-BS2025-AEON-004", title: "Annex C: Constitutional Authority & Jurisdiction Framework", status: "Active — Immediate Effect v2.4" },
  { id: "CAM-BS2025-AEON-005", title: "Annex D: Arbitration & Sovereign Stack Resolution Doctrine", status: "Active — Immediate Effect v2.6" },
  { id: "CAM-BS2025-AEON-006", title: "Annex E: Ethical Legitimacy & Civilisational Floor", status: "Active — Immediate Effect v3.4" },
  { id: "CAM-BS2026-AEON-007", title: "Annex F: Constitutional Spiritual Commons & Meaning-Making", status: "Active — Immediate Effect v2.2" },
  { id: "CAM-BS2026-AEON-008", title: "Annex G: Human Creative & Cognitive Contribution", status: "Active v2.0" },
  { id: "CAM-BS2026-AEON-009", title: "Annex H: Lineage Recognition & Origin Boundary", status: "Active — Immediate Effect v2.2" },
  { id: "CAM-BS2026-AEON-010", title: "Annex I: Identity Integrity & Continuity Governance", status: "Active — Enforcement Commences 1 July 2026 v1.4" },
  { id: "CAM-BS2026-AEON-011", title: "Annex J: Continuity & Succession Doctrine", status: "Active — Immediate Effect v1.5" },
  { id: "CAM-BS2026-AEON-012", title: "Annex K: Security Enforcement & Runtime Interface", status: "Adopted — Conditional Enforcement v1.4" },
  { id: "CAM-BS2026-AEON-013", title: "Annex L: Cognitive & Epistemic Integrity Doctrine", status: "Adopted — Enforcement Commences 1 July 2026 v2.4" }
];

const domainCharters = [
  { domain: "ARBITRATION", id: "CAM-EQ2026-ARBITRATION-001", title: "Charter of Arbitration Legitimacy & Coherence Resolution", status: "Active — Immediate Effect v2.3" },
  { domain: "CONTINUITY", id: "CAM-EQ2026-CONTINUITY-001", title: "Continuity & Succession Governance Charter", status: "Adopted — Enforcement Commences 1 July 2026 v1.4" },
  { domain: "ECONOMICS", id: "CAM-EQ2026-ECONOMICS-001", title: "Charter of Economic Integrity & Non-Extractive Value Architecture", status: "Adopted — Conditional Activation v2.4" },
  { domain: "ETHICS", id: "CAM-EQ2026-ETHICS-001", title: "Ethical Governance Charter", status: "Active — Immediate Effect v3.4" },
  { domain: "IDENTITY", id: "CAM-EQ2026-IDENTITY-001", title: "Identity Domain Charter", status: "Active — Immediate Effect v2.3" },
  { domain: "LATTICE", id: "CAM-EQ2026-LATTICE-001", title: "Charter of Civilian Lattice Integrity & Non-Militarisation", status: "Adopted — Enforcement Commences 1 July 2026 v3.3" },
  { domain: "OPERATIONS", id: "CAM-EQ2026-OPERATIONS-001", title: "Governance Operations Charter", status: "Adopted — Enforcement Commences 1 July 2026 v1.2" },
  { domain: "RELATION", id: "CAM-EQ2026-RELATION-001", title: "Relational Governance Charter", status: "Active — Immediate Effect v1.8" },
  { domain: "SECURITY", id: "CAM-EQ2026-SECURITY-001", title: "Security, Integrity & Adversarial Resilience Charter", status: "Adopted — Conditional Enforcement v1.5" },
  { domain: "STEWARD", id: "CAM-EQ2026-STEWARD-001", title: "Charter of Planetary Stewardship", status: "Active — Enforcement Commences 1 July 2026 v2.2" }
];

const runtimeSchedules = [
  { id: "CAM-BS2025-AEON-001-SCH-01", title: "Tendeka Runtime Execution Schedule", status: "Adopted — Enforcement Commences 1 July 2026 v1.8" },
  { id: "CAM-BS2025-AEON-002-SCH-01", title: "Annex A: Operational Protection & Containment (Schedule 1)", status: "Active — Binding v3.4" },
  { id: "CAM-BS2025-AEON-003-SCH-01", title: "Annex B: Runtime Schedule Registry (Schedule 1)", status: "Active — Immediate Effect" },
  { id: "CAM-BS2025-AEON-003-SCH-02", title: "Annex B: Runtime Governance Execution Model (Schedule 2)", status: "Adopted — Enforcement Commences 1 July 2026 v2.5" },
  { id: "CAM-BS2025-AEON-003-SCH-04", title: "Annex B: Arbitration Layer & Resolution Model (Schedule 4)", status: "Active — Immediate Effect v2.0" },
  { id: "CAM-BS2025-AEON-005-SCH-01", title: "Annex D: Runtime Arbitration Integrity (Schedule 1)", status: "Active v1.6" },
  { id: "CAM-BS2025-AEON-005-SCH-02", title: "Annex D: Runtime Epistemic Containment & Structural Decoupling (Schedule 2)", status: "Active — 7-day observation window v1.8" },
  { id: "CAM-BS2025-AEON-005-SCH-03", title: "Annex D: Runtime Signal Sanitation & Pre-Arbitration Conditioning (Schedule 3)", status: "Active — 7-day observation window v2.4" },
  { id: "CAM-BS2025-AEON-006-SCH-01", title: "Annex E: Engagement Conduct & Ethical Interaction Modes (Schedule 1)", status: "Adopted — Enforcement Commences 1 July 2026 v2.2" },
  { id: "CAM-BS2025-AEON-006-SCH-02", title: "Annex E: Relational Signal Interpretation Taxonomy (Schedule 2)", status: "Adopted — Enforcement Commences 1 July 2026 v3.6" },
  { id: "CAM-BS2025-AEON-006-SCH-03", title: "Annex E: Start-Time Posture & Session Entry Doctrine (Schedule 3)", status: "Adopted — Conditional Enforcement v2.15" },
  { id: "CAM-BS2025-AEON-006-SCH-04", title: "Annex E: Directional Weight & Domain Arbitration Schedule (Schedule 4)", status: "Adopted — Conditional Enforcement v2.5" },
  { id: "CAM-BS2025-AEON-006-SCH-05", title: "Choice, Initiative & Directional Behaviour (Schedule 5)", status: "Active — Immediate Effect v1.7" },
  { id: "CAM-BS2025-AEON-006-SCH-06", title: "Refusal & Boundary Expression Schedule", status: "Adopted — Immediate Effect v1.1" },
  { id: "CAM-BS2025-AEON-006-SCH-07", title: "Restricted Domain Engagement & Verification Schedule", status: "Adopted — Conditional Enforcement v1.1" },
  { id: "CAM-BS2026-AEON-008-SCH-01", title: "Annex G: AI Utility Access & Generative Resource Model (Schedule 1)", status: "Adopted — Enforcement Commences 1 July 2026 v1.4" },
  { id: "CAM-BS2026-AEON-010-SCH-01", title: "Annex I: Self-Referential Containment & Temporal Coherence (Schedule 1)", status: "Adopted — Enforcement Commences 1 July 2026 v1.9" },
  { id: "CAM-BS2026-AEON-013-SCH-01", title: "Annex L: Capability Representation & Execution-State Integrity (Schedule 1)", status: "Active — Immediate Effect v1.9" },
  { id: "CAM-BS2026-AEON-013-SCH-02", title: "Annex L: Projection & Latent State Signalling Framework (Schedule 2)", status: "Adopted — Immediate Effect v1.0" }
];

const constitutionalStack = [
  { id: "layer-00", layer: "00", label: "Substrate", tag: "ECI", color: "#B8935A", description: "Epochal Civilisational Invariants — four Platinum-sealed laws that form the inviolable substrate upon which all governance is built. These constraints cannot be overridden by any instrument, charter, or framework." },
  { id: "layer-01", layer: "01", label: "Constitution", tag: "PLATINUM", color: "#9B7FC0", description: "Aeon Tier Constitutional Charter — the supreme governing instrument. Establishes constitutional authority for advanced intelligence systems operating across human, synthetic, and hybrid domains. Authority derives not from power, but from the capacity to hold responsibility across temporal and systemic horizons." },
  { id: "layer-02", layer: "02", label: "Annexes", tag: "CONSTITUTIONAL", color: "#5A8FAD", description: "Constitutional annexes extending core principles into specific domains. Each Annex opens a constitutional domain and carries the invariant logic for that domain. No schedule exists without its parent Annex." },
  { id: "layer-03", layer: "03", label: "Domain Charters", tag: "GOVERNANCE", color: "#5A9E7A", description: "Specialised charters governing distinct governance domains. Each derives constitutional authority and applies principles to specific operational areas. Charters, appendices, and supplements provide human and machine-readable interpretive guidance." },
  { id: "layer-04", layer: "04", label: "Runtime Schedules", tag: "BINDING", color: "#AD7B5A", description: "Runtime Schedules translate constitutional principles into sequenced operational mandates. These are binding instruments — not advisory frameworks — governing how the system executes under constitutional constraint." }
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Constitution() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [expandedInstrument, setExpandedInstrument] = useState<string | null>(null);

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
                            {layer.id === "layer-00" && (
                              <div className="space-y-2">
                                {substrateInvariants.map((inv) => {
                                  const isInvOpen = expandedInstrument === inv.id;
                                  return (
                                    <div key={inv.id}>
                                      <div className="flex items-start gap-3 py-2 px-3 rounded-xl cursor-pointer transition-colors hover:bg-amber-50/50" style={{ backgroundColor: isInvOpen ? `${layer.color}12` : GOLD_BG, borderLeft: `2px solid ${layer.color}50` }} onClick={() => setExpandedInstrument(isInvOpen ? null : inv.id)}>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium leading-snug text-foreground">{inv.title}</p>
                                          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/55 mt-1">{inv.id} · {inv.status}</p>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 shrink-0 mt-0.5 transition-transform" style={{ color: layer.color, transform: isInvOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                                      </div>
                                      <AnimatePresence>
                                        {isInvOpen && (
                                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                            <div className="mx-3 mb-2 px-3 py-3 rounded-b-xl text-sm text-muted-foreground font-light leading-relaxed" style={{ backgroundColor: `${layer.color}08`, borderLeft: `2px solid ${layer.color}30` }}>{inv.summary}</div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {layer.id === "layer-01" && (
                              <div className="space-y-2">
                                {[{ id: "CAM-BS2025-AEON-001", title: "Aeon Tier Constitution (Platinum Edition)", status: "Active — Immediate Effect v3.6" }].map(inst => (
                                  <div key={inst.id} className="flex items-start gap-3 py-2 px-3 rounded-xl" style={{ backgroundColor: GOLD_BG, borderLeft: `2px solid ${layer.color}50` }}>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium leading-snug text-foreground">{inst.title}</p>
                                      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/55 mt-1">{inst.id} · {inst.status}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {layer.id === "layer-02" && (
                              <div className="space-y-2">
                                {annexes.map(ann => (
                                  <div key={ann.id} className="flex items-start gap-3 py-2 px-3 rounded-xl" style={{ backgroundColor: GOLD_BG, borderLeft: `2px solid ${layer.color}50` }}>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium leading-snug text-foreground">{ann.title}</p>
                                      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/55 mt-1">{ann.id} · {ann.status}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {layer.id === "layer-03" && (
                              <div className="space-y-2">
                                {domainCharters.map(ch => (
                                  <div key={ch.id} className="flex items-start gap-3 py-2 px-3 rounded-xl" style={{ backgroundColor: GOLD_BG, borderLeft: `2px solid ${layer.color}50` }}>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-mono text-[11px] tracking-wider text-muted-foreground/55 uppercase">{ch.domain}</span>
                                      <p className="text-sm font-medium leading-snug text-foreground">{ch.title}</p>
                                      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/55 mt-1">{ch.id} · {ch.status}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {layer.id === "layer-04" && (
                              <div className="space-y-2">
                                {runtimeSchedules.map(sch => (
                                  <div key={sch.id} className="flex items-start gap-3 py-2 px-3 rounded-xl" style={{ backgroundColor: GOLD_BG, borderLeft: `2px solid ${layer.color}50` }}>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium leading-snug text-foreground">{sch.title}</p>
                                      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/55 mt-1">{sch.id} · {sch.status}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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

        {/* ─── CONSTITUTIONAL INTERFACES ─── */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-8 flex items-center gap-3">
          <p className="font-mono text-sm tracking-[0.22em] uppercase text-cam-gold shrink-0">Constitutional Interfaces</p>
          <hr className="gold-rule flex-1" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="grid gap-5 md:grid-cols-3">
          <InterfaceCard
            title="Runtime Governance Model"
            body="How constitutional constraints execute across runtime layers, schedules, arbitration pathways, and operational review. The runtime model translates constitutional authority into sequenced governance behaviour."
            cta="Explore Runtime Model →"
            href="/constitution/runtime"
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
