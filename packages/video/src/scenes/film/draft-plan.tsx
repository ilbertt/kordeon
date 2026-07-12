// biome-ignore-all lint/style/noMagicNumbers: reveal + camera timing
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { HERO_SLUG } from '#data/channels';
import { pushShot, type RevealStep, SHOTS, stagedReveal } from '#lib/motion';
import { ProductStage } from '#scenes/film/product-stage';

// Beat 4 — Korde's plan lands (the real PlanCard, 2/4 checked) and Ada seconds it.
// Opens on Korde still typing (continuous from beat 3), and the camera pushes onto
// the plan card so the checkboxes read.
const REVEAL: RevealStep[] = [
  { at: 0, count: 4, typing: 'korde' },
  { at: 34, count: 5, typing: 'ada' },
  { at: 118, count: 6 },
];

export function DraftPlan({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { visibleCount, typingId } = stagedReveal({ steps: REVEAL, frame });
  const shot = pushShot({ from: SHOTS.chatMid, to: SHOTS.plan, frame, start: 18, end: 110 });
  return (
    <AbsoluteFill className="dark bg-background">
      <ProductStage
        shot={shot}
        product={{
          activeSlug: HERO_SLUG,
          visibleCount,
          typingId,
          planDone: 2,
          previewState: 'placeholder',
        }}
      />
      <Sequence from={40} durationInFrames={durationInFrames - 40}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 40} />
      </Sequence>
    </AbsoluteFill>
  );
}
