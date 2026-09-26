import type { ReactNode } from "react";

export type VigilObservatoryMastheadMode = "collection" | "reference" | "record";
export type VigilObservatoryMastheadVisual = "cases" | "taxonomy" | "harm" | "policy" | "standards" | "knowledge" | "datasets";

export type VigilObservatoryMastheadMetadata = {
  label: string;
  value: ReactNode;
  mono?: boolean;
};

type VigilObservatoryMastheadProps = {
  id?: string;
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  contextLabel?: string;
  metadata?: VigilObservatoryMastheadMetadata[];
  contextFooter?: ReactNode;
  titleId?: string;
  mode?: VigilObservatoryMastheadMode;
  visual?: VigilObservatoryMastheadVisual;
  artworkSrc?: string;
  ariaLive?: "off" | "polite" | "assertive";
  className?: string;
};

export function VigilObservatoryMasthead({
  id,
  kicker,
  title,
  description,
  contextLabel,
  metadata = [],
  contextFooter,
  titleId,
  mode = "reference",
  visual = "knowledge",
  artworkSrc,
  ariaLive = "off",
  className,
}: VigilObservatoryMastheadProps) {
  const classes = ["vigil-observatory-masthead", artworkSrc ? "has-artwork" : "", className].filter(Boolean).join(" ");
  const showContext = Boolean(contextLabel && metadata.length);

  return <header id={id} className={classes} data-mode={mode} data-visual={visual} aria-labelledby={titleId}>
    {artworkSrc ? <img className="vigil-observatory-masthead-artwork" src={artworkSrc} alt="" aria-hidden="true" /> : null}
    <div className="vigil-observatory-masthead-instrument" aria-hidden="true">
      <span className="vigil-observatory-masthead-instrument-arc" />
      <span className="vigil-observatory-masthead-instrument-axis vigil-observatory-masthead-instrument-axis-x" />
      <span className="vigil-observatory-masthead-instrument-axis vigil-observatory-masthead-instrument-axis-y" />
      <span className="vigil-observatory-masthead-instrument-index" />
      <span className="vigil-observatory-masthead-instrument-node" />
    </div>
    <span className="vigil-observatory-masthead-calibration-accent" aria-hidden="true" />

    <div className="vigil-observatory-masthead-title">
      <p className="vigil-library-kicker vigil-observatory-masthead-kicker">{kicker}</p>
      <h1 id={titleId}>{title}</h1>
      {description ? <p className="vigil-observatory-masthead-description">{description}</p> : null}
    </div>

    {showContext ? <aside className="vigil-observatory-masthead-context" aria-label={contextLabel}>
      <p className="vigil-observatory-masthead-context-label">{contextLabel}</p>
      <dl aria-live={ariaLive}>
        {metadata.map((item, index) => <div key={`${item.label}-${index}`}>
          <dt>{item.label}</dt>
          <dd className={item.mono ? "is-mono" : undefined}>{item.value}</dd>
        </div>)}
      </dl>
      {contextFooter ? <div className="vigil-observatory-masthead-context-footer">{contextFooter}</div> : null}
    </aside> : null}
  </header>;
}
