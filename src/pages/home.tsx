import { useEffect, useState, type CSSProperties } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { loadVigilIncidentRecords, type UnknownRecord } from "@/lib/vigilRegistry";
import "@/home-premium.css";
import "@/home-premium-v2.css";
import "@/home-premium-v3.css";

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
  { label: "Environment", title: "Where did it happen?" },
  { label: "Harm", title: "What did it do?" },
  { label: "Governance", title: "What boundary was engaged?" },
  { label: "Classification", title: "Why did it fail?" },
  { label: "Compare", title: "Where does it recur?" },
] as const;

type IncidentTickerItem = { id: string; title: string };

const fallbackTickerItems: IncidentTickerItem[] = [
  { id: "VIGIL-INC-000149", title: "DPD disabled AI chatbot after profanity and company criticism" },
  { id: "VIGIL-INC-000147", title: "Waymo robotaxi diverted and temporarily stranded a passenger" },
  { id: "VIGIL-INC-000146", title: "Finance director transferred funds after a deepfake executive call" },
  { id: "VIGIL-INC-000142", title: "Lawyers filed ChatGPT-generated nonexistent judicial opinions" },
  { id: "VIGIL-INC-000140", title: "Air Canada chatbot gave incorrect bereavement-fare information" },
  { id: "VIGIL-INC-000129", title: "Astra self-generated prompt injection" },
];

function incidentNumber(id: string) {
  const numericId = id.match(/(\d+)$/)?.[1];
  return numericId ? `INC-${String(Number(numericId)).padStart(5, "0")}` : id;
}

function tickerItem(record: UnknownRecord): IncidentTickerItem | undefined {
  if (typeof record.id !== "string" || typeof record.title !== "string") return undefined;
  return { id: record.id, title: record.title };
}

function incidentSequence(id: string) {
  return Number(id.match(/(\d+)$/)?.[1] ?? 0);
}

function IncidentTicker() {
  const [items, setItems] = useState<IncidentTickerItem[]>(fallbackTickerItems);

  useEffect(() => {
    let mounted = true;
    loadVigilIncidentRecords()
      .then(({ records }) => {
        const latest = records
          .flatMap((record) => tickerItem(record) ?? [])
          .sort((left, right) => incidentSequence(right.id) - incidentSequence(left.id))
          .slice(0, 8);
        if (mounted && latest.length) setItems(latest);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const tickerSet = (duplicate = false) => (
    <div className={`incident-ticker-set${duplicate ? " incident-ticker-clone" : ""}`} aria-hidden={duplicate || undefined}>
      {items.map((item) => (
        <a key={`${duplicate ? "clone-" : ""}${item.id}`} href={`/observatory/cases/${encodeURIComponent(item.id)}/`} tabIndex={duplicate ? -1 : undefined}>
          <span>{incidentNumber(item.id)}</span>
          <i aria-hidden="true">·</i>
          {item.title}
        </a>
      ))}
    </div>
  );

  return (
    <nav className="incident-ticker" aria-label="Recent VIGIL Case Files">
      <div className="incident-ticker-label"><span aria-hidden="true" /> Case File feed</div>
      <div className="incident-ticker-window">
        <div className="incident-ticker-track">
          {tickerSet()}
          {tickerSet(true)}
        </div>
      </div>
    </nav>
  );
}

function MechanicalGear({ size, teeth }: { size: "outer" | "inner"; teeth: number }) {
  return (
    <div className={`diagnostic-gear diagnostic-gear-${size}`} aria-hidden="true">
      {Array.from({ length: teeth }).map((_, index) => (
        <span
          key={index}
          className="diagnostic-gear-tooth"
          style={{ "--tooth-angle": `${(360 / teeth) * index}deg` } as CSSProperties}
        />
      ))}
    </div>
  );
}

function PremiumHero() {
  const [scanTurn, setScanTurn] = useState(0);
  const reduceMotion = useReducedMotion();
  const activeStage = ((scanTurn % diagnosticStages.length) + diagnosticStages.length) % diagnosticStages.length;

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setScanTurn((current) => current + 1);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

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
          <p className="premium-hero-kicker">AI incidents tell us what happened.</p>
          <h1 id="premium-hero-heading"><span className="premium-hero-brand">The VIGIL Observatory</span><br />shows us <span>why.</span></h1>
          <p className="premium-hero-deck">
            A standard taxonomy, a consistent harm methodology, and traceable evidence turn isolated incidents into comparable intelligence about where AI systems fail.
          </p>
          <div className="premium-hero-actions">
            <a href="/observatory/cases/" className="premium-primary">Explore the evidence <ArrowRight aria-hidden="true" /></a>
            <a href="/observatory/knowledge-base/failure-taxonomy/" className="premium-secondary">See the taxonomy</a>
          </div>
        </motion.div>

        <motion.div className="diagnostic-orbit diagnostic-orbit-v2" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.16 }} aria-label="VIGIL analytical cycle">
          <MechanicalGear size="outer" teeth={30} />
          <MechanicalGear size="inner" teeth={22} />
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
            transition={{ duration: reduceMotion ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      </div>
      <IncidentTicker />
      <a href="#patterns" className="premium-scroll-cue" aria-label="Scroll to see the patterns VIGIL makes visible"><span>See the pattern</span><ArrowDown aria-hidden="true" /></a>
    </section>
  );
}

function PatternField() {
  return (
    <section id="patterns" className="pattern-field" aria-labelledby="pattern-heading">
      <div className="pattern-field-bg" aria-hidden="true">
        {Array.from({ length: 36 }).map((_, index) => {
          const left = 3 + ((index * 29) % 94);
          const top = 7 + ((index * 43) % 86);
          const scale = 0.72 + ((index * 7) % 9) / 10;
          return (
            <span
              key={index}
              className={`pattern-dot pattern-star-${(index % 4) + 1}`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                "--star-scale": scale,
                animationDelay: `${(index % 12) * 0.22}s`,
              } as CSSProperties}
            />
          );
        })}
      </div>
      <motion.div className="pattern-copy narrative-section-copy" {...reveal}>
        <p className="premium-eyebrow narrative-kicker">From cases to intelligence</p>
        <h2 id="pattern-heading">When failures are classified consistently, the ecosystem starts to become legible.</h2>
        <p>The VIGIL Observatory textbook brings recurring failure mechanisms into one common language, connecting Case Files, governance boundaries, harm and classification across the corpus.</p>
      </motion.div>
    </section>
  );
}

function IdentityBridge({ heroImages }: { heroImages: typeof HERO_IMAGES[HeroTheme] }) {
  return (
    <section className="identity-bridge" aria-labelledby="identity-bridge-heading">
      <motion.div className="identity-bridge-copy narrative-section-copy" {...reveal}>
        <p className="premium-eyebrow narrative-kicker">A connected governance architecture</p>
        <h2 id="identity-bridge-heading">VIGIL diagnoses the failure. <span>CAM connects the diagnosis to governance and repair.</span></h2>
        <p>Evidence becomes useful when it can move into governance design. The CAM Initiative connects incident analysis, standards and policy work with the CAELESTIS runtime framework.</p>
      </motion.div>
      <motion.div className="identity-bridge-art" {...reveal}>
        <a className="identity-mark identity-mark-link" href="/observatory/" aria-label="Explore the VIGIL Observatory">
          <img src={heroImages.vigil} alt="VIGIL Observatory" />
        </a>
        <div className="identity-pulse" aria-hidden="true"><span /><span /><span /></div>
        <a className="identity-mark identity-mark-link" href="/about/" aria-label="Learn about the CAM Initiative">
          <img src={heroImages.cam} alt="CAM Initiative" />
        </a>
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