// biome-ignore-all lint/style/noMagicNumbers: preview reveal + camera timing
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { HERO_SLUG } from '#data/channels';
import { pushShot, SHOTS } from '#lib/motion';
import { collabPlanPrompt } from '#scenes/film/collab-plan';
import { ProductStage } from '#scenes/film/product-stage';

// Beat 6 — the differentiator: the running product renders live beside the chat.
// The camera crosses to the preview, Building resolves into the dashboard, and the
// cohort bars grow while the 62% and channel rates count up (previewReveal 0 → 1).
export function WatchShip({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const shot = pushShot({ from: SHOTS.handoff, to: SHOTS.preview, frame, start: 0, end: 84 });
  const previewState = frame < 30 ? 'building' : 'dashboard';
  const previewReveal = interpolate(frame, [36, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill className="dark bg-background">
      <ProductStage
        shot={shot}
        product={{
          activeSlug: HERO_SLUG,
          visibleCount: 7,
          compose: 'build',
          previewState,
          previewReveal,
          renderComposerPrompt: collabPlanPrompt(false),
        }}
      />
      <Sequence from={24} durationInFrames={durationInFrames - 24}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 24} />
      </Sequence>
    </AbsoluteFill>
  );
}
