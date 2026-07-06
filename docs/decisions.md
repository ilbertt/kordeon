# Decisions

Append-only log of genuine project decisions and why we made them. Newest at the
bottom, each under a dated heading. Reserve this for real choices with rationale
(especially a rejected alternative) — setup and tooling conventions live in
[AGENTS.md](../AGENTS.md), and the code is always the source of truth for the *how*.

## 2026-07-06 — One shared UI package

All UI — shadcn components and theme tokens — lives in a single `@repo/ui` package that
every app consumes. The reason the project is a monorepo at all: one design system
shared between the landing page and the future product, with the config in one place so
apps reuse it instead of repeating setup and drifting apart.
