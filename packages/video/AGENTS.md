# @repo/video

Renders kordeon's launch / social videos in Remotion by mounting the **real** `@repo/ui`
product components and driving them frame-by-frame. Reuse the product components; don't
re-implement them here.

Non-obvious, learned the hard way:

- **`jsx` is set explicitly in `tsconfig.json`, not only via `extends`.** Remotion's
  esbuild-loader reads this file raw and doesn't resolve `extends`; `@repo/ui`'s TSX imports no
  React (automatic runtime), so a missing `jsx` here compiles it with the classic runtime and
  throws `React is not defined`. After editing `tsconfig.json`, re-render with
  `--bundle-cache=false` (the bundle cache ignores it).

- **Animate from `useCurrentFrame()`, never timers or CSS transitions** — a render seeks each
  frame in isolation. The product's own `Thread` playback is timer-driven, so we pass
  `animate={false}` and reveal messages by frame-slicing `channel.messages` (the pure port is
  `src/lib/thread-timeline.ts`). Reusing the real window still drags in a few `@repo/ui`
  `animate-*` / `transition-*` classes (typing dots, hovers); they render as static frames and
  can't be stripped without editing shared components.

Follows the Remotion markup + interactivity skills: a zod `schema` + `defaultProps` for
Studio-editable copy, `Interactive.Div` + named sequences, inline `interpolate` over `spring`,
`translate` / `scale` props, and a pinned Google Font for deterministic renders.
