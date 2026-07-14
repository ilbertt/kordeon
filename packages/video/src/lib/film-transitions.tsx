// biome-ignore-all lint/style/noMagicNumbers: transition scale defaults
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import { AbsoluteFill, interpolate } from 'remotion';

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
