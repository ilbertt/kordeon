import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { AbsoluteFill } from 'remotion';
import { z } from 'zod';
import { fontStyle } from '#lib/fonts';
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

// Every on-screen line is a schema field, so the copy is editable in Studio
// Visual Mode and writes back to `launchDefaultProps` below.
export const launchSchema = z.object({
  hookTagline: z.string(),
  captionShape: z.string(),
  captionTeammate: z.string(),
  captionRefine: z.string(),
  captionHandoff: z.string(),
  captionShip: z.string(),
  payoffTagline: z.string(),
});

export const launchDefaultProps: z.infer<typeof launchSchema> = {
  hookTagline: 'One surface: explorer · chat · live preview',
  captionShape: 'Your team and your agent talk through the work — in one thread',
  captionTeammate: '@mention the agent like any teammate — it replies, it has a face',
  captionRefine: 'Shape the plan together before anything runs',
  captionHandoff: 'Hand it off — the agent builds it and opens a PR',
  captionShip: 'The running product renders live, right beside the chat',
  payoffTagline: 'Where humans collaborate and agents execute.',
};

// The 45s master: hook → the continuous product loop → payoff, dissolving between.
export function LaunchVideo({
  hookTagline,
  captionShape,
  captionTeammate,
  captionRefine,
  captionHandoff,
  captionShip,
  payoffTagline,
}: z.infer<typeof launchSchema>) {
  return (
    <AbsoluteFill style={fontStyle}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={HOOK_FRAMES}>
          <Hook tagline={hookTagline} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={MAIN_FRAMES}>
          <Main
            captions={{
              shape: captionShape,
              teammate: captionTeammate,
              refine: captionRefine,
              handoff: captionHandoff,
              ship: captionShip,
            }}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={PAYOFF_FRAMES}>
          <Payoff tagline={payoffTagline} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
