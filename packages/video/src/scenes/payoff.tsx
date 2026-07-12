// biome-ignore-all lint/style/noMagicNumbers: outro motion + layout tuning
import { buttonVariants } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { ArrowRight } from 'lucide-react';
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from 'remotion';

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// The close: the mark, the promise, and the way in. The tagline is the vision's
// one-liner; the CTA row mirrors the product's own actions.
export function Payoff({ tagline }: { tagline: string }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="dark items-center justify-center bg-background text-foreground">
      <Interactive.Div
        name="Payoff card"
        className="flex flex-col items-center gap-7"
        style={{
          opacity: interpolate(frame, [0, 30], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: EASE,
          }),
          translate: `0 ${interpolate(frame, [0, 30], [24, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: EASE,
          })}px`,
        }}
      >
        <span className="flex size-20 items-center justify-center rounded-2xl bg-foreground">
          <KordeonMark className="size-11" />
        </span>
        <h1 className="font-semibold text-6xl tracking-tight">kordeon</h1>
        <p className="max-w-2xl text-center text-2xl text-muted-foreground">{tagline}</p>
        <div
          className="mt-2 flex items-center gap-4"
          style={{
            opacity: interpolate(frame, [18, 42], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: EASE,
            }),
          }}
        >
          <span className={`${buttonVariants({ size: 'lg' })} h-12 rounded-2xl px-6 text-base`}>
            Get started — free
            <ArrowRight />
          </span>
          <span className="text-lg text-muted-foreground">Open source · Join the waitlist</span>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
}
