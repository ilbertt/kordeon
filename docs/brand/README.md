# Brand

The kordeon mark is a **chord** — three bars that are the product's three panels:
**explorer · chat · preview**. Heights are `8 · 18 · 14`, all centred on one axis so the
shape reads as a struck chord rather than a rising bar chart. The right bar — the
**preview** — is the panel other collaborative chat apps don't have, so it's the one
carrying the accent colour. Middle (chat) stands tallest.

## Colours

The mark uses one brand colour per role, sourced from the theme tokens in
[`packages/ui/src/styles/globals.css`](../../packages/ui/src/styles/globals.css) —
never hard-code these hex values in components; reference the token.

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Panels (explorer, chat) | `--primary` | `#00786f` | `#00bba7` |
| Preview bar / warm accent | `--accent-warm` | `#ff6900` | `#ff6900` |
| Tile (light UI) | ink | `#0d0d0b` | — |
| Tile (dark UI) | paper | — | `#ffffff` |

The tile is the **inverse of the surface**: an ink tile on light UI, a white tile on
dark UI. Only two variants exist — the SVG favicon flips between them via
`prefers-color-scheme`, so it doubles as both.

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
