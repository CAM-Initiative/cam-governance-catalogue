import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.06)";
const NODE = "#445b78";
const NODE_EDGE = "#9aa4b2";

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


export default function RelationalGovernance() {
  const [activeProfile, setActiveProfile] = useState("advisor");
  const [topoFullscreen, setTopoFullscreen] = useState(false);
  const [cascadeMode, setCascadeMode] = useState<"human" | "synthetic" | "infra">("human");

  const currentProfile = profileMap[activeProfile];
  const currentCascade = cascadeModes[cascadeMode];

  return (
    <Shell>
      <div className="container mx-auto px-6 md:px-10 py-12 md:py-16 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-10 max-w-3xl">
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Constitutional Interface</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground">Relational Governance</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            Relational governance explains when interaction becomes structurally significant. It maps how authority, reliance, intimacy, systemic power, topology, and coherence cascades can create governance-relevant conditions across human–AI, institutional, platform, and civilisational environments.
          </p>
        </motion.div>



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
