import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";

type Instrument = Record<string, string>;
const searchFields = ["id","title","summary","purpose","domain","status","effect","enforcement","review_state","authority_role"];
const filterFields = ["domain","instrument_class","hierarchy_type","status","effect","enforcement"];

export default function Catalogue() {
  const [rows, setRows] = useState<Instrument[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string,string>>({});

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cam-governance.json`).then(r=>r.json()).then((d)=>setRows(Array.isArray(d)?d:[]));
  }, []);

  const options = useMemo(() => Object.fromEntries(filterFields.map((f)=>[f, [...new Set(rows.map(r=>r[f]).filter(Boolean))].sort()])), [rows]);

  const filtered = useMemo(() => rows.filter((r)=> {
    const q = query.trim().toLowerCase();
    const qOk = !q || searchFields.some((f)=>String(r[f] ?? "").toLowerCase().includes(q));
    const fOk = filterFields.every((f)=>!filters[f] || String(r[f]??"")===filters[f]);
    return qOk && fOk;
  }), [rows, query, filters]);

  return <Shell><div className="container mx-auto px-6 md:px-10 py-10 max-w-6xl">
    <h1 className="font-serif text-4xl mb-6">Instrument Catalogue</h1>
    <input className="w-full border rounded-lg p-3 mb-4" placeholder="Search instruments" value={query} onChange={(e)=>setQuery(e.target.value)} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">{filterFields.map((f)=><select key={f} className="border rounded-lg p-2" value={filters[f]||""} onChange={(e)=>setFilters(v=>({...v,[f]:e.target.value}))}><option value="">All {f}</option>{(options[f]||[]).map((v:string)=><option key={v} value={v}>{v}</option>)}</select>)}</div>
    <div className="space-y-3">{filtered.map((it, i)=><article key={`${it.id}-${i}`} className="border rounded-xl p-4 bg-card/70"><div className="flex items-center justify-between gap-2"><h2 className="font-mono text-sm">{it.id || "Unresolved/source mapping required"}</h2>{it.link ? <a href={it.link} target="_blank" rel="noreferrer" className="text-primary text-xs">Source ↗</a> : <span className="text-xs text-red-700">Unresolved/source mapping required</span>}</div><p className="font-serif text-lg">{it.title}</p><p className="text-sm text-muted-foreground">{it.summary}</p></article>)}</div>
  </div></Shell>;
}
