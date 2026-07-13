import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { AbsoluteFill } from 'remotion';
import { z } from 'zod';
import { filmDefaultProps, filmSchema } from '#compositions/LaunchFilm';
import { dipToBackground } from '#lib/film-transitions';
import { fontStyle } from '#lib/fonts';
import { Finale } from '#scenes/film/finale';
import { MeetKordeon } from '#scenes/v4/meet-kordeon';
import {
  DraftPlan,
  HandOff,
  PullBack,
  ShapeIdea,
  WatchShip,
  WorkspaceHome,
} from '#scenes/v6/beats';
import { ThePivot } from '#scenes/v6/past';
import { CollaborateAfter } from '#scenes/v7/past';

// Cut 7 — same as cut 6, but the problem open is reworked: it now shows a *generic*
// agent (never Korde — Korde is the product) opening an abstract pull request that
// the same team can only weigh in on afterwards, in review, asking for the context
// that should have shaped the work ("changes requested"), not a nonsensical
// "shipped" badge. Everything downstream (pivot, Meet, product beats, dip cuts,
// pacing) is reused unchanged from cut 6.
const BEATS = {
  past: 174,
  pivot: 140,
  meet: 174,
  home: 160,
  shape: 168,
  plan: 174,
  handoff: 168,
  ship: 186,
  pullback: 168,
  finale: 180,
} as const;

const CROSSFADE_FRAMES = 24;

type BeatKey = keyof typeof BEATS;
const ORDER: BeatKey[] = [
  'past',
  'pivot',
  'meet',
  'home',
  'shape',
  'plan',
  'handoff',
  'ship',
  'pullback',
  'finale',
];

// Global start frame of each beat (transitions overlap by CROSSFADE_FRAMES), used
// as the float phase so the slab drift is continuous across the cut.
const STARTS: Record<BeatKey, number> = (() => {
  const starts = {} as Record<BeatKey, number>;
  let acc = 0;
  for (const key of ORDER) {
    starts[key] = acc;
    acc += BEATS[key] - CROSSFADE_FRAMES;
  }
  return starts;
})();

const BEATS_TOTAL =
  BEATS.past +
  BEATS.pivot +
  BEATS.meet +
  BEATS.home +
  BEATS.shape +
  BEATS.plan +
  BEATS.handoff +
  BEATS.ship +
  BEATS.pullback +
  BEATS.finale;

export const FILM_V7_DURATION = BEATS_TOTAL - (ORDER.length - 1) * CROSSFADE_FRAMES;

// Extends LaunchFilm's copy with the past-review + pivot lines.
export const filmV7Schema = filmSchema.extend({
  pastCaption: z.string(),
  pastTitle: z.string(),
  pastStatus: z.string(),
  pivotLine1: z.string(),
  pivotLine2: z.string(),
  meetLine: z.string(),
});

export const filmV7DefaultProps: z.infer<typeof filmV7Schema> = {
  ...filmDefaultProps,
  homeSubtitle: 'Humans collaborate. Agents execute.',
  chatSubtitle: 'Team and agent, one thread.',
  planSubtitle: 'Shape the plan together first.',
  handoffSubtitle: 'Hand off. The agent opens a PR.',
  shipSubtitle: 'Watch it run — beside the chat.',
  loopSubtitle: 'One surface. Nothing tabs away.',
  pastCaption: 'Today, collaboration comes after the code.',
  pastTitle: 'Add activation dashboard',
  pastStatus: 'Changes requested',
  pivotLine1: 'What if you shaped it together first —',
  pivotLine2: 'with the agent listening the whole time?',
  meetLine: 'Meet kordeon.',
};

// A plain crossfade for the matched slab→slab product cuts (the slab dissolves into
// itself); a cut through the background for the seams where the scenes differ.
const crossfade = () => (
  <TransitionSeries.Transition
    presentation={fade({ shouldFadeOutExitingScene: true })}
    timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
  />
);

const dipCut = () => (
  <TransitionSeries.Transition
    presentation={dipToBackground()}
    timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
  />
);

export function LaunchFilmV7(props: z.infer<typeof filmV7Schema>) {
  return (
    <AbsoluteFill className="dark bg-background" style={fontStyle}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BEATS.past}>
          <CollaborateAfter
            caption={props.pastCaption}
            title={props.pastTitle}
            statusLabel={props.pastStatus}
            durationInFrames={BEATS.past}
          />
        </TransitionSeries.Sequence>
        {dipCut()}
        <TransitionSeries.Sequence durationInFrames={BEATS.pivot}>
          <ThePivot
            line1={props.pivotLine1}
            line2={props.pivotLine2}
            durationInFrames={BEATS.pivot}
          />
        </TransitionSeries.Sequence>
        {dipCut()}
        <TransitionSeries.Sequence durationInFrames={BEATS.meet}>
          <MeetKordeon
            meetLine={props.meetLine}
            subtitle={props.coldOpenSubtitle}
            wordmark={props.wordmark}
          />
        </TransitionSeries.Sequence>
        {dipCut()}
        <TransitionSeries.Sequence durationInFrames={BEATS.home}>
          <WorkspaceHome
            subtitle={props.homeSubtitle}
            phase={STARTS.home}
            durationInFrames={BEATS.home}
          />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.shape}>
          <ShapeIdea
            subtitle={props.chatSubtitle}
            phase={STARTS.shape}
            durationInFrames={BEATS.shape}
          />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.plan}>
          <DraftPlan
            subtitle={props.planSubtitle}
            phase={STARTS.plan}
            durationInFrames={BEATS.plan}
          />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.handoff}>
          <HandOff
            subtitle={props.handoffSubtitle}
            phase={STARTS.handoff}
            durationInFrames={BEATS.handoff}
          />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.ship}>
          <WatchShip
            subtitle={props.shipSubtitle}
            phase={STARTS.ship}
            durationInFrames={BEATS.ship}
          />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.pullback}>
          <PullBack
            subtitle={props.loopSubtitle}
            phase={STARTS.pullback}
            durationInFrames={BEATS.pullback}
          />
        </TransitionSeries.Sequence>
        {dipCut()}
        <TransitionSeries.Sequence durationInFrames={BEATS.finale}>
          <Finale
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
