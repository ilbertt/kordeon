// biome-ignore-all lint/style/noMagicNumbers: outro motion + layout tuning
import { buttonVariants } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { ArrowRight } from 'lucide-react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// The close: the mark, the promise, and the way in. The tagline is the vision's
// one-liner; the CTA row mirrors the product's own actions.
export function Payoff() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const lift = interpolate(enter, [0, 1], [24, 0]);
  const cta = spring({ frame, fps, delay: 18, config: { damping: 200 }, durationInFrames: 24 });

  return (
    <AbsoluteFill className="dark items-center justify-center bg-background text-foreground">
      <div
        style={{ opacity: enter, transform: `translateY(${lift}px)` }}
        className="flex flex-col items-center gap-7"
      >
        <span className="flex size-20 items-center justify-center rounded-2xl bg-foreground">
          <KordeonMark className="size-11" />
        </span>
        <h1 className="font-semibold text-6xl tracking-tight">kordeon</h1>
        <p className="max-w-2xl text-center text-2xl text-muted-foreground">
          Where humans collaborate and agents execute.
        </p>
        <div style={{ opacity: cta }} className="mt-2 flex items-center gap-4">
          <span className={`${buttonVariants({ size: 'lg' })} h-12 rounded-2xl px-6 text-base`}>
            Get started — free
            <ArrowRight />
          </span>
          <span className="text-lg text-muted-foreground">Open source · Join the waitlist</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
