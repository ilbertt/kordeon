# @repo/video

Renders kordeon's launch / social videos with [Remotion](https://remotion.dev) by mounting
the **real** `@repo/ui` product components (Sidebar, Thread, Message, PlanCard, PreviewPane)
and driving them frame-by-frame — not screen recordings. `bun dev` opens Remotion Studio;
`bun render <Id> <out>` renders. The master composition is `LaunchVideo`; `Window` and `Smoke`
are debug probes.

Non-obvious conventions and rationale:

- **`jsx` is set explicitly in `tsconfig.json`, not just via `extends`.** Remotion's esbuild-loader
  reads this file raw and does not resolve `extends`; `@repo/ui`'s TSX imports no React (automatic
  runtime), so a missing `jsx` there compiles it with the classic runtime and throws
  `React is not defined` at import time. After editing `tsconfig.json`, re-render with
  `--bundle-cache=false` (the bundle cache ignores it).

- **Animate from `useCurrentFrame()`, never timers or CSS transitions.** A Remotion render seeks
  each frame in isolation, so `setTimeout`/`animate-in`/reaction playback don't advance. The
  product's own `Thread` playback is timer-driven — so we render `Thread` with `animate={false}`
  and reveal messages by frame-slicing `channel.messages` (+ setting `channel.typing`). The
  reveal/typing model is a pure port of `use-thread-playback` in `src/lib/thread-timeline.ts`.

- **The window is filmed with a camera** (`src/lib/camera.ts`): a promo is watched from the whole
  frame, not read up close, so each beat pushes into one panel rather than showing the dense
  three-panel UI flat. Shot focus points are in the window's own pixel grid, tuned against
  rendered stills.

- **Scene state flows one way from the frame.** `ProductWindow` is pure/presentational; the scene
  (`src/scenes/main.tsx`) derives every prop (`visibleCount`, `previewState`, `planDone`, camera
  shot, captions) from the local frame, so the window stays mounted across the whole loop with no
  cuts. Reuse product components; don't re-implement them here.
