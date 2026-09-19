# VIGIL Incident Ingestion Preview Branch

This branch is a permanent review surface for pre-publication VIGIL Incident ingestion.

- **Do not merge this branch into `main`.**
- **Do not use this branch for normal CAM Governance Interface development.**
- Canonical web production continues to use VIGIL `main`.
- This preview reads Incident records and taxonomy data from:
  `agent/incident-ecosystem-ingestion` in `CAM-Initiative/Vigil`.
- Re-run the branch workflow whenever the upstream ingestion branch changes to refresh generated preview data.

The purpose is human review of candidate Incident records before those records are merged into VIGIL `main`.

> Visibility note: this branch is not published as the production CAM Initiative website, but because this repository is public, the branch itself and its committed files remain visible on GitHub.
