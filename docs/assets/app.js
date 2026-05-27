const IMAGE_SOURCES = {
  runtimeMap: "https://raw.githubusercontent.com/CAM-Initiative/Caelestis/main/docs/images/aeon-constitutional-runtime-map.svg",
  runtimeFlow: "https://raw.githubusercontent.com/CAM-Initiative/Caelestis/main/docs/images/cam_runtime_flow_aeon_aesthetic.svg",
  cover: "https://raw.githubusercontent.com/CAM-Initiative/Caelestis/main/docs/images/aeon-magazine-readme-cover-v3.svg"
};
const DATA_URL = "data/cam-governance.json";
const PATHWAYS_URL = "data/problem-pathways.json";
const fields=["id","title","domain","summary","purpose","status","effect","enforcement","authority_role"];
const filters=["domain","hierarchy_type","status","effect","enforcement"];
const st={data:[],filtered:[],query:"",filters:{}};
const clean=v=>String(v??"").replace(/\*+/g,"").trim(); const n=v=>clean(v).toLowerCase();
const byId=id=>document.getElementById(id);

if(byId("hero-runtime-map")) byId("hero-runtime-map").src = IMAGE_SOURCES.runtimeMap;

async function loadJson(url){const r=await fetch(url); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();}
function makeMeta(dl,k,v){if(!v)return;const dt=document.createElement("dt");dt.textContent=k;const dd=document.createElement("dd");dd.textContent=clean(v);dl.append(dt,dd)}
function sourceLink(it){return it.link||"https://github.com/CAM-Initiative/Caelestis";}

async function initExplorer(){
  if(!byId("results")) return;
  try{
    const [data,pw] = await Promise.all([loadJson(DATA_URL),loadJson(PATHWAYS_URL)]);
    st.data = Array.isArray(data)?data:(data.items||[]);
    renderPathways(pw.pathways||pw);
    filters.forEach(f=>{st.filters[f]="";const sel=byId(`filter-${f.replace('_','-')}`);[...new Set(st.data.map(r=>clean(r[f])).filter(Boolean))].sort().forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o)});sel.onchange=e=>{st.filters[f]=e.target.value;apply();};});
    byId("search-input").oninput=e=>{st.query=e.target.value;apply();};
    apply();
  }catch(e){byId("result-count").innerHTML='<span class="error">Failed to load explorer data.</span>'; byId("results").innerHTML=`<p class="error">Expected /docs/data/cam-governance.json and /docs/data/problem-pathways.json (${e.message})</p>`;}
}
function renderPathways(pathways){const grid=byId("pathway-grid");grid.innerHTML="";pathways.forEach(p=>{const a=document.createElement("article");a.className="pathway";a.tabIndex=0;a.innerHTML=`<h3>${p.name}</h3><p>${p.meaning}</p><p><span class="pill">Likely phase: ${p.runtime_phase}</span></p><p><strong>Relevant instruments:</strong> ${p.instrument_ids.join(", ")}</p><p><strong>Concepts:</strong> ${(p.codes||[]).join(", ")||"—"}</p><p><a class="source-link" href="${p.source}" target="_blank" rel="noopener noreferrer">Source</a></p>`;a.onclick=()=>{byId("search-input").value=p.keywords.join(" ");st.query=p.keywords.join(" ");apply();};grid.appendChild(a);});}
function match(row){const q=n(st.query);const text=fields.some(f=>n(row[f]).includes(q));const fits=filters.every(f=>!st.filters[f]||clean(row[f])===st.filters[f]);return (!q||text)&&fits;}
function apply(){st.filtered=st.data.filter(match);byId("result-count").textContent=`${st.filtered.length} results · total ${st.data.length} · active filters: ${Object.entries(st.filters).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join(', ')||'none'}`; renderResults();}
function renderResults(){const host=byId("results");host.innerHTML="";if(!st.filtered.length){host.innerHTML='<p>No instruments match the current pathway/search/filter state.</p>';return;}const tpl=byId("instrument-card");st.filtered.forEach(it=>{const card=tpl.content.firstElementChild.cloneNode(true);card.querySelector('.card-title').textContent=clean(it.title)||clean(it.id);card.querySelector('.card-summary').textContent=clean(it.summary||it.purpose||"No summary.");const dl=card.querySelector('.card-meta');makeMeta(dl,'ID',it.id);makeMeta(dl,'Domain',it.domain);makeMeta(dl,'Hierarchy',it.hierarchy_type||'constitution');makeMeta(dl,'Status',it.status);makeMeta(dl,'Effect',it.effect);makeMeta(dl,'Enforcement',it.enforcement);card.querySelector('.source-link').href=sourceLink(it);host.appendChild(card);});}
initExplorer();
