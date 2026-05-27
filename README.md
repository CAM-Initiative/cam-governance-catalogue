# CAM Runtime Atlas (Static GitHub Pages)

This repository hosts an **explanatory runtime atlas** for Constitutional AI Mediation (CAM), using plain HTML/CSS/JavaScript.

> **Canonical source notice:** This repository/site is an explanatory interface, not the canonical corpus. Canonical governance documents remain in [CAM-Initiative/Caelestis](https://github.com/CAM-Initiative/Caelestis).

## What the site does

The `/docs` site provides three linked interfaces:

- **Landing page** introducing CAM runtime architecture.
- **Runtime flow view** with phase-based interactive execution cards.
- **Governance problem explorer** with curated pathways plus searchable/filterable instrument browsing.

## GitHub Pages setup (/docs)

Enable Pages in repository settings:

- **Source:** Deploy from a branch
- **Branch:** `main` (or your publishing branch)
- **Folder:** `/docs`

Required deployed structure:

- `/docs/index.html`
- `/docs/runtime.html`
- `/docs/explorer.html`
- `/docs/assets/style.css`
- `/docs/assets/app.js`
- `/docs/assets/runtime-map.js`
- `/docs/data/cam-governance.json`
- `/docs/data/runtime-flow.json`
- `/docs/data/problem-pathways.json`
- `/docs/images/`
- `/docs/.nojekyll`
