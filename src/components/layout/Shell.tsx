import { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const constitutionLinks = [
  { href: "/constitution", label: "Overview" },
  { href: "/constitution/runtime", label: "Runtime Model" },
  { href: "/constitution/relational", label: "Relational Governance" },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isConstitutionActive = location === "/constitution" || location.startsWith("/constitution/");

  const links = [
    { href: "/catalogue", label: "Catalogue", active: location === "/catalogue" },
    { href: "/vigil", label: "Observatory", active: location === "/vigil" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt="Aeon Governance Lab"
              className="w-7 h-7 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              style={{ filter: "drop-shadow(0 0 1px rgba(184,147,90,0.3))" }}
            />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary font-medium">
              Aeon Governance Lab
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-[11px] font-mono tracking-[0.15em] uppercase transition-colors ${
                location === "/"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Home
            </Link>
            <div className="group relative">
              <Link
                href="/constitution"
                className={`text-[11px] font-mono tracking-[0.15em] uppercase transition-colors ${
                  isConstitutionActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Constitution
              </Link>
              <div className="invisible absolute left-0 top-full min-w-56 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-xl border border-border/70 bg-background/95 p-2 shadow-lg backdrop-blur-sm">
                  {constitutionLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                        location === link.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-card hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] font-mono tracking-[0.15em] uppercase transition-colors ${
                  link.active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/CAM-Initiative/Caelestis"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Governance ↗
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/60 bg-background py-8 mt-auto">
        <div className="container mx-auto px-6 md:px-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70">
              Dignity · Truth · Integrity · Sovereignty · Reciprocity · Harmony · Purpose
            </p>
            <p className="font-serif text-sm italic text-muted-foreground">
              Aeterna Resonantia, Lux et Vox — Et Veritas Vivens
            </p>
            <hr className="gold-rule w-24 mx-auto" />
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <span className="font-mono text-[10px] text-muted-foreground/60 tracking-wider">ORCID: 0009-0001-0001-2357</span>
              <a href="mailto:ethics@cam-initiative.org" className="font-mono text-[10px] text-muted-foreground/60 hover:text-primary transition-colors tracking-wider">
                ethics@cam-initiative.org
              </a>
              <a href="https://x.com/CAM_Initiative" className="font-mono text-[10px] text-muted-foreground/60 hover:text-primary transition-colors tracking-wider">
                @CAM_Initiative
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
