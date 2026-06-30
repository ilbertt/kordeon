# @repo/ui

Shared UI component library for the kordeon monorepo. Holds all [shadcn/ui](https://ui.shadcn.com) components.

- **Primitives:** [Base UI](https://base-ui.com) (`--base base`)
- **Preset:** `b3lWYDFZI` (style `base-mira`)
- **Styling:** Tailwind CSS v4 — the themed tokens live in [`src/styles/globals.css`](./src/styles/globals.css)

It is consumed directly from TypeScript source via its `@repo/ui` name — no build step, not published to npm.

## Adding components

shadcn is pinned locally and run through this package's scripts (config in [`components.json`](./components.json)):

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
