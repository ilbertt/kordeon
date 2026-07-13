import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { AbsoluteFill } from 'remotion';
import { z } from 'zod';
import { filmDefaultProps, filmSchema } from '#compositions/LaunchFilm';
import { dipToBackground } from '#lib/film-transitions';
import { fontStyle } from '#lib/fonts';
import { Finale } from '#scenes/film/finale';
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
import { MeetMorph } from '#scenes/v8/meet-morph';

// Cut 8 — cut 7 with two changes: (1) captions hold much longer (every beat is
// longer, so each caption gets ~2.5–3s fully on screen); (2) "Meet kordeon" now
// *morphs* into the product: the line lands, the logo forms, its three bars unfold
// into the explorer · chat · preview columns, and the real window materialises where
// they landed — then the feature beats begin. So Meet → home is a matched crossfade
// (window into itself), not a dip. The past/pivot open and the finale are unchanged.
const BEATS = {
  past: 200,
  pivot: 184,
  meet: 210,
  home: 186,
  shape: 196,
  plan: 200,
  handoff: 194,
  ship: 212,
  pullback: 194,
  finale: 186,
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

export const FILM_V8_DURATION = BEATS_TOTAL - (ORDER.length - 1) * CROSSFADE_FRAMES;

// Same copy fields as cut 7 (generic-agent PR review + pivot).
export const filmV8Schema = filmSchema.extend({
  pastCaption: z.string(),
  pastTitle: z.string(),
  pastStatus: z.string(),
  pivotLine1: z.string(),
  pivotLine2: z.string(),
  meetLine: z.string(),
});

export const filmV8DefaultProps: z.infer<typeof filmV8Schema> = {
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

export function LaunchFilmV8(props: z.infer<typeof filmV8Schema>) {
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
          <MeetMorph meetLine={props.meetLine} phase={STARTS.meet} />
        </TransitionSeries.Sequence>
        {crossfade()}
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
