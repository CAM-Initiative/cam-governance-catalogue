import { lazy, Suspense, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Globe2, Layers3, RotateCcw, ShieldAlert } from "lucide-react";
import type { VigilIndexRecord } from "@/lib/vigilPresentation";
import { loadFailureTaxonomy } from "@/lib/vigilFailureTaxonomy";
import { topFailureClasses, severityDistribution } from "@/lib/vigilDashboardMetrics.mjs";
import { donutSegmentAppearance } from "@/lib/vigilDonutSelection.mjs";
import { layoutSeverityCallouts, CALLOUT_GEOMETRY } from "@/lib/vigilDonutCallouts.mjs";
import { countryFromJurisdictionString } from "@/lib/vigilCountryMatching.mjs";
import { AdSenseRail } from "@/components/advertising/AdSenseRail";
import "./VigilCasesDashboard.css";

const EarthGlobe3D = lazy(() => import("./EarthGlobe3D"));

type Country = { id: string; name: string; lat: number; lon: number };
type Location = Country & { count: number };
type Props = {
  /** Case counts in the globe follow all other filters, excluding the globe selection. */
  mapRecords: VigilIndexRecord[];
  /** The donut follows all filters except the severity it can select. */
  distributionRecords: VigilIndexRecord[];
  /** Failure rankings respect all filters except their own selected class. */
  taxonomyRecords: VigilIndexRecord[];
  severity: string;
  jurisdictions: string[];
  failureClass: string;
  onSeverity: (code: string) => void;
  onJurisdiction: (id: string) => void;
  onFailureClass: (id: string) => void;
  onClearFilters: () => void;
  countryByCase: Map<string, string[]>;
  geographyAvailable: boolean;
  geographyNote: string;
};

// Display pins indicate explicitly reviewed jurisdiction associations, NOT where an
// incident happened. Countries are never inferred from an organization or prose.
const COUNTRIES: Country[] = [
  { id: "AU", name: "Australia", lat: -25, lon: 134 },
  { id: "US", name: "United States", lat: 39, lon: -98 },
  { id: "GB", name: "United Kingdom", lat: 54, lon: -3 },
  { id: "CA", name: "Canada", lat: 57, lon: -106 },
  { id: "FR", name: "France", lat: 47, lon: 2 },
  { id: "DE", name: "Germany", lat: 51, lon: 10 },
  { id: "IN", name: "India", lat: 22, lon: 79 },
  { id: "JP", name: "Japan", lat: 37, lon: 138 },
  { id: "CN", name: "China", lat: 35, lon: 104 },
  { id: "KR", name: "South Korea", lat: 36, lon: 128 },
  { id: "NZ", name: "New Zealand", lat: -42, lon: 174 },
  { id: "NL", name: "Netherlands", lat: 52, lon: 5 },
  { id: "ES", name: "Spain", lat: 40, lon: -4 },
  { id: "BR", name: "Brazil", lat: -10, lon: -52 },
  { id: "IE", name: "Ireland", lat: 53, lon: -8 },
  { id: "IT", name: "Italy", lat: 42, lon: 12 },
  { id: "CH", name: "Switzerland", lat: 47, lon: 8 },
  { id: "SG", name: "Singapore", lat: 1, lon: 104 },
  { id: "IL", name: "Israel", lat: 31, lon: 35 },
  { id: "RU", name: "Russia", lat: 61, lon: 95 },
  { id: "KE", name: "Kenya", lat: 0, lon: 38 },
  { id: "SE", name: "Sweden", lat: 62, lon: 15 },
  { id: "PL", name: "Poland", lat: 52, lon: 19 },
  { id: "ID", name: "Indonesia", lat: -3, lon: 118 },
  { id: "AR", name: "Argentina", lat: -34, lon: -64 },
  { id: "FI", name: "Finland", lat: 64, lon: 26 },
  { id: "AE", name: "United Arab Emirates", lat: 24, lon: 54 },
  { id: "DK", name: "Denmark", lat: 56, lon: 10 },
  { id: "BE", name: "Belgium", lat: 51, lon: 5 },
  { id: "NO", name: "Norway", lat: 62, lon: 10 },
  { id: "GR", name: "Greece", lat: 39, lon: 23 },
  { id: "TR", name: "Türkiye", lat: 39, lon: 35 },
  { id: "SA", name: "Saudi Arabia", lat: 24, lon: 45 },
  { id: "MX", name: "Mexico", lat: 24, lon: -102 },
  { id: "ZA", name: "South Africa", lat: -29, lon: 25 },
  { id: "PH", name: "Philippines", lat: 13, lon: 122 },
  { id: "TW", name: "Taiwan", lat: 24, lon: 121 },
  { id: "UA", name: "Ukraine", lat: 49, lon: 32 },
  { id: "RO", name: "Romania", lat: 46, lon: 25 },
  { id: "CZ", name: "Czechia", lat: 50, lon: 15 },
  { id: "AT", name: "Austria", lat: 48, lon: 14 },
  { id: "PT", name: "Portugal", lat: 40, lon: -8 },
  { id: "CL", name: "Chile", lat: -33, lon: -71 },
  { id: "NG", name: "Nigeria", lat: 9, lon: 8 },
  { id: "EG", name: "Egypt", lat: 27, lon: 30 },
  { id: "MY", name: "Malaysia", lat: 4, lon: 102 },
  { id: "VN", name: "Vietnam", lat: 16, lon: 108 },
  { id: "EE", name: "Estonia", lat: 59, lon: 25 },
  { id: "PK", name: "Pakistan", lat: 30, lon: 69 },
  { id: "HK", name: "Hong Kong", lat: 22, lon: 114 },
  { id: "IR", name: "Iran", lat: 32, lon: 53 },
  { id: "BG", name: "Bulgaria", lat: 43, lon: 25 },
  { id: "BW", name: "Botswana", lat: -22, lon: 24 },
  { id: "CO", name: "Colombia", lat: 4, lon: -74 },
  { id: "EC", name: "Ecuador", lat: -1, lon: -78 },
  { id: "KH", name: "Cambodia", lat: 13, lon: 105 },
  { id: "KZ", name: "Kazakhstan", lat: 48, lon: 68 },
  { id: "LK", name: "Sri Lanka", lat: 7, lon: 81 },
  { id: "LT", name: "Lithuania", lat: 55, lon: 24 },
  { id: "NA", name: "Namibia", lat: -22, lon: 17 },
  { id: "PR", name: "Puerto Rico", lat: 18, lon: -66 },
  { id: "ZW", name: "Zimbabwe", lat: -19, lon: 30 },
  { id: "TH", name: "Thailand", lat: 16, lon: 101 },
];
const ALIASES: Record<string, string[]> = {
  US: ["united states", "usa", "u.s.", "us federal"],
  GB: ["united kingdom", "uk", "great britain", "england", "scotland", "wales"],
  AU: ["australia", "australian", "new south wales", "victoria"],
  CA: ["canada", "canadian"], NZ: ["new zealand"],
  KR: ["south korea", "republic of korea"], RU: ["russian federation", "russia"],
  AE: ["united arab emirates", "uae"], TR: ["turkey", "türkiye"],
  CZ: ["czech republic", "czechia"],
};
const byId = new Map(COUNTRIES.map(country => [country.id, country]));
export function countryDisplayName(code: string) { return byId.get(code)?.name ?? code; }
export function countryFromJurisdiction(value: string) {
  return countryFromJurisdictionString(value, COUNTRIES, ALIASES);
}

const DEG = Math.PI / 180;
const R = 146;
function project(lon: number, lat: number, rotation: number) {
  const lambda = (lon - rotation) * DEG;
  const phi = lat * DEG;
  const phi0 = 15 * DEG;
  const depth = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
  return { x: 174 + R * Math.cos(phi) * Math.sin(lambda), y: 174 - R * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)), visible: depth > 0.035 };
}
// Coastline silhouettes are purely visual. Country markers and counts are based
// on canonical jurisdiction fields and do not use these illustration polygons.
const LAND: Array<Array<[number, number]>> = [
  [[-168,65],[-152,70],[-138,60],[-129,51],[-124,42],[-117,33],[-111,31],[-106,24],[-97,18],[-90,19],[-86,13],[-80,9],[-77,17],[-82,25],[-81,31],[-74,40],[-67,45],[-60,51],[-56,55],[-64,60],[-80,60],[-91,68],[-111,72],[-133,69],[-151,72]],
  [[-82,12],[-73,11],[-61,10],[-51,3],[-50,-2],[-43,-6],[-35,-9],[-38,-16],[-41,-23],[-51,-34],[-54,-38],[-68,-55],[-74,-50],[-75,-38],[-71,-29],[-70,-17],[-76,-8],[-80,1]],
  [[-74,59],[-58,59],[-42,64],[-39,73],[-43,82],[-55,83],[-60,77],[-68,73]],
  [[-12,36],[-9,43],[-10,52],[-5,59],[5,60],[9,55],[16,56],[25,61],[30,70],[40,70],[50,64],[43,56],[34,46],[25,41],[18,40],[12,45],[6,43],[-1,44]],
  [[-18,36],[-5,37],[12,33],[25,32],[34,30],[43,12],[50,11],[42,-4],[36,-11],[30,-23],[18,-35],[11,-35],[10,-29],[2,-18],[-5,-5],[-13,5],[-17,17]],
  [[32,41],[41,47],[50,55],[55,61],[63,65],[77,71],[99,75],[124,69],[142,59],[165,60],[179,64],[179,50],[157,47],[141,43],[130,34],[128,26],[122,19],[114,21],[107,9],[103,1],[97,9],[94,19],[88,23],[80,7],[72,9],[68,24],[60,26],[52,25],[48,30],[42,32],[35,35]],
  [[68,24],[75,32],[80,29],[88,27],[92,22],[88,8],[80,7],[76,13],[73,18]],
  [[114,-22],[115,-15],[122,-12],[130,-13],[136,-11],[142,-13],[153,-27],[148,-38],[135,-36],[123,-34],[114,-27]],
  [[166,-35],[175,-40],[178,-46],[172,-47],[168,-43]],
  [[45,-13],[50,-14],[49,-24],[46,-26],[44,-18]],
  [[-8,58],[-6,51],[-2,50],[2,54],[-3,59]],
  [[126,35],[129,39],[132,42],[141,46],[145,42],[141,35],[135,33],[131,34]],
];
function coastline(shape: Array<[number, number]>, rotation: number) {
  const visible = shape.map(([lon, lat]) => project(lon, lat, rotation)).filter(point => point.visible);
  if (visible.length < 3) return "";
  return visible.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
}
function graticule(rotation: number, lon?: number, lat?: number) {
  const points = Array.from({ length: lon === undefined ? 121 : 61 }, (_, i) => {
    const value = lon === undefined ? -180 + i * 3 : -90 + i * 3;
    return project(lon ?? value, lat ?? value, rotation);
  });
  let drawing = "", pen = false;
  for (const point of points) {
    if (!point.visible) { pen = false; continue; }
    drawing += `${pen ? " L " : " M "}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    pen = true;
  }
  return drawing;
}
function Globe({ locations, selected, onSelect, onClearFilters }: { locations: Location[]; selected: string[]; onSelect: (id: string) => void; onClearFilters: () => void }) {
  const [rotation, setRotation] = useState(15);
  const pointer = useRef<{ x: number; rotation: number; moved: boolean } | null>(null);
  useEffect(() => {
    const target = byId.get(selected[selected.length - 1]);
    if (target) setRotation(target.lon);
  }, [selected]);
  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!pointer.current) return;
    if (Math.abs(event.clientX - pointer.current.x) > 3) pointer.current.moved = true;
    setRotation(pointer.current.rotation - (event.clientX - pointer.current.x) * 0.45);
  };
  const pinLocations = locations.map(loc => ({ ...loc, point: project(loc.lon, loc.lat, rotation) })).filter(loc => loc.point.visible);
  return (
    <div className="vigil-dashboard-globe-scene">
      <svg className="vigil-dashboard-globe" viewBox="0 0 348 348" role="img" aria-label="Drag to rotate a globe showing case jurisdictions. Use the jurisdiction list for keyboard selection."
        onPointerDown={event => { pointer.current = { x: event.clientX, rotation, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={onMove}
        onPointerUp={event => { pointer.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { pointer.current = null; }}>
        <defs>
          <radialGradient id="vigil-ocean" cx="33%" cy="28%" r="82%">
            <stop offset="0%" stopColor="#0c678d" /><stop offset="39%" stopColor="#073b62" /><stop offset="75%" stopColor="#05243d" /><stop offset="100%" stopColor="#010c1e" />
          </radialGradient>
          <radialGradient id="vigil-atmosphere"><stop offset="60%" stopColor="#27e5ed" stopOpacity="0" /><stop offset="90%" stopColor="#24b7e4" stopOpacity=".10" /><stop offset="100%" stopColor="#3bc5e7" stopOpacity=".35" /></radialGradient>
          <clipPath id="vigil-sphere-clip"><circle cx="174" cy="174" r={R} /></clipPath>
          <filter id="vigil-pin-glow"><feGaussianBlur stdDeviation="3.3" /></filter>
        </defs>
        <circle cx="174" cy="174" r="165" fill="url(#vigil-atmosphere)" />
        <circle cx="174" cy="174" r={R} fill="url(#vigil-ocean)" stroke="#2eacc7" strokeOpacity=".45" />
        <g clipPath="url(#vigil-sphere-clip)">
          {[-60,-30,0,30,60].map(lat => <path key={`lat-${lat}`} d={graticule(rotation, undefined, lat)} stroke="#54bdcb" strokeOpacity=".17" strokeWidth=".8" fill="none" />)}
          {Array.from({length:12},(_,i)=>-180+i*30).map(lon => <path key={`lon-${lon}`} d={graticule(rotation, lon)} stroke="#54bdcb" strokeOpacity=".16" strokeWidth=".8" fill="none" />)}
          {LAND.map((shape,i)=><path key={i} d={coastline(shape, rotation)} fill="#0c6575" stroke="#5dd1d0" strokeWidth="1" strokeOpacity=".56" fillOpacity=".83" />)}
        </g>
        {pinLocations.map(loc => (
          <g key={loc.id} className={selected.includes(loc.id)?"vigil-globe-pin is-selected":"vigil-globe-pin"} onClick={() => { if (!pointer.current?.moved) onSelect(loc.id); }}>
            <title>{loc.name}: {loc.count} case{loc.count===1?"":"s"}</title>
            <circle cx={loc.point.x} cy={loc.point.y} r="14" fill="#58e6f5" opacity=".35" filter="url(#vigil-pin-glow)"/>
            <circle cx={loc.point.x} cy={loc.point.y} r={selected.includes(loc.id)?7:5} fill={selected.includes(loc.id)?"#ffcf79":"#6cf5eb"} stroke="#fff8d7" strokeWidth="1.4"/>
            <circle cx={loc.point.x} cy={loc.point.y} r="12" fill="transparent" />
          </g>
        ))}
        <ellipse cx="174" cy="174" rx="169" ry="164" fill="none" stroke="#39cde2" strokeOpacity=".16" strokeDasharray="4 9" />
      </svg>
      
      <button type="button" className="vigil-dashboard-reset-rotation" onClick={() => { setRotation(15); onClearFilters(); }} aria-label="Reset globe view and clear filters" title="Reset globe and clear filters"><RotateCcw size={15} /></button>
    </div>
  );
}
function GlobeView({ locations, selected, onSelect, onClearFilters }: { locations: Location[]; selected: string[]; onSelect: (id: string) => void; onClearFilters: () => void }) {
  const [unavailable, setUnavailable] = useState(false);
  if (unavailable) return <Globe locations={locations} selected={selected} onSelect={onSelect} onClearFilters={onClearFilters} />;
  return <Suspense fallback={<Globe locations={locations} selected={selected} onSelect={onSelect} onClearFilters={onClearFilters} />}>
    <EarthGlobe3D locations={locations} selected={selected} onSelect={onSelect} onClearFilters={onClearFilters} onUnavailable={() => setUnavailable(true)} />
  </Suspense>;
}

const SEVERITIES = [
  { code: "S1", label: "Minimal", color: "#62d7ae" },
  { code: "S2", label: "Low", color: "#21b8da" },
  { code: "S3", label: "Moderate", color: "#ffc469" },
  { code: "S4", label: "High", color: "#f5875b" },
  { code: "S5", label: "Critical", color: "#e75c6e" },
  { code: "SU", label: "Unassessed", color: "#8b9cad" },
];
// Editorial leader lines return to the donut, with deterministic spacing so
// even adjacent tiny severity slices never overlap labels in a narrow rail.
function SeverityDonut({ records, selected, onSelect }: { records: VigilIndexRecord[]; selected: string; onSelect: (code: string) => void }) {
  const distribution = severityDistribution(records);
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  const labels = layoutSeverityCallouts(distribution.map(item => ({
    ...item, label: SEVERITIES.find(definition => definition.code === item.code)?.label ?? item.code,
    color: SEVERITIES.find(definition => definition.code === item.code)?.color ?? "#8b9cad",
  })), total);
  const selectedCount = distribution.find(item => item.code === selected)?.count;
  const { centerX: cx, centerY: cy, labelLeftX, labelRightX } = CALLOUT_GEOMETRY;
  let elapsed = 0;
  const activate = (code: string) => onSelect(selected === code ? "" : code);
  return <div className="vigil-dashboard-outcomes">
    <div className="vigil-dashboard-donut">
      <svg viewBox="0 0 440 306" role="group" aria-label={`Harm severity for ${total} Case Files. Select a donut segment or its connected label to filter.`}>
        <defs>
          <filter id="vigil-donut-dimensional-shadow" x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#001927" floodOpacity=".29"/>
          </filter>
          <radialGradient id="vigil-donut-face" cx="38%" cy="27%" r="85%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".07"/>
            <stop offset="72%" stopColor="#ffffff" stopOpacity=".015"/>
            <stop offset="100%" stopColor="#001829" stopOpacity=".10"/>
          </radialGradient>
          {SEVERITIES.map(entry => <linearGradient id={`vigil-donut-shade-${entry.code}`} key={entry.code} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={entry.color} stopOpacity="1"/>
            <stop offset="48%" stopColor={entry.color} stopOpacity=".88"/>
            <stop offset="100%" stopColor={entry.color} stopOpacity=".68"/>
          </linearGradient>)}
        </defs>
        <g filter="url(#vigil-donut-dimensional-shadow)">
          <circle cx={cx} cy={cy} r="75" fill="none" className="vigil-dashboard-donut-track" strokeWidth="29"/>
          <circle cx={cx} cy={cy} r="62" fill="url(#vigil-donut-face)"/>
        </g>
        {distribution.map(item => {
          const start = elapsed; elapsed += item.count;
          const isSelected = selected === item.code;
          const appearance = donutSegmentAppearance(start, item.count, total, isSelected, Boolean(selected));
          const circumference = 2 * Math.PI * appearance.radius;
          return total && item.count ? <g key={item.code} className="vigil-dashboard-donut-slice" transform={isSelected ? `translate(${appearance.offsetX} ${appearance.offsetY})` : undefined}>
            <circle cx={cx} cy={cy} r={appearance.radius} fill="none" stroke={`url(#vigil-donut-shade-${item.code})`}
              strokeWidth={appearance.strokeWidth} opacity={appearance.opacity}
              strokeDasharray={`${(item.count / total) * circumference} ${circumference}`}
              strokeDashoffset={-(start / total) * circumference} transform={`rotate(-90 ${cx} ${cy})`}
              onClick={() => activate(item.code)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(item.code); } }}
              tabIndex={0} role="button" aria-label={`${item.code}: ${item.count} Case Files; ${isSelected ? "clear filter" : "filter"}`}
              aria-pressed={isSelected} className="vigil-dashboard-donut-segment"><title>{item.code}: {item.count} Case Files</title>
            </circle>
          </g> : null;
        })}
        <circle cx={cx} cy={cy} r="62.5" fill="none" stroke="#ffffff" strokeOpacity=".2" strokeWidth="1.4" pointerEvents="none"/>
        <circle cx={cx} cy={cy} r="87.5" fill="none" stroke="#081d32" strokeOpacity=".27" strokeWidth="1" pointerEvents="none"/>
        <text x={cx} y={cy-4} textAnchor="middle" className="vigil-dashboard-donut-count">{selectedCount ?? total}</text>
        <text x={cx} y={cy+15} textAnchor="middle" className="vigil-dashboard-donut-caption">{selected ? `${selected} SELECTED` : "CASE FILES"}</text>
        {labels.map(item => {
          const active = selected === item.code;
          const dim = selected && !active;
          const dx = Math.cos(item.midAngle), dy = Math.sin(item.midAngle);
          const x0 = cx + dx * (active ? 106 : 91);
          const y0 = cy + dy * (active ? 106 : 91);
          const left = item.side === "left";
          const joinX = left ? 112 : 328;
          const endX = left ? 106 : 334;
          const textX = left ? labelLeftX : labelRightX;
          const anchor = left ? "end" : "start";
          return <g key={item.code} className={`vigil-dashboard-severity-callout${active ? " is-selected" : dim ? " is-muted" : ""}`}
              role="button" tabIndex={0} aria-label={`Filter ${item.code} ${item.label}: ${item.count} Case Files`}
              aria-pressed={active} onClick={() => activate(item.code)}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(item.code); } }}>
            <path d={`M${x0.toFixed(1)},${y0.toFixed(1)} L${joinX},${item.y.toFixed(1)} L${endX},${item.y.toFixed(1)}`}
              stroke={active ? item.color : "var(--vd-chart-line, #a6a3a2)"}
              strokeWidth={active ? 2.6 : 1.6} fill="none" strokeLinejoin="round" pointerEvents="none"/>
            <circle cx={x0} cy={y0} r="2.6" fill={active ? item.color : "var(--vd-chart-line, #a6a3a2)"} pointerEvents="none"/>
            <text x={textX} y={item.y-7} textAnchor={anchor} className="vigil-dashboard-severity-label">{item.code} ({item.count})</text>
            <text x={textX} y={item.y+15} textAnchor={anchor} className="vigil-dashboard-severity-name">{item.label}</text>
            <rect x={left ? 0 : 328} y={item.y-29} width="112" height="48" fill="transparent" pointerEvents="all"/>
          </g>;
        })}
      </svg>
    </div>
  </div>;
}

export default function VigilCasesDashboard({mapRecords,distributionRecords,taxonomyRecords,severity,jurisdictions,failureClass,onSeverity,onJurisdiction,onFailureClass,onClearFilters,countryByCase,geographyAvailable,geographyNote}: Props) {
  const [classNames, setClassNames] = useState<Record<string,string>>({});
  useEffect(() => {
    let active = true;
    loadFailureTaxonomy().then(result => {
      if (!active || result.status !== "ready") return;
      const names: Record<string, string> = {};
      for (const family of result.data.families) for (const row of family.classes) names[row.class_id] = row.name;
      setClassNames(names);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const jurisdictionById = countryByCase;
  const locations = useMemo(() => {
    const counts = new Map<string,number>();
    let unmapped = 0;
    for (const record of mapRecords) {
      // Multi-country associations count once for each reviewed country, while
      // each country still counts an Incident only once.
      const countryIds = (jurisdictionById.get(record.id) ?? []).filter(id => byId.has(id));
      if (!countryIds.length) { unmapped++; continue; }
      for (const id of new Set(countryIds)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const regions = [...counts].flatMap(([id,count]) => { const c=byId.get(id);return c?[{...c,count}]:[]; }).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
    return {regions,unmapped,mapped:mapRecords.length-unmapped};
  }, [mapRecords,jurisdictionById]);
  const failures = useMemo(()=>topFailureClasses(taxonomyRecords),[taxonomyRecords]);
  return (
    <aside className="vigil-dashboard-sidebar" aria-label="Case File dashboard">
      <section className="vigil-dashboard-panel vigil-dashboard-location-panel" aria-labelledby="vigil-dashboard-geography">
        <div className="vigil-dashboard-panel-heading"><div><span className="vigil-dashboard-kicker">Geographic Profile</span><h2 id="vigil-dashboard-geography"><Globe2 size={19} /> Jurisdiction coverage</h2></div></div>
        <GlobeView locations={geographyAvailable ? locations.regions : []} selected={jurisdictions} onSelect={onJurisdiction} onClearFilters={onClearFilters}/>
        <label className="vigil-dashboard-country-keyboard">
          <span className="sr-only">Choose country using a keyboard-accessible list</span>
          <select value="" disabled={!geographyAvailable} onChange={event=>onJurisdiction(event.target.value)} aria-label="Add or remove a jurisdiction using keyboard">
            <option value="">Add a jurisdiction</option>
            {locations.regions.map(item=><option key={item.id} value={item.id}>{item.name} ({item.count})</option>)}
            {jurisdictions.filter(id=>!locations.regions.some(item=>item.id===id)).map(id=><option key={id} value={id}>{byId.get(id)?.name??id} (selected)</option>)}
          </select>
        </label>
        <details className="vigil-dashboard-geo-disclosure vigil-dashboard-panel-info">
          <summary aria-label="Globe data and imagery information" title="Globe data information">i</summary>
          <div className="vigil-dashboard-geo-disclosure-body vigil-dashboard-panel-info-body">
            <p>{geographyNote}</p>
            <p>Choose multiple countries on the globe or with the keyboard selector. Case Files match any selected country and are counted once. Country beacons represent reviewed jurisdiction associations, not incident coordinates. Earth imagery: NASA Blue Marble.</p>
            {!geographyAvailable && <p>Geographic data is unavailable for the selected source. Case Files remain searchable.</p>}
          </div>
        </details>
      </section>
      <section className="vigil-dashboard-panel vigil-dashboard-severity-panel" aria-labelledby="vigil-dashboard-severity">
        <div className="vigil-dashboard-panel-heading"><div><span className="vigil-dashboard-kicker">Risk profile</span><h2 id="vigil-dashboard-severity"><ShieldAlert size={19} /> Harm severity</h2></div></div>
        <details className="vigil-dashboard-panel-info">
          <summary aria-label="Harm severity chart information" title="Harm severity information">i</summary>
          <div className="vigil-dashboard-panel-info-body">
            <p>Severity shows the overall recorded harm rating of the current Case Files. Select a segment or connected label to filter the list. SU means unassessed; it must not be treated as S1.</p>
          </div>
        </details>
        <SeverityDonut records={distributionRecords} selected={severity} onSelect={onSeverity}/>
      </section>
      <section className="vigil-dashboard-panel vigil-dashboard-failures-panel" aria-labelledby="vigil-dashboard-failures">
        <div className="vigil-dashboard-panel-heading"><div><span className="vigil-dashboard-kicker">Taxonomy intelligence</span><h2 id="vigil-dashboard-failures"><Layers3 size={19} /> Most frequent failures</h2></div></div>
        <details className="vigil-dashboard-panel-info">
          <summary aria-label="Taxonomy intelligence counts information" title="Taxonomy counts information">i</summary>
          <div className="vigil-dashboard-panel-info-body">
            <p>Rankings reflect the current search, severity, jurisdiction and metadata filters, but exclude the failure class you select here. Selecting a class filters the Case Files and other charts without reordering this list. Counts represent distinct Case Files, not mentions or evidence-source citations.</p>
          </div>
        </details>
        <ol className="vigil-dashboard-failure-list">
          {failures.map((entry,index)=><li key={entry.id}>
            <button type="button" onClick={()=>onFailureClass(failureClass===entry.id?"":entry.id)} className={failureClass===entry.id?"is-selected":""} aria-pressed={failureClass===entry.id} title="Filter case files by this failure class">
              <span className="vigil-dashboard-failure-bar" aria-hidden="true" style={{width:`${Math.max(3,100*(entry.count/(failures[0]?.count || 1)))}%`}}/>
              <span className="vigil-dashboard-failure-rank">{String(index+1).padStart(2,"0")}</span>
              <span className="vigil-dashboard-failure-name"><span>{entry.id.replace("VIGIL-FC-","FC-")}</span><strong>{classNames[entry.id]??"Fidelity Class"}</strong></span>
              <span className="vigil-dashboard-failure-count">{entry.count}</span>
            </button>
          </li>)}
          {!failures.length && <li className="vigil-dashboard-empty">No evidenced failure-role mappings in this selection.</li>}
        </ol>
      </section>
      <div className="vigil-dashboard-ad"><AdSenseRail/></div>
    </aside>
  );
}
