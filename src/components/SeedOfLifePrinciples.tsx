const nodes = [
  { name: "Truth", x: 50, y: 15 },
  { name: "Sovereignty", x: 78, y: 32 },
  { name: "Reciprocity", x: 78, y: 68 },
  { name: "Integrity", x: 50, y: 85 },
  { name: "Harmony", x: 22, y: 68 },
  { name: "Purpose", x: 22, y: 32 },
];

export function SeedOfLifePrinciples() {
  return (
    <figure className="cam-parchment-card rounded-2xl p-4 shadow-sm" aria-label="Seed of Life diagram showing Dignity at the centre of the seven foundational CAM principles.">
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        <svg className="absolute inset-0 h-full w-full text-cam-gold" viewBox="0 0 100 100" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="0.7">
            <circle cx="50" cy="50" r="22" />
            {nodes.map((node) => <circle cx={node.x} cy={node.y} key={node.name} r="22" />)}
          </g>
          <g stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.45">
            {nodes.map((node) => <line key={node.name} x1="50" y1="50" x2={node.x} y2={node.y} />)}
          </g>
        </svg>
        <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cam-gold/45 bg-[hsl(36_48%_96%)] text-center font-serif text-xl text-foreground shadow-sm">Dignity</div>
        {nodes.map((node) => (
          <div key={node.name} className="absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cam-gold/35 bg-card/85 px-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold shadow-sm sm:text-xs" style={{ left: `${node.x}%`, top: `${node.y}%` }}>{node.name}</div>
        ))}
      </div>
      <figcaption className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">Seed of Life geometry showing Dignity held at the centre while Truth and Integrity balance the vertical axis.</figcaption>
    </figure>
  );
}
