import { useState, type CSSProperties } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Database, ExternalLink, Scale } from "lucide-react";

const externalResources = [
  {
    label: "AI Regulations Tracker",
    category: "Regulation",
    description: "Compare AI laws, regulatory proposals and policy developments across jurisdictions.",
    href: "https://regulations.ai/",
    icon: Scale,
  },
  {
    label: "AI Incident Database",
    category: "Incident evidence",
    description: "Search reported AI incidents and harms documented across systems, sectors and jurisdictions.",
    href: "https://incidentdatabase.ai/",
    icon: Database,
  },
  {
    label: "OECD AI Incidents Monitor",
    category: "International monitoring",
    description: "Review internationally monitored AI incidents, hazards and emerging risk patterns.",
    href: "https://oecd.ai/en/incidents",
    icon: Database,
  },
  {
    label: "NIST AI Resource Center",
    category: "Risk & standards",
    description: "Access NIST AI risk-management frameworks, profiles, guidance and supporting resources.",
    href: "https://airc.nist.gov/",
    icon: BookOpen,
  },
] as const;

const dividerLabels = ["A", "B–M", "N", "O–Z"] as const;

export function ExploreGovernanceRail() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [wheelTurn, setWheelTurn] = useState(0);
  const active = externalResources[activeIndex];
  const ActiveIcon = active.icon;

  const rotate = (delta: number) => {
    setDirection(delta > 0 ? "next" : "previous");
    setWheelTurn((value) => value + delta * 42);
    setActiveIndex((value) => (value + delta + externalResources.length) % externalResources.length);
  };

  const machineStyle = {
    "--wheel-turn": `${wheelTurn}deg`,
  } as CSSProperties;

  return (
    <aside aria-label="External governance references" className="home-governance-panel home-governance-rotary-index">
      <div className="home-governance-rotary-scene">
        <div className="home-governance-rotary-machine" style={machineStyle}>
          <span className="home-governance-rotary-base" aria-hidden="true" />
          <span className="home-governance-rotary-arm home-governance-rotary-arm-left" aria-hidden="true" />
          <span className="home-governance-rotary-arm home-governance-rotary-arm-right" aria-hidden="true" />

          <button
            aria-label="Show previous external governance reference"
            className="home-governance-rotary-wheel home-governance-rotary-wheel-left"
            onClick={() => rotate(-1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" />
          </button>

          <button
            aria-label="Show next external governance reference"
            className="home-governance-rotary-wheel home-governance-rotary-wheel-right"
            onClick={() => rotate(1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" />
          </button>

          <div className="home-governance-rotary-deck">
            <div className="home-governance-rotary-rear-stack" aria-hidden="true">
              {Array.from({ length: 9 }, (_, index) => (
                <span
                  className="home-governance-rotary-rear-card"
                  key={index}
                  style={{ "--sheet-index": index } as CSSProperties}
                />
              ))}
            </div>

            <div className="home-governance-rotary-dividers" aria-hidden="true">
              {dividerLabels.map((label, index) => (
                <span
                  className="home-governance-rotary-divider"
                  key={label}
                  style={{ "--divider-index": index } as CSSProperties}
                >
                  <b>{label}</b>
                </span>
              ))}
            </div>

            <article
              className={`home-governance-rotary-card is-${direction}`}
              key={`${active.label}-${wheelTurn}`}
            >
              <div className="home-governance-rotary-card-meta">
                <span>{active.category}</span>
                <span>{String(activeIndex + 1).padStart(2, "0")} / {String(externalResources.length).padStart(2, "0")}</span>
              </div>

              <div className="home-governance-rotary-card-title">
                <ActiveIcon aria-hidden="true" />
                <h3>{active.label}</h3>
              </div>

              <p className="home-governance-rotary-copy">{active.description}</p>

              <a className="home-governance-rotary-link" href={active.href} rel="noreferrer" target="_blank">
                Open reference <ExternalLink aria-hidden="true" />
              </a>

              <span className="home-governance-rotary-slot home-governance-rotary-slot-left" aria-hidden="true" />
              <span className="home-governance-rotary-slot home-governance-rotary-slot-right" aria-hidden="true" />
            </article>
          </div>

          <span className="home-governance-rotary-spindle" aria-hidden="true" />

          <div className="home-governance-rotary-nameplate">
            <span>External Governance References</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
