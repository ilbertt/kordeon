// biome-ignore-all lint/style/noMagicNumbers: morph geometry + stage timing
import { MARK_BARS, MARK_VIEWBOX } from '@repo/ui/custom/kordeon-mark';
import type { ReactNode } from 'react';
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { EASE, EASE_IN_OUT } from '#lib/motion';
import { SLAB } from '#scenes/slab-beat';
import { SlabStage } from '#scenes/slab-stage';

type Rect = { left: number; top: number; width: number; height: number; radius: number };

// Bars are HTML here (they tween into the product's columns), so map the mark's
// brand tones to background classes rather than the SVG `fill-*`.
const BAR_BG = {
  teal: 'bg-[#00bba7] dark:bg-[#00786f]',
  orange: 'bg-[#ff6900]',
} as const;

// The mark, big and centred — the shape the bars start as.
const MARK_SIZE = 260;
const CENTER_X = 960;
const MARK_CY = 470;

function markRect(bar: (typeof MARK_BARS)[number]): Rect {
  const unit = MARK_SIZE / MARK_VIEWBOX;
  return {
    left: CENTER_X - MARK_SIZE / 2 + bar.x * unit,
    top: MARK_CY - MARK_SIZE / 2 + bar.y * unit,
    width: bar.w * unit,
    height: bar.h * unit,
    radius: 2 * unit,
  };
}

// The product window's three columns, projected to screen at the wide slab pose —
// exactly where the real ProductWindow lands, so the bars fold *onto* the panels
// the window will show. Mirrors the @repo/ui workspace layout (sidebar w-64,
// preview w-[22rem], top bar h-14).
const WIN_W = 1920;
const WIN_H = 1080;
const SIDEBAR_W = 256;
const PREVIEW_W = 352;
const TOPBAR_H = 56;
const SLAB_SCALE = SLAB.wide.scale;
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

// Stage timings, local frames: the meet line lands → ~0.5s later the mark strikes up
// above it (LOGO_IN), so the two share the frame; the line holds (MEET_OUT) then fades
// → the mark unfolds into the three columns → the real window materialises where they
// landed. The line sits below the mark via CAPTION_OFFSET. The window is fully solid
// before the crossfade to the first product beat, so that seam dissolves one identical
// window into the next.
const LOGO_IN = 16;
const MEET_OUT = 86;
const CAPTION_OFFSET = 150;
const MORPH_START = 104;
const MORPH_END = 156;
const MAT_START = 150;
const MAT_END = 182;

function MorphBar({ bar, index }: { bar: (typeof MARK_BARS)[number]; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const strike = spring({
    frame: frame - LOGO_IN - index * 5,
    fps,
    config: { damping: 15, mass: 0.7, stiffness: 150 },
    durationInFrames: 20,
  });
  const t = interpolate(frame, [MORPH_START, MORPH_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  const rect = mixRect({ from: markRect(bar), to: panelRect(index), t });
  // Solid as the mark, thinned to a wash as it becomes a column (so it never floods
  // as a solid slab), gone once the real UI has filled in.
  const wash = interpolate(frame, [MORPH_START, MORPH_END], [1, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const clear = interpolate(frame, [MAT_START, MAT_END - 4], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Before the morph the bar strikes up from its baseline, like the chord mark.
  const rise = frame < MORPH_START ? interpolate(strike, [0, 1], [22, 0]) : 0;
  const grow = frame < MORPH_START ? interpolate(strike, [0, 1], [0.55, 1]) : 1;
  return (
    <div
      className={`absolute ${BAR_BG[bar.tone]}`}
      style={{
        left: rect.left,
        top: rect.top + rise,
        width: rect.width,
        height: rect.height,
        borderRadius: rect.radius,
        opacity: Math.min(strike, wash, clear),
        transform: `scaleY(${grow})`,
        transformOrigin: 'bottom',
      }}
    />
  );
}

// Beat — "Meet kordeon": the line lands, the logo strikes up above it, the line
// fades, then its three bars unfold into the product's explorer · chat · preview
// columns and the real window fills in — opening on `channelState` (held identical to
// the following home beat's first frame, so their crossfade blends one window).
export function MeetMorph({
  meetLine,
  phase,
  channelState,
}: {
  meetLine: string;
  phase: number;
  channelState: { slug: string; visibleCount: number; typingId?: string };
}): ReactNode {
  const frame = useCurrentFrame();
  const windowOpacity = interpolate(frame, [MAT_START, MAT_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  return (
    <AbsoluteFill className="dark bg-background text-foreground">
      <Sequence durationInFrames={MEET_OUT}>
        <KineticCaption
          text={meetLine}
          durationInFrames={MEET_OUT}
          variant="hero"
          offsetY={CAPTION_OFFSET}
        />
      </Sequence>
      <AbsoluteFill>
        {[...MARK_BARS.entries()].map(([index, bar]) => (
          <MorphBar key={bar.key} bar={bar} index={index} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: windowOpacity }}>
        <SlabStage
          pose={SLAB.wide}
          phase={phase}
          product={{
            activeSlug: channelState.slug,
            visibleCount: channelState.visibleCount,
            typingId: channelState.typingId,
            previewState: 'placeholder',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
