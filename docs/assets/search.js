const DATA_URL = "data/cam-governance.json";
const CANONICAL_BASE = "https://github.com/CAM-Initiative/Caelestis/blob/main/";
const hierarchyOrder = ["constitution", "annex", "schedule", "domain charter", "appendix", "supplement"];
const pathways = {
  "Provenance & lineage": "provenance lineage source chain origin",
  "Identity integrity": "identity integrity attestation authentication role",
  "Runtime arbitration": "arbitration adjudication dispute conflict runtime",
  "Relational dependency": "dependency relation interop cross-domain",
  "Crisis response": "crisis emergency incident response continuity",
  "Economic extraction": "economic extraction fee levy compensation",
  "Platform legitimacy": "legitimacy trust charter constitutional authority",
  "Synthetic labour": "synthetic labour automation agent workload",
  "Security boundaries": "security boundary access control enclave",
  "Observability & telemetry": "observability telemetry logs metrics audit"
};
const searchFields = ["id","title","summary","purpose","domain","status","effect","enforcement","review_state","authority_role"];
const filterFields = ["domain","hierarchy_type","status","effect","enforcement"];
const state = { data: [], filtered: [], query: "", filters: {}, pathway: "" };

const $ = (id) => document.getElementById(id);
const clean = (v) => String(v ?? "").replace(/\*+/g, "").trim();
const normalize = (v) => clean(v).toLowerCase();

function fillSelect(field, rows) {
  const select = $("filter-" + field.replace("_", "-"));
  [...new Set(rows.map((r) => clean(r[field])).filter(Boolean))].sort((a,b)=>a.localeCompare(b)).forEach((value) => {
    const option = document.createElement("option"); option.value = value; option.textContent = value; select.appendChild(option);
  });
  select.addEventListener("change", (e) => { state.filters[field] = e.target.value; applyFilters(); });
}

function setupPathways(){
  const wrap=$("pathways");
  Object.entries(pathways).forEach(([label,terms])=>{
    const btn=document.createElement("button"); btn.className="pathway-btn"; btn.type="button"; btn.textContent=label;
    btn.addEventListener("click",()=>{ state.pathway = state.pathway===label?"":label; state.query = state.pathway?terms:""; $("search-input").value = state.query; applyFilters(); updatePathwayState(); });
    wrap.appendChild(btn);
  });
}
function updatePathwayState(){
  document.querySelectorAll(".pathway-btn").forEach((b)=>b.classList.toggle("active", b.textContent===state.pathway));
}

function matchesSearch(row){const q=normalize(state.query); if(!q) return true; return searchFields.some((f)=>normalize(row[f]).includes(q));}
function matchesFilters(row){return filterFields.every((f)=>!state.filters[f] || clean(row[f])===state.filters[f]);}

function relatedFor(item, rows){
  const score = (other)=>{
    if(other===item) return -1;
    let s=0;
    if(clean(other.domain) && clean(other.domain)===clean(item.domain)) s+=3;
    if(clean(other.parent_id) && (clean(other.parent_id)===clean(item.id) || clean(item.parent_id)===clean(other.id) || clean(other.parent_id)===clean(item.parent_id))) s+=3;
    if(clean(other.hierarchy_type)===clean(item.hierarchy_type)) s+=2;
    const q = normalize(state.query);
    if(q && searchFields.some((f)=>normalize(other[f]).includes(q))) s+=1;
    return s;
  };
  return rows.map((r)=>({r,s:score(r)})).filter((x)=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,3).map((x)=>x.r);
}
function toSourceUrl(item){return item.source_path ? `${CANONICAL_BASE}${item.source_path}` : "https://github.com/CAM-Initiative/Caelestis";}
function meta(dl,l,v){if(!v)return;const dt=document.createElement("dt");dt.textContent=l;const dd=document.createElement("dd");dd.textContent=clean(v);dl.append(dt,dd)}

function renderNavigation(rows){
  const d=$("domain-cards"); d.innerHTML="";
  const domainCounts={}; rows.forEach(r=>{const k=clean(r.domain)||"Unassigned"; domainCounts[k]=(domainCounts[k]||0)+1;});
  Object.entries(domainCounts).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([domain,count])=>{
    const b=document.createElement("button"); b.className="mini-card"; b.type="button"; b.textContent=`${domain} (${count})`;
    b.onclick=()=>{$("filter-domain").value=domain==="Unassigned"?"":domain; state.filters.domain=domain==="Unassigned"?"":domain; applyFilters();}; d.appendChild(b);
  });

  const h=$("hierarchy-cards"); h.innerHTML="";
  hierarchyOrder.forEach((type)=>{const count=rows.filter((r)=>normalize(r.hierarchy_type)===type).length; const b=document.createElement("button"); b.className="mini-card"; b.type="button"; b.textContent=`${type} (${count})`; b.onclick=()=>{$("filter-hierarchy-type").value=type; state.filters.hierarchy_type=type; applyFilters();}; h.appendChild(b);});
}

function renderResults(rows){
  const results=$("results"); const count=$("result-count"); results.innerHTML="";
  const active = Object.entries(state.filters).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join(", ");
  count.textContent = `${rows.length} results · total ${state.data.length}${state.pathway?` · pathway: ${state.pathway}`:""}${active?` · filters: ${active}`:""}`;
  if(!rows.length){results.innerHTML='<p class="empty-state">No instruments matched the active query/filter combination.</p>'; return;}
  const tpl=$("card-template"); const frag=document.createDocumentFragment();
  rows.forEach((item)=>{
    const card=tpl.content.firstElementChild.cloneNode(true);
    card.querySelector(".card-title").textContent = clean(item.title) || clean(item.id) || "Untitled";
    card.querySelector(".card-summary").textContent = clean(item.summary || item.purpose || "No summary/purpose provided.");
    const dl=card.querySelector(".card-meta");
    meta(dl,"ID",item.id); meta(dl,"Domain",item.domain); meta(dl,"Hierarchy",item.hierarchy_type||"constitution"); meta(dl,"Status",item.status); meta(dl,"Effect",item.effect); meta(dl,"Enforcement",item.enforcement);
    const rel=card.querySelector(".related-list");
    relatedFor(item, state.filtered).forEach((r)=>{const li=document.createElement("li"); li.textContent=`${clean(r.id)} — ${clean(r.title)}`; rel.appendChild(li);});
    if(!rel.children.length){const li=document.createElement("li"); li.textContent="No strong related matches."; rel.appendChild(li);}
    const link=card.querySelector(".source-link"); link.href=toSourceUrl(item);
    frag.appendChild(card);
  });
  results.appendChild(frag);
}

function applyFilters(){state.filtered = state.data.filter((r)=>matchesSearch(r)&&matchesFilters(r)); renderNavigation(state.filtered.length?state.filtered:state.data); renderResults(state.filtered);}

async function init(){
  setupPathways();
  filterFields.forEach((f)=>state.filters[f]="");
  $("search-input").addEventListener("input", (e)=>{state.query=e.target.value; state.pathway=""; updatePathwayState(); applyFilters();});
  try{
    const res = await fetch(DATA_URL); if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json(); state.data = Array.isArray(payload)?payload:(payload.items||[]);
    filterFields.forEach((f)=>fillSelect(f,state.data));
    applyFilters();
  }catch(err){
    $("result-count").innerHTML = `<span class="error">Failed to load governance data.</span>`;
    $("results").innerHTML = `<p class="error">Could not load <code>/docs/data/cam-governance.json</code>. Confirm the file exists at that path and GitHub Pages is serving /docs. (${err.message})</p>`;
  }
}
init();
