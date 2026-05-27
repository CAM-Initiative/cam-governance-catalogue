#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'docs', 'data');
function loadJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function asArray(data) { return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []); }
const gov = asArray(loadJson(path.join(dataDir, 'cam-governance.json')));
const validIds = new Set(gov.map((i) => i?.id).filter(Boolean));
const linksById = new Map(gov.filter((i) => i?.id).map((i) => [i.id, i.link]));
const failures = [];
function checkRefs(entries, fileLabel) {
  entries.forEach((entry, idx) => {
    const ids = Array.isArray(entry?.instrument_ids) ? entry.instrument_ids : [];
    ids.forEach((id) => { if (!validIds.has(id)) failures.push(`${fileLabel}[${idx}] unknown instrument id: ${id}`); });
  });
}
function checkCanonicalLinks(entries, fileLabel) {
  entries.forEach((entry, idx) => {
    const ids = Array.isArray(entry?.instrument_ids) ? entry.instrument_ids : [];
    ids.forEach((id) => {
      if (!validIds.has(id)) return;
      const link = linksById.get(id);
      if (typeof link !== 'string' || !link.trim()) failures.push(`${fileLabel}[${idx}] references ${id} but cam-governance.json has no link`);
    });
  });
}
['runtime-flow.json', 'problem-pathways.json'].forEach((name) => {
  const file = path.join(dataDir, name);
  if (!fs.existsSync(file)) return;
  const entries = asArray(loadJson(file));
  checkRefs(entries, name);
  checkCanonicalLinks(entries, name);
});
if (failures.length) { console.error('Catalogue validation failed:'); failures.forEach((f) => console.error(`- ${f}`)); process.exit(1); }
console.log('Catalogue validation passed.');
