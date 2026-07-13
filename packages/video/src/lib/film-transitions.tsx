// biome-ignore-all lint/style/noMagicNumbers: transition scale defaults
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import { AbsoluteFill, interpolate } from 'remotion';

// A fade-and-scale transition: the incoming scene resolves from `enterScale` → 1
// while the outgoing scene recedes 1 → `exitScale`, both crossfading. Paired with
// `springTiming` it gives every cut a soft push instead of a hard swap — the
// built-in `fade` presentation only crossfades opacity.
type FadeScaleProps = {
  enterScale: number;
  exitScale: number;
};

function FadeScalePresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<FadeScaleProps>) {
  const isEntering = presentationDirection === 'entering';
  const opacity = isEntering ? presentationProgress : 1 - presentationProgress;
  const scale = isEntering
    ? interpolate(presentationProgress, [0, 1], [passedProps.enterScale, 1])
    : interpolate(presentationProgress, [0, 1], [1, passedProps.exitScale]);
  return <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
}

export function fadeScale(props?: Partial<FadeScaleProps>): TransitionPresentation<FadeScaleProps> {
  return {
    component: FadeScalePresentation,
    props: { enterScale: props?.enterScale ?? 0.95, exitScale: props?.exitScale ?? 0.95 },
  };
}

// A cut *through* the background: the outgoing scene fades fully out over the first
// ~45% of the transition and the incoming one fades up over the last ~45%, so at
// the midpoint only the opaque root shows. Unlike a crossfade, the two scenes never
// share opacity — which is what makes a dissolve between *different* content (brand
// lockup vs. product slab) read as a translucent double-image. Use it only where
// the two scenes differ; matched slab-to-slab cuts still use `fade`.
function DipToBackgroundPresentation({
  children,
  presentationDirection,
  presentationProgress,
}: TransitionPresentationComponentProps<Record<string, never>>) {
  const opacity =
    presentationDirection === 'entering'
      ? interpolate(presentationProgress, [0.55, 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : interpolate(presentationProgress, [0, 0.45], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

export function dipToBackground(): TransitionPresentation<Record<string, never>> {
  return { component: DipToBackgroundPresentation, props: {} };
}
