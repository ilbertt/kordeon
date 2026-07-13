// biome-ignore-all lint/style/noMagicNumbers: per-beat reveal + pose timing
import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { channelBySlug, HERO_SLUG } from '#data/channels';
import { type RevealStep, stagedReveal } from '#lib/motion';
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

const SLAB = {
  wide: { focusX: 960, focusY: 540, scale: 0.72, rotateX: 6, rotateY: 0 },
  chat: { focusX: 800, focusY: 430, scale: 0.96, rotateX: 5, rotateY: 3 },
  composer: { focusX: 770, focusY: 812, scale: 1.04, rotateX: 4, rotateY: 1 },
  handoff: { focusX: 1020, focusY: 560, scale: 0.9, rotateX: 5, rotateY: -4 },
  preview: { focusX: 1720, focusY: 360, scale: 1.06, rotateX: 5, rotateY: -8 },
  pullback: { focusX: 960, focusY: 540, scale: 0.74, rotateX: 6, rotateY: 0 },
} satisfies Record<string, SlabPose>;

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
  return (
    <AbsoluteFill className="dark bg-background">
      <SlabStage pose={pose} product={product} phase={phase} />
      <Sequence from={captionStart} durationInFrames={durationInFrames - captionStart}>
        <KineticCaption text={caption} durationInFrames={durationInFrames - captionStart} />
      </Sequence>
    </AbsoluteFill>
  );
}

export function WorkspaceHome({
  subtitle,
  phase,
  durationInFrames,
}: {
  subtitle: string;
  phase: number;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const welcome = channelBySlug(WELCOME_SLUG);
  const { visibleCount, typingId } = threadStateAt({
    messages: welcome?.messages ?? [],
    fps,
    frame,
    currentUserId: 'you',
  });
  return (
    <SlabBeat
      pose={SLAB.wide}
      phase={phase}
      product={{ activeSlug: WELCOME_SLUG, visibleCount, typingId, previewState: 'placeholder' }}
      caption={subtitle}
      captionStart={22}
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
  const pose = poseAt({ from: SLAB.wide, to: SLAB.chat, frame, start: MOVE_START, end: 120 });
  return (
    <SlabBeat
      pose={pose}
      phase={phase}
      product={{ activeSlug: HERO_SLUG, visibleCount, typingId, previewState: 'placeholder' }}
      caption={subtitle}
      captionStart={16}
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
  const pose = poseAt({ from: SLAB.chat, to: SLAB.composer, frame, start: MOVE_START, end: 92 });
  return (
    <SlabBeat
      pose={pose}
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
  const pose = poseAt({ from: SLAB.composer, to: SLAB.handoff, frame, start: MOVE_START, end: 90 });
  const previewState = frame < 54 ? 'placeholder' : 'building';
  const compose = frame < 50 ? 'collab' : 'build';
  return (
    <SlabBeat
      pose={pose}
      phase={phase}
      product={{
        activeSlug: HERO_SLUG,
        visibleCount,
        typingId,
        compose,
        previewState,
        renderComposerPrompt: collabPlanPrompt(false),
      }}
      caption={subtitle}
      captionStart={18}
      durationInFrames={durationInFrames}
    />
  );
}

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
  const pose = poseAt({ from: SLAB.handoff, to: SLAB.preview, frame, start: MOVE_START, end: 100 });
  const previewState = frame < 40 ? 'building' : 'dashboard';
  const previewReveal = interpolate(frame, [46, 160], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <SlabBeat
      pose={pose}
      phase={phase}
      product={{
        activeSlug: HERO_SLUG,
        visibleCount: 7,
        compose: 'build',
        previewState,
        previewReveal,
        renderComposerPrompt: collabPlanPrompt(false),
      }}
      caption={subtitle}
      captionStart={24}
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
  const pose = poseAt({ from: SLAB.preview, to: SLAB.pullback, frame, start: MOVE_START, end: 96 });
  return (
    <SlabBeat
      pose={pose}
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
      captionStart={20}
      durationInFrames={durationInFrames}
    />
  );
}
