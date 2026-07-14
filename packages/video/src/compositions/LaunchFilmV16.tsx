import { filmV15DefaultProps } from '#compositions/LaunchFilmV15';

// Cut 16 — identical animation to cut 15 (reuses the LaunchFilmV15 component), two
// caption rewrites on the hand-off/ship beats. "opens a PR" is dropped outright: it
// re-introduced the PR-review framing the film pivots away from and is code-specific
// (a channel can be a dashboard, an export, research). The hand-off now leans on the
// product's own verb — the agent *executes* — and the ship beat says you *see the
// work take shape* beside the chat (kept out of the hand-off line to avoid echoing).
export const filmV16DefaultProps: typeof filmV15DefaultProps = {
  ...filmV15DefaultProps,
  handoffSubtitle: 'Hand off. The agent executes.',
  shipSubtitle: 'See the work take shape — beside the chat.',
};
