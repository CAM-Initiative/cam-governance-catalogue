type DocumentRailItem = {
  href: string;
  label: string;
  meta?: string;
};

export function DocumentRail({
  title = "On this page",
  items,
  className = "",
  ariaLabel,
}: {
  title?: string;
  items: DocumentRailItem[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <aside className={`document-rail${className ? ` ${className}` : ""}`}>
      <p className="document-rail-title">{title}</p>
      <nav className="document-rail-nav" aria-label={ariaLabel ?? title}>
        {items.map((item) => (
          <a className="document-rail-link" href={item.href} key={item.href}>
            {item.meta ? <span className="document-rail-meta">{item.meta}</span> : null}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
