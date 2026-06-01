# CAM Governance Catalogue

This repository hosts the CAM governance interface. The interface provides a constitutional orientation hub, runtime governance model, relational governance explainer, instrument catalogue, and VIGIL observatory for digital ecosystem health signals.

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

Catalogue, runtime, relational, and VIGIL interface data is served from:

- `/docs/data/cam-governance.json`
- `/docs/data/runtime-flow.json`
- `/docs/data/problem-pathways.json`
- `https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Registry.Index.json` (the live VIGIL registry source)
- `/docs/data/vigil-registry-fallback.json` (optional cached fallback generated at build time)

Runtime and Relational Governance sit under the Constitution section. VIGIL is exposed as CAM’s public AI governance observatory and digital ecosystem health register for technology signals, observations, clusters, and proposals that may require CAM review.

### VIGIL interface sync

The VIGIL page is populated at runtime from the live VIGIL master registry index, `VIGIL.Registry.Index.json`, on the VIGIL default branch. The source configuration lives in `src/config/registrySources.json`, and the interface treats VIGIL as an external live registry source so newly generated registry entries can appear without pinning to an archival commit.

During CAM interface builds, the `sync:vigil` script writes `docs/data/vigil-registry-fallback.json` as an optional cached fallback. Runtime loading always attempts the live registry first, then displays a clear fallback notice if it must use the cached data. Record source links are read from generated registry metadata (`github_blob_url` and `raw_url`) and only fall back to constructing links from a published `path`.

After the VIGIL repository routes records, validates records, rebuilds generated VIGIL registry JSON files, and commits those generated files, the VIGIL workflow is expected to send a `repository_dispatch` event to `CAM-Initiative/cam-governance-catalogue` with `event_type` set to `vigil-records-updated`. That dispatch should use a repository secret token with permission to dispatch to the CAM interface repository, such as `CAM_INTERFACE_DISPATCH_TOKEN`.

## Validate catalogue references

```bash
pnpm run validate:catalogue
```
