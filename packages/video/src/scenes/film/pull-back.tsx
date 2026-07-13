// biome-ignore-all lint/style/noMagicNumbers: camera timing
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { HERO_SLUG } from '#data/channels';
import { pushShot, SHOTS } from '#lib/motion';
import { collabPlanPrompt } from '#scenes/film/collab-plan';
import { ProductStage } from '#scenes/film/product-stage';

// Beat 7 — pull back to the whole three-panel window, alive at once: explorer
// statuses, the full thread with its handed-off brief, and the live preview. It
// holds the full shape so the finale can pick it up and fold it into the logo.
export function PullBack({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const shot = pushShot({ from: SHOTS.preview, to: SHOTS.pullback, frame, start: 0, end: 74 });
  return (
    <AbsoluteFill className="dark bg-background">
      <ProductStage
        shot={shot}
        product={{
          activeSlug: HERO_SLUG,
          visibleCount: 7,
          compose: 'built',
          previewState: 'dashboard',
          previewReveal: 1,
          renderComposerPrompt: collabPlanPrompt(false),
        }}
      />
      <Sequence from={20} durationInFrames={durationInFrames - 20}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 20} />
      </Sequence>
    </AbsoluteFill>
  );
}
