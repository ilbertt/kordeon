import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Hook } from '#scenes/hook';
import { Main } from '#scenes/main';
import { Payoff } from '#scenes/payoff';

const HOOK_FRAMES = 120;
const MAIN_FRAMES = 1080;
const PAYOFF_FRAMES = 210;
const CROSSFADE_FRAMES = 24;

// Total = sum(scenes) - sum(transitions), since each transition overlaps its
// neighbours. Kept in sync with the composition's durationInFrames in Root.
export const LAUNCH_DURATION = HOOK_FRAMES + MAIN_FRAMES + PAYOFF_FRAMES - 2 * CROSSFADE_FRAMES;

// The 45s master: hook → the continuous product loop → payoff, dissolving between.
export function LaunchVideo() {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={HOOK_FRAMES}>
        <Hook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={MAIN_FRAMES}>
        <Main />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={PAYOFF_FRAMES}>
        <Payoff />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}
