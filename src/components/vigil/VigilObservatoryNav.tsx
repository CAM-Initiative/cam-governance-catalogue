import { Link, useLocation } from "wouter";

const links = [
  { href: "/observatory/failure-modes", label: "Failure Modes", matches: ["/observatory/failure-modes", "/vigil"] },
  { href: "/observatory/incidents", label: "Incidents & Observations", matches: ["/observatory/incidents"] },
  { href: "/observatory/repairs", label: "Repairs", matches: ["/observatory/repairs"] },
  { href: "/observatory/knowledge-base", label: "Knowledge Base", matches: ["/observatory/knowledge-base"] },
  { href: "/observatory/ledger", label: "Full Ledger", matches: ["/observatory/ledger", "/observatory"] },
];

export function VigilObservatoryNav() {
  const [location] = useLocation();
  return (
    <section className="vigil-local-nav" aria-label="VIGIL Observatory">
      <div className="container mx-auto px-4 py-4 sm:px-6 md:px-10">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">VIGIL Observatory</p>
            <p className="mt-1 text-sm text-muted-foreground">Evidence → diagnosis → repair → learning</p>
          </div>
          <nav className="hide-scrollbar flex max-w-full gap-1 overflow-x-auto pb-1" aria-label="Observatory sections">
            {links.map((link) => {
              const active = link.matches.some((prefix) => location === prefix || (prefix !== "/observatory" && location.startsWith(`${prefix}/`)));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`vigil-local-nav-link ${active ? "is-active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </section>
  );
}
