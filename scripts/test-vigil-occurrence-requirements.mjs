import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AlignmentIcon, alignmentIconKind } from "../src/lib/vigilAlignmentIcon.mjs";
import assert from 'node:assert/strict';
import test from 'node:test';
import { occurrenceRequirementRows, publicRequirementEvidenceSources } from '../src/lib/vigilOccurrenceRequirements.mjs';
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
test('Compliance evidence citations use Section 06 numbering, not raw source indexes', () => {
 const sources = [
  {source_title:'Confidential internal note',source_residence:'cam-internal',source_url:'https://internal.example/'},
  {source_title:'Public trace',source_url:'https://example.org/trace'},
  {source_title:'Public trace',source_url:'https://example.org/trace'},
  {source_title:'Second public account',source_url:'https://example.org/second'},
  {source_title:'Internal working note',source_residence:'internal'},
  {source_url:'https://example.org/untitled'},
 ];
 const record = {...raw, source_records:sources, external_requirement_assessments:[{
  ...assessment, source_record_refs:['source_records[0]','source_records[1]','source_records[2]','source_records[3]','source_records[4]','source_records[5]','source_records[99]']
 }]};
 const bibliography = publicRequirementEvidenceSources(record);
 assert.deepEqual(bibliography.map(s=>({title:s.title,refs:s.sourceRecordRefs,number:s.referenceNumber})),[
  {title:'Public trace',refs:['source_records[1]','source_records[2]'],number:1},
  {title:'Second public account',refs:['source_records[3]'],number:2},
 ]);
 const numbers = Object.fromEntries(bibliography.flatMap(s=>s.sourceRecordRefs.map(ref=>[ref,s.referenceNumber])));
 assert.deepEqual(occurrenceRequirementRows(record,[requirement],numbers)[0].evidence,[
  {title:'Public trace',referenceNumber:1,url:'#vigil-evidence-reference-1'},
  {title:'Second public account',referenceNumber:2,url:'#vigil-evidence-reference-2'},
 ]);
 assert.deepEqual(occurrenceRequirementRows(record,[requirement],{})[0].evidence,[],
  'Unpublished or unresolved source references must not fall back to raw index numbers');
});
test('Compliance retains its assessment basis where no public references are linked', () => {
 const record = {...raw, external_requirement_assessments:[{...assessment,source_record_refs:[]}]};
 const row = occurrenceRequirementRows(record,[requirement],{});
 assert.equal(row[0].assessmentBasis, assessment.assessment_basis);
 assert.deepEqual(row[0].evidence,[]);
});

import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const classificationSource=await readFile(new URL('../src/lib/vigilTaxonomyClassification.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(classificationSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/^import .*;\n/gm,'');
const classification=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const classified=role=>({record_type:'incident',classification_status:'classified',classification_role:role,adjudication_coverage:{status:'complete'},alignment_exemplar_eligible:true});
test('Complete successful holding and eligibility do not imply admitted exemplar status',()=>{assert.equal(classification.taxonomyFailureTypeLabel(classified('successful-invariant')),'Safeguards worked');});
test('An ambiguous boundary alone is not a mixed outcome',()=>{assert.equal(classification.taxonomyFailureTypeLabel(classified('ambiguous-boundary')),'Outcome unclear');});
test('Incomplete coverage retains completed mapping findings without a whole-Incident outcome',()=>{assert.equal(classification.taxonomyFailureTypeLabel({...classified('failure-occurrence'),adjudication_coverage:{status:'partial'}}),'Review incomplete');});
test('Failure remains the Case File outcome beside successful safeguards',()=>{assert.equal(classification.taxonomyFailureTypeLabel({...classified('failure-occurrence'),primary_classification:{classification_role:'failure-occurrence'},secondary_classifications:[{classification_role:'successful-invariant'}]}),'Failures found');});
test('Unresolved results cannot erase confirmed failure or working safeguards',()=>{
 assert.equal(classification.taxonomyFailureTypeLabel({...classified('failure-occurrence'),primary_classification:{classification_role:'failure-occurrence'},secondary_classifications:[{classification_role:'ambiguous-boundary'}]}),'Failures found');
 assert.equal(classification.taxonomyFailureTypeLabel({...classified('successful-invariant'),primary_classification:{classification_role:'successful-invariant'},secondary_classifications:[{classification_role:'ambiguous-boundary'}]}),'Safeguards worked');
});
test('Disputes and required human review prevent a final outcome',()=>{
 assert.equal(classification.taxonomyFailureTypeLabel({...classified('failure-occurrence'),classification_status:'classification-disputed'}),'Review incomplete');
 assert.equal(classification.taxonomyFailureTypeLabel({...classified('failure-occurrence'),classification_status:'requires-human-review'}),'Review incomplete');
});
test('No applicable mapping after a complete review is not treated as a success',()=>{
 assert.equal(classification.taxonomyFailureTypeLabel({...classified('failure-occurrence'),classification_status:'unclassified',classification_role:undefined}),'No classification assigned');
});

// The static crawl pages must preserve the same assessments as the interactive view.
import vm from 'node:vm';
const staticSource = await readFile(new URL('./prepare-github-pages.js', import.meta.url), 'utf8');
const htmlFunction = staticSource.slice(staticSource.indexOf('function occurrenceAssessmentsHtml'), staticSource.indexOf('function clauseAssessmentsHtml'));
const html = vm.runInNewContext(`${htmlFunction}; occurrenceAssessmentsHtml`, {
 occurrenceRequirementRows, publicRequirementEvidenceSources,
 createElement, renderToStaticMarkup, AlignmentIcon, alignmentIconKind,
 occurrenceRequirements: [requirement],
 REQUIREMENT_ASSESSMENT_INTRO: 'Occurrence assessments',
 escapeHtml: value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
});
test('Static Case Files publish all results, normative force, basis, date and evidence',()=>{
 const output=html({...raw, external_requirement_assessments:['aligned','not-aligned','boundary'].map(alignment_result=>({...assessment,alignment_result}))});
 for(const value of ['Aligned','Not aligned','Boundary','Normative force','Voluntary consensus standard',assessment.assessment_basis,assessment.assessed_on,'#vigil-evidence-reference-1'])assert.ok(output.includes(value),value);
 assert.equal((output.match(/<tr>/g)||[]).length,4);
 assert.doesNotMatch(output,/Applicability|Not met|undefined|https:\/\/example.org/);
 assert.match(output, /The observed gate rejected the request\. <a href="#vigil-evidence-reference-1" aria-label="Evidence reference 1">\[1\]<\/a>/);
 assert.doesNotMatch(output, /Supporting evidence|Evidence:<\/|Observed trace|No source-record references are linked/);
 assert.match(staticSource, /<li id="vigil-evidence-reference-\$\{source.referenceNumber\}"/);
 assert.doesNotMatch(output, /href="#vigil-evidence-reference-2"/);
});
test('Static zero-row Case Files make no positive compliance claim',()=>{
 assert.equal(html({external_requirement_assessments:[]}),'<h2>Compliance</h2><p>No occurrence-specific external requirement assessment is published for this Case File.</p>');
});


test('Compliance and classification share the same three icon components', async () => {
 for (const [result, role, kind, css] of [
  ['aligned','successful-invariant','held','lucide-check'],
  ['not-aligned','failure-occurrence','failed','lucide-x'],
  ['boundary','ambiguous-boundary','ambiguous','lucide-circle-minus'],
 ]) {
  assert.equal(alignmentIconKind(result),kind);
  assert.equal(alignmentIconKind(role),kind);
  const svg=renderToStaticMarkup(createElement(AlignmentIcon,{kind}));
  assert.ok(svg.includes(css)); assert.ok(svg.includes('aria-hidden="true"'));
  const output=html({...raw,external_requirement_assessments:[{...assessment,alignment_result:result}]});
  assert.ok(output.includes(svg),'static output uses the identical icon markup');
 }
 assert.equal(alignmentIconKind('unknown'),undefined);
 for (const file of ['CaseTaxonomyClassification.tsx','CaseRequirementAssessments.tsx']) {
  const source=await readFile(new URL('../src/components/vigil/'+file,import.meta.url),'utf8');
  assert.match(source,/import \{[^}]*AlignmentIcon[^}]*\} from "@\/lib\/vigilAlignmentIcon.mjs"/);
 }
});
