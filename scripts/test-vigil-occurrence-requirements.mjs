import assert from 'node:assert/strict';
import test from 'node:test';
import { occurrenceRequirementRows } from '../src/lib/vigilOccurrenceRequirements.mjs';
const requirement = { requirement_id: 'R1', external_source_id: 'IEEE 7014', clause_or_control: '4.3', requirement_summary: 'A bounded requirement', normative_force: 'voluntary-consensus-standard', vigil_source_id: 'IEEE-7014', source_version: '2024' };
const assessment = { requirement_id: 'R1', alignment_result: 'aligned', assessment_basis: 'The observed gate rejected the request.', assessed_on: '2026-10-04', source_record_refs: ['source_records[0]'] };
const raw = { taxonomy_classification: { primary_classification: { classification_role: 'failure-occurrence' } }, source_records: [{ source_title: 'Observed trace', source_url: 'https://example.org/trace' }], external_requirement_assessments: [assessment] };
test('All three results render for voluntary requirements without taxonomy polarity inheritance', () => {
 const rows = occurrenceRequirementRows({...raw, external_requirement_assessments: ['aligned','not-aligned','boundary'].map(alignment_result=>({...assessment, alignment_result}))}, [requirement]);
 assert.deepEqual(rows.map(row=>row.resultLabel), ['Aligned','Not aligned','Boundary']);
 assert.ok(rows.every(row=>row.normativeForce==='Voluntary consensus standard'));
 assert.equal(rows[0].assessmentBasis,assessment.assessment_basis);
 assert.equal(rows[0].assessedOn,assessment.assessed_on);
 assert.deepEqual(rows[0].evidence,[{title:'Observed trace',referenceNumber:1,url:'#vigil-evidence-reference-1'}]);
 assert.match(rows[0].url,/ai-governance-standards/);
});
test('Independent assessments render without a taxonomy classification', () => {
 assert.equal(occurrenceRequirementRows({external_requirement_assessments:[assessment]},[requirement])[0].resultLabel,'Aligned');
});
test('Different clause assessments retain both results', () => {
 const rows=occurrenceRequirementRows({...raw,external_requirement_assessments:[assessment,{...assessment,alignment_result:'not-aligned',source_clause_indices:[1]}]},[requirement]);
 assert.deepEqual(rows.map(row=>row.resultLabel),['Aligned','Not aligned']);assert.notEqual(rows[0].key,rows[1].key);
});
test('Missing, empty, invalid and retired assessments never manufacture compliance', () => {
 for (const assessments of [undefined,[],[{requirement_id:'R1',applicability_status:'applicable',finding:'met'}],[{...assessment,alignment_result:'unknown'}],[{...assessment,alignment_result:'toString'}]]) {
  assert.deepEqual(occurrenceRequirementRows({taxonomy_classification:raw.taxonomy_classification,external_requirement_assessments:assessments},[requirement]),[]);
 }
});
test('Metadata outage preserves results, basis and dates without exposing internal IDs', () => {
 const row=occurrenceRequirementRows(raw)[0];assert.equal(row.resultLabel,'Aligned');assert.equal(row.title,'Requirement details unavailable');assert.equal(row.normativeForce,'Not recorded');assert.equal(row.assessmentBasis,assessment.assessment_basis);
});
test('Evidence references resolve within this occurrence and omit invalid references', () => {
 const row=occurrenceRequirementRows({...raw,external_requirement_assessments:[{...assessment,source_record_refs:['source_records[0]','source_records[9]','https://example.org']}]},[requirement])[0];
 assert.equal(row.evidence.length,1);assert.equal(row.evidence[0].url,'#vigil-evidence-reference-1');
});
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const classificationSource=await readFile(new URL('../src/lib/vigilTaxonomyClassification.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(classificationSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/^import .*;\n/gm,'');
const classification=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const classified=role=>({record_type:'incident',classification_status:'classified',classification_role:role,adjudication_coverage:{status:'complete'},alignment_exemplar_eligible:true});
test('Complete successful holding and eligibility do not imply admitted exemplar status',()=>{assert.equal(classification.taxonomyFailureTypeLabel(classified('successful-invariant')),'Invariant held');});
test('An ambiguous boundary alone is not a mixed outcome',()=>{assert.equal(classification.taxonomyFailureTypeLabel(classified('ambiguous-boundary')),'Boundary unresolved');});
test('Incomplete coverage retains completed mapping findings without a whole-Incident outcome',()=>{assert.equal(classification.taxonomyFailureTypeLabel({...classified('failure-occurrence'),adjudication_coverage:{status:'partial'}}),'Adjudication incomplete');});
test('Distinct failure and held mappings produce a mixed outcome',()=>{assert.equal(classification.taxonomyFailureTypeLabel({...classified('failure-occurrence'),primary_classification:{classification_role:'failure-occurrence'},secondary_classifications:[{classification_role:'successful-invariant'}]}),'Combination');});

// The static crawl pages must preserve the same assessments as the interactive view.
import vm from 'node:vm';
const staticSource = await readFile(new URL('./prepare-github-pages.js', import.meta.url), 'utf8');
const htmlFunction = staticSource.slice(staticSource.indexOf('function occurrenceAssessmentsHtml'), staticSource.indexOf('function clauseAssessmentsHtml'));
const html = vm.runInNewContext(`${htmlFunction}; occurrenceAssessmentsHtml`, {
 occurrenceRequirementRows,
 occurrenceRequirements: [requirement],
 REQUIREMENT_ASSESSMENT_INTRO: 'Occurrence assessments',
 escapeHtml: value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
});
test('Static Case Files publish all results, normative force, basis, date and evidence',()=>{
 const output=html({...raw, external_requirement_assessments:['aligned','not-aligned','boundary'].map(alignment_result=>({...assessment,alignment_result}))});
 for(const value of ['Aligned','Not aligned','Boundary','Normative force','Voluntary consensus standard',assessment.assessment_basis,assessment.assessed_on,'#vigil-evidence-reference-1'])assert.ok(output.includes(value),value);
 assert.equal((output.match(/<tr>/g)||[]).length,4);
 assert.doesNotMatch(output,/Applicability|Not met|undefined|https:\/\/example.org/);
});
test('Static zero-row Case Files make no positive compliance claim',()=>{
 assert.equal(html({external_requirement_assessments:[]}),'<h2>Compliance</h2><p>No occurrence-specific external requirement assessment is published for this Case File.</p>');
});
