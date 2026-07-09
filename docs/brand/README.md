# Brand

The kordeon mark is a **chord** — three bars that are the product's three panels:
**explorer · chat · preview**. Heights are `8 · 18 · 14`, all centred on one axis so the
shape reads as a struck chord rather than a rising bar chart. The right bar — the
**preview** — is the panel other collaborative chat apps don't have, so it's the one
carrying the accent colour. Middle (chat) stands tallest.

## Colours

The mark is a brand asset, not themeable UI, so it carries **fixed hex** and neither
reads nor extends the shadcn theme in
[`packages/ui/src/styles/globals.css`](../../packages/ui/src/styles/globals.css) — keep
that theme pure shadcn (no custom tokens). The orange accent appears **only in the mark
and in charts** (`--chart-2`); it is never a general UI colour.

| Role | Hex | Notes |
| --- | --- | --- |
| Panel bars (explorer, chat) | `#00bba7` / `#00786f` | bright teal on the ink tile, deep teal on the white tile |
| Preview bar | `#ff6900` | the warm accent — mark and charts only |
| Tile (light UI) | `#0d0d0b` (ink) | |
| Tile (dark UI) | `#ffffff` (paper) | |

The tile is the **inverse of the surface** — an ink tile on light UI, a white tile on
dark UI — so only two variants exist; the SVG favicon flips between them via
`prefers-color-scheme`.

## Files

- `kordeon-mark.svg` — the bare mark (no tile). Source of truth for the in-app
  `KordeonMark` component; not imported directly.
- `kordeon-icon-master.svg` — full-bleed ink square used to (re)generate the raster
  favicon pack. Upload to [realfavicongenerator.net](https://realfavicongenerator.net),
  or regenerate locally with ImageMagick.

The **served** assets live in [`apps/website/public/`](../../apps/website/public):
`favicon.svg` (adaptive), `favicon.ico`, and `apple-touch-icon.png`. A landing page
needs no PWA manifest or maskable install icons — regenerate those from the master if
the product itself ever ships as an installable app.
