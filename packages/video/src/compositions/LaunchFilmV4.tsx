import { springTiming, TransitionSeries } from '@remotion/transitions';
import { AbsoluteFill } from 'remotion';
import { z } from 'zod';
import { filmDefaultProps, filmSchema } from '#compositions/LaunchFilm';
import { fadeScale } from '#lib/film-transitions';
import { fontStyle } from '#lib/fonts';
import { Finale } from '#scenes/film/finale';
import {
  DraftPlan,
  HandOff,
  PullBack,
  ShapeIdea,
  WatchShip,
  WorkspaceHome,
} from '#scenes/v4/beats';
import { MeetKordeon } from '#scenes/v4/meet-kordeon';
import { BrokenFlow, TheQuestion } from '#scenes/v4/problem';

// Cut 4 — opens on the problem (collaborating *after* the agent works, on a fake
// PR) before "Meet kordeon" and the product. The product beats push in tighter
// than cut 3 (see the SLAB poses in scenes/v4/beats), and the open is slowed so
// the three-columns → logo read.
const BEATS = {
  broken: 156,
  question: 104,
  meet: 174,
  home: 140,
  shape: 168,
  plan: 174,
  handoff: 144,
  ship: 174,
  pullback: 156,
  finale: 174,
} as const;

const CROSSFADE_FRAMES = 18;
const BEATS_TOTAL =
  BEATS.broken +
  BEATS.question +
  BEATS.meet +
  BEATS.home +
  BEATS.shape +
  BEATS.plan +
  BEATS.handoff +
  BEATS.ship +
  BEATS.pullback +
  BEATS.finale;

export const FILM_V4_DURATION = BEATS_TOTAL - (Object.keys(BEATS).length - 1) * CROSSFADE_FRAMES;

// Extends LaunchFilm's copy with the problem-act lines.
export const filmV4Schema = filmSchema.extend({
  brokenCaption: z.string(),
  question: z.string(),
  meetLine: z.string(),
});

export const filmV4DefaultProps: z.infer<typeof filmV4Schema> = {
  ...filmDefaultProps,
  brokenCaption: 'Today, collaboration happens after the agent works.',
  question: 'What if you could shape it together — before handing off?',
  meetLine: 'Meet kordeon.',
};

const crossfade = () => (
  <TransitionSeries.Transition
    presentation={fadeScale()}
    timing={springTiming({ config: { damping: 200 }, durationInFrames: CROSSFADE_FRAMES })}
  />
);

export function LaunchFilmV4(props: z.infer<typeof filmV4Schema>) {
  return (
    <AbsoluteFill style={fontStyle}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BEATS.broken}>
          <BrokenFlow caption={props.brokenCaption} durationInFrames={BEATS.broken} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.question}>
          <TheQuestion line={props.question} durationInFrames={BEATS.question} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.meet}>
          <MeetKordeon
            meetLine={props.meetLine}
            subtitle={props.coldOpenSubtitle}
            wordmark={props.wordmark}
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
