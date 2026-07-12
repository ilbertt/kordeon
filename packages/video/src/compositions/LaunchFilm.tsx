import { springTiming, TransitionSeries } from '@remotion/transitions';
import { AbsoluteFill } from 'remotion';
import { z } from 'zod';
import { fadeScale } from '#lib/film-transitions';
import { fontStyle } from '#lib/fonts';
import { ColdOpen } from '#scenes/film/cold-open';
import { Cta } from '#scenes/film/cta';
import { DraftPlan } from '#scenes/film/draft-plan';
import { HandOff } from '#scenes/film/hand-off';
import { PullBack } from '#scenes/film/pull-back';
import { ShapeIdea } from '#scenes/film/shape-idea';
import { WatchShip } from '#scenes/film/watch-ship';
import { WorkspaceHome } from '#scenes/film/workspace-home';

// The 8 beats, in frames. Each scene is a pure function of its local frame, so the
// product window stays mounted through beats 2–7 while the thread, preview and
// camera evolve; only brand beats (1, 8) are bespoke.
const BEATS = {
  coldOpen: 108,
  home: 150,
  shape: 192,
  plan: 180,
  handoff: 150,
  ship: 180,
  pullback: 168,
  cta: 150,
} as const;

const CROSSFADE_FRAMES = 18;
const BEATS_TOTAL =
  BEATS.coldOpen +
  BEATS.home +
  BEATS.shape +
  BEATS.plan +
  BEATS.handoff +
  BEATS.ship +
  BEATS.pullback +
  BEATS.cta;

// Total = sum(beats) − sum(transitions); each fade-scale overlaps its neighbours.
// Kept in sync with the composition's durationInFrames in Root.
export const FILM_DURATION = BEATS_TOTAL - (Object.keys(BEATS).length - 1) * CROSSFADE_FRAMES;

// Every on-screen line is a schema field, so all copy is editable in Studio Visual
// Mode and writes back to `filmDefaultProps`. Nothing is duplicated from the seed
// data — the thread copy still comes from `#data/channels`.
export const filmSchema = z.object({
  coldOpenSubtitle: z.string(),
  homeSubtitle: z.string(),
  chatSubtitle: z.string(),
  planSubtitle: z.string(),
  handoffSubtitle: z.string(),
  shipSubtitle: z.string(),
  loopSubtitle: z.string(),
  loopSteps: z.array(z.string()),
  wordmark: z.string(),
  ctaTagline: z.string(),
  ctaButton: z.string(),
  ctaMeta: z.string(),
});

export const filmDefaultProps: z.infer<typeof filmSchema> = {
  coldOpenSubtitle: 'The whole shape of work — in one surface.',
  homeSubtitle: 'Where humans collaborate and agents execute.',
  chatSubtitle: 'Your team and your agent — in one thread.',
  planSubtitle: 'Shape the plan together — before anything runs.',
  handoffSubtitle: 'Hand it off — the agent builds it and opens a PR.',
  shipSubtitle: 'The running product renders live — right beside the chat.',
  loopSubtitle: 'One surface. Nothing tabs away.',
  loopSteps: ['chat', 'refine the plan', 'hand off', 'preview'],
  wordmark: 'kordeon',
  ctaTagline: 'Where humans collaborate and agents execute.',
  ctaButton: 'Get started — free',
  ctaMeta: 'Open source · Join the waitlist',
};

// A fresh element each call so TransitionSeries sees a distinct transition child.
const crossfade = () => (
  <TransitionSeries.Transition
    presentation={fadeScale()}
    timing={springTiming({ config: { damping: 200 }, durationInFrames: CROSSFADE_FRAMES })}
  />
);

// The sharper cut: an 8-beat montage of the real product, each transition a spring
// fade-and-scale, each beat carrying one kinetic caption.
export function LaunchFilm(props: z.infer<typeof filmSchema>) {
  return (
    <AbsoluteFill style={fontStyle}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BEATS.coldOpen}>
          <ColdOpen
            subtitle={props.coldOpenSubtitle}
            wordmark={props.wordmark}
            durationInFrames={BEATS.coldOpen}
          />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.home}>
          <WorkspaceHome subtitle={props.homeSubtitle} durationInFrames={BEATS.home} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.shape}>
          <ShapeIdea subtitle={props.chatSubtitle} durationInFrames={BEATS.shape} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.plan}>
          <DraftPlan subtitle={props.planSubtitle} durationInFrames={BEATS.plan} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.handoff}>
          <HandOff subtitle={props.handoffSubtitle} durationInFrames={BEATS.handoff} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.ship}>
          <WatchShip subtitle={props.shipSubtitle} durationInFrames={BEATS.ship} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.pullback}>
          <PullBack
            subtitle={props.loopSubtitle}
            steps={props.loopSteps}
            durationInFrames={BEATS.pullback}
          />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.cta}>
          <Cta
            wordmark={props.wordmark}
            tagline={props.ctaTagline}
            button={props.ctaButton}
            meta={props.ctaMeta}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
