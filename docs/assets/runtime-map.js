(async function(){
 if(document.body.dataset.page!=="runtime") return;
 const map=document.getElementById("runtime-map"); map.src=ASSET_URLS.runtimeFlow;
 const err=document.getElementById("runtime-error"); const wrap=document.getElementById("runtime-steps");
 try{const [flow,govRaw]=await Promise.all([fetch('data/runtime-flow.json').then(r=>r.json()),fetch('data/cam-governance.json').then(r=>r.json())]);
 const gov=Array.isArray(govRaw)?govRaw:govRaw.items||[];
 flow.forEach(step=>{const card=document.createElement('article'); card.className='step-card';
 const refs=(step.instrument_ids||[]).map(id=>`<li><a href='${sourceLink(id,gov)}' target='_blank' rel='noopener'>${id}</a></li>`).join('');
 card.innerHTML=`<button aria-expanded='false'><h3>${step.phase} · ${step.step_label}</h3><p>${step.explanation}</p><p><strong>Governance question:</strong> ${step.governance_question}</p></button><div class='step-details'><p><strong>Relevant instruments</strong></p><ul>${refs||"<li>None mapped</li>"}</ul></div>`;
 const btn=card.querySelector('button'); btn.onclick=()=>{const active=card.classList.toggle('active'); btn.setAttribute('aria-expanded',active?'true':'false');};
 wrap.appendChild(card);});
 }catch(e){err.hidden=false; err.textContent=`Failed to load runtime flow data (${e.message})`;}
})();
