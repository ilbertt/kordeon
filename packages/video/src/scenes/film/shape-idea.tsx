// biome-ignore-all lint/style/noMagicNumbers: reveal + camera timing
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { HERO_SLUG } from '#data/channels';
import { pushShot, type RevealStep, SHOTS, stagedReveal } from '#lib/motion';
import { ProductStage } from '#scenes/film/product-stage';

// Beat 3 — the team shapes the idea in chat. You + Maya land, then Theo @-mentions
// Korde; the typing row ends on Korde composing, teeing up the plan in beat 4.
const REVEAL: RevealStep[] = [
  { at: 0, count: 2, typing: 'maya' },
  { at: 46, count: 3, typing: 'theo' },
  { at: 104, count: 4, typing: 'korde' },
];

export function ShapeIdea({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { visibleCount, typingId } = stagedReveal({ steps: REVEAL, frame });
  const shot = pushShot({ from: SHOTS.wide, to: SHOTS.chatMid, frame, start: 0, end: 120 });
  return (
    <AbsoluteFill className="dark bg-background">
      <ProductStage
        shot={shot}
        product={{ activeSlug: HERO_SLUG, visibleCount, typingId, previewState: 'placeholder' }}
      />
      <Sequence from={16} durationInFrames={durationInFrames - 16}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 16} />
      </Sequence>
    </AbsoluteFill>
  );
}
