## Project

Bun + TypeScript monorepo (`apps/*`, `packages/*`).

## Docs

[`docs/`](./docs) holds product knowledge the code can't express — the *why* and the intent. Read the relevant doc before working on a feature. When a change shifts product direction, the landing page's look/feel, or makes a notable technical decision, update the matching doc in the same change (append a dated entry to [`docs/decisions.md`](./docs/decisions.md)). Keep docs minimal — capture only what the code can't; the code is always the source of truth.

## Stack

- **Runtime:** Bun
- **Monorepo:** Bun workspaces + Turbo
- **Linter/Formatter:** Biome (auto-formats on save)
- **Commits:** Conventional Commits (commitlint)

## Code style

- No comments that restate what types and naming already say — only comment the non-obvious
- Imports use `#*` subpath mapping (e.g. `import { foo } from '#services/foo'`)
- Single source of truth — never duplicate keys, enum values, or type info that belongs to a class/module; derive from the source instead
- Biome enforces `useMaxParams: 1` — wrap multiple params in an object
- Only re-export from index files - Biome enforces that

## Validation

After finishing an implementation, always run:

1. `bun fix:codestyle` — auto-fix formatting/lint issues
2. `bun check:all` — verify types and codestyle pass
3. `bun run build` — verify the build succeeds

Check `package.json` scripts (root and per-app) for other available commands.

## Run scripts

When running a script, always check `package.json` scripts (root and per-app) for available commands first.

## READMEs

- Packages are **internal-only** — consumed from TypeScript source via their `@repo/*` name, not published to npm. A package needs a README only when there's contributor-relevant context that isn't obvious from the source.
- The root `README.md` is the project homepage: it lists the apps/packages and a quick-start. Keep it short.

## UI

All shadcn/ui components live in `@repo/ui` — the single source of truth for components and the theme. It is the **only** workspace with a `components.json`; add components there with `bun run --filter '@repo/ui' ui:add <name>`. Apps consume `@repo/ui` (`@repo/ui/components/*`, `@repo/ui/globals.css`) and never run shadcn directly. Our own components live in `@repo/ui/src/custom/` (imported as `@repo/ui/custom/*`), kept separate from the shadcn-owned `components/` so re-running the CLI can't clobber them. The shared theme tokens live once in `@repo/ui/src/styles/globals.css`, whose `@source` globs scan all `apps/**` and `packages/**`. React TypeScript options are shared via `@repo/typescript-config/react.json`.

## Keeping this file up to date

When a change affects code style, tooling, conventions, or project taste (new lint rules, formatter config, naming patterns, dependency choices, etc.), propose updating this file to reflect it.
