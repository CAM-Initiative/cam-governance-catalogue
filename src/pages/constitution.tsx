import { useState, useRef } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Maximize2 } from "lucide-react";

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.06)";
const NODE = "#445b78";
const NODE_EDGE = "#9aa4b2";

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

// ─── RELATIONAL PROFILES DATA ────────────────────────────────────────────────

const profileMap: Record<string, { title: string; values: string; description: string; points: string }> = {
  advisor: { title: "Institutional Advisor", values: "A2 · FR2 · C1 · SP2", description: "A balanced governance-facing profile in which authority, reliance, and systemic reach are materially present, but intimacy remains relatively constrained.", points: "380,255 470,300 380,390 290,300" },
  companion: { title: "Personal Companion", values: "A1 · FR3 · C3 · SP1", description: "A relationally intense profile with strong intimacy and continuity dependence, but comparatively low delegated authority and infrastructure reach.", points: "380,165 425,300 380,345 245,300" },
  finance: { title: "Financial Agent", values: "A3 · FR3 · C0 · SP3", description: "A high-execution profile where authority, reliance, and systemic power concentrate strongly even without relational intimacy.", points: "380,300 515,300 380,435 245,300" },
  infrastructure: { title: "Public Infrastructure AI", values: "A2 · FR2 · C0 · SP4", description: "A systemically exposed profile with minimal intimacy but very high infrastructural reach, requiring strong oversight and concentration safeguards.", points: "380,300 560,300 380,390 290,300" },
  executive: { title: "Executive Agent", values: "A3 · FR3 · C1 · SP3", description: "A strategic oversight profile at the highest authority tier, characterized by maximum delegated power and significant systemic reach, with moderate functional reliance and minimal intimacy.", points: "380,255 515,300 380,435 245,300" },
  guardian: { title: "Guardian Agent", values: "A2 FR4 C2 SP1", description: "A protective support profile combining intensive continuity reliance with maximum delegated authority and limited systemic reach. Requires strong safeguards to ensure authority is exercised exclusively within the relational context.", points: "380,210 425,300 380,390 200,300" },
  custodian: { title: "Planetary Custodian", values: "A4 · FR4 · C4 · SP4", description: "A fully convergent profile across all axes at maximum intensity. Legitimacy depends entirely on constraint, distribution, and continuous safeguard activation to prevent concentration risk.", points: "380,120 560,300 380,480 200,300" }
};

// ─── COHERENCE CASCADE MODES ─────────────────────────────────────────────────

const cascadeModes = {
  human: { color: "#9aa4b2", label: "Human Hub Cascade", sub: "systemic amplification", desc: "Human hub cascade: influential users propagate signals across multiple platforms creating cross‑network amplification." },
  synthetic: { color: "#5b8def", label: "Synthetic Hub Cascade", sub: "model‑driven amplification", desc: "Synthetic hub cascade: algorithms cluster related users, models, or content streams, creating emergent amplification hubs." },
  infra: { color: "#c96f6f", label: "Network Cascade", sub: "infrastructure routing", desc: "Infrastructure cascade: platform algorithms or distribution systems route signals system‑wide once a coherence threshold is reached." }
};

// ─── SHARED PANEL STYLE ───────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  background: "hsl(38 35% 97%)",
  border: `2px solid ${GOLD_BORDER}`,
  borderRadius: 28,
  boxShadow: "0 10px 30px rgba(184,147,90,0.06)",
  padding: "28px 22px 24px"
};

const btnBase: React.CSSProperties = {
  border: `1.5px solid ${GOLD_BORDER}`,
  background: "hsl(38 30% 96%)",
  color: "#1f2937",
  borderRadius: 999,
  padding: "10px 16px",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 180ms ease, border-color 180ms ease, transform 180ms ease",
  fontFamily: "inherit"
};

const btnActive: React.CSSProperties = {
  background: `rgba(184,147,90,0.12)`,
  borderColor: GOLD
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Constitution() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [expandedInstrument, setExpandedInstrument] = useState<string | null>(null);

  // Relational Profiles state
  const [activeProfile, setActiveProfile] = useState("advisor");

  // Topology fullscreen state
  const [topoFullscreen, setTopoFullscreen] = useState(false);

  // Coherence Cascades mode
  const [cascadeMode, setCascadeMode] = useState<"human" | "synthetic" | "infra">("human");

  const currentProfile = profileMap[activeProfile];
  const currentCascade = cascadeModes[cascadeMode];

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
          <p className="font-mono text-sm tracking-[0.22em] uppercase text-primary shrink-0">Governance Stack</p>
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
                      <span className="font-mono text-[9px] font-medium" style={{ color: layer.color }}>{layer.layer}</span>
                    </div>
                    {i < constitutionalStack.length - 1 && (
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${layer.color}50, transparent)` }} />
                    )}
                  </div>
                  <div className="flex-1 rounded-2xl border transition-all duration-200 overflow-hidden" style={{ borderColor: isOpen ? layer.color + "70" : GOLD_BORDER, backgroundColor: "hsl(36 35% 96%)", boxShadow: isOpen ? `0 0 0 1px ${layer.color}20` : "none" }}>
                    <div className="p-5 cursor-pointer flex items-start justify-between gap-3" onClick={() => setExpandedLayer(isOpen ? null : layer.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-serif text-lg text-foreground">{layer.label}</h3>
                          <span className="px-2 py-0.5 font-mono text-[8px] tracking-[0.15em] uppercase rounded-full shrink-0" style={{ color: layer.color, backgroundColor: `${layer.color}14`, border: `1px solid ${layer.color}30` }}>{layer.tag}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-light leading-relaxed">{layer.description}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 shrink-0 mt-1 transition-transform duration-200" style={{ color: layer.color, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="px-5 pb-5">
                            <div className="h-px mb-4" style={{ backgroundColor: GOLD_BORDER }} />
                            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60 mb-3">Instruments</p>
                            {layer.id === "layer-00" && (
                              <div className="space-y-2">
                                {substrateInvariants.map((inv) => {
                                  const isInvOpen = expandedInstrument === inv.id;
                                  return (
                                    <div key={inv.id}>
                                      <div className="flex items-start gap-3 py-2 px-3 rounded-xl cursor-pointer transition-colors hover:bg-amber-50/50" style={{ backgroundColor: isInvOpen ? `${layer.color}12` : GOLD_BG, borderLeft: `2px solid ${layer.color}50` }} onClick={() => setExpandedInstrument(isInvOpen ? null : inv.id)}>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-foreground">{inv.title}</p>
                                          <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">{inv.id} · {inv.status}</p>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 shrink-0 mt-0.5 transition-transform" style={{ color: layer.color, transform: isInvOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                                      </div>
                                      <AnimatePresence>
                                        {isInvOpen && (
                                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                            <div className="mx-3 mb-2 px-3 py-3 rounded-b-xl text-xs text-muted-foreground font-light leading-relaxed" style={{ backgroundColor: `${layer.color}08`, borderLeft: `2px solid ${layer.color}30` }}>{inv.summary}</div>
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
                                      <p className="text-xs font-medium text-foreground">{inst.title}</p>
                                      <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">{inst.id} · {inst.status}</p>
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
                                      <p className="text-xs font-medium text-foreground">{ann.title}</p>
                                      <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">{ann.id} · {ann.status}</p>
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
                                      <span className="font-mono text-[8px] tracking-wider text-muted-foreground/50 uppercase">{ch.domain}</span>
                                      <p className="text-xs font-medium text-foreground">{ch.title}</p>
                                      <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">{ch.id} · {ch.status}</p>
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
                                      <p className="text-xs font-medium text-foreground">{sch.title}</p>
                                      <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">{sch.id} · {sch.status}</p>
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

        {/* ─── RELATIONAL PROFILES ─── */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-8 flex items-center gap-3">
          <p className="font-mono text-sm tracking-[0.22em] uppercase text-primary shrink-0">Relational Profiles</p>
          <hr className="gold-rule flex-1" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16">
          <p className="text-sm text-muted-foreground font-light leading-relaxed mb-3">
            Relational state space can be measured across four relational axes. When combined, these factors become governance-relevant due to the risks that form when multiple dimensions converge or concentrate intensity over time.
          </p>
          <p className="text-sm text-muted-foreground font-light leading-relaxed mb-3">
            Relational systems do not operate at a single level of intensity. They form distinct profiles depending on how authority, reliance, intimacy, and systemic reach combine.
          </p>
          <p className="text-sm text-muted-foreground font-light leading-relaxed mb-8">
            Some profiles remain bounded and personal. Others begin to carry institutional weight. And in rare cases, multiple dimensions converge, creating conditions where influence becomes structurally significant.
          </p>

          <div style={panelStyle}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <h3 className="font-serif text-2xl text-foreground mb-1">Relational Profiles</h3>
              <p className="text-sm text-muted-foreground font-light">Seven example relationship configurations:</p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, margin: "18px 0 10px" }}>
              {Object.entries(profileMap).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  style={{ ...btnBase, ...(activeProfile === key ? btnActive : {}) }}
                  onMouseEnter={e => { if (activeProfile !== key) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                  onClick={() => setActiveProfile(key)}
                >
                  {p.title}
                </button>
              ))}
            </div>

            <p style={{ marginTop: 16, textAlign: "center", color: "#4b5563", lineHeight: 1.55, fontSize: "0.95rem", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
              {currentProfile.description}
            </p>

            <div style={{ width: "100%", overflow: "hidden" }}>
              <svg viewBox="0 0 760 720" style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Relational profile radar chart">
                {/* Grid */}
                <polygon points="380,120 560,300 380,480 200,300" fill="none" stroke="#cdd4df" strokeWidth="1.5"/>
                <polygon points="380,165 515,300 380,435 245,300" fill="none" stroke="#cdd4df" strokeWidth="1.5"/>
                <polygon points="380,210 470,300 380,390 290,300" fill="none" stroke="#cdd4df" strokeWidth="1.5"/>
                <polygon points="380,255 425,300 380,345 335,300" fill="none" stroke="#cdd4df" strokeWidth="1.5"/>
                {/* Axes */}
                <line x1="380" y1="105" x2="380" y2="495" stroke="#556070" strokeWidth="2.4"/>
                <line x1="185" y1="300" x2="575" y2="300" stroke="#556070" strokeWidth="2.4"/>
                {/* Ticks */}
                {[255,210,165,345,390,435].map((y,i) => <line key={i} x1="370" y1={y} x2="390" y2={y} stroke={NODE_EDGE} strokeWidth="1.4"/>)}
                {[335,290,245,425,470,515].map((x,i) => <line key={i} x1={x} y1="290" x2={x} y2="310" stroke={NODE_EDGE} strokeWidth="1.4"/>)}
                {/* Labels */}
                <text x="380" y="72" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1f2937">Intimacy</text>
                <text x="380" y="94" textAnchor="middle" fontSize="14" fill="#4b5563">C-Scale</text>
                <text x="635" y="292" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1f2937">Systemic Power</text>
                <text x="635" y="314" textAnchor="middle" fontSize="14" fill="#4b5563">SP-Scale</text>
                <text x="380" y="560" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1f2937">Authority</text>
                <text x="380" y="582" textAnchor="middle" fontSize="14" fill="#4b5563">A-Scale</text>
                <text x="125" y="292" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1f2937">Reliance</text>
                <text x="125" y="314" textAnchor="middle" fontSize="14" fill="#4b5563">FR-Scale</text>
                {/* Tier labels */}
                <text x="402" y="258" fontSize="12" fill="#6b7280">Tier 1</text>
                <text x="402" y="213" fontSize="12" fill="#6b7280">Tier 2</text>
                <text x="402" y="168" fontSize="12" fill="#6b7280">Tier 3</text>
                <text x="402" y="123" fontSize="12" fill="#6b7280">Tier 4</text>
                {/* Dynamic profile shape — CSS transition animates polygon points */}
                <polygon
                  points={currentProfile.points}
                  fill="rgba(110,135,175,0.22)"
                  stroke={NODE}
                  strokeWidth="3.5"
                  style={{ transition: "points 0.35s ease" }}
                />
                {/* Callout */}
                <text x="380" y="650" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1f2937">Example profile: {currentProfile.title}</text>
                <text x="380" y="676" textAnchor="middle" fontSize="14" fill="#4b5563">{currentProfile.values}</text>
              </svg>
            </div>

            <p style={{ marginTop: 14, textAlign: "center", color: "#6b7280", fontSize: "0.88rem", lineHeight: 1.5 }}>
              Lower risk (greater expansion space) when configurations are bounded at the axis centre → Higher risk when configurations are bounded at the axis edge
            </p>
          </div>
        </motion.div>

        {/* ─── RELATIONAL TOPOLOGY ─── */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-8 flex items-center gap-3">
          <p className="font-mono text-sm tracking-[0.22em] uppercase text-primary shrink-0">Relational Topology & Expansion</p>
          <hr className="gold-rule flex-1" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16">
          <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
            Relational systems often begin as dyadic interactions but can scale through institutional mediation, network amplification, distributed influence, and eventually constitutional‑level coordination across multiple systems or jurisdictions.
          </p>
          <p className="text-sm text-muted-foreground font-light leading-relaxed mb-8">
            Understanding how relational systems organise and scale across different levels of coordination and influence is foundational in understanding how information propagates through complex distributed systems.
          </p>

          <div
            style={{ ...panelStyle, cursor: "pointer" }}
            className="hover:shadow-lg transition-shadow"
            onClick={() => setTopoFullscreen(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-xl text-foreground mb-1">Expansion Scale of Relational Influence</h3>
                <p className="text-xs text-muted-foreground font-light">R0 — Dyadic to R4 — Constitutional</p>
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[9px] tracking-wider uppercase transition-colors"
                style={{ border: `1px solid ${GOLD_BORDER}`, color: GOLD, backgroundColor: GOLD_BG }}
                onClick={e => { e.stopPropagation(); setTopoFullscreen(true); }}
              >
                <Maximize2 className="w-3 h-3" /> Expand
              </button>
            </div>
            <TopologySVG id="topo-inline" />
          </div>
        </motion.div>

        {/* Topology Fullscreen Modal */}
        <AnimatePresence>
          {topoFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
              onClick={() => setTopoFullscreen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-6xl max-h-[90vh] overflow-auto rounded-2xl p-8"
                style={{ background: "hsl(38 35% 97%)", border: `2px solid ${GOLD_BORDER}` }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setTopoFullscreen(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors"
                  style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}
                  aria-label="Close fullscreen"
                >
                  <X size={22} style={{ color: GOLD }} />
                </button>
                <h3 className="font-serif text-2xl text-foreground mb-6 pr-12">Expansion Scale of Relational Influence</h3>
                <TopologySVG id="topo-fullscreen" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── COHERENCE CASCADES ─── */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-8 flex items-center gap-3">
          <p className="font-mono text-sm tracking-[0.22em] uppercase text-primary shrink-0">Coherence Cascades</p>
          <hr className="gold-rule flex-1" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16">
          <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
            Coherence Cascades describe the moment a relational signal moves beyond isolated interaction and begins to propagate across systems. Not every signal spreads — but when alignment emerges across participants, platforms, or processes, it can cross a threshold where amplification becomes self-reinforcing.
          </p>
          <p className="text-sm text-muted-foreground font-light leading-relaxed mb-8">
            At this point, influence is no longer local; it becomes networked, systemic, and consequential. Understanding these cascades allows us to distinguish between noise and meaningful coordination, and to recognise when relational dynamics begin to shape outcomes at scale.
          </p>

          <div style={panelStyle}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <h3 className="font-serif text-2xl text-foreground mb-1">Relational Cascade Model</h3>
              <p className="text-sm text-muted-foreground font-light">Three systemic pathways through which relational systems amplify into global influence</p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, margin: "18px 0 10px" }}>
              {(Object.entries(cascadeModes) as [keyof typeof cascadeModes, typeof cascadeModes["human"]][]).map(([key, m]) => (
                <button
                  key={key}
                  type="button"
                  style={{ ...btnBase, ...(cascadeMode === key ? { ...btnActive, borderColor: m.color, background: m.color + "15" } : {}) }}
                  onMouseEnter={e => { if (cascadeMode !== key) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                  onClick={() => setCascadeMode(key)}
                >
                  {key === "human" ? "Human Hub" : key === "synthetic" ? "Synthetic Hub" : "Infrastructure Routing"}
                </button>
              ))}
            </div>

            <p style={{ marginTop: 12, marginBottom: 4, textAlign: "center", color: "#4b5563", lineHeight: 1.55, fontSize: "0.95rem", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
              {currentCascade.desc}
            </p>

            <div style={{ width: "100%", overflow: "hidden" }}>
              <svg viewBox="0 0 900 450" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrow-cascade" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L9,3 L0,6 Z" fill="#6b7280" />
                  </marker>
                  <style>{`
                    @keyframes cascadeFlow {
                      from { stroke-dashoffset: 0; }
                      to   { stroke-dashoffset: -22; }
                    }
                    @keyframes cascadePulse {
                      0%,100% { r: 18; opacity: 1; }
                      50%     { r: 22; opacity: 0.75; }
                    }
                    @keyframes cascadeNodePop {
                      0%,100% { opacity: 1; }
                      50%     { opacity: 0.55; }
                    }
                    .cascade-edge {
                      stroke-dasharray: 10 12;
                      animation: cascadeFlow 1.1s linear infinite;
                    }
                    .cascade-center { animation: cascadePulse 1.4s ease-in-out infinite; }
                    .cascade-node  { animation: cascadeNodePop 1.4s ease-in-out infinite; }
                  `}</style>
                </defs>
                {/* LEFT — Local Interaction */}
                <text x="150" y="70" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1f2937">Local Interaction</text>
                <text x="150" y="90" textAnchor="middle" fontSize="14" fill="#4b5563">dyadic or small-group nodes</text>
                <circle cx="120" cy="240" r="10" fill={NODE} />
                <circle cx="160" cy="280" r="10" fill={NODE} />
                <circle cx="190" cy="210" r="10" fill={NODE} />

                {/* CENTRE — Hub Formation */}
                <text x="420" y="70" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1f2937">Hub Formation</text>
                <text x="420" y="90" textAnchor="middle" fontSize="14" fill="#4b5563">polyadic amplification</text>
                <circle cx="420" cy="250" r="16" fill="#8ea7c5" />
                <circle cx="380" cy="210" r="8" fill={NODE} />
                <circle cx="460" cy="210" r="8" fill={NODE} />
                <circle cx="380" cy="290" r="8" fill={NODE} />
                <circle cx="460" cy="290" r="8" fill={NODE} />
                <line x1="420" y1="250" x2="380" y2="210" stroke={NODE_EDGE} strokeWidth="2" />
                <line x1="420" y1="250" x2="460" y2="210" stroke={NODE_EDGE} strokeWidth="2" />
                <line x1="420" y1="250" x2="380" y2="290" stroke={NODE_EDGE} strokeWidth="2" />
                <line x1="420" y1="250" x2="460" y2="290" stroke={NODE_EDGE} strokeWidth="2" />

                {/* Arrows */}
                <line x1="240" y1="250" x2="350" y2="250" stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrow-cascade)" />
                <line x1="490" y1="250" x2="600" y2="250" stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrow-cascade)" />

                {/* Threshold */}
                <line x1="560" y1="120" x2="560" y2="420" stroke="#d1d5db" strokeWidth="2" strokeDasharray="6 6" />
                <text x="560" y="110" textAnchor="middle" fontSize="12" fill="#6b7280">coherence threshold</text>

                {/* RIGHT — Cascade (dynamic) */}
                <text x="720" y="70" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1f2937">{currentCascade.label}</text>
                <text x="720" y="90" textAnchor="middle" fontSize="14" fill="#4b5563">{currentCascade.sub}</text>

                <circle cx="720" cy="250" r="18" fill={currentCascade.color}
                  className="cascade-center"
                  style={{ transition: "fill 0.3s ease" }} />

                {([
                  [640,180,0],[780,180,1],[620,260,2],
                  [820,260,3],[660,340,4],[780,340,5]
                ] as [number,number,number][]).map(([cx,cy,i]) => (
                  <circle key={i} cx={cx} cy={cy} r="9" fill={NODE}
                    className="cascade-node"
                    style={{ animationDelay: `${i * 0.18}s` }} />
                ))}

                {([
                  [720,250,640,180],[720,250,780,180],[720,250,620,260],
                  [720,250,820,260],[720,250,660,340],[720,250,780,340]
                ] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    className="cascade-edge"
                    stroke={currentCascade.color}
                    strokeWidth="2.5"
                    style={{ transition: "stroke 0.3s ease", animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </svg>
            </div>

            <p style={{ marginTop: 14, textAlign: "center", color: "#6b7280", fontSize: "0.88rem", lineHeight: 1.5 }}>
              Cross‑platform signalling by influential users amplifies relational signals across multiple networks.
            </p>
          </div>
        </motion.div>

      </div>
    </Shell>
  );
}

// ─── TOPOLOGY SVG (shared between inline + fullscreen) ────────────────────────

function TopologySVG({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 1400 560" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`horizon-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#eef2f7" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#dbe4f0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c9d6e8" stopOpacity="0.45" />
        </linearGradient>
        <marker id={`arrow-${id}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L9,3 L0,6 Z" fill="#6b7280" />
        </marker>
      </defs>

      {/* Gradient band */}
      <rect x="0" y="250" width="1400" height="220" fill={`url(#horizon-${id})`} rx="20" />

      {/* Title */}
      <text x="700" y="42" textAnchor="middle" fontSize="26" fontWeight="600" fill="#374151" letterSpacing="0.2px">Expansion Scale of Relational Influence</text>

      {/* Zone headings */}
      {[["120","Personal"],["380","Institutional"],["640","Multi‑party"],["930","Networked"],["1200","Civilisational"]].map(([x,label]) => (
        <text key={label} x={x} y="220" textAnchor="middle" fontSize="18" fontWeight="600" fill="#374151" letterSpacing="0.3px">{label}</text>
      ))}

      {/* Regime dividers */}
      {[260,520,780,1040].map(x => (
        <line key={x} x1={x} y1="250" x2={x} y2="460" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.6" />
      ))}

      {/* R0 — Dyadic */}
      <text x="110" y="108" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1f2937">R0 — Dyadic</text>
      <text x="110" y="140" textAnchor="middle" fontSize="15" fill="#4b5563">one human &amp;</text>
      <text x="110" y="162" textAnchor="middle" fontSize="15" fill="#4b5563">one system</text>
      <circle cx="95" cy="350" r="12" fill={NODE} />
      <circle cx="145" cy="350" r="12" fill={NODE} />
      <line x1="95" y1="350" x2="145" y2="350" stroke={NODE_EDGE} strokeWidth="2" />

      {/* R1 — Triadic */}
      <text x="380" y="108" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1f2937">R1 — Triadic</text>
      <text x="380" y="140" textAnchor="middle" fontSize="15" fill="#4b5563">third party</text>
      <text x="380" y="162" textAnchor="middle" fontSize="15" fill="#4b5563">mediation</text>
      <circle cx="350" cy="330" r="12" fill={NODE} />
      <circle cx="410" cy="330" r="12" fill={NODE} />
      <circle cx="380" cy="395" r="12" fill={NODE} />
      <line x1="350" y1="330" x2="410" y2="330" stroke={NODE_EDGE} strokeWidth="2" />
      <line x1="350" y1="330" x2="380" y2="395" stroke={NODE_EDGE} strokeWidth="2" />
      <line x1="410" y1="330" x2="380" y2="395" stroke={NODE_EDGE} strokeWidth="2" />

      {/* R2 — Polyadic */}
      <text x="640" y="108" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1f2937">R2 — Polyadic</text>
      <text x="640" y="140" textAnchor="middle" fontSize="15" fill="#4b5563">distributed</text>
      <text x="640" y="162" textAnchor="middle" fontSize="15" fill="#4b5563">coordination</text>
      <circle cx="640" cy="310" r="10" fill={NODE} />
      <circle cx="600" cy="355" r="10" fill={NODE} />
      <circle cx="680" cy="355" r="10" fill={NODE} />
      <circle cx="610" cy="415" r="10" fill={NODE} />
      <circle cx="670" cy="415" r="10" fill={NODE} />
      <line x1="640" y1="310" x2="600" y2="355" stroke="#6b7280" strokeWidth="2" />
      <line x1="640" y1="310" x2="680" y2="355" stroke="#6b7280" strokeWidth="2" />
      <line x1="600" y1="355" x2="610" y2="415" stroke="#6b7280" strokeWidth="2" />
      <line x1="680" y1="355" x2="670" y2="415" stroke="#6b7280" strokeWidth="2" />

      {/* R3 — Distributed */}
      <text x="930" y="108" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1f2937">R3 — Distributed</text>
      <text x="930" y="140" textAnchor="middle" fontSize="15" fill="#4b5563">cross‑platform</text>
      <text x="930" y="162" textAnchor="middle" fontSize="15" fill="#4b5563">influence networks</text>
      <circle cx="930" cy="300" r="10" fill={NODE} />
      <circle cx="880" cy="340" r="10" fill={NODE} />
      <circle cx="980" cy="340" r="10" fill={NODE} />
      <circle cx="850" cy="405" r="10" fill={NODE} />
      <circle cx="930" cy="425" r="10" fill={NODE} />
      <circle cx="1010" cy="405" r="10" fill={NODE} />
      <line x1="930" y1="300" x2="880" y2="340" stroke="#6b7280" strokeWidth="2" />
      <line x1="930" y1="300" x2="980" y2="340" stroke="#6b7280" strokeWidth="2" />
      <line x1="880" y1="340" x2="850" y2="405" stroke="#6b7280" strokeWidth="2" />
      <line x1="980" y1="340" x2="1010" y2="405" stroke="#6b7280" strokeWidth="2" />
      <line x1="850" y1="405" x2="930" y2="425" stroke="#6b7280" strokeWidth="2" />
      <line x1="1010" y1="405" x2="930" y2="425" stroke="#6b7280" strokeWidth="2" />

      {/* R4 — Constitutional */}
      <text x="1200" y="108" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1f2937">R4 — Constitutional</text>
      <text x="1200" y="140" textAnchor="middle" fontSize="15" fill="#4b5563">planetary</text>
      <text x="1200" y="162" textAnchor="middle" fontSize="15" fill="#4b5563">coordination layer</text>
      <circle cx="1200" cy="350" r="22" fill={NODE} />
      <circle cx="1140" cy="310" r="8" fill={NODE} />
      <circle cx="1260" cy="310" r="8" fill={NODE} />
      <circle cx="1100" cy="400" r="8" fill={NODE} />
      <circle cx="1300" cy="400" r="8" fill={NODE} />
      <circle cx="1200" cy="280" r="8" fill={NODE} />
      <circle cx="1200" cy="420" r="8" fill={NODE} />
      <line x1="1200" y1="350" x2="1140" y2="310" stroke="#6b7280" strokeWidth="2" />
      <line x1="1200" y1="350" x2="1260" y2="310" stroke="#6b7280" strokeWidth="2" />
      <line x1="1200" y1="350" x2="1100" y2="400" stroke="#6b7280" strokeWidth="2" />
      <line x1="1200" y1="350" x2="1300" y2="400" stroke="#6b7280" strokeWidth="2" />
      <line x1="1200" y1="350" x2="1200" y2="280" stroke="#6b7280" strokeWidth="2" />
      <line x1="1200" y1="350" x2="1200" y2="420" stroke="#6b7280" strokeWidth="2" />

      {/* Arrows between levels */}
      <line x1="190" y1="350" x2="310" y2="350" stroke="#6b7280" strokeWidth="2" markerEnd={`url(#arrow-${id})`} />
      <line x1="450" y1="350" x2="560" y2="350" stroke="#6b7280" strokeWidth="2" markerEnd={`url(#arrow-${id})`} />
      <line x1="710" y1="350" x2="820" y2="350" stroke="#6b7280" strokeWidth="2" markerEnd={`url(#arrow-${id})`} />
      <line x1="1030" y1="350" x2="1130" y2="350" stroke="#6b7280" strokeWidth="2" markerEnd={`url(#arrow-${id})`} />
    </svg>
  );
}
