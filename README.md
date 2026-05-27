# CAM Governance Catalogue (Static GitHub Pages)

This repository is a **public reader/search interface** over governance data exported from [CAM-Initiative/Caelestis](https://github.com/CAM-Initiative/Caelestis).

> **Canonical source notice:** This repository is not canonical. The canonical governance corpus remains in CAM-Initiative/Caelestis.

## GitHub Pages configuration

To ensure the Governance Problem Explorer is served (instead of repository root/README content), configure GitHub Pages as:

- **Source:** Deploy from branch
- **Branch:** `main`
- **Folder:** `/docs`

The published site expects this structure under `/docs`:

- `/docs/index.html`
- `/docs/assets/style.css`
- `/docs/assets/search.js`
- `/docs/data/cam-governance.json`
- `/docs/.nojekyll`
