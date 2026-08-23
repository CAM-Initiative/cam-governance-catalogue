import { ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";

// Legacy Failure Modes routes resolve into the FM-centred Case Files surface.
const links = [
  { href: "/observatory/cases", label: "Case Files", subtitle: "AI failure mode investigations", matches: ["/observatory/cases", "/observatory/failure-modes", "/observatory/reports", "/observatory/incidents", "/observatory/repairs", "/vigil", "/observatory"] },
  { href: "/observatory/knowledge-base", label: "Knowledge Base", subtitle: "What do we know now?", matches: ["/observatory/knowledge-base", "/observatory/lessons"] },
];

export function VigilObservatoryNav() {
  const [location] = useLocation();
  return (
    <section className="vigil-local-nav vigil-app-shell" aria-label="VIGIL Observatory">
      <div className="container mx-auto max-w-[1500px] px-4 sm:px-6 md:px-10">
        <div className="vigil-app-shell-inner">
          <Link href="/observatory/about" className="vigil-app-identity">
            <span className="vigil-app-mark" aria-hidden="true"><ShieldCheck /></span>
            <span className="min-w-0">
              <span className="vigil-app-name-line">
                <span className="vigil-app-name">VIGIL Observatory</span>
                <span className="cam-development-status">Public beta · prototype</span>
              </span>
              <span className="vigil-app-tagline">Observation → Record → Classification → Diagnosis → Repair → Learn</span>
            </span>
          </Link>
          <nav className="hide-scrollbar vigil-app-nav" aria-label="Observatory sections">
            {links.map((link) => {
              const active = link.matches.some((prefix) => location === prefix || (prefix !== "/observatory" && location.startsWith(`${prefix}/`)));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`vigil-local-nav-link vigil-app-nav-link ${active ? "is-active" : ""}`}
                >
                  <span className="vigil-app-nav-label">{link.label}</span>
                  <span className="vigil-app-nav-subtitle">{link.subtitle}</span>
                </Link>
              );
            })}
            <span className="vigil-app-nav-placeholder" aria-hidden="true" />
          </nav>
        </div>
      </div>
    </section>
  );
}
