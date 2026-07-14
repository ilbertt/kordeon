// biome-ignore-all lint/style/noMagicNumbers: reverse-morph geometry + resolve timing
import { MARK_BARS, MARK_VIEWBOX } from '@repo/ui/custom/kordeon-mark';
import type { ReactNode } from 'react';
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { HERO_SLUG } from '#data/channels';
import { EASE, EASE_IN_OUT } from '#lib/motion';
import { collabPlanPrompt } from '#scenes/film/collab-plan';
import { type SlabPose, SlabStage } from '#scenes/slab/slab-stage';

type Rect = { left: number; top: number; width: number; height: number; radius: number };

const BAR_BG = {
  teal: 'bg-[#00bba7] dark:bg-[#00786f]',
  orange: 'bg-[#ff6900]',
} as const;

const CENTER_X = 960;
const PULLBACK_POSE: SlabPose = { focusX: 960, focusY: 540, scale: 0.74, rotateX: 6, rotateY: 0 };
const SLAB_SCALE = PULLBACK_POSE.scale;

const BIG_SIZE = 260;
const BIG_CY = 470;
const LOCK_SIZE = 160;
const LOCK_CY = 400;

function markRect({
  bar,
  size,
  cy,
}: {
  bar: (typeof MARK_BARS)[number];
  size: number;
  cy: number;
}): Rect {
  const unit = size / MARK_VIEWBOX;
  return {
    left: CENTER_X - size / 2 + bar.x * unit,
    top: cy - size / 2 + bar.y * unit,
    width: bar.w * unit,
    height: bar.h * unit,
    radius: 2 * unit,
  };
}

const WIN_W = 1920;
const WIN_H = 1080;
const SIDEBAR_W = 256;
const PREVIEW_W = 352;
const TOPBAR_H = 56;
const WIN_LEFT = CENTER_X - (WIN_W * SLAB_SCALE) / 2;
const WIN_TOP = 540 - (WIN_H * SLAB_SCALE) / 2;
const COLUMNS = [
  { left: 0, width: SIDEBAR_W },
  { left: SIDEBAR_W, width: WIN_W - SIDEBAR_W - PREVIEW_W },
  { left: WIN_W - PREVIEW_W, width: PREVIEW_W },
];
const PANEL_INSET = 5;

function panelRect(index: number): Rect {
  const col = COLUMNS[index] ?? COLUMNS[0]!;
  return {
    left: WIN_LEFT + col.left * SLAB_SCALE + PANEL_INSET,
    top: WIN_TOP + TOPBAR_H * SLAB_SCALE + PANEL_INSET,
    width: col.width * SLAB_SCALE - PANEL_INSET * 2,
    height: (WIN_H - TOPBAR_H) * SLAB_SCALE - PANEL_INSET * 2,
    radius: 12,
  };
}

function mix({ from, to, t }: { from: number; to: number; t: number }): number {
  return from + (to - from) * t;
}

function mixRect({ from, to, t }: { from: Rect; to: Rect; t: number }): Rect {
  return {
    left: mix({ from: from.left, to: to.left, t }),
    top: mix({ from: from.top, to: to.top, t }),
    width: mix({ from: from.width, to: to.width, t }),
    height: mix({ from: from.height, to: to.height, t }),
    radius: mix({ from: from.radius, to: to.radius, t }),
  };
}

// hold the window → panels fold panel → mark → the mark holds (a caption can land
// here) → it shrinks onto the tile as the wordmark, promise + waitlist resolve. Every
// post-fold beat below is shifted later by `holdExtra`, so a cut can hold the formed
// mark longer (e.g. to read a caption) without touching the fold itself.
const PANEL_IN_START = 42;
const WIN_OUT_START = 52;
const WIN_OUT_END = 84;
const FOLD_START = 76;
const FOLD_END = 140;
const SHRINK_START = 180;
const SHRINK_END = 222;
const TILE_IN = 196;
const TILE_END = 220;
const LOCKUP_AT = 216;
const CTA_AT = 242;

// An opt-in caption over the recomposition. Defaults land it during the fold; a cut
// can pass a later `foldCaptionFrom` (once the bars have folded to the mark) with a
// matching `holdExtra` so it still reads before the white lockup tile appears.
const FOLD_CAPTION_FROM = 88;
const FOLD_CAPTION_DUR = 100;

function FoldBar({
  bar,
  index,
  shrinkStart,
  shrinkEnd,
}: {
  bar: (typeof MARK_BARS)[number];
  index: number;
  shrinkStart: number;
  shrinkEnd: number;
}) {
  const frame = useCurrentFrame();
  const fold = interpolate(frame, [FOLD_START, FOLD_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  const shrink = interpolate(frame, [shrinkStart, shrinkEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  const folded = mixRect({
    from: panelRect(index),
    to: markRect({ bar, size: BIG_SIZE, cy: BIG_CY }),
    t: fold,
  });
  const rect = mixRect({
    from: folded,
    to: markRect({ bar, size: LOCK_SIZE, cy: LOCK_CY }),
    t: shrink,
  });
  const appear = interpolate(frame, [PANEL_IN_START, PANEL_IN_START + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wash = interpolate(frame, [FOLD_START, FOLD_END], [0.55, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      className={`absolute ${BAR_BG[bar.tone]}`}
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: rect.radius,
        opacity: Math.min(appear, wash),
      }}
    />
  );
}

type MorphFinaleProps = {
  wordmark: string;
  tagline: string;
  selfHost: string;
  waitlist: string;
  phase: number;
  durationInFrames: number;
  // Opt-in caption over the recomposition, before the white tile lands.
  foldCaption?: string;
  foldCaptionFrom?: number;
  foldCaptionDur?: number;
  // Hold the formed mark this many frames longer before it shrinks to the lockup.
  holdExtra?: number;
};

// Finale — the reverse of the opening morph: the product window's panels fold back
// into the mark, which holds while "self-hostable" lands, then shrinks to the lockup
// as the wordmark, promise and waitlist line resolve.
export function MorphFinale({
  wordmark,
  tagline,
  selfHost,
  waitlist,
  phase,
  foldCaption,
  foldCaptionFrom = FOLD_CAPTION_FROM,
  foldCaptionDur = FOLD_CAPTION_DUR,
  holdExtra = 0,
}: MorphFinaleProps): ReactNode {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shrinkStart = SHRINK_START + holdExtra;
  const shrinkEnd = SHRINK_END + holdExtra;
  const windowOpacity = interpolate(frame, [WIN_OUT_START, WIN_OUT_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  const selfHostOpacity = Math.min(
    interpolate(frame, [150, 168], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE,
    }),
    interpolate(frame, [200, 216], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  );
  const tile = interpolate(frame, [TILE_IN + holdExtra, TILE_END + holdExtra], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  const lockup = spring({
    frame: frame - (LOCKUP_AT + holdExtra),
    fps,
    config: { damping: 20, mass: 0.8 },
    durationInFrames: 26,
  });
  const cta = spring({
    frame: frame - (CTA_AT + holdExtra),
    fps,
    config: { damping: 18, mass: 0.8 },
    durationInFrames: 24,
  });
  return (
    <AbsoluteFill className="dark bg-background text-foreground">
      {frame < WIN_OUT_END ? (
        <AbsoluteFill style={{ opacity: windowOpacity }}>
          <SlabStage
            pose={PULLBACK_POSE}
            phase={phase}
            product={{
              activeSlug: HERO_SLUG,
              visibleCount: 7,
              compose: 'built',
              previewState: 'dashboard',
              previewReveal: 1,
              renderComposerPrompt: collabPlanPrompt(false),
            }}
          />
        </AbsoluteFill>
      ) : null}

      <div
        className="absolute rounded-3xl bg-foreground"
        style={{ left: 858, top: 298, width: 204, height: 204, opacity: tile }}
      />
      <AbsoluteFill>
        {[...MARK_BARS.entries()].map(([index, bar]) => (
          <FoldBar
            key={bar.key}
            bar={bar}
            index={index}
            shrinkStart={shrinkStart}
            shrinkEnd={shrinkEnd}
          />
        ))}
      </AbsoluteFill>

      {foldCaption ? (
        <Sequence from={foldCaptionFrom} durationInFrames={foldCaptionDur}>
          <KineticCaption text={foldCaption} durationInFrames={foldCaptionDur} />
        </Sequence>
      ) : null}

      {/* Before the lockup: the mark is formed, and the one thing to say about it.
          Opt-out — an empty `selfHost` drops it (a cut can make the point as its own
          caption beat before the fold instead of floating it beside the mark). */}
      {selfHost ? (
        <div
          className="absolute inset-x-0 text-center"
          style={{ top: 640, opacity: selfHostOpacity }}
        >
          <span className="font-medium text-3xl text-muted-foreground">{selfHost}</span>
        </div>
      ) : null}

      <Interactive.Div
        name="Finale lockup"
        className="absolute inset-x-0 flex flex-col items-center gap-6"
        style={{
          top: 548,
          opacity: lockup,
          translate: `0 ${interpolate(lockup, [0, 1], [22, 0])}px`,
        }}
      >
        <h1 className="font-semibold text-7xl tracking-tight">{wordmark}</h1>
        <p className="max-w-3xl text-center text-2xl text-muted-foreground">{tagline}</p>
        <p
          className="mt-2 font-medium text-2xl"
          style={{ opacity: cta, translate: `0 ${interpolate(cta, [0, 1], [16, 0])}px` }}
        >
          {waitlist}
        </p>
      </Interactive.Div>
    </AbsoluteFill>
  );
}
