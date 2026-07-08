## Project

Bun + TypeScript monorepo (`apps/*`, `packages/*`).

## Docs

[`docs/`](./docs) holds product knowledge the code can't express — the *why* and the intent. Read the relevant doc before working on a feature, and update the matching doc in the same change when you shift product direction or the landing page's look/feel. Keep docs minimal — capture only what the code can't; the code is always the source of truth.

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

## Pull requests

Keep PR descriptions small and minimal. Don't list the changes — the diff already shows them. Explain only the *why* and anything the diff can't convey. Oversized descriptions are noise that ends up in the git history forever.

## Package docs

- The root `README.md` is a short homepage / quick-start — don't enumerate the repo structure; the tree already shows it.
- A workspace's own conventions live in its `AGENTS.md` (e.g. [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md)) — not duplicated here or in a README. Packages are internal-only: consumed from TypeScript source via their `@repo/*` name, never published.
- In `AGENTS.md` files, never explain structure (the tree already shows it), and never explain usage for non-public packages — document only non-obvious conventions and rationale.

## Keeping this file up to date

When a change affects code style, tooling, conventions, or project taste (new lint rules, formatter config, naming patterns, dependency choices, etc.), propose updating this file to reflect it.
