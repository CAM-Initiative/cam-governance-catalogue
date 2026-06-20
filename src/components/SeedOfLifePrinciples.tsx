const principles = ["Truth", "Sovereignty", "Reciprocity", "Integrity", "Harmony", "Purpose"];

function SeedOfLifeSVG() {
  const cx = 150;
  const cy = 132;
  const r = 46;
  const outerR = 96;
  const outerCenters = principles.map((name, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 3);
    return {
      name,
      x: cx + outerR * Math.cos(angle),
      y: cy + outerR * Math.sin(angle),
    };
  });
  const principleLabels = [
    { name: "Truth", x: cx, y: cy - outerR - 23 },
    { name: "Sovereignty", x: cx + outerR + 35, y: cy - outerR / 2 },
    { name: "Reciprocity", x: cx + outerR + 36, y: cy + outerR / 2 + 5 },
    { name: "Integrity", x: cx, y: cy + outerR + 31 },
    { name: "Harmony", x: cx - outerR - 35, y: cy + outerR / 2 + 5 },
    { name: "Purpose", x: cx - outerR - 35, y: cy - outerR / 2 },
  ];

  return (
    <svg aria-hidden="true" className="mx-auto h-auto w-full max-w-[520px] text-cam-gold" viewBox="0 0 320 270" role="img">
      <g fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.2">
        <circle cx={cx} cy={cy} r={r} />
        {outerCenters.map((center) => (
          <circle cx={center.x} cy={center.y} key={center.name} r={r} />
        ))}
      </g>
      <g fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="0.9">
        {outerCenters.map((center) => (
          <line key={center.name} x1={cx} x2={center.x} y1={cy} y2={center.y} />
        ))}
      </g>
      <rect fill="hsl(36 48% 96%)" height="32" rx="16" stroke="currentColor" strokeOpacity="0.38" width="104" x={cx - 52} y={cy - 16} />
      <text fill="currentColor" fontFamily="ui-serif, Georgia, serif" fontSize="17" textAnchor="middle" x={cx} y={cy + 6}>Dignity</text>
      {principleLabels.map((label) => (
        <g key={label.name}>
          <rect fill="hsl(36 48% 96%)" height="24" rx="12" stroke="currentColor" strokeOpacity="0.3" width="90" x={label.x - 45} y={label.y - 15} />
          <text fill="currentColor" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="9" letterSpacing="1.1" textAnchor="middle" x={label.x} y={label.y + 1}>{label.name}</text>
        </g>
      ))}
    </svg>
  );
}

export function SeedOfLifePrinciples() {
  return (
    <figure className="cam-parchment-card rounded-2xl p-5 shadow-sm" aria-label="Seed of Life diagram showing Dignity at the centre of the seven foundational CAM principles.">
      <div className="mb-4 flex items-center gap-3">
        <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-cam-gold">Geometry of Orientation</p>
        <hr className="gold-rule flex-1" />
      </div>
      <SeedOfLifeSVG />
      <figcaption className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The Seed of Life places Dignity at the centre, with Truth, Integrity, Sovereignty, Reciprocity, Harmony, and Purpose held in relation around it.
      </figcaption>
    </figure>
  );
}
