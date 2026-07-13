// biome-ignore-all lint/style/noMagicNumbers: reveal + camera timing
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { HERO_SLUG } from '#data/channels';
import { pushShot, type RevealStep, SHOTS, stagedReveal } from '#lib/motion';
import { collabPlanPrompt } from '#scenes/film/collab-plan';
import { ProductStage } from '#scenes/film/product-stage';

// Beat 4 — the plan is a shared brief, not a message. The camera drops to the
// collaborate composer where Maya, Theo and Korde co-write it: cursors travel to
// lines and a requirement gets ticked. Korde's "started the brief" message lands
// off-focus in the thread above (kept revealing for continuity into the handoff).
const REVEAL: RevealStep[] = [
  { at: 0, count: 4, typing: 'korde' },
  { at: 28, count: 5, typing: 'ada' },
  { at: 108, count: 6 },
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
  const shot = pushShot({ from: SHOTS.chatMid, to: SHOTS.composer, frame, start: 8, end: 78 });
  return (
    <AbsoluteFill className="dark bg-background">
      <ProductStage
        shot={shot}
        product={{
          activeSlug: HERO_SLUG,
          visibleCount,
          typingId,
          previewState: 'placeholder',
          renderComposerPrompt: collabPlanPrompt(true),
        }}
      />
      <Sequence from={40} durationInFrames={durationInFrames - 40}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 40} />
      </Sequence>
    </AbsoluteFill>
  );
}
