// biome-ignore-all lint/style/noMagicNumbers: per-beat reveal + pose timing
import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { channelBySlug, HERO_SLUG } from '#data/channels';
import { type RevealStep, stagedReveal } from '#lib/motion';
import { threadStateAt } from '#lib/thread-timeline';
import type { ProductWindowProps } from '#product-window/product-window';
import { collabPlanPrompt } from '#scenes/film/collab-plan';
import { poseAt, SLAB, type SlabPose, SlabStage } from '#scenes/slab/slab-stage';

const WELCOME_SLUG = 'welcome';

// A product beat in the slab cut: the floating window plus its one kinetic caption.
function SlabBeat({
  pose,
  product,
  caption,
  captionStart,
  durationInFrames,
}: {
  pose: SlabPose;
  product: ProductWindowProps;
  caption: string;
  captionStart: number;
  durationInFrames: number;
}): ReactNode {
  return (
    <AbsoluteFill className="dark bg-background">
      <SlabStage pose={pose} product={product} />
      <Sequence from={captionStart} durationInFrames={durationInFrames - captionStart}>
        <KineticCaption text={caption} durationInFrames={durationInFrames - captionStart} />
      </Sequence>
    </AbsoluteFill>
  );
}

// Beat 2 — the workspace materialises as a floating slab; Korde's welcome reveals.
export function WorkspaceHome({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
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

// Beat 3 — the team shapes the idea in chat; the slab eases toward the thread.
export function ShapeIdea({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { visibleCount, typingId } = stagedReveal({ steps: SHAPE_REVEAL, frame });
  const pose = poseAt({ from: SLAB.wide, to: SLAB.chat, frame, start: 0, end: 110 });
  return (
    <SlabBeat
      pose={pose}
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

// Beat 4 — the slab drops to the collaborate composer where the brief is co-written.
export function DraftPlan({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { visibleCount, typingId } = stagedReveal({ steps: PLAN_REVEAL, frame });
  const pose = poseAt({ from: SLAB.chat, to: SLAB.composer, frame, start: 8, end: 78 });
  return (
    <SlabBeat
      pose={pose}
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

// Beat 5 — the deliberate handoff: the brief locks to building, the preview starts.
export function HandOff({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { visibleCount, typingId } = stagedReveal({ steps: HANDOFF_REVEAL, frame });
  const pose = poseAt({ from: SLAB.composer, to: SLAB.handoff, frame, start: 0, end: 70 });
  const previewState = frame < 48 ? 'placeholder' : 'building';
  const compose = frame < 44 ? 'collab' : 'build';
  return (
    <SlabBeat
      pose={pose}
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

// Beat 6 — the running product renders live; the slab crosses to the preview.
export function WatchShip({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const pose = poseAt({ from: SLAB.handoff, to: SLAB.preview, frame, start: 0, end: 84 });
  const previewState = frame < 30 ? 'building' : 'dashboard';
  const previewReveal = interpolate(frame, [36, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <SlabBeat
      pose={pose}
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

// Beat 7 — pull back to the whole floating slab, every panel alive at once.
export function PullBack({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const pose = poseAt({ from: SLAB.preview, to: SLAB.pullback, frame, start: 0, end: 74 });
  return (
    <SlabBeat
      pose={pose}
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
