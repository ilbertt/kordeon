// biome-ignore-all lint/style/noMagicNumbers: per-beat reveal + pose timing
import { interpolate, useCurrentFrame } from 'remotion';
import { HERO_SLUG } from '#data/channels';
import { EASE_IN_OUT, type RevealStep, stagedReveal } from '#lib/motion';
import { collabPlanPrompt } from '#scenes/collab-plan';
import { handoffPlanPrompt } from '#scenes/handoff-cursors';
import { homePanPose, move, SLAB, SlabBeat, swapMix } from '#scenes/slab-beat';
import { poseAt } from '#scenes/slab-stage';

// Which channel + reveal state the establishing shot opens on, held identical to the
// meet beat's final frame so their crossfade blends one window into the next.
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
  channelState: HomeChannelState;
}) {
  const frame = useCurrentFrame();
  return (
    <SlabBeat
      // Push into the left channel-list panel and crane down it, then return to wide.
      pose={homePanPose(frame)}
      phase={phase}
      product={{
        activeSlug: channelState.slug,
        visibleCount: channelState.visibleCount,
        typingId: channelState.typingId,
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

// Hold on the composer so the Build button and the collaboration cursors are both
// framed for the You-cursor press, then move to the hand-off pose (ship's start) so
// the beat still hands cleanly into the preview.
const HANDOFF_HOLD = 60;
const HANDOFF_MOVE_END = 150;

// The You-cursor click choreography, aligned to the state swap so the button
// flipping to "Building" is the visible result of the press.
const HANDOFF_SPEC = {
  travelStart: 26,
  arrive: HANDOFF_SWAP - 4,
  click: HANDOFF_SWAP,
  fadeStart: HANDOFF_SWAP + 4,
  fadeSpan: 14,
} as const;

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
  const pose = poseAt({
    from: SLAB.composer,
    to: SLAB.handoff,
    frame,
    start: HANDOFF_HOLD,
    end: HANDOFF_MOVE_END,
    easing: EASE_IN_OUT,
  });
  return (
    <SlabBeat
      pose={pose}
      phase={phase}
      product={{
        activeSlug: HERO_SLUG,
        visibleCount,
        typingId,
        compose: frame < HANDOFF_SWAP ? 'collab' : 'build',
        previewState: frame < HANDOFF_SWAP ? 'placeholder' : 'building',
        previewPrevState: 'placeholder',
        previewStateMix: swapMix({ frame, at: HANDOFF_SWAP }),
        renderComposerPrompt: handoffPlanPrompt(HANDOFF_SPEC),
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
