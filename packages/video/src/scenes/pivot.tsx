// biome-ignore-all lint/style/noMagicNumbers: past-act motion tuning
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { EASE } from '#lib/motion';

// The pivot out of the desaturated past: one hero line owns the beat while the
// grayscale lifts, priming the full-colour Meet kordeon the crossfade hands off to.
export function ThePivot({ line1, durationInFrames }: { line1: string; durationInFrames: number }) {
  const frame = useCurrentFrame();
  const gray = interpolate(frame, [durationInFrames * 0.5, durationInFrames], [1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  return (
    <AbsoluteFill
      className="dark bg-background text-foreground"
      style={{ filter: `grayscale(${gray})` }}
    >
      <Sequence durationInFrames={durationInFrames}>
        <KineticCaption text={line1} durationInFrames={durationInFrames} variant="hero" />
      </Sequence>
    </AbsoluteFill>
  );
}
