// biome-ignore-all lint/style/noMagicNumbers: outro motion + layout tuning
import { buttonVariants } from '@repo/ui/components/button';
import { ArrowRight } from 'lucide-react';
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { AnimatedChordMark } from '#components/chord-mark-animated';

// Beat 8 — the close: the chord mark is struck, the wordmark and promise resolve
// under it, then the CTA springs up and the waitlist line fades in behind it.
export function Cta({
  wordmark,
  tagline,
  button,
  meta,
}: {
  wordmark: string;
  tagline: string;
  button: string;
  meta: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tile = spring({ frame, fps, config: { damping: 14, mass: 0.7 }, durationInFrames: 24 });
  const lockup = spring({
    frame: frame - 20,
    fps,
    config: { damping: 20, mass: 0.8 },
    durationInFrames: 26,
  });
  const cta = spring({
    frame: frame - 52,
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 130 },
    durationInFrames: 22,
  });
  const metaOpacity = interpolate(frame, [64, 88], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill className="dark items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-7">
        <span
          className="flex size-24 items-center justify-center rounded-3xl bg-foreground"
          style={{ scale: interpolate(tile, [0, 1], [0.7, 1]), opacity: tile }}
        >
          <AnimatedChordMark className="size-14" delay={6} />
        </span>
        <Interactive.Div
          name="CTA lockup"
          className="flex flex-col items-center gap-6"
          style={{ opacity: lockup, translate: `0 ${interpolate(lockup, [0, 1], [20, 0])}px` }}
        >
          <h1 className="font-semibold text-7xl tracking-tight">{wordmark}</h1>
          <p className="max-w-3xl text-center text-2xl text-muted-foreground">{tagline}</p>
        </Interactive.Div>
        <div
          className="mt-2 flex items-center gap-5"
          style={{
            opacity: cta,
            translate: `0 ${interpolate(cta, [0, 1], [18, 0])}px`,
            scale: interpolate(cta, [0, 1], [0.9, 1]),
          }}
        >
          <span className={`${buttonVariants({ size: 'lg' })} h-12 rounded-2xl px-7 text-base`}>
            {button}
            <ArrowRight />
          </span>
          <span className="text-lg text-muted-foreground" style={{ opacity: metaOpacity }}>
            {meta}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
