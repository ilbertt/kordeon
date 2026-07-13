// biome-ignore-all lint/style/noMagicNumbers: brand-mark geometry + morph timing constants
// The metamorphosis maths, kept pure so the component only wires refs to it. The
// kordeon mark is three bars — explorer · chat · the accented preview — and the
// product window is three panels in that same order. So the reveal isn't a
// cross-fade: each logo bar is tweened, in place, onto the panel it stands for.
// A bar travels through three keyframes as the visitor scrolls:
//   K0  the resting mark (measured from its slot in the hero lockup)
//   K1  the same mark blown up huge and centred — "the logo becomes bigger"
//   K2  the product panel it becomes — full height, at its real column
// Past the spread the panels are held while the real window fades in over them,
// so the solid bars read as filling with live UI rather than being swapped for it.

export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
};

type Stage = { width: number; height: number };
type Slot = { left: number; top: number; width: number };

// The mark's geometry (viewBox 0 0 24 24), shared with `KordeonMark`. Order is
// the panel order: explorer, chat, preview.
export const MORPH_BARS = [
  { key: 'explorer', tone: 'teal', x: 3, y: 8, w: 4, h: 8 },
  { key: 'chat', tone: 'teal', x: 10, y: 3, w: 4, h: 18 },
  { key: 'preview', tone: 'orange', x: 17, y: 5, w: 4, h: 14 },
] as const;

const VIEWBOX = 24;

// Real product layout (must track the workspace: sidebar `w-64`, preview
// `w-[22rem]`, top bar `h-14`, and the `md`/`xl` breakpoints that drop each side
// panel to a drawer). Off those breakpoints a bar collapses into the edge so the
// spread always lands on the columns the window will actually show.
const SIDEBAR_W = 256;
const PREVIEW_W = 352;
const TOPBAR_H = 56;
const SIDEBAR_BP = 768;
const PREVIEW_BP = 1280;
// A seam between the panels so the two teal bars (explorer + chat) stay read as
// two, not one block — the product's own borders take over once it materializes.
const PANEL_GAP = 8;

// The huge centred mark: sized to the smaller viewport axis so it never spills.
const BIG_LOGO_W_FACTOR = 0.5;
const BIG_LOGO_H_FACTOR = 0.62;
const BIG_LOGO_CENTER_Y = 0.44;

// Progress milestones along the scroll track.
const GROW_END = 0.42; // K0 → K1: the mark grows
const SPREAD_END = 0.85; // K1 → K2: bars unfold into panels
const LOGO_FADE_END = 0.06; // the crisp SVG hands off to the tweened bars
const INTRO_FADE_END = 0.28; // headline + CTA clear as the mark takes over
// The bars thin to a translucent wash as they grow — so the colour never floods
// the screen as solid slabs — but they hold that wash all the way onto the real
// product columns (you watch the mark land on the panels it becomes) and only
// clear at the very end, leaving the clean, usable window.
const BARS_WASH = 0.38; // opacity held while overlapping the columns
const BARS_WASH_START = 0.32; // full opacity until the mark is clearly grown
const BARS_WASH_BY = 0.62; // thinned to the wash by the time it has spread
const BARS_CLEAR_START = 0.92; // held over the columns, then dissolved at the end
// The window only surfaces once the bars have reached their columns — otherwise
// the UI (text, avatars) shows through before the shapes have finished
// expanding. So it starts near the end of the spread and fills in under the
// wash, reading as the panels themselves being painted with the real product.
const MATERIALIZE_START = 0.74;
const MATERIALIZE_END = 0.96;
const PRODUCT_SETTLE = 0.015; // scale the window settles by as it lands

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const mix = ({ a, b, t }: { a: number; b: number; t: number }) => a + (b - a) * t;
const mixRect = ({ a, b, t }: { a: Rect; b: Rect; t: number }): Rect => ({
  left: mix({ a: a.left, b: b.left, t }),
  top: mix({ a: a.top, b: b.top, t }),
  width: mix({ a: a.width, b: b.width, t }),
  height: mix({ a: a.height, b: b.height, t }),
  radius: mix({ a: a.radius, b: b.radius, t }),
});

type Bar = (typeof MORPH_BARS)[number];

const restingRect = ({ bar, slot }: { bar: Bar; slot: Slot }): Rect => {
  const unit = slot.width / VIEWBOX;
  return {
    left: slot.left + bar.x * unit,
    top: slot.top + bar.y * unit,
    width: bar.w * unit,
    height: bar.h * unit,
    radius: 2 * unit,
  };
};

const bigRect = ({ bar, stage }: { bar: Bar; stage: Stage }): Rect => {
  const size = Math.min(stage.width * BIG_LOGO_W_FACTOR, stage.height * BIG_LOGO_H_FACTOR);
  const unit = size / VIEWBOX;
  const originX = stage.width / 2 - size / 2;
  const originY = stage.height * BIG_LOGO_CENTER_Y - size / 2;
  return {
    left: originX + bar.x * unit,
    top: originY + bar.y * unit,
    width: bar.w * unit,
    height: bar.h * unit,
    radius: 2 * unit,
  };
};

const panelRect = ({ index, stage }: { index: number; stage: Stage }): Rect => {
  const sidebar = stage.width >= SIDEBAR_BP ? SIDEBAR_W : 0;
  const preview = stage.width >= PREVIEW_BP ? PREVIEW_W : 0;
  const top = TOPBAR_H;
  const height = stage.height - TOPBAR_H;
  const half = PANEL_GAP / 2;
  if (index === 0) {
    return { left: 0, top, width: Math.max(0, sidebar - half), height, radius: 0 };
  }
  if (index === 2) {
    const width = Math.max(0, preview - half);
    return { left: stage.width - width, top, width, height, radius: 0 };
  }
  const left = sidebar > 0 ? sidebar + half : 0;
  const right = preview > 0 ? stage.width - preview - half : stage.width;
  return { left, top, width: Math.max(0, right - left), height, radius: 0 };
};

export function barGeometry({
  index,
  progress,
  stage,
  slot,
}: {
  index: number;
  progress: number;
  stage: Stage;
  slot: Slot;
}): Rect {
  const bar = MORPH_BARS[index]!;
  const k0 = restingRect({ bar, slot });
  const k1 = bigRect({ bar, stage });
  // Interpolate the keyframes linearly and let the scroll carry the easing (the
  // CTA's eased scroll tween, or the visitor's own scroll). Easing each segment
  // with its own smoothstep would flatten the bars' velocity to zero at K1 — a
  // visible hitch exactly where the grown mark starts folding into the panels.
  if (progress <= GROW_END) {
    return mixRect({ a: k0, b: k1, t: progress / GROW_END });
  }
  const k2 = panelRect({ index, stage });
  if (progress <= SPREAD_END) {
    return mixRect({ a: k1, b: k2, t: (progress - GROW_END) / (SPREAD_END - GROW_END) });
  }
  return k2;
}

const barWash = ({ progress }: { progress: number }): number => {
  if (progress <= BARS_WASH_START) {
    return 1;
  }
  if (progress <= BARS_WASH_BY) {
    const t = smoothstep((progress - BARS_WASH_START) / (BARS_WASH_BY - BARS_WASH_START));
    return mix({ a: 1, b: BARS_WASH, t });
  }
  if (progress <= BARS_CLEAR_START) {
    return BARS_WASH;
  }
  const t = smoothstep((progress - BARS_CLEAR_START) / (1 - BARS_CLEAR_START));
  return mix({ a: BARS_WASH, b: 0, t });
};

export function morphPhases({ progress }: { progress: number }) {
  const materialize = smoothstep(
    (progress - MATERIALIZE_START) / (MATERIALIZE_END - MATERIALIZE_START),
  );
  return {
    logoOpacity: 1 - smoothstep(progress / LOGO_FADE_END),
    introOpacity: 1 - smoothstep(progress / INTRO_FADE_END),
    barsOpacity: barWash({ progress }),
    productOpacity: materialize,
    productScale: 1 - PRODUCT_SETTLE * (1 - materialize),
  };
}
