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
import { CollaborateAfter, ThePivot } from '#scenes/v6/past';

// Cut 6 — rebuilds the open and slows the whole film. The problem act is now a
// desaturated "past": the agent's work sits shipped and locked while the same team
// reacts too late, then a pivot hands into a full-colour "Meet kordeon". Two edits
// fix the residual "flash": (1) captions clear a beat before every cut (see
// CAPTION_TAIL in scenes/v6/beats), so no dissolve carries a caption; (2) the four
// seams between *different* scenes (brand ↔ product) dip through the background
// instead of crossfading — a crossfade of different content reads as a translucent
// double-image. The five matched slab→slab cuts keep the plain crossfade (the slab
// dissolves into itself). Product beats also crossfade their preview-state swaps.
const BEATS = {
  past: 156,
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

export const FILM_V6_DURATION = BEATS_TOTAL - (ORDER.length - 1) * CROSSFADE_FRAMES;

// Extends LaunchFilm's copy with the past-act + pivot lines. The product-beat
// captions are trimmed to one idea each (see the defaults below) so each lands
// cleanly in the hold the slower beats give it.
export const filmV6Schema = filmSchema.extend({
  pastCaption: z.string(),
  pastAuthor: z.string(),
  pastStatus: z.string(),
  pivotLine1: z.string(),
  pivotLine2: z.string(),
  meetLine: z.string(),
});

export const filmV6DefaultProps: z.infer<typeof filmV6Schema> = {
  ...filmDefaultProps,
  homeSubtitle: 'Humans collaborate. Agents execute.',
  chatSubtitle: 'Team and agent, one thread.',
  planSubtitle: 'Shape the plan together first.',
  handoffSubtitle: 'Hand off. The agent opens a PR.',
  shipSubtitle: 'Watch it run — beside the chat.',
  loopSubtitle: 'One surface. Nothing tabs away.',
  pastCaption: 'You collaborate after the agent ships.',
  pastAuthor: 'Built by Korde',
  pastStatus: 'Shipped',
  pivotLine1: 'What if you shaped it together first —',
  pivotLine2: 'with the agent listening the whole time?',
  meetLine: 'Meet kordeon.',
};

// A plain crossfade for the matched slab→slab product cuts (the slab dissolves into
// itself). A fresh element each call so TransitionSeries sees a distinct child.
const crossfade = () => (
  <TransitionSeries.Transition
    presentation={fade({ shouldFadeOutExitingScene: true })}
    timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
  />
);

// A cut through the background for the seams where the two scenes differ, so no
// translucent double-image ever shows.
const dipCut = () => (
  <TransitionSeries.Transition
    presentation={dipToBackground()}
    timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
  />
);

export function LaunchFilmV6(props: z.infer<typeof filmV6Schema>) {
  return (
    <AbsoluteFill className="dark bg-background" style={fontStyle}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BEATS.past}>
          <CollaborateAfter
            caption={props.pastCaption}
            authorLabel={props.pastAuthor}
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
