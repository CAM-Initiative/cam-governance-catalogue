import { ReactNode, useEffect, useState } from "react";
import { Coffee, Github, Mail, Newspaper } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

const mobileLinks = [
  { href: "/", label: "Home", internal: true },
  { href: "/about/", label: "About", internal: true },
  { href: "/policy/", label: "Policy", internal: true },
  { href: "/observatory/cases/", label: "Case Files", internal: true },
  { href: "/observatory/knowledge-base/", label: "Knowledge Base", internal: true },
  { href: "/observatory/knowledge-base/failure-taxonomy/", label: "Alignment Taxonomy", internal: true },
  { href: "/observatory/severity-methodology/", label: "Harm Impact Assessment", internal: true },
  { href: "/observatory/knowledge-base/standards-sources/", label: "AI Governance Standards", internal: true },
  { href: "/datasets/", label: "Datasets", internal: true },
  { href: "/licensing/", label: "Copyright & Licence", internal: true },
  { href: "/privacy/", label: "Privacy", internal: true },
  { href: "mailto:ethics@cam-initiative.org", label: "Contact" },
];

const homeLinks = [
  { href: "/", label: "Overview" },
  { href: "/about/", label: "About" },
  { href: "/policy/", label: "Policy" },
  { href: "/licensing/", label: "Copyright & Licence" },
  { href: "/privacy/", label: "Privacy" },
];

const vigilLinks = [
  { href: "/observatory/cases/", label: "VIGIL Observatory Case Files", navLabel: "Case Files" },
  { href: "/observatory/knowledge-base/", label: "VIGIL Observatory Knowledge Base", navLabel: "Knowledge Base" },
  { href: "/observatory/knowledge-base/failure-taxonomy/", label: "VIGIL Observatory Alignment Taxonomy", navLabel: "Alignment Taxonomy" },
  { href: "/observatory/severity-methodology/", label: "Harm Impact Assessment", navLabel: "Harm Impact Assessment" },
  { href: "/observatory/knowledge-base/standards-sources/", label: "VIGIL Observatory AI Governance Standards", navLabel: "AI Governance Standards" },
];

function navActive(location: string, href: string) {
  return location === href || (href.startsWith("/observatory/") && location.startsWith(href));
}

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHomeActive = location === "/" || location === "/about/" || location === "/policy/" || location === "/licensing/" || location === "/privacy/";
  const isVigilActive = location === "/observatory/" || location.startsWith("/observatory/");
  const isDatasetsActive = location === "/datasets/" || location.startsWith("/datasets/");

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="site-frame">
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="site-brand">
            <img src="/cam-triskelion.svg" alt="" className="site-brand-mark" />
            <span className="site-brand-name">CAM Initiative</span>
          </Link>

          <div className="site-mobile-controls">
            <ThemeToggle />
            <button
              type="button"
              className="site-menu-button"
              aria-controls="mobile-site-navigation"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              Menu
            </button>
          </div>

          <nav className="site-desktop-nav" aria-label="Primary navigation">
            <div className="site-nav-group">
              <Link href="/" className={isHomeActive ? "site-nav-root is-active" : "site-nav-root"}>
                Home
              </Link>
              <div className="site-nav-dropdown-wrap">
                <div className="site-nav-dropdown">
                  {homeLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={location === link.href ? "site-nav-dropdown-link is-active" : "site-nav-dropdown-link"}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="site-nav-group">
              <Link
                href="/observatory/knowledge-base/"
                className={isVigilActive ? "site-nav-root is-active" : "site-nav-root"}
              >
                VIGIL Observatory
              </Link>
              <div className="site-nav-dropdown-wrap site-nav-dropdown-wrap--wide">
                <div className="site-nav-dropdown">
                  {vigilLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-label={link.label}
                      className={navActive(location, link.href) ? "site-nav-dropdown-link is-active" : "site-nav-dropdown-link"}
                    >
                      {link.navLabel}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/datasets/"
              className={isDatasetsActive ? "site-nav-root is-active" : "site-nav-root"}
            >
              Datasets
            </Link>
            <ThemeToggle />
          </nav>
        </div>

        {isMobileMenuOpen && (
          <nav id="mobile-site-navigation" aria-label="Mobile navigation" className="site-mobile-nav">
            <div className="site-mobile-nav-inner">
              {mobileLinks.map((link) => (
                link.internal ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={navActive(location, link.href) ? "site-mobile-nav-link is-active" : "site-mobile-nav-link"}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.href} href={link.href} className="site-mobile-nav-link">
                    {link.label}
                  </a>
                )
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="site-main">
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-copy">
            <span>© 2026 CAM Initiative. All rights reserved.</span>
            <span aria-hidden="true">·</span>
            <Link href="/licensing/">Copyright & Licence</Link>
            <span aria-hidden="true">·</span>
            <Link href="/privacy/">Privacy</Link>
          </div>

          <nav aria-label="Footer" className="site-social-links">
            <a href="mailto:ethics@cam-initiative.org" aria-label="Contact" className="site-social-link">
              <Mail aria-hidden="true" />
            </a>
            <a href="https://x.com/CAM_Initiative" aria-label="CAM Initiative updates on X" target="_blank" rel="noreferrer" className="site-social-link">
              <span className="site-social-x" aria-hidden="true">𝕏</span>
            </a>
            <a href="https://substack.com/@caminitiative" aria-label="Substack" target="_blank" rel="noreferrer" className="site-social-link">
              <Newspaper aria-hidden="true" />
            </a>
            <a href="https://github.com/CAM-Initiative/Vigil" aria-label="VIGIL Observatory repository on GitHub" target="_blank" rel="noreferrer" className="site-social-link">
              <Github aria-hidden="true" />
            </a>
            <a href="https://buymeacoffee.com/cam_initiative" aria-label="Support CAM Initiative" target="_blank" rel="noreferrer" className="site-social-link">
              <Coffee aria-hidden="true" />
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
