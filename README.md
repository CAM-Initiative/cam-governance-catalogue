# CAM Governance Catalogue

This repository hosts the Replit-origin CAM interface (Home, Constitution, Runtime) and added **Instrument Catalogue** and **VIGIL** routes integrated into the same navigation.

## Run locally

Use Node 20 (see `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm run dev
```

## Build for GitHub Pages

```bash
pnpm run build
```

Build output is written to `/docs` for GitHub Pages publication.

## GitHub Pages settings

- Branch: `main`
- Folder: `/docs`

## Data sources

Catalogue/runtime data is served from:

- `/docs/data/cam-governance.json`
- `/docs/data/runtime-flow.json`
- `/docs/data/problem-pathways.json`
- `/docs/vigil/VIGIL.Records.json` (copied from `/vigil/VIGIL.Records.json` when present)

VIGIL is exposed as a public workflow / signal register layer for technology signals, observations, clusters, and proposals that may require CAM review.

## Validate catalogue references

```bash
pnpm run validate:catalogue
```
