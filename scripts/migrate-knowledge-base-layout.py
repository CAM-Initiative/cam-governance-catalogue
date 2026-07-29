#!/usr/bin/env python3
from pathlib import Path
import re

path = Path("src/pages/vigil-knowledge-base.tsx")
text = path.read_text(encoding="utf-8")

new_card = '''function KnowledgeCard({ record }: { record: LearnRecord }) {
  return <article className="cam-parchment-card overflow-hidden rounded-3xl border border-cam-gold/30 shadow-lg transition hover:-translate-y-0.5 hover:border-cam-gold/50 hover:shadow-xl">
    <div className="border-b border-cam-gold/25 bg-[hsl(36_48%_96%)] px-6 py-4 md:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">{record.id}</p>
        <StatusBadges record={record} />
      </div>
    </div>
    <div className="p-6 md:p-7">
      <h3 className="font-serif text-3xl leading-tight text-foreground md:text-[2rem]">{record.title}</h3>
      {record.caseDescriptor && <p className="mt-3 text-base font-medium leading-relaxed text-foreground/70">{record.caseDescriptor}</p>}
      <div className="mt-5 border-l-2 border-cam-gold/35 pl-4">
        <p className="report-label">Reusable governance lesson</p>
        <p className="mt-2 text-base leading-relaxed text-foreground/85">{record.abstractedLearning}</p>
      </div>
      {(record.canonicalFailureName || record.primaryFailureFamilyCode) && <div className="mt-6 rounded-2xl border border-border/75 bg-card/65 p-4">
        <p className="report-label">Failure taxonomy</p>
        {record.canonicalFailureName && <p className="mt-1.5 font-serif text-lg leading-snug text-foreground">{record.canonicalFailureName}</p>}
        {record.primaryFailureFamilyCode && <p className="mt-1 font-mono text-xs text-muted-foreground">{record.primaryFailureFamilyCode}</p>}
      </div>}
      {record.knowledgeTags.length > 0 && <div className="mt-5 flex flex-wrap gap-2">
        {record.knowledgeTags.slice(0, 5).map((tag) => <span key={tag} className="rounded-full border border-border bg-background/55 px-2.5 py-1 text-xs text-muted-foreground">{tag}</span>)}
      </div>}
      <div className="mt-7 flex flex-wrap gap-3 border-t border-border/65 pt-5">
        <Link href={`/observatory/knowledge-base/${encodeURIComponent(record.id)}`} className="inline-flex min-h-11 items-center rounded-xl bg-rose-900 px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-rose-50 transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 focus-visible:ring-offset-background">Read lesson</Link>
        <Link href={`/observatory/reports/${encodeURIComponent(record.id)}`} className="inline-flex min-h-11 items-center rounded-xl border border-cam-gold/50 bg-cam-gold/10 px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] transition hover:bg-cam-gold/20">View evidence report</Link>
      </div>
    </div>
  </article>;
}'''

card_pattern = re.compile(r'function KnowledgeCard\(\{ record \}: \{ record: LearnRecord \}\) \{.*?\n\}\n\n(?=function DetailSection)', re.S)
text, card_count = card_pattern.subn(new_card + "\n\n", text, count=1)
if card_count != 1:
    raise SystemExit(f"KnowledgeCard structural replacement failed: {card_count}")

new_library = '''      <div className="mt-7 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside aria-label="Knowledge Base search and filters" className="cam-parchment-card rounded-2xl p-4 shadow-sm lg:sticky lg:top-20">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">Search the Knowledge Base</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Find a completed lesson by incident, failure family, application, vendor, principle, or VIGIL record ID.</p>
          </div>
          <label className="relative block"><span className="sr-only">Search lessons learned</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lessons…" className="w-full rounded-xl border border-input bg-background/70 py-3 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15" /></label>
          <div className="mt-5 space-y-4 border-t border-border/65 pt-5">
            <label className="block"><span className="report-label">Year</span><select value={year} onChange={(event) => setYear(event.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm"><option value="">All years</option>{filterOptions.years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="block"><span className="report-label">Failure family</span><select value={failureFamily} onChange={(event) => setFailureFamily(event.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm"><option value="">All failure families</option>{filterOptions.families.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="block"><span className="report-label">Application</span><select value={application} onChange={(event) => setApplication(event.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm"><option value="">All applications</option>{filterOptions.applications.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="block"><span className="report-label">Monitoring</span><select value={monitoring} onChange={(event) => setMonitoring(event.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm"><option value="">All monitoring states</option><option value="required">Monitoring ongoing</option><option value="not-required">No monitoring declared</option></select></label>
          </div>
          {(query || year || failureFamily || application || monitoring) && <button type="button" onClick={() => { setQuery(""); setYear(""); setFailureFamily(""); setApplication(""); setMonitoring(""); }} className="mt-5 w-full rounded-xl border border-cam-gold/35 bg-card px-3 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/55 hover:bg-background">Clear search and filters</button>}
        </aside>

        <section className="min-w-0" aria-label="Published VIGIL lessons">
          {state.status === "loading" && <div className="cam-parchment-card rounded-2xl p-6 text-muted-foreground">Loading published learning records…</div>}
          {state.status === "error" && <div className="cam-parchment-card rounded-2xl p-6"><p className="font-mono text-xs uppercase tracking-[0.16em] text-rose-800">Knowledge Base unavailable</p><p className="mt-3 text-muted-foreground">{state.message}</p></div>}
          {state.status === "ready" && <>
            {state.notice && <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{state.notice}</p>}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-4">
              <div><p className="font-mono text-xs uppercase tracking-[0.14em] text-cam-gold">Published lessons</p><p className="mt-1 text-sm text-muted-foreground">{filtered.length} lesson{filtered.length === 1 ? "" : "s"} in this view</p></div>
            </div>
            {grouped.length ? <div className="space-y-12">{grouped.map(([groupYear, groupRecords]) => <section key={groupYear} aria-labelledby={`knowledge-year-${groupYear}`}><div className="flex items-center gap-4"><h2 id={`knowledge-year-${groupYear}`} className="font-serif text-3xl text-foreground">{groupYear}</h2><div className="h-px flex-1 bg-border" /></div><div className="mt-5 space-y-6">{groupRecords.map((record) => <KnowledgeCard key={record.id} record={record} />)}</div></section>)}</div> : <div className="cam-parchment-card rounded-2xl p-6"><p className="font-serif text-2xl text-foreground">No published lessons match this view</p><p className="mt-3 text-muted-foreground">Clear one or more filters, or check again after a VIGIL evidence chain has been closed with a published LEARN record.</p></div>}
          </>}
        </section>
      </div>'''

start = text.find('      <section aria-label="Knowledge Base search and filters"')
end_marker = '      </>}\n    </>}\n  </main></Shell>;'
end = text.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit(f"Knowledge Base library structural boundaries not found: start={start}, end={end}")
text = text[:start] + new_library + "\n" + text[end:]

path.write_text(text, encoding="utf-8")
