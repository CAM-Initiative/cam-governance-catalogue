import type { ReactNode } from "react";

export type VigilObservatoryMastheadMode = "collection" | "reference" | "record";

export type VigilObservatoryMastheadMetadata = {
  label: string;
  value: ReactNode;
  mono?: boolean;
};

// Phase 1 adopts this component on Case Files and Alignment Taxonomy before the remaining Observatory surfaces migrate.
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
  ariaLive = "off",
  className,
}: VigilObservatoryMastheadProps) {
  const classes = ["vigil-observatory-masthead", className].filter(Boolean).join(" ");
  const showContext = Boolean(contextLabel && metadata.length);

  return <header id={id} className={classes} data-mode={mode} aria-labelledby={titleId}>
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
