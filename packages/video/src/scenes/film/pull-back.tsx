// biome-ignore-all lint/style/noMagicNumbers: loop overlay + camera timing
import { ArrowRight } from 'lucide-react';
import { Fragment } from 'react';
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { HERO_SLUG } from '#data/channels';
import { pushShot, SHOTS } from '#lib/motion';
import { ProductStage } from '#scenes/film/product-stage';

// The loop, struck out over the (dimmed) full window: each step pops in with an
// arrow drawing to it — chat → refine the plan → hand off → preview.
function LoopOverlay({ steps }: { steps: string[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex items-center gap-4" style={{ translate: '0 -70px' }}>
        {[...steps.entries()].map(([index, step]) => {
          const pop = spring({
            frame: frame - 24 - index * 16,
            fps,
            config: { damping: 16, mass: 0.6, stiffness: 130 },
            durationInFrames: 20,
          });
          const arrow = spring({
            frame: frame - 24 - index * 16 + 6,
            fps,
            config: { damping: 18, mass: 0.6 },
            durationInFrames: 16,
          });
          return (
            <Fragment key={step}>
              {index > 0 ? (
                <ArrowRight
                  className="size-8 text-primary"
                  style={{ opacity: arrow, scale: interpolate(arrow, [0, 1], [0.5, 1]) }}
                />
              ) : null}
              <span
                className="rounded-2xl border border-primary/40 bg-primary/10 px-6 py-3 font-semibold text-3xl text-foreground tracking-tight"
                style={{
                  opacity: pop,
                  scale: interpolate(pop, [0, 1], [0.7, 1]),
                  translate: `0 ${interpolate(pop, [0, 1], [20, 0])}px`,
                }}
              >
                {step}
              </span>
            </Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// Beat 7 — pull back to the whole three-panel window, alive at once (explorer
// statuses, chat, live preview), and overlay the loop as kinetic text.
export function PullBack({
  subtitle,
  steps,
  durationInFrames,
}: {
  subtitle: string;
  steps: string[];
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const shot = pushShot({ from: SHOTS.preview, to: SHOTS.pullback, frame, start: 0, end: 72 });
  const dim = interpolate(frame, [34, 66], [0, 0.42], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill className="dark bg-background">
      <ProductStage
        shot={shot}
        dim={dim}
        product={{
          activeSlug: HERO_SLUG,
          visibleCount: 7,
          compose: 'built',
          planDone: 4,
          previewState: 'dashboard',
          previewReveal: 1,
        }}
      />
      <LoopOverlay steps={steps} />
      <Sequence from={96} durationInFrames={durationInFrames - 96}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 96} />
      </Sequence>
    </AbsoluteFill>
  );
}
