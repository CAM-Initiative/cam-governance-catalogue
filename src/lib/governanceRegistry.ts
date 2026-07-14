import { useEffect, useMemo, useState } from "react";
import registrySources from "@/config/registrySources.json";

export interface GovernanceInstrumentRecord {
  id: string;
  title?: string;
  summary?: string;
  purpose?: string;
  status?: string;
  effect?: string;
  enforcement?: string;
  review_state?: string;
  authority_role?: string;
  version?: string;
  domain?: string;
  stack?: string;
  instrument_class?: string;
  hierarchy_type?: string | null;
  hierarchy_number?: string | null;
  parent_id?: string | null;
  link?: string;
  path?: string;
  route?: string;
  url?: string;
  is_derived?: boolean;
  [key: string]: unknown;
}

export interface GovernanceIndexState {
  instruments: GovernanceInstrumentRecord[];
  byId: Record<string, GovernanceInstrumentRecord>;
  loading: boolean;
  error: string | null;
}

export interface GovernanceStackGroups {
  substrateLaws: GovernanceInstrumentRecord[];
  constitution: GovernanceInstrumentRecord[];
  annexes: GovernanceInstrumentRecord[];
  domainCharters: GovernanceInstrumentRecord[];
  runtimeSchedules: GovernanceInstrumentRecord[];
  supporting: GovernanceInstrumentRecord[];
  ungrouped: GovernanceInstrumentRecord[];
}

const EMPTY_GROUPS: GovernanceStackGroups = {
  substrateLaws: [],
  constitution: [],
  annexes: [],
  domainCharters: [],
  runtimeSchedules: [],
  supporting: [],
  ungrouped: [],
};

function parseGovernancePayload(payload: unknown): GovernanceInstrumentRecord[] {
  const maybeItems = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  return maybeItems.filter(
    (item): item is GovernanceInstrumentRecord =>
      Boolean(item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string"),
  );
}

async function fetchGovernancePayload(url: string): Promise<GovernanceInstrumentRecord[]> {
  const response = await fetch(url, {
    headers: { Accept: "application/json,text/plain;q=0.9,*/*;q=0.8" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  const trimmed = text.trimStart();
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (trimmed.startsWith("<") || contentType.includes("text/html")) {
    throw new Error("Received an HTML fallback instead of governance JSON");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Governance registry response was not valid JSON");
  }

  const instruments = parseGovernancePayload(payload);
  if (instruments.length === 0) {
    throw new Error("Governance registry contained no instruments");
  }

  return instruments;
}

export function useGovernanceIndex(): GovernanceIndexState {
  const [instruments, setInstruments] = useState<GovernanceInstrumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bundledFallbackUrl = `${import.meta.env.BASE_URL}data/cam-governance-fallback.json`;
    const legacySnapshotUrl = `${import.meta.env.BASE_URL}data/cam-governance.json`;
    const canonicalRegistryUrl = registrySources.cam?.registry_index_url;
    const candidates = [bundledFallbackUrl, canonicalRegistryUrl, legacySnapshotUrl]
      .filter((url): url is string => Boolean(url))
      .filter((url, index, all) => all.indexOf(url) === index);

    async function loadRegistry() {
      const failures: string[] = [];

      for (const url of candidates) {
        try {
          const loaded = await fetchGovernancePayload(url);
          if (cancelled) return;
          setInstruments(loaded);
          setError(null);
          return;
        } catch (err) {
          failures.push(err instanceof Error ? err.message : "Unknown registry error");
        }
      }

      if (cancelled) return;
      setInstruments([]);
      setError("Unable to load the bundled or canonical governance registry.");
      console.warn("[CAM governance] Registry loading failed:", failures);
    }

    void loadRegistry().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(
    () => Object.fromEntries(instruments.map((instrument) => [instrument.id, instrument])),
    [instruments],
  );

  return { instruments, byId, loading, error };
}

function clean(value?: string | null): string {
  return (value ?? "").replace(/\*\*/g, "").trim();
}

export function instrumentDescription(instrument: GovernanceInstrumentRecord, fallback = ""): string {
  return clean(instrument.purpose) || clean(instrument.summary) || fallback;
}

export function instrumentStatus(instrument: GovernanceInstrumentRecord, fallback = "Status pending"): string {
  const parts = [clean(instrument.status), clean(instrument.effect), clean(instrument.enforcement)]
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index);
  const status = parts.join(" — ") || fallback;
  return instrument.version ? `${status} v${instrument.version}` : status;
}

export function instrumentHref(instrument: GovernanceInstrumentRecord): string | undefined {
  const raw = clean(instrument.route) || clean(instrument.url) || clean(instrument.path) || clean(instrument.link);
  if (!raw) return undefined;
  if (/^(https?:|mailto:|#|\/)/.test(raw)) return raw;
  return `https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/${raw}`;
}

export function instrumentDisplayId(id: string): string {
  return id.replace(/-PLATINUM$/, "");
}

function sortByGovernanceOrder(a: GovernanceInstrumentRecord, b: GovernanceInstrumentRecord): number {
  const domainCompare = clean(a.domain).localeCompare(clean(b.domain));
  if (domainCompare) return domainCompare;
  const hierarchyCompare = clean(a.hierarchy_number).localeCompare(clean(b.hierarchy_number), undefined, {
    numeric: true,
    sensitivity: "base",
  });
  if (hierarchyCompare) return hierarchyCompare;
  return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" });
}

function isLaw(instrument: GovernanceInstrumentRecord): boolean {
  return (
    clean(instrument.instrument_class).toLowerCase() === "law" ||
    clean(instrument.domain).toLowerCase() === "substrate laws" ||
    /(^|-)LAW-/.test(instrument.id)
  );
}

function isRootConstitution(instrument: GovernanceInstrumentRecord): boolean {
  const hierarchyType = clean(instrument.hierarchy_type).toLowerCase();
  return (
    clean(instrument.instrument_class).toLowerCase() === "constitution" &&
    !hierarchyType &&
    /AEON-001/.test(instrument.id)
  );
}

function isAnnex(instrument: GovernanceInstrumentRecord): boolean {
  return clean(instrument.hierarchy_type).toLowerCase() === "annex";
}

function isRuntimeSchedule(instrument: GovernanceInstrumentRecord): boolean {
  return clean(instrument.hierarchy_type).toLowerCase() === "schedule" || /-SCH-/.test(instrument.id);
}

function isDomainCharter(instrument: GovernanceInstrumentRecord): boolean {
  return clean(instrument.instrument_class).toLowerCase() === "charter" && !clean(instrument.hierarchy_type);
}

function isSupportingInstrument(instrument: GovernanceInstrumentRecord): boolean {
  const hierarchyType = clean(instrument.hierarchy_type).toLowerCase();
  return ["appendix", "supplement"].includes(hierarchyType);
}

export function groupGovernanceInstruments(instruments: GovernanceInstrumentRecord[]): GovernanceStackGroups {
  if (!instruments.length) return EMPTY_GROUPS;

  const groups: GovernanceStackGroups = {
    substrateLaws: [],
    constitution: [],
    annexes: [],
    domainCharters: [],
    runtimeSchedules: [],
    supporting: [],
    ungrouped: [],
  };

  for (const instrument of instruments) {
    if (isLaw(instrument)) groups.substrateLaws.push(instrument);
    else if (isRootConstitution(instrument)) groups.constitution.push(instrument);
    else if (isAnnex(instrument)) groups.annexes.push(instrument);
    else if (isDomainCharter(instrument)) groups.domainCharters.push(instrument);
    else if (isRuntimeSchedule(instrument)) groups.runtimeSchedules.push(instrument);
    else if (isSupportingInstrument(instrument)) groups.supporting.push(instrument);
    else groups.ungrouped.push(instrument);
  }

  Object.values(groups).forEach((group) => group.sort(sortByGovernanceOrder));
  return groups;
}

export function warnForUngroupedConstitutionInstruments(groups: GovernanceStackGroups): void {
  if (groups.ungrouped.length > 0) {
    console.warn(
      "[CAM governance] Registry instruments were not assigned to Constitution stack groups:",
      groups.ungrouped.map((instrument) => instrument.id),
    );
  }
}

export function warnForMissingRuntimeInstruments(
  referencedIds: string[],
  byId: Record<string, GovernanceInstrumentRecord>,
): void {
  const missingIds = Array.from(new Set(referencedIds.filter((id) => !byId[id])));
  if (missingIds.length > 0) {
    console.warn("[CAM governance] Runtime trace references instruments missing from the governance registry:", missingIds);
  }
}
