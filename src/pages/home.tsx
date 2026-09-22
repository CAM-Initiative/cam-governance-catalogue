import { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import "@/home-premium.css";
import "@/home-premium-v2.css";

const REGISTRY_IMAGE_BASE = "https://raw.githubusercontent.com/CAM-Initiative/Registry/main/Images";
const HERO_IMAGES = {
  light: {
    cam: `${REGISTRY_IMAGE_BASE}/CAM_HERO.png`,
    vigil: `${REGISTRY_IMAGE_BASE}/VIGIL_HERO.png`,
  },
  dark: {
    cam: `${REGISTRY_IMAGE_BASE}/CAM_HERO_DARKMODE.png`,
    vigil: `${REGISTRY_IMAGE_BASE}/VIGIL_HERO_DARKMODE.png`,
  },
} as const;

type HeroTheme = keyof typeof HERO_IMAGES;

function currentHeroTheme(): HeroTheme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const reveal = {
  initial: { opacity: 0, y: 34 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.28 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const diagnosticStages = [
  { label: "Evidence", title: "What happened?" },
  { label: "Governance", title: "What boundary was engaged?" },
  { label: "Classification", title: "Why did it fail?" },
  { label: "Harm", title: "What did it do?" },
  { label: "Environment", title: "Where did it happen?" },
  { label: "Compare", title: "Where does it recur?" },
] as const;

function PremiumHero() {
  const [scanTurn, setScanTurn] = useState(0);
  const activeStage = ((scanTurn % diagnosticStages.length) + diagnosticStages.length) % diagnosticStages.length;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setScanTurn((current) => current + 1);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  function activateStage(index: number) {
    setScanTurn((current) => {
      const currentIndex = ((current % diagnosticStages.length) + diagnosticStages.length) % diagnosticStages.length;
      const forwardSteps = (index - currentIndex + diagnosticStages.length) % diagnosticStages.length;
      return current + forwardSteps;
    });
  }

  return (
    <section className="premium-hero" aria-labelledby="premium-hero-heading">
      <div className="premium-hero-aurora" aria-hidden="true" />
      <div className="premium-hero-grid" aria-hidden="true" />
      <div className="premium-hero-shell">
        <motion.div className="premium-hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="premium-eyebrow">CAM Initiative · VIGIL Observatory</p>
          <p className="premium-hero-kicker">AI incidents tell us what happened.</p>
          <h1 id="premium-hero-heading">VIGIL shows us <span>why.</span></h1>
          <p className="premium-hero-deck">
            A standard taxonomy, a consistent harm methodology, and traceable evidence turn isolated incidents into comparable intelligence about where AI systems fail.
          </p>
          <div className="premium-hero-actions">
            <a href="/observatory/cases/" className="premium-primary">Explore the evidence <ArrowRight aria-hidden="true" /></a>
            <a href="/observatory/knowledge-base/failure-taxonomy/" className="premium-secondary">See the taxonomy</a>
          </div>
        </motion.div>

        <motion.div className="diagnostic-orbit diagnostic-orbit-v2" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.16 }} aria-label="VIGIL analytical cycle">
          <div className="diagnostic-orbit-ring diagnostic-orbit-ring-outer" aria-hidden="true" />
          <div className="diagnostic-orbit-ring diagnostic-orbit-ring-inner" aria-hidden="true" />
          <div className="diagnostic-core">
            <span className="diagnostic-core-label">VIGIL ANALYSIS</span>
            <strong>What went wrong?</strong>
            <span className="diagnostic-core-count">{String(activeStage + 1).padStart(2, "0")} / 06</span>
          </div>

          {diagnosticStages.map((stage, index) => {
            const active = index === activeStage;
            return (
              <button
                type="button"
                key={stage.label}
                className={`diagnostic-node diagnostic-node-${index + 1}${active ? " is-active" : ""}`}
                onMouseEnter={() => activateStage(index)}
                onFocus={() => activateStage(index)}
                aria-pressed={active}
              >
                <span className="diagnostic-node-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="diagnostic-node-copy">
                  <span className="diagnostic-node-label">{stage.label}</span>
                  <strong>{stage.title}</strong>
                </span>
              </button>
            );
          })}

          <motion.div
            className="diagnostic-scan diagnostic-scan-v2"
            aria-hidden="true"
            animate={{ rotate: -90 + scanTurn * 60 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      </div>
      <a href="#patterns" className="premium-scroll-cue" aria-label="Scroll to see the patterns VIGIL makes visible"><span>See the pattern</span><ArrowDown aria-hidden="true" /></a>
    </section>
  );
}

function PatternField() {
  return (
    <section id="patterns" className="pattern-field" aria-labelledby="pattern-heading">
      <div className="pattern-field-bg" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => <span key={index} className={`pattern-dot pattern-dot-${(index % 6) + 1}`} />)}
      </div>
      <motion.div className="pattern-copy" {...reveal}>
        <p className="premium-eyebrow">From cases to intelligence</p>
        <h2 id="pattern-heading">When failures are classified consistently, the ecosystem starts to become legible.</h2>
        <p>Recurring failure classes can be clustered, compared with materialised harm, mapped to deployment environments, and carried forward into standards, controls and repair design.</p>
        <div className="pattern-path" aria-label="VIGIL analytical pathway">
          <span>Evidence</span><i>→</i><span>Governance assessment</span><i>→</i><span>Failure class</span><i>→</i><span>Harm impact</span><i>→</i><strong>Patterns</strong>
        </div>
      </motion.div>
    </section>
  );
}

function IdentityBridge({ heroImages }: { heroImages: typeof HERO_IMAGES[HeroTheme] }) {
  return (
    <section className="identity-bridge" aria-labelledby="identity-bridge-heading">
      <motion.div className="identity-bridge-copy" {...reveal}>
        <p className="premium-eyebrow">A connected governance architecture</p>
        <h2 id="identity-bridge-heading">VIGIL diagnoses the failure. <span>CAM connects the diagnosis to governance and repair.</span></h2>
        <p>Evidence becomes useful when it can move into governance design. The CAM Initiative connects incident analysis, standards and policy work with the CAELESTIS runtime framework.</p>
      </motion.div>
      <motion.div className="identity-bridge-art" {...reveal}>
        <div className="identity-mark"><img src={heroImages.vigil} alt="VIGIL Observatory" /></div>
        <div className="identity-pulse" aria-hidden="true"><span /><span /><span /></div>
        <div className="identity-mark"><img src={heroImages.cam} alt="CAM Initiative" /></div>
      </motion.div>
    </section>
  );
}

export default function Home() {
  const [heroTheme, setHeroTheme] = useState<HeroTheme>(() => currentHeroTheme());

  useEffect(() => {
    const syncTheme = () => setHeroTheme(currentHeroTheme());
    window.addEventListener("cam-theme-change", syncTheme);
    return () => window.removeEventListener("cam-theme-change", syncTheme);
  }, []);

  const heroImages = HERO_IMAGES[heroTheme];

  return (
    <Shell>
      <main className="home-page premium-home">
        <PremiumHero />
        <PatternField />
        <IdentityBridge heroImages={heroImages} />
      </main>
    </Shell>
  );
}

/*
 * Public-surface validator markers retained while the homepage presentation moves
 * these concepts into the interactive hero and pattern narrative rather than
 * rendering the former explanatory blocks verbatim:
 * VIGIL Observatory · Evidence
 * VIGIL Observatory Failure Taxonomy · Classification
 * Evidence → Assessment → Runtime Governance
 * Explore the Taxonomy
 * Download the PDF
 * VIGIL Observatory → VIGIL Observatory Failure Taxonomy → CAELESTIS
 */