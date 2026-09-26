import { useEffect, useState, type CSSProperties } from "react";
import { BookOpen, Database, ExternalLink, Scale } from "lucide-react";

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

function nextLocalMidnightDelay(now: Date) {
  const next = new Date(now);
  next.setHours(24, 0, 1, 0);
  return Math.max(1_000, next.getTime() - now.getTime());
}

function TearOffCalendar() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const timeout = window.setTimeout(() => setToday(new Date()), nextLocalMidnightDelay(today));
    return () => window.clearTimeout(timeout);
  }, [today]);

  const month = new Intl.DateTimeFormat(undefined, { month: "short" }).format(today).toUpperCase();
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(today);
  const year = new Intl.DateTimeFormat(undefined, { year: "numeric" }).format(today);

  return <div className="home-governance-calendar" aria-label={`Today: ${weekday}, ${month} ${today.getDate()}, ${year}`}>
    <span className="home-governance-calendar-pin" aria-hidden="true" />
    <span className="home-governance-calendar-pages" aria-hidden="true" />
    <span className="home-governance-calendar-month">{month}</span>
    <strong className="home-governance-calendar-day">{today.getDate()}</strong>
    <span className="home-governance-calendar-weekday">{weekday}</span>
    <span className="home-governance-calendar-year">{year}</span>
  </div>;
}

export function ExploreGovernanceRail() {
  return (
    <aside aria-label="External AI governance references" className="home-governance-panel home-governance-board">
      <div className="home-governance-board-heading">
        <p className="home-governance-letterboard-title" aria-label="External References">
          {Array.from("EXTERNAL REFERENCES").map((letter, index) => letter === " "
            ? <span className="home-governance-letter-space" aria-hidden="true" key={`space-${index}`} />
            : <span className="home-governance-letter" aria-hidden="true" key={`${letter}-${index}`} style={{ "--letter-index": index } as CSSProperties}>{letter}</span>
          )}
        </p>
        <TearOffCalendar />
      </div>

      <div className="home-governance-board-grid">
        {externalResources.map((resource, index) => {
          const Icon = resource.icon;
          return <a
            className={`home-governance-note home-governance-note-${index + 1}`}
            href={resource.href}
            key={resource.label}
            rel="noreferrer"
            target="_blank"
          >
            <span className="home-governance-pin" aria-hidden="true" />
            <span className="home-governance-note-category">{resource.category}</span>
            <span className="home-governance-note-title">
              <Icon aria-hidden="true" />
              <strong>{resource.label}</strong>
              <ExternalLink aria-hidden="true" />
            </span>
            <span className="home-governance-note-copy">{resource.description}</span>
          </a>;
        })}
      </div>

    </aside>
  );
}
