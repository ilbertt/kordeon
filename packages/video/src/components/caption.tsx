// biome-ignore-all lint/style/noMagicNumbers: caption motion + layout tuning
import type { ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

const IN_FRAMES = 12;
const OUT_FRAMES = 12;
const RISE_PX = 18;

// A kinetic lower-third caption: fades + rises in, holds, fades out. Meant to be
// wrapped in its own <Sequence> so `useCurrentFrame` is local to the line; pass
// the sequence's length as `durationInFrames` so it knows when to leave.
export function Caption({
  children,
  durationInFrames,
}: {
  children: ReactNode;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, IN_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const exit = interpolate(frame, [durationInFrames - OUT_FRAMES, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(enter, exit);
  const y = interpolate(enter, [0, 1], [RISE_PX, 0]);

  return (
    <AbsoluteFill className="items-center justify-end pb-28">
      <div
        style={{ opacity, transform: `translateY(${y}px)` }}
        className="mx-auto max-w-4xl rounded-2xl border border-border/60 bg-background/70 px-9 py-5 text-center backdrop-blur-md"
      >
        <p className="text-pretty font-semibold text-4xl text-foreground leading-snug tracking-tight">
          {children}
        </p>
      </div>
    </AbsoluteFill>
  );
}
