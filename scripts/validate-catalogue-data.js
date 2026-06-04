#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');
const dataDir = path.join(repoRoot, 'docs', 'data');
const fallbackPath = path.join(dataDir, 'cam-governance-fallback.json');
const syncMetaPath = path.join(dataDir, 'cam-governance-sync-meta.json');
const sourceConfigPath = path.join(repoRoot, 'src', 'config', 'registrySources.json');
const maxFallbackAgeDays = Number.parseInt(process.env.CAM_FALLBACK_MAX_AGE_DAYS || '45', 10);

const asArray = (v) => Array.isArray(v) ? v : [];
const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const failures = [];
const warnings = [];

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    failures.push(`${label} is missing at ${path.relative(repoRoot, filePath)}`);
    return false;
  }
  return true;
}

function validateCamFallback() {
  if (!requireFile(fallbackPath, 'CAM governance fallback') || !requireFile(syncMetaPath, 'CAM governance sync metadata')) {
    return [];
  }

  const sourceConfig = loadJson(sourceConfigPath);
  const gov = loadJson(fallbackPath);
  const meta = loadJson(syncMetaPath);
  const items = asArray(gov.items);

  if (!items.length) failures.push('docs/data/cam-governance-fallback.json must contain a non-empty items array');
  if (typeof gov.count !== 'number') failures.push('docs/data/cam-governance-fallback.json must include a numeric count');
  if (typeof gov.count === 'number' && gov.count !== items.length) {
    failures.push(`docs/data/cam-governance-fallback.json count ${gov.count} does not match ${items.length} items`);
  }
  if (meta.source_url !== sourceConfig.cam?.registry_index_url) {
    failures.push('CAM governance sync metadata source_url does not match src/config/registrySources.json');
  }
  if (meta.fallback_file !== 'docs/data/cam-governance-fallback.json') {
    failures.push('CAM governance sync metadata fallback_file must be docs/data/cam-governance-fallback.json');
  }
  if (meta.record_count !== items.length) {
    failures.push(`CAM governance sync metadata record_count ${meta.record_count} does not match ${items.length} fallback items`);
  }

  const syncedAt = Date.parse(meta.synced_at_utc);
  const dataFetchedAt = Date.parse(meta.data_fetched_at_utc || meta.synced_at_utc);
  if (Number.isNaN(syncedAt)) {
    failures.push('CAM governance sync metadata synced_at_utc must be a valid timestamp');
  }
  if (Number.isNaN(dataFetchedAt)) {
    failures.push('CAM governance sync metadata data_fetched_at_utc must be a valid timestamp');
  } else if (Number.isFinite(maxFallbackAgeDays) && maxFallbackAgeDays > 0) {
    const ageMs = Date.now() - dataFetchedAt;
    const maxAgeMs = maxFallbackAgeDays * 24 * 60 * 60 * 1000;
    if (ageMs > maxAgeMs) {
      failures.push(`CAM governance fallback is older than ${maxFallbackAgeDays} days; run pnpm run sync:cam`);
    }
  }

  if (meta.status && meta.status !== 'fetched') {
    warnings.push(`CAM governance fallback sync status is ${meta.status}; live source may not have been reachable during the last sync`);
  }

  items.forEach((item, idx) => {
    if (!item || typeof item !== 'object') failures.push(`cam-governance-fallback.json items[${idx}] must be an object`);
    if (typeof item?.id !== 'string' || !item.id.trim()) failures.push(`cam-governance-fallback.json items[${idx}] has no id`);
    if (typeof item?.link !== 'string' || !item.link.trim()) failures.push(`cam-governance-fallback.json items[${idx}] has no link`);
  });

  return items;
}

const gov = validateCamFallback();
const canon = new Map(gov.map((i) => [i.id, i.link]));

function validateRefSet(items, fileLabel) {
  asArray(items).forEach((row, idx) => {
    asArray(row.instrument_ids).forEach((id) => {
      if (!canon.has(id)) failures.push(`${fileLabel}[${idx}] unknown instrument id: ${id}`);
      const link = canon.get(id);
      if (typeof link !== 'string' || !link.trim()) failures.push(`${fileLabel}[${idx}] references ${id} but cam-governance-fallback.json has no link`);
    });
  });
}

['runtime-flow.json', 'problem-pathways.json'].forEach((name) => {
  validateRefSet(loadJson(path.join(dataDir, name)), name);
});

if (warnings.length) {
  console.warn('Catalogue validation warnings:');
  warnings.forEach((f) => console.warn(`- ${f}`));
}

if (failures.length) {
  console.error('Catalogue validation failed:');
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log('Catalogue validation passed.');
