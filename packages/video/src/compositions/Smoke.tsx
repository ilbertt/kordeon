// biome-ignore-all lint/style/noMagicNumbers: motion timing + layout constants
import { Button } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { ArrowRight } from 'lucide-react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { fontStyle } from '#lib/fonts';

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Phase-0 smoke test: proves the real @repo/ui theme + components render, fully
// styled, inside Remotion's bundler. Not a final scene — just the integration probe.
export function Smoke() {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      className="dark items-center justify-center bg-background text-foreground"
      style={fontStyle}
    >
      <div
        style={{
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
          translate: `0 ${interpolate(frame, [0, 30], [24, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: EASE,
          })}px`,
        }}
        className="flex flex-col items-center gap-8"
      >
        <span className="flex size-20 items-center justify-center rounded-2xl bg-foreground">
          <KordeonMark className="size-11" />
        </span>
        <h1 className="font-semibold text-7xl tracking-tight">kordeon</h1>
        <p className="text-2xl text-muted-foreground">
          Where humans collaborate and agents execute.
        </p>
        <Button size="lg" className="mt-2 h-12 rounded-2xl px-6 text-base">
          Get started — free
          <ArrowRight />
        </Button>
      </div>
    </AbsoluteFill>
  );
}
