# CAM Website Palette Contract

The public CAM interface uses a clean canvas, warm parchment working surfaces, archival gold, and Corpus-surface palette. New decorative colours must be expressed through the tokens in `src/index.css`; they must not introduce an isolated hue in a page component.

## Appearance system

The default light appearance uses a white/near-white `--background` canvas. Parchment remains available through `--card`, `--secondary`, and the CAM Corpus surfaces so that archival character communicates grouping rather than colouring the whole page.

The dark appearance uses a **neutral near-black canvas with slightly raised charcoal principal surfaces and neutral light reading text**, not absolute black and not a brown/sepia inversion. The target hierarchy is approximately `#0B0B0B` for the canvas, `#121212` for cards and popovers, and `#1A1A1A` for secondary/interactive surfaces. CAM archival-gold accents, semantic borders, selected states and status meanings remain available for hierarchy, but ordinary foreground and muted text remain neutral so they do not collapse visually into the gold accent family. The base token architecture remains in `src/index.css`; `src/dark-appearance.css` is loaded after it and owns the final dark-surface and reading-text closure, including compatibility overrides for legacy light-only landing-page utilities. Dark mode must not expose light parchment section backgrounds, pure-white interaction surfaces, or translucent navigation surfaces.

`--cam-surface-*` aliases describe shared presentation roles. Any `--vigil-*` alias must resolve to one of those CAM roles or another approved CAM token. VIGIL must not declare an independent brand palette.

## Shared Corpus selection surface

`--cam-corpus-selected` is the selected-state surface for **Constitutional Interfaces**. It keeps the Corpus selection state visually coherent across the site.

Use the accompanying `--cam-corpus-selected-foreground` and `--cam-corpus-selected-border` tokens for text and borders on that surface.

## Evidence-to-Repair report hierarchy

Within **Corpus implementation by instrument section**, `--cam-corpus-heading` must reuse the selected **Constitutional Interfaces** Corpus surface. The instrument, action, and verification summary uses the deliberately softer, lighter `--cam-corpus-metadata` surface below it. Literal corpus wording remains on parchment. These surfaces are aliases of existing CAM palette tokens, not new hues.

Foreground or text tokens—including `--foreground`, `--primary-foreground`, and `--cam-corpus-selected-foreground`—must never be used as a report background. The palette validator rejects that mapping.

## Navigation surfaces

The sticky site header, desktop dropdown menus, mobile menu trigger, and mobile navigation panel must be visually opaque. Navigation may use the shared background, card, or popover tokens, but it must not rely on translucent glass treatment that allows underlying page content to interfere with legibility.

## Exceptions

Semantic status colours may be used only where the interface is conveying state (for example, a warning, failure, or completed repair). They are not decorative palette colours and must not be used for corpus panels, navigation, headers, buttons, or general backgrounds.

## Enforcement

Run `pnpm run validate:palette`. The validator ensures the light and dark appearance architecture exists, VIGIL aliases remain subordinate to CAM tokens, the shared header owns the persisted appearance control, the Corpus surfaces remain valid, and a hard-coded green/cyan hue cannot be introduced into the report header. It also runs in the published-site validation workflow.
