import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { reportStaticPublicationFailure } from "@/lib/staticPublicationFallback";
import { RecoveryIllustration, RECOVERY_HEADLINE, RECOVERY_SUBTITLE, RECOVERY_FOOTNOTE } from "@/lib/publicationRecoveryCopy.mjs";

type Props = { children: ReactNode; fallback: ReactNode };
export class PublicationErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CAM publication render failed", error, info.componentStack);
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function PublicationRecoveryNotice({ basicPath, retryPath = basicPath, observatory = true }: { basicPath: string; retryPath?: string; observatory?: boolean }) {
  return <section role="alert" data-publication-recovery style={{ maxWidth: "48rem", margin: "1.5rem auto", padding: "1.5rem", border: "1px solid currentColor", borderRadius: ".75rem", textAlign: "center" }}>
    <RecoveryIllustration />
    <h2>{RECOVERY_HEADLINE}</h2>
    {observatory && <p>{RECOVERY_SUBTITLE}</p>}
    <p>The interactive view is temporarily unavailable. Published Case Files remain available in basic reading mode; interactive search, filters and charts may be unavailable.</p>
    <p style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}><a href={basicPath + "?view=static"}>Open basic Case Files</a><a href={retryPath}>Retry interactive view</a><a href="/">Home</a></p>
    <p style={{ fontSize: ".875em" }}>{RECOVERY_FOOTNOTE}</p>
  </section>;
}

export function PublicationRecovery() {
  const isCase = /^\/observatory\/cases\/[^/]+\/?$/.test(window.location.pathname);
  const isIndex = /^\/observatory\/(?:cases\/?)?$/.test(window.location.pathname);
  const kind = isCase ? "vigil-case" : "vigil-case-index";
  const hasBasic = (isCase || isIndex) && Boolean(document.querySelector(`[data-static-publication-fallback="${kind}"]`));
  useEffect(() => {
    if (hasBasic) reportStaticPublicationFailure(kind);
  }, [hasBasic, kind]);
  if (hasBasic) return null;
  const basicPath = isCase ? window.location.pathname.replace(/\/?$/, "/") : "/observatory/cases/";
  return <main><PublicationRecoveryNotice basicPath={basicPath} retryPath={window.location.pathname} observatory={isCase || isIndex} /></main>;
}
