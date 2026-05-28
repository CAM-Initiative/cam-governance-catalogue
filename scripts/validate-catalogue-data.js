#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'docs', 'data');

const asArray = (v) => Array.isArray(v) ? v : [];
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const gov = asArray(loadJson(path.join(dataDir, 'cam-governance.json')));
const canon = new Map(gov.map((i) => [i.id, i.link]));
const failures = [];

function validateRefSet(items, fileLabel) {
  asArray(items).forEach((row, idx) => {
    asArray(row.instrument_ids).forEach((id) => {
      if (!canon.has(id)) failures.push(`${fileLabel}[${idx}] unknown instrument id: ${id}`);
      const link = canon.get(id);
      if (typeof link !== 'string' || !link.trim()) failures.push(`${fileLabel}[${idx}] references ${id} but cam-governance.json has no link`);
    });
  });
}

['runtime-flow.json', 'problem-pathways.json'].forEach((name) => {
  validateRefSet(loadJson(path.join(dataDir, name)), name);
});

if (failures.length) {
  console.error('Catalogue validation failed:');
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log('Catalogue validation passed.');
