/* Public Case File bibliography enrichment.
   VIGIL record references are citations, not navigation chrome. Where the linked
   canonical JSON exposes a version and last-updated date, add those facts to the
   citation without changing the canonical record or source URL. */

type ReferenceRecord = {
  record_identity?: {
    version?: string;
    updated?: string;
  };
  record_version?: string;
  version?: string;
  record_last_updated?: string;
  last_updated?: string;
  updated?: string;
};

const decorated = new WeakSet<Element>();

function rawVigilUrl(href: string) {
  try {
    const url = new URL(href, window.location.href);
    if (url.hostname !== "github.com") return undefined;
    const match = url.pathname.match(/^\/CAM-Initiative\/Vigil\/blob\/([^/]+)\/(.+\.json)$/i);
    if (!match) return undefined;
    return `https://raw.githubusercontent.com/CAM-Initiative/Vigil/${match[1]}/${match[2]}`;
  } catch {
    return undefined;
  }
}

function metadataFrom(record: ReferenceRecord) {
  const version = record.record_identity?.version ?? record.record_version ?? record.version;
  const updated = record.record_identity?.updated ?? record.record_last_updated ?? record.last_updated ?? record.updated;
  return { version, updated };
}

async function decorateReference(item: Element) {
  if (decorated.has(item)) return;
  const link = item.querySelector<HTMLAnchorElement>('a[href*="github.com/CAM-Initiative/Vigil/blob/"]');
  if (!link) return;
  const rawUrl = rawVigilUrl(link.href);
  if (!rawUrl) return;
  decorated.add(item);

  try {
    const response = await fetch(rawUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const record = await response.json() as ReferenceRecord;
    const { version, updated } = metadataFrom(record);
    if (!version && !updated) return;

    const meta = document.createElement("p");
    meta.className = "vigil-reference-record-meta";
    const parts: string[] = [];
    if (version) parts.push(`Version ${version}`);
    if (updated) parts.push(`Last updated ${updated}`);
    meta.textContent = parts.join(" · ");
    link.before(meta);
  } catch {
    // Citation remains complete and usable if enrichment is unavailable.
  }
}

function decorateBibliographies(root: ParentNode = document) {
  root.querySelectorAll(".vigil-case-bibliography li").forEach((item) => void decorateReference(item));
}

function start() {
  decorateBibliographies();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches(".vigil-case-bibliography, .vigil-case-bibliography li")) decorateBibliographies(node.parentElement ?? node);
        else if (node.querySelector(".vigil-case-bibliography")) decorateBibliographies(node);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
else start();
