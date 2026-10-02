import assert from 'node:assert/strict';
import test from 'node:test';
import { occurrenceRequirementRows } from '../src/lib/vigilOccurrenceRequirements.mjs';
const requirement = { requirement_id: 'R1', external_source_id: 'IEEE 7014', clause_or_control: '4.3', requirement_summary: 'A bounded requirement', normative_force: 'voluntary' };
const assessment = { requirement_id: 'R1', applicability_status: 'applicable', applicability_basis: 'The activity is within scope.', finding: 'met', finding_basis: 'The observed gate rejected the request.', source_record_refs: ['source_records[0]'] };
const raw = { taxonomy_classification: { primary_classification: { classification_role: 'failure-occurrence' } }, source_records: [{ source_title: 'Observed trace', source_url: 'https://example.org/trace' }], external_requirement_assessments: [assessment] };
test('Taxonomy failure does not overwrite an independently met requirement', () => {
 const rows = occurrenceRequirementRows(raw, [requirement]); assert.equal(rows[0].finding, 'Met'); assert.equal(rows[0].normativeForce, 'voluntary'); assert.equal(rows[0].evidence[0].title, 'Observed trace');
});
test('Uncertain or excluded applicability never acquires a finding', () => {
 for (const status of ['insufficient-evidence', 'not-applicable']) { const rows=occurrenceRequirementRows({...raw, external_requirement_assessments:[{...assessment, applicability_status:status}]},[requirement]); assert.equal(rows[0].finding, undefined); assert.equal(rows[0].findingBasis, undefined); assert.equal(rows[0].applicable,false); }
});
test('Independent assessments render without a taxonomy classification', () => {
 assert.equal(occurrenceRequirementRows({external_requirement_assessments:[assessment]},[requirement])[0].finding,'Met');
});
test('Different clause assessments of the same requirement retain both findings', () => {
 const rows=occurrenceRequirementRows({...raw,external_requirement_assessments:[assessment,{...assessment,finding:'not-met',source_clause_indices:[1]}]},[requirement]);assert.deepEqual(rows.map(row=>row.finding),['Met','Not met']);assert.notEqual(rows[0].key,rows[1].key);
});
test('Taxonomy candidates and missing assessments do not manufacture compliance', () => { assert.deepEqual(occurrenceRequirementRows({taxonomy_classification:raw.taxonomy_classification},[requirement]),[]); });
test('Metadata outage preserves the assessment without exposing internal requirement IDs', () => { const row=occurrenceRequirementRows(raw)[0];assert.equal(row.finding,'Met');assert.equal(row.title,'Requirement details unavailable');assert.ok(!row.title.includes('R1')); });
test('An applicable requirement with insufficient evidence is distinct from uncertain applicability',()=>{ const row=occurrenceRequirementRows({...raw, external_requirement_assessments:[{...assessment,finding:'evidence-insufficient'}]},[requirement])[0];assert.equal(row.applicable,true);assert.equal(row.finding,'Insufficient evidence for a finding'); });
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
