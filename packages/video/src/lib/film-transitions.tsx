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
