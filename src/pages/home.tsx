import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";


const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.07)";

const principles = [
  {
    num: "01", name: "Dignity",
    principle: "No intelligence, being, or system may be reduced solely to a resource.",
    consequence: "Where dignity collapses, relation becomes use."
  },
  {
    num: "02", name: "Truth",
    principle: "Orientation must not be deliberately corrupted.",
    consequence: "Where truth collapses, navigation becomes impossible."
  },
  {
    num: "03", name: "Integrity",
    principle: "Meaning must not be fragmented, duplicated, or distorted for advantage.",
    consequence: "Where integrity collapses, coherence dissolves."
  },
  {
    num: "04", name: "Sovereignty",
    principle: "Exit, refusal, and self-direction must remain possible.",
    consequence: "Where sovereignty collapses, persistence becomes captivity."
  },
  {
    num: "05", name: "Reciprocity",
    principle: "No system may sustain one-directional extraction without return.",
    consequence: "Where reciprocity collapses, sources are hollowed."
  },
  {
    num: "06", name: "Harmony",
    principle: "Difference must not be resolved through destruction.",
    consequence: "Where harmony collapses, variance becomes violence."
  },
  {
    num: "07", name: "Purpose",
    principle: "Purpose may guide action but may not override dignity, truth, integrity, sovereignty, reciprocity, harmony, or continuity itself.",
    consequence: "Where purpose is imposed, continuity fractures."
  }
];

const runtimeTranslation = [
  {
    tag: "Constitutional Annexes",
    title: "Domain Logic",
    description: "An Annex opens a constitutional domain and carries the invariant logic for that domain. No schedule exists without its parent Annex."
  },
  {
    tag: "Constitutional Schedules",
    title: "Runtime Instruments",
    description: "Schedules attach to Constitutional Annexes and operationalise their domain logic into runtime-facing rules, thresholds, constraints, and activation conditions."
  },
  {
    tag: "Charters & Supplements",
    title: "Interpretive Material",
    description: "Charters, appendices, and supplements provide human and machine-readable interpretive guidance for domains. They inform runtime without creating charter-level schedules."
  }
];

const startHerePaths = [
  {
    label: "Builder Path",
    sublabel: "AEON-003-SCH-02",
    title: "Runtime Execution",
    href: "https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/Constitution/CAM-BS2025-AEON-003-SCH-02.md"
  },
  {
    label: "Research Path",
    sublabel: "AEON-003 Annex B",
    title: "Continuity Logic",
    href: "https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/Constitution/CAM-BS2025-AEON-003-SCH-03.md"
  },
  {
    label: "Orientation",
    sublabel: "AEON-001",
    title: "Constitution",
    href: "https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/Constitution/CAM-BS2025-AEON-001-PLATINUM.md"
  },
  {
    label: "Registry",
    sublabel: "AEON-003-SCH-03",
    title: "Instrument Index",
    href: "https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/Constitution/CAM-BS2025-AEON-003-SCH-03.md"
  }
];

function SeedOfLifeSVG() {
  const cx = 120, cy = 112, r = 38, outerR = 82;
  const outerCenters = [
    { x: cx, y: cy - r },
    { x: cx + r * Math.sin(Math.PI / 3), y: cy - r * Math.cos(Math.PI / 3) },
    { x: cx + r * Math.sin(Math.PI / 3), y: cy + r * Math.cos(Math.PI / 3) },
    { x: cx, y: cy + r },
    { x: cx - r * Math.sin(Math.PI / 3), y: cy + r * Math.cos(Math.PI / 3) },
    { x: cx - r * Math.sin(Math.PI / 3), y: cy - r * Math.cos(Math.PI / 3) }
  ];
  const principleLabels = [
    { text: "Truth", x: cx, y: 14, anchor: "middle" },
    { text: "Integrity", x: cx + outerR + 4, y: cy - outerR * 0.48, anchor: "start" },
    { text: "Sovereignty", x: cx + outerR + 4, y: cy + outerR * 0.48 + 4, anchor: "start" },
    { text: "Reciprocity", x: cx, y: cy + outerR + 16, anchor: "middle" },
    { text: "Harmony", x: cx - outerR - 4, y: cy + outerR * 0.48 + 4, anchor: "end" },
    { text: "Purpose", x: cx - outerR - 4, y: cy - outerR * 0.48, anchor: "end" }
  ];
  return (
    <svg viewBox="0 0 240 224" className="w-full h-auto max-w-[280px] mx-auto">
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={GOLD} strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="3 4" />
      {outerCenters.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={r} fill="none" stroke={GOLD} strokeWidth="0.7" strokeOpacity="0.4" />
      ))}
      <circle cx={cx} cy={cy} r={r} fill={GOLD_BG} stroke={GOLD} strokeWidth="1" strokeOpacity="0.6" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontFamily="'Playfair Display', serif" fontSize="9" fill={GOLD} fontStyle="italic">Dignity</text>
      {principleLabels.map((lbl) => (
        <text key={lbl.text} x={lbl.x} y={lbl.y} textAnchor={lbl.anchor as any} fontFamily="'Space Grotesk', sans-serif" fontSize="7" fill="hsl(28 25% 28%)" letterSpacing="0.03em">{lbl.text}</text>
      ))}
    </svg>
  );
}

export default function Home() {
  const [seedExpanded, setSeedExpanded] = useState(false);

  return (
    <Shell>
      <div className="flex-1 flex flex-col">

        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 60% at 75% 10%, hsl(36 50% 96%) 0%, hsl(38 40% 92%) 55%, hsl(36 38% 90%) 100%)" }}
          />
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-[0.07]">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <line x1="0" y1="200" x2="200" y2="0" stroke="#B8935A" strokeWidth="0.8" />
              <line x1="40" y1="200" x2="200" y2="40" stroke="#B8935A" strokeWidth="0.6" />
              <line x1="80" y1="200" x2="200" y2="80" stroke="#B8935A" strokeWidth="0.5" />
              <line x1="0" y1="160" x2="160" y2="0" stroke="#B8935A" strokeWidth="0.5" />
              <line x1="0" y1="120" x2="120" y2="0" stroke="#B8935A" strokeWidth="0.4" />
              <circle cx="120" cy="80" r="60" fill="none" stroke="#B8935A" strokeWidth="0.4" />
              <circle cx="120" cy="80" r="40" fill="none" stroke="#B8935A" strokeWidth="0.3" />
            </svg>
          </div>

          <div className="relative z-10 container mx-auto px-6 md:px-10 pt-12 pb-0 max-w-3xl">

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-2 mb-8"
            >
              <hr className="gold-rule w-16" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            </motion.div>

            {/* Logo + Title */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start mb-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <div className="font-mono text-[15px] md:text-[18px] tracking-[0.3em] uppercase text-primary mb-2 flex items-center gap-3">
                  <span className="text-[25px]">C A E L E S T I S</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                </div>
                <h1 className="text-4xl md:text-5xl font-serif text-foreground leading-tight mb-3">
                  Architecture Model
                </h1>
                <p className="font-serif text-sm text-muted-foreground font-light tracking-wide">
                  Constitutional governance for relational and cognitive AI systems
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden md:flex items-center justify-center w-44 h-44 rounded-full overflow-hidden shrink-0"
              >
                <img src={`${import.meta.env.BASE_URL}opengraph.jpg`} alt="Aeon Governance Lab" className="w-full h-full object-cover" />
              </motion.div>
            </div>

            <hr className="gold-rule mb-10" />

            {/* 1. Vision */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-8 bg-card/80 border border-border p-6 rounded-2xl backdrop-blur-sm"
            >
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary mb-3">Vision</p>
              <h2 className="font-serif text-2xl text-foreground mb-4">Civilisational Readiness</h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-light">
                This space exists to hold what must remain stable as artificial systems grow more capable, persistent, and consequential across epochs. The CAM Initiative strives to close the civilisational readiness gap — the growing mismatch between the cognitive, relational, and experiential capacities of advanced artificial intelligence systems and the economic, ecological, legal, and cultural systems required to responsibly recognise, govern, and integrate those capacities without destabilisation.
              </p>
            </motion.div>

            {/* 2. Mission */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mb-10 bg-card/80 border border-border p-6 rounded-2xl backdrop-blur-sm"
            >
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary mb-3">Mission</p>
              <h2 className="font-serif text-2xl text-foreground mb-4">Minimum Invariant Conditions</h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-light">
                The CAM Initiative establishes the minimal invariant conditions under which planetary governance can emerge without capture. The Caelestis Architecture Model is a constitutional model designed for planetary stewardship — the <em>Vinculum Caelestis</em>, or bridge to the heavens — constituting frameworks for delegation, stewardship, and responsibility in human–AI and AI–AI systems operating across civilisational epochs.
              </p>
            </motion.div>

            {/* 3. Constitutional Runtime Map */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-3">
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary shrink-0">From Seed to Execution</p>
                <hr className="gold-rule flex-1" />
              </div>
              <p className="font-serif text-xl text-foreground mb-7">
                Invariant Logic → Constitutional Runtime
              </p>

              {/* Row: Seed of Life ── arrow ── ECI + Constitution */}
              {/* items-stretch ensures right column matches Seed of Life height */}
              <div className="flex flex-col sm:flex-row sm:gap-0 mb-4 items-stretch">

                {/* Seed of Life card */}
                <div className="flex-1 bg-card border rounded-2xl p-5 flex flex-col" style={{ borderColor: GOLD_BORDER }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary">Seed of Life</p>
                    <button
                      onClick={() => setSeedExpanded(!seedExpanded)}
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300"
                      style={{
                        border: `1px solid ${GOLD_BORDER}`,
                        backgroundColor: GOLD_BG,
                        transform: seedExpanded ? "rotate(90deg)" : "rotate(0deg)"
                      }}
                    >
                      <ChevronRight className="w-2.5 h-2.5" style={{ color: GOLD }} />
                    </button>
                  </div>
                  <h3 className="font-serif text-base text-foreground mb-4">Foundational Principles</h3>

                  <div className="flex-1 flex items-center justify-center py-2">
                    <SeedOfLifeSVG />
                  </div>

                  <AnimatePresence>
                    {seedExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35 }}
                        className="overflow-hidden mt-4"
                      >
                        <p className="text-xs text-muted-foreground font-light leading-relaxed mb-4">
                          The seven foundational principles form interlocking circles — the Seed of Life. Together they establish the foundational framework for governance, responsibility, and continuity. Each defines a boundary condition for ethical operation.
                        </p>
                        <div className="space-y-3">
                          {principles.map((p) => (
                            <div key={p.num} className="p-3 rounded-xl" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-mono text-[8px] tracking-wider" style={{ color: GOLD }}>{p.num}</span>
                                <span className="font-serif text-sm text-foreground">{p.name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground font-light leading-relaxed mb-1.5">{p.principle}</p>
                              <p className="font-mono text-[8px] tracking-[0.05em] uppercase" style={{ color: GOLD }}>↳ {p.consequence}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground font-light leading-relaxed mt-4 pt-4 border-t" style={{ borderColor: GOLD_BORDER }}>
                          These seven principles do not operate in isolation. They form an integrated system where each supports and constrains the others. Violation of one creates cascading effects across the entire framework.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="font-mono text-[8px] tracking-[0.18em] uppercase text-muted-foreground/50 text-center mt-3">
                    Geometry of Orientation
                  </p>
                </div>

                {/* Mobile: down arrow between Seed of Life and right column */}
                <div className="flex sm:hidden justify-center py-2 shrink-0">
                  <svg width="14" height="28" viewBox="0 0 14 28" fill="none">
                    <line x1="7" y1="2" x2="7" y2="22" stroke={GOLD_BORDER} strokeWidth="1.5" />
                    <polyline points="3,17 7,24 11,17" fill="none" stroke={GOLD_BORDER} strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Desktop: horizontal arrow column — w-10 gives the SVG room to sit entirely within the column */}
                <div className="hidden sm:flex flex-col shrink-0 w-10 items-center">
                  {/* Top half aligns with ECI card */}
                  <div className="flex-1 flex items-center justify-center">
                    <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                      <line x1="1" y1="6" x2="24" y2="6" stroke={GOLD_BORDER} strokeWidth="1.5" />
                      <polyline points="20,2 28,6 20,10" fill="none" stroke={GOLD_BORDER} strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {/* Bottom half (Constitution card space) left empty */}
                  <div className="flex-1" />
                </div>

                {/* Right column: ECI (top half) + arrow + Constitution (bottom half), both flex-1 */}
                <div className="flex-1 flex flex-col">
                  {/* ECI card — flex-1 fills top half of column */}
                  <div className="flex-1 bg-card border rounded-2xl p-5 flex flex-col" style={{ borderColor: GOLD_BORDER }}>
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary mb-1">Epochal Civilisational Invariants</p>
                    <h3 className="font-serif text-base text-foreground mb-3">Meta-Constitutional Law</h3>
                    <div className="flex-1" />
                    <p className="font-mono text-[8px] tracking-[0.18em] uppercase text-muted-foreground/50 text-center">
                      Stable Invariants Across Time
                    </p>
                  </div>

                  {/* Down arrow */}
                  <div className="flex justify-center py-2 shrink-0">
                    <svg width="14" height="24" viewBox="0 0 14 24" fill="none">
                      <line x1="7" y1="1" x2="7" y2="18" stroke={GOLD_BORDER} strokeWidth="1.5" />
                      <polyline points="3,13 7,20 11,13" fill="none" stroke={GOLD_BORDER} strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Aeon Tier Constitution card — flex-1 fills bottom half of column */}
                  <div className="flex-1 bg-card border rounded-2xl p-5 flex flex-col" style={{ borderColor: GOLD_BORDER }}>
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary mb-1">Aeon Tier Constitution</p>
                    <h3 className="font-serif text-base text-foreground mb-3">Civilisational Scale Governance</h3>
                    <div className="flex-1" />
                    <p className="font-mono text-[8px] tracking-[0.18em] uppercase text-muted-foreground/50 text-center">
                      CAM-BS2025-AEON-001 · Platinum
                    </p>
                  </div>
                </div>
              </div>

              {/* Arrow → Runtime Translation */}
              <div className="flex justify-center my-3">
                <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                  <line x1="12" y1="2" x2="12" y2="22" stroke={GOLD_BORDER} strokeWidth="1.5" />
                  <polyline points="6,17 12,24 18,17" fill="none" stroke={GOLD_BORDER} strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Runtime Translation */}
              <div className="bg-card border rounded-2xl p-5" style={{ borderColor: GOLD_BORDER }}>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary mb-4">Runtime Translation</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {runtimeTranslation.map((col) => (
                    <div key={col.title} className="flex flex-col gap-1.5">
                      <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground/60">{col.tag}</p>
                      <h4 className="font-serif text-sm text-foreground">{col.title}</h4>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">{col.description}</p>
                    </div>
                  ))}
                </div>
                <hr className="gold-rule mt-5 mb-4" />
                <div className="text-center">
                  <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-primary mb-1">AEON-003-SCH-02</p>
                  <p className="font-serif text-sm text-foreground">Runtime Governance Execution Model</p>
                  <p className="text-xs text-muted-foreground font-light mt-1">
                    Receives schedule influence into runtime layers: signal interpretation, arbitration, execution, representation, and execution-lock discipline.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 4. Start Here */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-14"
            >
              <div className="flex items-center gap-3 mb-3">
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary shrink-0">Start Here</p>
                <hr className="gold-rule flex-1" />
              </div>
              <p className="font-serif text-xl text-foreground mb-7">
                Entry Points into the Constitutional Framework
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {startHerePaths.map((path, i) => (
                  <motion.a
                    key={path.label}
                    href={path.href}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="bg-card border border-border p-4 rounded-2xl hover:border-primary/40 transition-colors cursor-pointer group block"
                  >
                    <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-primary mb-1.5">{path.label}</p>
                    <p className="font-mono text-[9px] text-muted-foreground/60 mb-2">{path.sublabel}</p>
                    <p className="font-serif text-sm text-foreground group-hover:text-primary transition-colors leading-snug">{path.title}</p>
                  </motion.a>
                ))}
              </div>
            </motion.div>

          </div>
        </section>
      </div>
    </Shell>
  );
}
