import { springTiming, TransitionSeries } from '@remotion/transitions';
import { AbsoluteFill } from 'remotion';
import type { z } from 'zod';
import type { filmSchema } from '#compositions/LaunchFilm';
import { fadeScale } from '#lib/film-transitions';
import { fontStyle } from '#lib/fonts';
import { ColdOpen } from '#scenes/film/cold-open';
import { Finale } from '#scenes/film/finale';
import {
  DraftPlan,
  HandOff,
  PullBack,
  ShapeIdea,
  WatchShip,
  WorkspaceHome,
} from '#scenes/slab/beats';

// Cut 3 — same beats and copy as LaunchFilm, but every product beat presents the
// window as a floating 3D slab (see SlabStage) instead of a full-frame plane the
// camera crops into. Brand beats (cold open, metamorphosis finale) are shared.
const BEATS = {
  coldOpen: 108,
  home: 150,
  shape: 192,
  plan: 180,
  handoff: 150,
  ship: 180,
  pullback: 168,
  finale: 180,
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
  BEATS.finale;

export const FILM_V3_DURATION = BEATS_TOTAL - (Object.keys(BEATS).length - 1) * CROSSFADE_FRAMES;

// Reuses LaunchFilm's `filmSchema` / `filmDefaultProps` (the copy is identical) —
// Root wires them onto this composition directly.

const crossfade = () => (
  <TransitionSeries.Transition
    presentation={fadeScale()}
    timing={springTiming({ config: { damping: 200 }, durationInFrames: CROSSFADE_FRAMES })}
  />
);

export function LaunchFilmV3(props: z.infer<typeof filmSchema>) {
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
          <PullBack subtitle={props.loopSubtitle} durationInFrames={BEATS.pullback} />
        </TransitionSeries.Sequence>
        {crossfade()}
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
