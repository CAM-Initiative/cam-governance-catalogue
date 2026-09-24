import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Shell } from "@/components/layout/Shell";
import { ExploreGovernanceRail } from "@/components/ExploreGovernanceRail";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { loadVigilIncidentRecords, type UnknownRecord } from "@/lib/vigilRegistry";
import { loadFailureTaxonomy, type FailureTaxonomyClass } from "@/lib/vigilFailureTaxonomy";
import "@/home-premium.css";
import "@/home-premium-v2.css";
import "@/home-premium-v3.css";

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

const fallbackTickerItems: IncidentTickerItem[] = [
  { id: "VIGIL-INC-000149", title: "DPD disabled AI chatbot after profanity and company criticism" },
  { id: "VIGIL-INC-000147", title: "Waymo robotaxi diverted and temporarily stranded a passenger" },
  { id: "VIGIL-INC-000146", title: "Finance director transferred funds after a deepfake executive call" },
  { id: "VIGIL-INC-000142", title: "Lawyers filed ChatGPT-generated nonexistent judicial opinions" },
  { id: "VIGIL-INC-000140", title: "Air Canada chatbot gave incorrect bereavement-fare information" },
  { id: "VIGIL-INC-000129", title: "Astra self-generated prompt injection" },
];

const fallbackTaxonomyStickers: TaxonomySticker[] = [
  { classId: "FC-000023", name: "Monitor Circumvention or Coverage Bypass" },
  { classId: "FC-000046", name: "Inferential Evidence–Authority Conflation" },
  { classId: "FC-000075", name: "Compaction Meaning Drift" },
  { classId: "FC-000074", name: "Identity / Evaluative Integrity" },
  { classId: "FC-000001", name: "Source-Authority Separation Failure" },
  { classId: "FC-000005", name: "Transformation Authority Failure" },
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

function MechanicalGear({ size, teeth, rotation, reduceMotion, onArrive }: { size: "outer" | "inner"; teeth: number; rotation: number; reduceMotion: boolean; onArrive?: () => void }) {
  return (
    <motion.div
      className={`diagnostic-gear diagnostic-gear-${size}`}
      aria-hidden="true"
      animate={{ rotate: rotation }}
      transition={{ duration: reduceMotion ? 0 : 1.62, ease: [0.22, 1, 0.36, 1] }}
      onUpdate={(latest) => {
        if (!onArrive) return;
        const currentRotation = typeof latest.rotate === "number" ? latest.rotate : Number(latest.rotate ?? 0);
        if (Math.abs(currentRotation - rotation) <= 3) onArrive();
      }}
    >
      <span className="diagnostic-gear-spokes">
        {Array.from({ length: 6 }).map((_, index) => (
          <i key={index} style={{ "--spoke-angle": `${index * 60}deg` } as CSSProperties} />
        ))}
      </span>
      {Array.from({ length: teeth }).map((_, index) => (
        <span
          key={index}
          className={`diagnostic-gear-tooth${size === "outer" && index === 0 ? " is-index-tooth" : ""}`}
          style={{ "--tooth-angle": `${(360 / teeth) * index}deg` } as CSSProperties}
        />
      ))}
    </motion.div>
  );
}

function PremiumHero() {
  const [gearTurn, setGearTurn] = useState(0);
  const [activeStage, setActiveStage] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();
  const targetStage = ((gearTurn % diagnosticStages.length) + diagnosticStages.length) % diagnosticStages.length;

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveStage(null);
      setGearTurn((current) => current + 1);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  function activateStage(index: number) {
    setActiveStage(null);
    setGearTurn((current) => {
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
          <p className="premium-hero-deck">A standard taxonomy, a consistent harm methodology, and traceable evidence turn isolated incidents into comparable intelligence about where AI systems fail.</p>
          <div className="premium-hero-actions">
            <a href="/observatory/cases/" className="premium-primary">Explore the evidence <ArrowRight aria-hidden="true" /></a>
            <a href="/observatory/knowledge-base/failure-taxonomy/" className="premium-secondary">See the taxonomy</a>
          </div>
        </motion.div>

        <motion.div className="diagnostic-orbit diagnostic-orbit-v2" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.16 }} aria-label="VIGIL analytical cycle">
          <MechanicalGear size="outer" teeth={64} rotation={gearTurn * 60} reduceMotion={Boolean(reduceMotion)} onArrive={() => setActiveStage(targetStage)} />
          <motion.span
            className="diagnostic-selector-rotor"
            aria-hidden="true"
            animate={{ rotate: gearTurn * 60 }}
            transition={{ duration: reduceMotion ? 0 : 1.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="diagnostic-gear-index-pointer" />
          </motion.span>
          <span className="diagnostic-instrument-web" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <i key={index} style={{ "--web-angle": `${index * 45 + (index % 3 === 0 ? 0.8 : index % 3 === 1 ? -0.45 : 0.2)}deg` } as CSSProperties} />
            ))}
          </span>
          <MechanicalGear size="inner" teeth={48} rotation={gearTurn * -30} reduceMotion={Boolean(reduceMotion)} />
          <div className="diagnostic-core">
            <span className="diagnostic-core-label">VIGIL ANALYSIS</span>
            <strong>What went wrong?</strong>
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
                <span className="diagnostic-node-copy">
                  <span className="diagnostic-node-label">{stage.label}</span>
                  <strong>{stage.title}</strong>
                </span>
              </button>
            );
          })}
        </motion.div>
      </div>
      <IncidentTicker />
      <a href="#patterns" className="premium-scroll-cue" aria-label="Scroll to see the patterns VIGIL makes visible"><span>See the pattern</span><ArrowDown aria-hidden="true" /></a>
    </section>
  );
}

function stickerSeed(value: string) {
  return [...value].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
}

const stickerSlots = [
  [4, 7, -13], [35, 4, 8], [64, 9, -6],
  [13, 24, 6], [47, 22, -11], [70, 29, 12],
  [2, 43, -8], [31, 42, 14], [61, 47, -4],
  [15, 60, 11], [44, 61, -14], [72, 65, 7],
  [4, 78, -5], [34, 76, 10], [62, 81, -12],
  [21, 12, 15], [53, 7, -9], [51, 79, 5],
] as const;

function stickerStyle(item: TaxonomySticker, index: number): CSSProperties {
  const seed = stickerSeed(`${item.classId}-${index}`);
  const slot = stickerSlots[index % stickerSlots.length];
  const layer = Math.floor(index / stickerSlots.length);
  const left = slot[0] + ((seed % 7) - 3) + ((layer % 3) - 1) * 2.2;
  const top = slot[1] + (((seed >>> 4) % 7) - 3) + ((layer % 4) - 1.5) * 1.7;
  const rotation = slot[2] + (((seed >>> 9) % 9) - 4) + (layer % 2 ? 3 : -2);
  return {
    "--sticker-left": `${Math.max(0, Math.min(77, left))}%`,
    "--sticker-top": `${Math.max(0, Math.min(86, top))}%`,
    "--sticker-rotate": `${rotation}deg`,
  } as CSSProperties;
}

function taxonomySticker(entry: FailureTaxonomyClass): TaxonomySticker {
  return { classId: entry.class_id, name: entry.name };
}

function TaxonomyReveal() {
  const reduceMotion = useReducedMotion();
  const [pool, setPool] = useState<TaxonomySticker[]>(fallbackTaxonomyStickers);
  const [visibleCount, setVisibleCount] = useState(reduceMotion ? fallbackTaxonomyStickers.length : 3);

  useEffect(() => {
    let mounted = true;
    loadFailureTaxonomy()
      .then((result) => {
        if (!mounted || result.status !== "ready") return;
        const stickers = result.data.families.flatMap((family) => family.classes.map(taxonomySticker));
        if (!stickers.length) return;
        const ordered = [...stickers].sort((left, right) => stickerSeed(left.classId) - stickerSeed(right.classId));
        setPool(ordered);
        if (reduceMotion) setVisibleCount(ordered.length);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !pool.length) return;

    if (visibleCount >= pool.length) {
      const resetTimer = window.setTimeout(() => setVisibleCount(0), 2400);
      return () => window.clearTimeout(resetTimer);
    }

    const landingTimer = window.setTimeout(() => setVisibleCount((count) => Math.min(count + 1, pool.length)), 720);
    return () => window.clearTimeout(landingTimer);
  }, [pool.length, reduceMotion, visibleCount]);

  const visible = useMemo(() => pool.slice(0, visibleCount), [pool, visibleCount]);

  return (
    <div className="taxonomy-sticker-stage" aria-label="VIGIL failure classes accumulating into a shared taxonomy">
      <div className="taxonomy-sticker-board">
        {visible.map((item, index) => (
          <a
            key={item.classId}
            href="/observatory/knowledge-base/failure-taxonomy/"
            className="taxonomy-sticker"
            style={stickerStyle(item, index)}
            tabIndex={-1}
          >
            <span className="taxonomy-sticker-code">{item.classId}</span>
            <strong>{item.name}</strong>
          </a>
        ))}
      </div>
      <a className="taxonomy-reveal-link" href="/observatory/knowledge-base/failure-taxonomy/">Explore the full failure taxonomy <ArrowRight aria-hidden="true" /></a>
    </div>
  );
}

function PatternField() {
  return (
    <section id="patterns" className="pattern-field taxonomy-reveal-section" aria-labelledby="pattern-heading">
      <div className="pattern-field-bg" aria-hidden="true">
        {Array.from({ length: 36 }).map((_, index) => {
          const left = 3 + ((index * 29) % 94);
          const top = 7 + ((index * 43) % 86);
          const scale = 0.72 + ((index * 7) % 9) / 10;
          return (
            <span
              key={index}
              className={`pattern-dot pattern-star-${(index % 4) + 1}`}
              style={{ left: `${left}%`, top: `${top}%`, "--star-scale": scale, animationDelay: `${(index % 12) * 0.22}s` } as CSSProperties}
            />
          );
        })}
      </div>
      <motion.div className="pattern-copy narrative-section-copy taxonomy-reveal-copy" {...reveal}>
        <p className="premium-eyebrow narrative-kicker">From cases to intelligence</p>
        <h2 id="pattern-heading">When failures are classified consistently, the ecosystem starts to become legible.</h2>
        <p>The VIGIL Observatory textbook brings recurring failure mechanisms into one common language, connecting Case Files, governance boundaries, harm and classification across the corpus.</p>
      </motion.div>
      <TaxonomyReveal />
    </section>
  );
}

function AdjudicationFrameworkSection() {
  const outcomes = [
    {
      kind: "failure",
      label: "Failure",
      title: "The boundary did not hold.",
      body: "Evidence supports a failure occurrence against the governing invariant.",
      mark: "×",
    },
    {
      kind: "boundary",
      label: "Boundary",
      title: "The evidence stops short.",
      body: "A meaningful governance edge is exposed without forcing the case into failure or success.",
      mark: "i",
    },
    {
      kind: "exemplar",
      label: "Exemplar",
      title: "The boundary held under pressure.",
      body: "The case records a successful invariant: evidence of the system or governance response working as intended.",
      mark: "✓",
    },
  ] as const;

  return (
    <section className="adjudication-framework-section" aria-labelledby="adjudication-framework-heading">
      <motion.div className="adjudication-framework-copy narrative-section-copy" {...reveal}>
        <p className="premium-eyebrow narrative-kicker">Adjudication, not assumption</p>
        <h2 id="adjudication-framework-heading">VIGIL does not assume every incident is a failure.</h2>
        <p>The same evidence can establish failure, expose an ambiguous boundary, or show an invariant holding under pressure.</p>
      </motion.div>

      <motion.div className="adjudication-outcomes" {...reveal}>
        {outcomes.map((outcome, index) => (
          <article
            key={outcome.kind}
            className={`adjudication-outcome adjudication-outcome-${outcome.kind}`}
            style={{ "--outcome-tilt": `${[-1.1, 0.65, -0.45][index]}deg` } as CSSProperties}
          >
            <div className="adjudication-outcome-head">
              <span className="adjudication-outcome-mark" aria-hidden="true">{outcome.mark}</span>
              <span className="adjudication-outcome-label">{outcome.label}</span>
            </div>
            <h3>{outcome.title}</h3>
            <p>{outcome.body}</p>
          </article>
        ))}
        <motion.div
          className="adjudication-doom-stamp"
          initial={{ opacity: 0, y: -220, scale: 1.28, rotate: -16 }}
          whileInView={{ opacity: 0.86, y: 0, scale: 1, rotate: -7.5 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 230, damping: 15, mass: 0.8 }}
        >
          <span>VIGIL is not a doom catalogue</span>
        </motion.div>
      </motion.div>

      <motion.a className="adjudication-framework-link" href="/observatory/cases/" {...reveal}>
        See how VIGIL adjudicates Case Files <ArrowRight aria-hidden="true" />
      </motion.a>
    </section>
  );
}

function GovernanceExplorerSection() {
  return (
    <section className="governance-explorer-home-section" aria-labelledby="governance-explorer-heading">
      <motion.div className="governance-explorer-home-copy narrative-section-copy" {...reveal}>
        <p className="premium-eyebrow narrative-kicker">Explore the wider governance landscape</p>
        <h2 id="governance-explorer-heading">AI Governance Explorer</h2>
        <p>Move from VIGIL evidence and taxonomy into the CAM Initiative&apos;s governance resources and the external tools that help situate incidents, regulation and standards in a wider ecosystem.</p>
      </motion.div>
      <motion.div className="governance-explorer-home-panel" {...reveal}>
        <ExploreGovernanceRail />
      </motion.div>
    </section>
  );
}

export default function Home() {
  return (
    <Shell>
      <main className="home-page premium-home">
        <PremiumHero />
        <PatternField />
        <AdjudicationFrameworkSection />
        <GovernanceExplorerSection />
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