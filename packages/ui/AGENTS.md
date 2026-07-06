# @repo/ui

Shared UI for the kordeon monorepo — the single source of truth for components and the
theme. Internal-only: consumed from TypeScript source via the `@repo/ui` name, never
built or published. This is the **only** workspace with a `components.json`; apps
consume `@repo/ui` and never run shadcn directly.

- **Primitives:** [Base UI](https://base-ui.com) (`--base base`)
- **Preset:** `b3lWYDFZI` (style `base-mira`)
- **Styling:** Tailwind CSS v4 — themed tokens live once in [`src/styles/globals.css`](./src/styles/globals.css)

## Structure

- `src/components/` — shadcn-owned and regenerable; add via the CLI below.
- `src/custom/` — our own components (`@repo/ui/custom/*`), kept separate so re-running
  shadcn can't clobber them.

## Adding components

shadcn is pinned locally and run through this package's scripts:

```sh
bun run --filter '@repo/ui' ui:add button
# any shadcn subcommand:
bun run --filter '@repo/ui' shadcn <command>
```

## Usage

```tsx
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
```

A consuming app imports the stylesheet once:

```ts
import '@repo/ui/globals.css';
```
