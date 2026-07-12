// biome-ignore-all lint/style/noMagicNumbers: entrance motion + tilt tuning
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { channelBySlug } from '#data/channels';
import { EASE, SHOTS } from '#lib/motion';
import { threadStateAt } from '#lib/thread-timeline';
import { ProductStage } from '#scenes/film/product-stage';

const WELCOME_SLUG = 'welcome';

// Beat 2 — the workspace materialises: the window rises out of a forward tilt with
// a gentle yaw for depth, and Korde's welcome reveals in the thread.
export function WorkspaceHome({
  subtitle,
  durationInFrames,
}: {
  subtitle: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const welcome = channelBySlug(WELCOME_SLUG);
  const { visibleCount, typingId } = threadStateAt({
    messages: welcome?.messages ?? [],
    fps,
    frame,
    currentUserId: 'you',
  });

  const settle = interpolate(frame, [0, 46], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  const tilt = {
    rotateX: 6 * settle,
    rotateY: Math.sin(frame / 44) * 2,
    lift: 46 * settle,
    scale: interpolate(frame, [0, 46], [0.955, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE,
    }),
    opacity: interpolate(frame, [0, 16], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  };

  return (
    <AbsoluteFill className="dark bg-background">
      <ProductStage
        shot={SHOTS.wide}
        product={{ activeSlug: WELCOME_SLUG, visibleCount, typingId, previewState: 'placeholder' }}
        tilt={tilt}
      />
      <Sequence from={22} durationInFrames={durationInFrames - 22}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 22} />
      </Sequence>
    </AbsoluteFill>
  );
}
