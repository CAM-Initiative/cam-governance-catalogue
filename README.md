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
- `/docs/vigil/VIGIL.Records.Index.json` (the VIGIL interface ingestion file, sourced from the VIGIL public index)

Runtime and Relational Governance sit under the Constitution section. VIGIL is exposed as CAM’s public AI governance observatory and digital ecosystem health register for technology signals, observations, clusters, and proposals that may require CAM review.

### VIGIL interface sync

The VIGIL page is populated from the VIGIL public index JSON sourced from the VIGIL repository. During CAM interface builds, the `sync:vigil` script writes the current VIGIL public index into `docs/vigil/VIGIL.Records.Index.json`. The page uses the full synced registry as its data source, but defaults to showing open records. All statuses remain available through the status filter for deliberate review. The interface can be refreshed manually, by repository dispatch after VIGIL updates, or by the scheduled fallback workflow.

After the VIGIL repository routes records, validates records, rebuilds generated VIGIL registry JSON files, and commits those generated files, the VIGIL workflow is expected to send a `repository_dispatch` event to `CAM-Initiative/cam-governance-catalogue` with `event_type` set to `vigil-records-updated`. That dispatch should use a repository secret token with permission to dispatch to the CAM interface repository, such as `CAM_INTERFACE_DISPATCH_TOKEN`.

## Validate catalogue references

```bash
pnpm run validate:catalogue
```
