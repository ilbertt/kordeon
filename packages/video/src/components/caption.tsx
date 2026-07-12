// biome-ignore-all lint/style/noMagicNumbers: caption motion + layout tuning
import type { ReactNode } from 'react';
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from 'remotion';

const IN_FRAMES = 12;
const OUT_FRAMES = 12;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// A kinetic lower-third caption: fades + rises in, holds, fades out. Wrap it in
// its own named <Sequence> so `useCurrentFrame` is local to the line; pass the
// sequence length as `durationInFrames` so it knows when to leave. The pill is an
// Interactive.Div so its text/placement stay editable in Studio Visual Mode.
export function Caption({
  children,
  durationInFrames,
}: {
  children: ReactNode;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="items-center justify-end pb-28">
      <Interactive.Div
        name="Caption"
        className="mx-auto max-w-4xl rounded-2xl border border-border/60 bg-background/70 px-9 py-5 text-center backdrop-blur-md"
        style={{
          opacity: Math.min(
            interpolate(frame, [0, IN_FRAMES], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: EASE,
            }),
            interpolate(frame, [durationInFrames - OUT_FRAMES, durationInFrames], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          ),
          translate: `0 ${interpolate(frame, [0, IN_FRAMES], [18, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: EASE,
          })}px`,
        }}
      >
        <p className="text-pretty font-semibold text-4xl text-foreground leading-snug tracking-tight">
          {children}
        </p>
      </Interactive.Div>
    </AbsoluteFill>
  );
}
