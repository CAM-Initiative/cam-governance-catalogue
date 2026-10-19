import { useEffect, useState } from "react";
import "./AdSenseRail.css";

// Public AdSense identifiers are build-time configuration, never credentials.
// Deliberately fail closed until site approval, privacy messaging and consent
// arrangements are completed and the publisher explicitly enables advertising.
const clientId = String(import.meta.env.VITE_ADSENSE_CLIENT_ID ?? "").trim();
const slotId = String(import.meta.env.VITE_ADSENSE_SLOT ?? "").trim();

export const adsenseRailEnabled =
  import.meta.env.VITE_ADSENSE_ENABLED === "true" &&
  /^ca-pub-\d{16}$/.test(clientId) &&
  /^\d{10}$/.test(slotId);

const editorialRoutes = new Set([
  "/", "/about", "/knowledge-base", "/datasets", "/observatory",
  "/observatory/cases", "/observatory/alignment-taxonomy",
  "/observatory/harm-impact-assessment", "/observatory/ai-governance-standards",
]);

/** Never advertise on print reports, policy/legal pages, or missing routes. */
export function adRailEligibleRoute(location: string) {
  const path = location.replace(/\/+$/, "") || "/";
  return editorialRoutes.has(path) ||
    path.startsWith("/observatory/cases/") ||
    path.startsWith("/observatory/alignment-taxonomy/") ||
    path.startsWith("/observatory/ai-governance-standards/");
}

export function AdSenseRail() {
  // Never request hidden ads on narrow screens. A mobile visitor neither
  // downloads the ad script nor gets a blank reserved sidebar.
  const [isWideDesktop, setIsWideDesktop] = useState(false);

  useEffect(() => {
    if (!adsenseRailEnabled) return;
    const query = window.matchMedia("(min-width: 1600px)");
    const update = () => setIsWideDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!adsenseRailEnabled || !isWideDesktop) return;

    if (!document.querySelector('script[data-cam-adsense="true"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      script.dataset.camAdsense = "true";
      document.head.appendChild(script);
    }

    const adWindow = window as Window & { adsbygoogle?: Record<string, never>[] };
    // Google's queue supports an ad unit before or after the script loads.
    (adWindow.adsbygoogle ??= []).push({});
  }, [isWideDesktop]);

  if (!adsenseRailEnabled || !isWideDesktop) return null;

  return (
    <aside className="site-ad-rail" aria-label="Advertisement">
      <span className="site-ad-rail-label">Advertisement</span>
      <ins
        className="adsbygoogle site-ad-rail-unit"
        style={{ display: "inline-block", width: 160, height: 600 }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
      />
      <p className="site-ad-rail-disclosure">
        Advertising helps keep the research free. Advertisers have no role in VIGIL assessments.
      </p>
    </aside>
  );
}
