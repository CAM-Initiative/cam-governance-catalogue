# CAM Website Palette Contract

The public CAM interface uses a warm parchment, archival-gold, and Corpus-surface palette. New decorative colours must be expressed through the tokens in `src/index.css`; they must not introduce an isolated hue in a page component.

## Shared Corpus selection surface

`--cam-corpus-selected` is the selected-state surface for **Constitutional Interfaces**. It is also the background for an Evidence-to-Repair report's **Corpus implementation by instrument section** header. This keeps the Corpus visually coherent across the site.

Use the accompanying `--cam-corpus-selected-foreground` and `--cam-corpus-selected-border` tokens for text and borders on that surface.

## Evidence-to-Repair report hierarchy

Within **Corpus implementation by instrument section**, `--cam-corpus-heading` is the deepest CAM warm-ink surface used for the section title. The instrument, action, and verification summary uses the deliberately lighter `--cam-corpus-metadata` surface below it. Literal corpus wording remains on parchment. These surfaces are aliases of existing CAM palette tokens, not new hues.

## Exceptions

Semantic status colours may be used only where the interface is conveying state (for example, a warning, failure, or completed repair). They are not decorative palette colours and must not be used for corpus panels, navigation, headers, buttons, or general backgrounds.

## Enforcement

Run `pnpm run validate:palette`. The validator ensures the Corpus surfaces exist, that both the home-page Constitutional Interfaces and the Evidence-to-Repair report use the appropriate shared tokens, and that a hard-coded green/cyan hue cannot be introduced into the report header. It also runs in the published-site validation workflow.
