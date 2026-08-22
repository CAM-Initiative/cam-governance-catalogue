import { ReactNode, useEffect, useState } from "react";
import { Coffee, Mail, Newspaper } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

const mobileLinks = [
  { href: "/", label: "Home", internal: true },
  { href: "/observatory/cases", label: "VIGIL Case Files", internal: true },
  { href: "/about", label: "About", internal: true },
  { href: "/privacy", label: "Privacy", internal: true },
  { href: "/constitution", label: "Constitution", internal: true },
  { href: "/catalogue", label: "Catalogue", internal: true },
  { href: "/policy", label: "Policy Papers", internal: true },
  { href: "/observatory/about", label: "About VIGIL", internal: true },
  { href: "/observatory/knowledge-base", label: "VIGIL Knowledge Base", internal: true },
  { href: "/observatory/ledger", label: "VIGIL Full Ledger", internal: true },
  { href: "mailto:ethics@cam-initiative.org", label: "Contact" },
];

const homeLinks = [
  { href: "/", label: "Overview" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
];

const constitutionLinks = [
  { href: "/constitution", label: "Overview" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/constitution/relational", label: "Relational Governance" },
  { href: "/constitution/transition", label: "Transitional Architecture" },
];

const vigilLinks = [
  { href: "/observatory/about", label: "About VIGIL" },
  { href: "/observatory/cases", label: "Case Files" },
  { href: "/observatory/knowledge-base", label: "Knowledge Base" },
  { href: "/observatory/ledger", label: "Full Ledger" },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHomeActive = location === "/" || location === "/about" || location === "/privacy";
  const isConstitutionActive = location === "/catalogue" || location === "/constitution" || location.startsWith("/constitution/");
  const isVigilActive = location === "/vigil" || location === "/observatory" || location.startsWith("/observatory/") || location.startsWith("/vigil/");

  const links = [
    { href: "/policy", label: "Policy", active: location === "/policy" || location.startsWith("/policy/") },
  ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/cam-triskelion.svg"
              alt="CAM Initiative"
              className="w-8 h-8 object-contain opacity-95 group-hover:opacity-100 transition-opacity"
            />
            <span className="font-mono text-[12px] tracking-[0.18em] uppercase text-primary font-semibold">
              CAM Initiative
            </span>
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-border bg-card/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-controls="mobile-site-navigation"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              Menu
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <div className="group relative">
              <Link
                href="/"
                className={`text-[12px] font-mono tracking-[0.14em] uppercase transition-colors ${
                  isHomeActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Home
              </Link>
              <div className="invisible absolute left-0 top-full min-w-44 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-xl border border-primary/35 bg-popover p-2 shadow-2xl ring-1 ring-primary/15">
                  {homeLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.13em] transition-colors ${
                        location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-card hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="group relative">
              <Link
                href="/observatory/cases"
                className={`text-[12px] font-mono tracking-[0.14em] uppercase transition-colors ${
                  isVigilActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                VIGIL
              </Link>
              <div className="invisible absolute left-0 top-full min-w-64 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-xl border border-primary/35 bg-background p-2 shadow-2xl ring-1 ring-primary/15">
                  {vigilLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.13em] transition-colors ${
                        location === link.href || location.startsWith(`${link.href}/`)
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

            <div className="group relative">
              <Link
                href="/constitution"
                className={`text-[12px] font-mono tracking-[0.14em] uppercase transition-colors ${
                  isConstitutionActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Constitution
              </Link>
              <div className="invisible absolute left-0 top-full min-w-56 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-xl border border-primary/35 bg-popover p-2 shadow-2xl ring-1 ring-primary/15">
                  {constitutionLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.13em] transition-colors ${
                        location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-card hover:text-foreground"
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
                className={`text-[12px] font-mono tracking-[0.14em] uppercase transition-colors ${
                  link.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>
        </div>

        {isMobileMenuOpen && (
          <nav id="mobile-site-navigation" aria-label="Mobile navigation" className="border-t border-border/70 bg-card px-6 py-3 shadow-md md:hidden">
            <div className="container mx-auto grid gap-1">
              {mobileLinks.map((link) => (
                link.internal ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 font-mono text-[12px] uppercase tracking-[0.13em] transition-colors ${
                      location === link.href ||
                      (link.href === "/constitution" && isConstitutionActive) ||
                      (link.href.startsWith("/observatory/") && location.startsWith(link.href))
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    className="rounded-lg px-3 py-2 font-mono text-[12px] uppercase tracking-[0.13em] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  >
                    {link.label}
                  </a>
                )
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="mt-auto border-t border-primary/25 bg-card py-6 text-foreground shadow-sm md:py-7">
        <div className="container mx-auto min-w-0 px-4 sm:px-6 md:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-10">
            <div className="min-w-0 max-w-2xl space-y-2 text-center md:text-left">
              <p className="text-base font-semibold leading-relaxed text-foreground md:text-[17px]">
                Governance architecture, evidence-led repair, and public policy for artificial intelligence and synthetic agents.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                © 2026 CAM Initiative. All rights reserved.
              </p>
            </div>

            <nav aria-label="Footer" className="flex w-full max-w-full flex-wrap justify-center gap-3 md:w-auto md:justify-end">
              <a href="mailto:ethics@cam-initiative.org" aria-label="Contact" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-card/70 text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="https://x.com/CAM_Initiative" aria-label="CAM Initiative updates on X" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-card/70 text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <span className="font-serif text-base leading-none" aria-hidden="true">𝕏</span>
              </a>
              <a href="https://substack.com" aria-label="Substack" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-card/70 text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <Newspaper className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="https://buymeacoffee.com/cam_initiative" aria-label="Support CAM Initiative" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-card/70 text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <Coffee className="h-4 w-4" aria-hidden="true" />
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
