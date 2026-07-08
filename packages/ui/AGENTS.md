# @repo/ui

The single source of truth for the monorepo's shadcn/ui components and theme — the
**only** workspace with a `components.json`. Apps consume `@repo/ui` and never run
shadcn directly.

Built on [Base UI](https://base-ui.com) (`--base base`) with the `base-mira` preset.
shadcn is pinned; add components only through this package's scripts, and
keep our own components in `custom/` (separate from shadcn's regenerable `components/`,
so re-running the CLI can't clobber them).

`components/` is vendored shadcn output — regenerable, so don't hand-edit it to
please the linter. It's exempt from a few of our stricter Biome rules via the
`packages/ui/src/components/**` override in `biome.json` (re-exported hooks,
`role`-based a11y widgets, unused runtime imports). Some stateful components (e.g.
`message-scroller`) pull shadcn's `@shadcn/react` runtime for their headless logic
instead of inlining it — that's expected, not everything is fully copied in.

Multi-file custom modules live in `custom/<name>/` and import each other with
per-file relative paths — no barrel index (Biome `noBarrelFile`). The `./custom/*`
export is an ordered `["*.tsx", "*.ts"]` fallback, so a component and a sibling
`.ts` type/util that crosses the package boundary (e.g. `custom/mention/types.ts`)
both resolve through the one wildcard — no per-file `exports` key.
