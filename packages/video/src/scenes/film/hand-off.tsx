// biome-ignore-all lint/style/noMagicNumbers: handoff staging + camera timing
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { HERO_SLUG } from '#data/channels';
import { pushShot, type RevealStep, SHOTS, stagedReveal } from '#lib/motion';
import { collabPlanPrompt } from '#scenes/film/collab-plan';
import { ProductStage } from '#scenes/film/product-stage';

// Beat 5 — the deliberate handoff. "Perfect. Hand it off." lands, the preview flips
// from placeholder to Building (spinner + PR #128), and the plan completes on
// screen as the agent picks it up (planDone ramps 2 → 4).
const REVEAL: RevealStep[] = [
  { at: 0, count: 6 },
  { at: 16, count: 7 },
];

export function HandOff({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { visibleCount, typingId } = stagedReveal({ steps: REVEAL, frame });
  const shot = pushShot({ from: SHOTS.composer, to: SHOTS.handoff, frame, start: 0, end: 70 });
  const previewState = frame < 48 ? 'placeholder' : 'building';
  // The composer flips from the co-written brief to the locked, building brief —
  // a real handoff: the same prompt, now read-only with the agent on it.
  const compose = frame < 44 ? 'collab' : 'build';
  return (
    <AbsoluteFill className="dark bg-background">
      <ProductStage
        shot={shot}
        product={{
          activeSlug: HERO_SLUG,
          visibleCount,
          typingId,
          compose,
          previewState,
          renderComposerPrompt: collabPlanPrompt(false),
        }}
      />
      <Sequence from={18} durationInFrames={durationInFrames - 18}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 18} />
      </Sequence>
    </AbsoluteFill>
  );
}
