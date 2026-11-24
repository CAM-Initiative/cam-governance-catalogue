export type StaticPublicationFallbackKind = "vigil-case" | "vigil-case-index";

function fallbackSelector(kind: StaticPublicationFallbackKind) {
  return `[data-static-publication-fallback="${kind}"]`;
}

export function hasStaticPublicationFallback(kind: StaticPublicationFallbackKind) {
  return typeof document !== "undefined" && Boolean(document.querySelector(fallbackSelector(kind)));
}

export function retireStaticPublicationFallback(kind: StaticPublicationFallbackKind) {
  if (typeof document === "undefined") return;
  document.querySelector(fallbackSelector(kind))?.remove();
}

export function reportStaticPublicationFailure(kind: StaticPublicationFallbackKind) {
  if (typeof document === "undefined") return;
  const status = document.querySelector(fallbackSelector(kind) + " [data-vigil-fallback-status]");
  if (status) status.textContent = "The interactive view is unavailable. You can continue reading the published basic version below, or retry.";
}
