// biome-ignore-all lint/style/noMagicNumbers: handoff staging + camera timing
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { HERO_SLUG } from '#data/channels';
import { pushShot, type RevealStep, SHOTS, stagedReveal } from '#lib/motion';
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
  const shot = pushShot({ from: SHOTS.plan, to: SHOTS.handoff, frame, start: 0, end: 66 });
  const previewState = frame < 48 ? 'placeholder' : 'building';
  const compose = frame < 44 ? 'collab' : 'build';
  const planDone = Math.round(
    interpolate(frame, [54, 120], [2, 4], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  return (
    <AbsoluteFill className="dark bg-background">
      <ProductStage
        shot={shot}
        product={{
          activeSlug: HERO_SLUG,
          visibleCount,
          typingId,
          compose,
          planDone,
          previewState,
        }}
      />
      <Sequence from={18} durationInFrames={durationInFrames - 18}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 18} />
      </Sequence>
    </AbsoluteFill>
  );
}
