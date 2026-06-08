import { ReactNode, useEffect, useState } from "react";
import { Coffee, Mail } from "lucide-react";
import { Link, useLocation } from "wouter";

const footerLinks = [
  { href: "/", label: "Home", internal: true },
  { href: "/about", label: "About", internal: true },
  { href: "/catalogue", label: "Catalogue", internal: true },
  { href: "/constitution", label: "Constitution", internal: true },
  { href: "/vigil", label: "VIGIL", internal: true },
];

const mobileLinks = [
  { href: "/", label: "Home", internal: true },
  { href: "/about", label: "About", internal: true },
  { href: "/catalogue", label: "Catalogue", internal: true },
  { href: "/constitution", label: "Constitution", internal: true },
  { href: "/vigil", label: "Observatory / VIGIL", internal: true },
  { href: "mailto:ethics@cam-initiative.org", label: "Contact" },
];

const homeLinks = [
  { href: "/", label: "Overview" },
  { href: "/about", label: "About" },
];

const constitutionLinks = [
  { href: "/constitution", label: "Overview" },
  { href: "/constitution/runtime", label: "Runtime Model" },
  { href: "/constitution/relational", label: "Relational Governance" },
  { href: "/constitution/transition", label: "Transitional Architecture" },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHomeActive = location === "/" || location === "/about";
  const isConstitutionActive = location === "/constitution" || location.startsWith("/constitution/");

  const links = [
    { href: "/catalogue", label: "Catalogue", active: location === "/catalogue" },
    { href: "/vigil", label: "Observatory", active: location === "/vigil" || location === "/observatory" },
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
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt="Aeon Governance Lab"
              className="w-7 h-7 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              style={{ filter: "drop-shadow(0 0 1px rgba(184,147,90,0.3))" }}
            />
            <span className="font-mono text-[12px] tracking-[0.18em] uppercase text-primary font-semibold">
              Aeon Governance Lab
            </span>
          </Link>

          <button
            type="button"
            className="inline-flex items-center rounded-lg border border-border bg-card/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            aria-controls="mobile-site-navigation"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            Menu
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <div className="group relative">
              <Link
                href="/"
                className={`text-[12px] font-mono tracking-[0.14em] uppercase transition-colors ${
                  isHomeActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Home
              </Link>
              <div className="invisible absolute left-0 top-full min-w-44 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-xl border border-[rgba(184,147,90,0.38)] bg-[hsl(36_55%_98%)] p-2 shadow-2xl ring-1 ring-[rgba(184,147,90,0.16)]">
                  {homeLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.13em] transition-colors ${
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
            <div className="group relative">
              <Link
                href="/constitution"
                className={`text-[12px] font-mono tracking-[0.14em] uppercase transition-colors ${
                  isConstitutionActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Constitution
              </Link>
              <div className="invisible absolute left-0 top-full min-w-56 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-xl border border-[rgba(184,147,90,0.38)] bg-[hsl(36_55%_98%)] p-2 shadow-2xl ring-1 ring-[rgba(184,147,90,0.16)]">
                  {constitutionLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.13em] transition-colors ${
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
                className={`text-[12px] font-mono tracking-[0.14em] uppercase transition-colors ${
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
              className="text-[12px] font-mono tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              GitHub ↗
            </a>
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
                      location === link.href || (link.href === "/constitution" && isConstitutionActive)
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

      <footer className="mt-auto border-t border-primary/25 bg-[hsl(36_48%_95%)] py-7 text-foreground shadow-[inset_0_1px_0_hsl(38_62%_40%/0.08)] md:py-8">
        <div className="container mx-auto px-6 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
            <div className="max-w-2xl space-y-2 text-center md:text-left">
              <p className="text-base font-semibold leading-relaxed text-foreground md:text-[17px]">
                Public governance infrastructure for artificial intelligence, synthetic agents, and runtime governance systems
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                © 2026 CAM Initiative. All rights reserved. Public access is subject to citation and applicable licence terms.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-xl border border-primary/15 bg-card/55 px-5 py-4 shadow-sm md:items-end md:border-transparent md:bg-transparent md:px-0 md:py-0 md:shadow-none">
              <nav aria-label="Footer" className="flex flex-nowrap justify-center gap-x-4 gap-y-2 md:justify-end md:gap-x-6">
                {footerLinks.map((link) => (
                  link.internal ? (
                    <Link key={link.href} href={link.href} className="whitespace-nowrap font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-sm">
                      {link.label}
                    </Link>
                  ) : (
                    <a key={link.href} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined} className="whitespace-nowrap font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-sm">
                      {link.label}
                    </a>
                  )
                ))}
              </nav>

              <address className="not-italic">
                <div className="flex flex-wrap justify-center gap-3 md:justify-end">
                  <a href="mailto:ethics@cam-initiative.org" aria-label="Contact" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-card/70 text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a href="https://x.com/CAM_Initiative" aria-label="CAM Initiative updates on X" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-card/70 text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <span className="font-serif text-base leading-none" aria-hidden="true">𝕏</span>
                  </a>
                  <a href="https://buymeacoffee.com/cam_initiative" aria-label="Support CAM Initiative" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-card/70 text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <Coffee className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </address>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
