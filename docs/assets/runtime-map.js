const IMAGE_SOURCES = {
  runtimeFlow: "https://raw.githubusercontent.com/CAM-Initiative/Caelestis/main/docs/images/cam_runtime_flow_aeon_aesthetic.svg"
};
const FLOW_URL = "data/runtime-flow.json";
const GOV_URL = "data/cam-governance.json";
const byId = (id) => document.getElementById(id);
const clean = (v) => String(v ?? "").replace(/\*+/g, "").trim();
if (byId("runtime-flow-image")) byId("runtime-flow-image").src = IMAGE_SOURCES.runtimeFlow;

async function initRuntime(){
  try{
    const [flow,gov]=await Promise.all([fetch(FLOW_URL).then(r=>r.json()),fetch(GOV_URL).then(r=>r.json())]);
    const rows = Array.isArray(gov)?gov:(gov.items||[]);
    const idx = new Map(rows.map(r=>[r.id,r]));
    render(flow.phases||[],idx);
  }catch(e){byId("runtime-phases").innerHTML=`<p class="error">Could not load runtime data. Expected /docs/data/runtime-flow.json and /docs/data/cam-governance.json (${e.message})</p>`;}
}
function render(phases, idx){const host=byId("runtime-phases");host.innerHTML="";phases.forEach(phase=>{const sec=document.createElement("section");sec.className="phase";sec.innerHTML=`<h3>${phase.name}</h3>`;phase.steps.forEach(step=>{const art=document.createElement("article");art.className="step-card";art.innerHTML=`<button class="step-button" aria-expanded="false"><strong>${step.label}</strong> — ${step.explanation}</button><div class="step-details" hidden><p><strong>Governance question:</strong> ${step.governance_question}</p><p><strong>Relevant instruments:</strong></p><ul></ul></div>`;const ul=art.querySelector("ul");step.instrument_ids.forEach(id=>{const row=idx.get(id);const li=document.createElement("li");const href=(row&&row.link)||"https://github.com/CAM-Initiative/Caelestis";li.innerHTML=`<a class="source-link" href="${href}" target="_blank" rel="noopener noreferrer">${id}</a>${row?` — ${clean(row.title)}`:""}`;ul.appendChild(li);});const btn=art.querySelector(".step-button");const det=art.querySelector(".step-details");btn.onclick=()=>{const open=det.hidden;det.hidden=!open;btn.setAttribute("aria-expanded",String(open));};sec.appendChild(art);});host.appendChild(sec);});}
initRuntime();
