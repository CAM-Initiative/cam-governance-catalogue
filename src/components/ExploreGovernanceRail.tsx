import { useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Database, ExternalLink, Scale } from "lucide-react";

const externalResources = [
  {
    tab: "REG",
    label: "AI Regulations Tracker",
    category: "Regulation",
    description: "Compare AI laws, regulatory proposals and policy developments across jurisdictions.",
    href: "https://regulations.ai/",
    icon: Scale,
  },
  {
    tab: "INC",
    label: "AI Incident Database",
    category: "Incident evidence",
    description: "Search reported AI incidents and harms documented across systems, sectors and jurisdictions.",
    href: "https://incidentdatabase.ai/",
    icon: Database,
  },
  {
    tab: "OECD",
    label: "OECD AI Incidents Monitor",
    category: "International monitoring",
    description: "Review internationally monitored AI incidents, hazards and emerging risk patterns.",
    href: "https://oecd.ai/en/incidents",
    icon: Database,
  },
  {
    tab: "NIST",
    label: "NIST AI Resource Center",
    category: "Risk & standards",
    description: "Access NIST AI risk-management frameworks, profiles, guidance and supporting resources.",
    href: "https://airc.nist.gov/",
    icon: BookOpen,
  },
] as const;

export function ExploreGovernanceRail() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = externalResources[activeIndex];
  const ActiveIcon = active.icon;
  const showCard = (index: number) => {
    const count = externalResources.length;
    setActiveIndex((index + count) % count);
  };

  return (
    <aside aria-label="External governance references" className="home-governance-panel home-governance-rolodex">
      <div className="home-governance-rolodex-heading">
        <div>
          <p className="home-governance-rolodex-eyebrow">Reference index</p>
          <h2>External Governance References</h2>
          <p className="home-governance-rolodex-intro">A growing card index of external governance tools, incident monitors, standards and regulatory references.</p>
        </div>
        <span className="home-governance-rolodex-count" aria-label={`Reference ${activeIndex + 1} of ${externalResources.length}`}>
          {String(activeIndex + 1).padStart(2, "0")} / {String(externalResources.length).padStart(2, "0")}
        </span>
      </div>

      <div className="home-governance-rolodex-machine">
        <div className="home-governance-rolodex-tabs" role="tablist" aria-label="External governance reference cards">
          {externalResources.map((resource, index) => (
            <button
              aria-controls="home-governance-rolodex-card"
              aria-selected={activeIndex === index}
              className={activeIndex === index ? "is-active" : undefined}
              id={`home-governance-rolodex-tab-${index}`}
              key={resource.label}
              onClick={() => showCard(index)}
              role="tab"
              title={resource.label}
              type="button"
            >
              {resource.tab}
            </button>
          ))}
        </div>

        <div className="home-governance-rolodex-stack">
          <span className="home-governance-rolodex-stack-sheet home-governance-rolodex-stack-sheet-back" aria-hidden="true" />
          <span className="home-governance-rolodex-stack-sheet home-governance-rolodex-stack-sheet-middle" aria-hidden="true" />

          <article
            aria-labelledby={`home-governance-rolodex-tab-${activeIndex}`}
            className="home-governance-rolodex-card"
            id="home-governance-rolodex-card"
            key={active.label}
            role="tabpanel"
          >
            <span className="home-governance-rolodex-hole home-governance-rolodex-hole-left" aria-hidden="true" />
            <span className="home-governance-rolodex-hole home-governance-rolodex-hole-right" aria-hidden="true" />

            <p className="home-governance-rolodex-category">{active.category}</p>
            <div className="home-governance-rolodex-card-title">
              <ActiveIcon aria-hidden="true" />
              <h3>{active.label}</h3>
            </div>
            <p className="home-governance-rolodex-copy">{active.description}</p>
            <a className="home-governance-rolodex-link" href={active.href} rel="noreferrer" target="_blank">
              Open reference <ExternalLink aria-hidden="true" />
            </a>
          </article>
        </div>

        <span className="home-governance-rolodex-spindle" aria-hidden="true" />
      </div>

      <div className="home-governance-rolodex-controls">
        <button onClick={() => showCard(activeIndex - 1)} type="button">
          <ChevronLeft aria-hidden="true" />
          Previous
        </button>
        <span>{active.category}</span>
        <button onClick={() => showCard(activeIndex + 1)} type="button">
          Next
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
