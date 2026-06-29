# kordeon

A monorepo powered by [Bun](https://bun.sh) and [Turborepo](https://turborepo.dev/).

## Structure

```
apps/
  my-app/             # Bun application (template)
packages/
  my-package/         # Internal package (template)
  typescript-config/  # Shared TypeScript configuration
```

## Requirements

- [Bun](https://bun.sh)

## Getting started

```sh
bun install
bun run build
```

## Tooling

- [Bun](https://bun.sh) — runtime, package manager, bundler
- [Turborepo](https://turborepo.dev/) — task orchestration with caching
- [Biome](https://biomejs.dev/) — linter and formatter
- [commitlint](https://commitlint.js.org/) — conventional commit enforcement
- [TypeScript](https://www.typescriptlang.org/) — shared config via `@repo/typescript-config`
