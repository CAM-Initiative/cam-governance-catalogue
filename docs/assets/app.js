const ASSET_URLS={
  runtimeMap:"https://raw.githubusercontent.com/CAM-Initiative/Caelestis/main/README/images/aeon-constitutional-runtime-map.svg",
  runtimeFlow:"https://raw.githubusercontent.com/CAM-Initiative/Caelestis/main/README/images/cam_runtime_flow_aeon_aesthetic.svg",
  cover:"https://raw.githubusercontent.com/CAM-Initiative/Caelestis/main/README/images/aeon-magazine-readme-cover-v3.svg"
};
const DATA={gov:"data/cam-governance.json",pathways:"data/problem-pathways.json"};
const SEARCH_FIELDS=["id","title","domain","summary","purpose","status","effect","enforcement","authority_role"];
const FILTER_FIELDS=["domain","hierarchy_type","status","effect","enforcement"];
const CANONICAL_BASE="https://github.com/CAM-Initiative/Caelestis/blob/main/";
const clean=v=>String(v??"").trim(); const norm=v=>clean(v).toLowerCase();
async function j(url){const r=await fetch(url); if(!r.ok) throw new Error(r.status); return r.json();}
function sourceLink(id,rows){const row=rows.find(r=>r.id===id); return row?.source_path?`${CANONICAL_BASE}${row.source_path}`:"https://github.com/CAM-Initiative/Caelestis";}
function setMapImage(){const hero=document.getElementById("hero-runtime-map"); if(hero) hero.src=ASSET_URLS.runtimeMap;}
function initExplorer(){const root=document.body.dataset.page; if(root!=="explorer") return; let rows=[]; const state={q:"",f:{}}; FILTER_FIELDS.forEach(f=>state.f[f]="");
const rc=document.getElementById("result-count"), res=document.getElementById("results");
function render(list){const active=Object.entries(state.f).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join(", "); rc.textContent=`${list.length} shown of ${rows.length}${active?` · filters ${active}`:""}`; res.innerHTML=""; list.forEach(item=>{const a=document.createElement("article"); a.className="instrument-card"; a.innerHTML=`<h3>${clean(item.title)||clean(item.id)}</h3><p class='muted'>${clean(item.summary||item.purpose||"No summary")}</p><div class='tags'><span class='tag'>${clean(item.domain)||"Unassigned"}</span><span class='tag'>${clean(item.hierarchy_type)||"constitution"}</span><span class='tag'>${clean(item.status)||""}</span></div><p><a href='${sourceLink(item.id,rows)}' target='_blank' rel='noopener'>Canonical source</a></p>`; res.appendChild(a);}); if(!list.length)res.innerHTML="<p class='muted'>No matching instruments.</p>"; }
function apply(){const list=rows.filter(r=>SEARCH_FIELDS.some(f=>norm(r[f]).includes(norm(state.q)))&&FILTER_FIELDS.every(f=>!state.f[f]||clean(r[f])===state.f[f])); render(list);}
j(DATA.gov).then(data=>{rows=Array.isArray(data)?data:data.items||[]; FILTER_FIELDS.forEach(f=>{const s=document.getElementById(`filter-${f.replace('_','-')}`); [...new Set(rows.map(r=>clean(r[f])).filter(Boolean))].sort().forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;s.appendChild(o)}); s.onchange=e=>{state.f[f]=e.target.value;apply();};}); document.getElementById("search-input").oninput=e=>{state.q=e.target.value;apply();}; apply();}).catch(err=>{rc.innerHTML=`<span class='error'>Failed to load /docs/data/cam-governance.json (${err.message})</span>`;});
j(DATA.pathways).then(pathways=>{const wrap=document.getElementById("pathway-list"); pathways.forEach(p=>{const card=document.createElement("article"); card.className="pathway-card"; card.innerHTML=`<h3>${p.name}</h3><p>${p.meaning}</p><p><strong>Likely phase:</strong> ${p.likely_runtime_phase}</p><p><strong>Concepts/codes:</strong> ${(p.concepts||[]).join(", ")||"—"}</p><p><strong>Relevant instruments:</strong> ${(p.instrument_ids||[]).join(", ")}</p><p><a href='${p.source_link}' target='_blank' rel='noopener'>Source context</a></p>`; wrap.appendChild(card);});}).catch(()=>{const e=document.getElementById("pathway-error"); e.hidden=false; e.textContent="Failed to load curated pathways.";});
}
setMapImage(); initExplorer();
