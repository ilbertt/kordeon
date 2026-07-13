// biome-ignore-all lint/style/noMagicNumbers: per-beat reveal + pose timing
import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { channelBySlug, HERO_SLUG } from '#data/channels';
import { EASE_IN_OUT, type RevealStep, stagedReveal } from '#lib/motion';
import { threadStateAt } from '#lib/thread-timeline';
import type { ProductWindowProps } from '#product-window/product-window';
import { collabPlanPrompt } from '#scenes/film/collab-plan';
import { poseAt, type SlabPose, SlabStage } from '#scenes/slab/slab-stage';

const WELCOME_SLUG = 'welcome';

// The pose only starts moving once the crossfade is over, so the incoming beat
// holds its start pose for the whole transition. With a continuous float (`phase`)
// and a matching start pose, the outgoing and incoming slabs are identical through
// the crossfade — it dissolves the window into itself, so product cuts don't jump.
const MOVE_START = 24;

// Each caption is fully gone this many frames before its beat ends: 12 empty frames
// of product, then the 24-frame crossfade runs caption-free. So only one caption is
// ever on screen, with a clear gap across every seam.
const CAPTION_TAIL = 36;

// Frames over which a preview pane crossfades between states instead of hard-swapping
// the whole pane on one frame (which reads as a flash).
const SWAP_FADE = 8;

const SLAB = {
  wide: { focusX: 960, focusY: 540, scale: 0.72, rotateX: 6, rotateY: 0 },
  chat: { focusX: 800, focusY: 430, scale: 0.96, rotateX: 5, rotateY: 3 },
  composer: { focusX: 770, focusY: 812, scale: 1.04, rotateX: 4, rotateY: 1 },
  handoff: { focusX: 1020, focusY: 560, scale: 0.9, rotateX: 5, rotateY: -4 },
  preview: { focusX: 1720, focusY: 360, scale: 1.06, rotateX: 5, rotateY: -8 },
  pullback: { focusX: 960, focusY: 540, scale: 0.74, rotateX: 6, rotateY: 0 },
} satisfies Record<string, SlabPose>;

// Every product-beat push shares the same start (after the crossfade) and the strong
// on-screen ease-in-out, so only the destination pose and its end frame vary.
function move({
  from,
  to,
  frame,
  end,
}: {
  from: SlabPose;
  to: SlabPose;
  frame: number;
  end: number;
}): SlabPose {
  return poseAt({ from, to, frame, start: MOVE_START, end, easing: EASE_IN_OUT });
}

// 0 → 1 crossfade weight for a preview state that flips at `at`.
function swapMix({ frame, at }: { frame: number; at: number }): number {
  return interpolate(frame, [at, at + SWAP_FADE], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function SlabBeat({
  pose,
  product,
  phase,
  caption,
  captionStart,
  durationInFrames,
}: {
  pose: SlabPose;
  product: ProductWindowProps;
  phase: number;
  caption: string;
  captionStart: number;
  durationInFrames: number;
}): ReactNode {
  const captionDuration = durationInFrames - captionStart - CAPTION_TAIL;
  return (
    <AbsoluteFill className="dark bg-background">
      <SlabStage pose={pose} product={product} phase={phase} />
      <Sequence from={captionStart} durationInFrames={captionDuration}>
        <KineticCaption text={caption} durationInFrames={captionDuration} />
      </Sequence>
    </AbsoluteFill>
  );
}

// Optional override to open the establishing shot on a specific channel + reveal
// state instead of the default welcome thread — lets a cut jump straight into a
// feature channel.
export type HomeChannelState = { slug: string; visibleCount: number; typingId?: string };

export function WorkspaceHome({
  subtitle,
  phase,
  durationInFrames,
  channelState,
}: {
  subtitle: string;
  phase: number;
  durationInFrames: number;
  channelState?: HomeChannelState;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const welcome = channelBySlug(WELCOME_SLUG);
  const welcomeState = threadStateAt({
    messages: welcome?.messages ?? [],
    fps,
    frame,
    currentUserId: 'you',
  });
  const active = channelState ?? { slug: WELCOME_SLUG, ...welcomeState };
  return (
    <SlabBeat
      pose={SLAB.wide}
      phase={phase}
      product={{
        activeSlug: active.slug,
        visibleCount: active.visibleCount,
        typingId: active.typingId,
        previewState: 'placeholder',
      }}
      caption={subtitle}
      captionStart={30}
      durationInFrames={durationInFrames}
    />
  );
}

const SHAPE_REVEAL: RevealStep[] = [
  { at: 0, count: 2, typing: 'maya' },
  { at: 46, count: 3, typing: 'theo' },
  { at: 104, count: 4, typing: 'korde' },
];

export function ShapeIdea({
  subtitle,
  phase,
  durationInFrames,
}: {
  subtitle: string;
  phase: number;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { visibleCount, typingId } = stagedReveal({ steps: SHAPE_REVEAL, frame });
  return (
    <SlabBeat
      pose={move({ from: SLAB.wide, to: SLAB.chat, frame, end: 120 })}
      phase={phase}
      product={{ activeSlug: HERO_SLUG, visibleCount, typingId, previewState: 'placeholder' }}
      caption={subtitle}
      captionStart={30}
      durationInFrames={durationInFrames}
    />
  );
}

const PLAN_REVEAL: RevealStep[] = [
  { at: 0, count: 4, typing: 'korde' },
  { at: 28, count: 5, typing: 'ada' },
  { at: 108, count: 6 },
];

export function DraftPlan({
  subtitle,
  phase,
  durationInFrames,
}: {
  subtitle: string;
  phase: number;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { visibleCount, typingId } = stagedReveal({ steps: PLAN_REVEAL, frame });
  return (
    <SlabBeat
      pose={move({ from: SLAB.chat, to: SLAB.composer, frame, end: 92 })}
      phase={phase}
      product={{
        activeSlug: HERO_SLUG,
        visibleCount,
        typingId,
        previewState: 'placeholder',
        renderComposerPrompt: collabPlanPrompt(true),
      }}
      caption={subtitle}
      captionStart={40}
      durationInFrames={durationInFrames}
    />
  );
}

const HANDOFF_REVEAL: RevealStep[] = [
  { at: 0, count: 6 },
  { at: 16, count: 7 },
];

// The composer lock and the preview both flip on the same frame, so the hand-off
// reads as one change; the preview crossfades placeholder → building over SWAP_FADE.
const HANDOFF_SWAP = 52;

export function HandOff({
  subtitle,
  phase,
  durationInFrames,
}: {
  subtitle: string;
  phase: number;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { visibleCount, typingId } = stagedReveal({ steps: HANDOFF_REVEAL, frame });
  return (
    <SlabBeat
      pose={move({ from: SLAB.composer, to: SLAB.handoff, frame, end: 90 })}
      phase={phase}
      product={{
        activeSlug: HERO_SLUG,
        visibleCount,
        typingId,
        compose: frame < HANDOFF_SWAP ? 'collab' : 'build',
        previewState: frame < HANDOFF_SWAP ? 'placeholder' : 'building',
        previewPrevState: 'placeholder',
        previewStateMix: swapMix({ frame, at: HANDOFF_SWAP }),
        renderComposerPrompt: collabPlanPrompt(false),
      }}
      caption={subtitle}
      captionStart={30}
      durationInFrames={durationInFrames}
    />
  );
}

// The dashboard both replaces the building state (crossfaded) and grows its bars in
// from this frame, so there's never a frame of empty 0% chart.
const SHIP_SWAP = 40;

export function WatchShip({
  subtitle,
  phase,
  durationInFrames,
}: {
  subtitle: string;
  phase: number;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const previewReveal = interpolate(frame, [SHIP_SWAP, 172], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <SlabBeat
      pose={move({ from: SLAB.handoff, to: SLAB.preview, frame, end: 100 })}
      phase={phase}
      product={{
        activeSlug: HERO_SLUG,
        visibleCount: 7,
        compose: 'build',
        previewState: frame < SHIP_SWAP ? 'building' : 'dashboard',
        previewPrevState: 'building',
        previewStateMix: swapMix({ frame, at: SHIP_SWAP }),
        previewReveal,
        renderComposerPrompt: collabPlanPrompt(false),
      }}
      caption={subtitle}
      captionStart={36}
      durationInFrames={durationInFrames}
    />
  );
}

export function PullBack({
  subtitle,
  phase,
  durationInFrames,
}: {
  subtitle: string;
  phase: number;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  return (
    <SlabBeat
      pose={move({ from: SLAB.preview, to: SLAB.pullback, frame, end: 96 })}
      phase={phase}
      product={{
        activeSlug: HERO_SLUG,
        visibleCount: 7,
        compose: 'built',
        previewState: 'dashboard',
        previewReveal: 1,
        renderComposerPrompt: collabPlanPrompt(false),
      }}
      caption={subtitle}
      captionStart={30}
      durationInFrames={durationInFrames}
    />
  );
}
