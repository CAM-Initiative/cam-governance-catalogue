# CAM Initiative Website

## Overview

Interactive website for the CAM Initiative — an independent constitutional AI governance project (Aeon Governance Lab). Built as a self-hosted replacement for the Wix site, targeting export to GitHub Pages at https://github.com/CAM-Initiative/WebDesign.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend framework**: React 18 + Vite 7 (react-vite artifact)
- **Routing**: Wouter
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **API framework**: Express 5 (api-server — currently unused by frontend)
- **Database**: PostgreSQL + Drizzle ORM (provisioned but unused — static site)
- **Typography**: Space Grotesk + Playfair Display + IBM Plex Mono (Google Fonts)

## Artifacts

- `artifacts/cam-initiative` — Main CAM Initiative website (serves at `/`)
- `artifacts/api-server` — Express API server (at `/api` — not yet used by frontend)
- `artifacts/mockup-sandbox` — Design sandbox (at `/__mockup`)

## Pages

- `/` — Home: Archival Sanctuary hero, Vision, Mission, nav cards to all sections
- `/runtime` — Runtime Flow: Horizontally-scrolling interactive phase cards powered by `runtimeTrace.json`. Cards expand on click (framer-motion) to show governance instruments.
- `/constitution` — Constitutional hierarchy display: Substrate → Constitution → Annexes → Domain Charters → Frameworks → Runtime
- `/custodian` — Office of the Planetary Custodian: mandate, temporal horizon, legitimacy

## Key Files

- `artifacts/cam-initiative/src/data/runtimeTrace.json` — The 7-phase runtime trace data (Substrate, Constitution, Annexes, Domain Charters, Frameworks, Runtime, Custodian)
- `artifacts/cam-initiative/src/pages/runtime.tsx` — The interactive horizontal flow page
- `artifacts/cam-initiative/src/pages/home.tsx` — Homepage
- `artifacts/cam-initiative/src/components/layout/Shell.tsx` — Nav + footer layout wrapper
- `artifacts/cam-initiative/src/index.css` — Design system: dark theme (hsl 220 20% 8%), gold/purple/teal/ochre/rose accents

## Design System

- Background: `hsl(220, 20%, 8%)` — near-black deep slate
- Primary/Gold: `hsl(36, 34%, 63%)` — #C0A882
- Font-sans: Space Grotesk
- Font-serif: Playfair Display  
- Font-mono: IBM Plex Mono
- Accent colors per governance phase: gold, purple, teal-blue, teal-green, olive, ochre, dusty-rose

## Content Sources

- CAM Initiative site: https://www.cam-initiative.org
- Caelestis governance: https://github.com/CAM-Initiative/Caelestis/tree/main/Governance
- Governance JSON: https://raw.githubusercontent.com/CAM-Initiative/Caelestis/main/Governance/CAM.Governance.JSON (88 instruments)
- Branding SVGs: https://github.com/CAM-Initiative/Registry/tree/main/Images

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/cam-initiative run dev` — run frontend locally
