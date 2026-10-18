const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),assert=require('assert/strict');
// One-off acceptance audit, not a permanent corpus semantic validator.
// Requires Playwright and a compatible Chromium executable.
const web=process.env.SECTION03_WEBSITE_ROOT||process.cwd(),canonical=process.env.SECTION03_CANONICAL_ROOT||require('path').resolve(web,'../canonical');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.SECTION03_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage']});
 const server=http.createServer((req,res)=>{let file=web+'/docs'+decodeURIComponent(req.url.split('?')[0]);if(file.endsWith('/'))file+='index.html';if(!fs.existsSync(file))file=web+'/docs/index.html';res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(4190,'127.0.0.1',r));
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='127.0.0.1')return route.continue();
  if(url.hostname==='raw.githubusercontent.com'&&url.pathname.startsWith('/CAM-Initiative/Vigil/')){
   const offset=url.pathname.indexOf('/vigil/');const file=canonical+url.pathname.slice(offset);
   if(offset>=0&&fs.existsSync(file))return route.fulfill({body:fs.readFileSync(file),contentType:'application/json',headers:{'access-control-allow-origin':'*'}});
  }
  return route.abort(); // Remote decorative images/fonts are unavailable in this local test.
 });
 const results=[],page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function open(n,report=false){const id=`VIGIL-INC-${String(n).padStart(6,'0')}`;await page.goto(`http://127.0.0.1:4190/observatory/${report?'reports':'cases'}/${id}/`,{waitUntil:'domcontentloaded'});if(!report)await page.getByRole('tab',{name:'03 Classification'}).click();await page.waitForTimeout(100);return JSON.parse(fs.readFileSync(`${canonical}/vigil/records/incidents/${id}.json`));}
 for(const n of [1,2,3,4,6,126,129,139,144,197,198]){
  const r=await open(n);const t=r.taxonomy_classification;const mappings=[t.primary_classification,...t.secondary_classifications].filter(Boolean);
  if(mappings.length){await page.waitForSelector('.vigil-primary-classification-table');const rows=page.locator('.vigil-primary-classification-table tbody > tr');assert.equal(await rows.count(),mappings.length);
   for(let i=0;i<mappings.length;i++){const m=mappings[i],row=rows.nth(i);assert.equal(await row.locator('td.vigil-classification-basis > p').first().textContent(),m.classification_basis);assert((await row.innerText()).includes(m.class_id));
    const label=m.classification_role==='ambiguous-boundary'?'Boundary unresolved':m.classification_role==='successful-invariant'?'Invariant held':'Failure occurred';assert((await row.locator('td').first().innerText()).includes(label));
    assert.equal(await row.locator('details.vigil-classification-reference-criteria').getAttribute('open'),null);
   }
   assert((await page.locator('.vigil-taxonomy-reference-note').allTextContents()).join(' ').includes(t.taxonomy_version));
  }else{await page.getByText('No VIGIL Observatory Alignment Taxonomy classification is recorded for this Incident.',{exact:false}).waitFor();assert.equal(await page.locator('.vigil-primary-classification-table').count(),0);assert((await page.locator('[role=tabpanel]').innerText()).includes('No VIGIL Observatory Alignment Taxonomy classification'));}
  if(n===139)assert((await page.locator('[role=tabpanel]').innerText()).includes('Further adjudication required'));
  if(n===129)assert((await page.locator('[role=tabpanel]').innerText()).includes('disputed'));
  results.push({incident:n,surface:'interactive',mappings:mappings.length,result:'pass'});
 }
 await open(3);await page.waitForSelector('.vigil-primary-classification-table');const signal=page.locator('.vigil-primary-classification-table tbody > tr').filter({hasText:'VIGIL-FC-000042'});
 await signal.locator('.vigil-classification-evidence > summary').click();assert((await signal.innerText()).includes('E019'));
 await signal.getByRole('link',{name:'E019 · Section 02'}).click();await page.waitForSelector('#vigil-source-episode-E019');assert.equal(await page.locator('#case-panel-diagnose').count(),1);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.activeElement.id),'vigil-source-episode-E019');
 results.push({surface:'episode navigation to mounted Assessment and keyboard focus',result:'pass'});
 await open(2);await page.waitForSelector('.vigil-primary-classification-table');await page.locator('.vigil-classification-reference-criteria > summary').first().click();const reference=await page.locator('.vigil-classification-reference-criteria').first().innerText();assert(reference.includes('Failure-side conditions')&&reference.includes('Success-side conditions'));
 await page.locator('#case-classify').screenshot({path:'/tmp/section03-boundary-desktop.png'});
 await page.setViewportSize({width:390,height:844});await open(1);await page.waitForSelector('.vigil-primary-classification-table');
 const widths=await page.locator('.vigil-primary-classification-table-wrap').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));assert(widths.scroll<=widths.client+2,JSON.stringify(widths));
 await page.locator('.vigil-primary-classification-table tbody > tr').first().scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/section03-mobile.png'});results.push({surface:'390px responsive classification',...widths,result:'pass'});
 await page.setViewportSize({width:1440,height:1000});
 for(const n of [1,2,3,4,6,126,129,139,144]){const r=await open(n,true);await page.waitForSelector('.report-document');const ms=[r.taxonomy_classification.primary_classification,...r.taxonomy_classification.secondary_classifications].filter(Boolean);if(ms.length){await page.waitForSelector('.vigil-primary-classification-table');for(let i=0;i<ms.length;i++)assert.equal(await page.locator('.vigil-primary-classification-table tbody > tr').nth(i).locator('td.vigil-classification-basis > p').first().textContent(),ms[i].classification_basis);}results.push({incident:n,surface:'deterministic/print report',result:'pass'});}
 await open(3,true);await page.waitForSelector('.vigil-primary-classification-table');await page.emulateMedia({media:'print'});
 await page.pdf({path:'/tmp/section03-inc003.pdf',format:'A4',printBackground:true});
 await page.locator('.vigil-primary-classification-table tbody > tr').first().screenshot({path:'/tmp/section03-print.png'});
 results.push({surface:'A4 PDF produced from Chromium print media',result:'pass'});
 assert.deepEqual(errors,[]);fs.writeFileSync('/tmp/section03-browser-results.json',JSON.stringify({results,pageErrors:errors,limitations:['External decorative images and Google fonts blocked; local fallback fonts used.','Canonical network responses supplied from the exact adjudication working tree; no deployment.']},null,2));
 console.log(JSON.stringify({checks:results.length,pageErrors:errors}));await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
