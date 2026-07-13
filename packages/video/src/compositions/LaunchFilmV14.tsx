import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { AbsoluteFill } from 'remotion';
import type { z } from 'zod';
import { filmV12DefaultProps, filmV12Schema } from '#compositions/LaunchFilmV12';
import { HERO_SLUG } from '#data/channels';
import { dipToBackground } from '#lib/film-transitions';
import { fontStyle } from '#lib/fonts';
import {
  DraftPlan,
  HandOff,
  type HomeChannelState,
  PullBack,
  ShapeIdea,
  WatchShip,
  WorkspaceHome,
} from '#scenes/v6/beats';
import { ThePivot } from '#scenes/v6/past';
import { CollaborateAfter } from '#scenes/v7/past';
import { MeetMorph } from '#scenes/v8/meet-morph';
import { MorphFinale } from '#scenes/v12/finale';

// Cut 14 — cut 13's copy, but the hand-off is now an explicit action: the You
// cursor drives to the composer's Build button and presses it (the teammate
// cursors resting alongside), the preview flips to "building" as the result, and
// the collaboration cursors fade out before the camera hands into the ship pan.
export const filmV14Schema = filmV12Schema;

export const filmV14DefaultProps: z.infer<typeof filmV14Schema> = {
  ...filmV12DefaultProps,
  chatSubtitle: 'Agents are present from the first message.',
  pastTitle: 'The next feature',
};

const HOME_CHANNEL: HomeChannelState = { slug: HERO_SLUG, visibleCount: 2, typingId: 'maya' };

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
  finale: 270,
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

export const FILM_V14_DURATION = BEATS_TOTAL - (ORDER.length - 1) * CROSSFADE_FRAMES;

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

export function LaunchFilmV14(props: z.infer<typeof filmV14Schema>) {
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
          <MeetMorph meetLine={props.meetLine} phase={STARTS.meet} channelState={HOME_CHANNEL} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.home}>
          <WorkspaceHome
            subtitle={props.homeSubtitle}
            phase={STARTS.home}
            durationInFrames={BEATS.home}
            channelState={HOME_CHANNEL}
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
            clickToBuild
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
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.finale}>
          <MorphFinale
            wordmark={props.wordmark}
            tagline={props.ctaTagline}
            selfHost={props.selfHost}
            waitlist={props.waitlist}
            phase={STARTS.finale}
            durationInFrames={BEATS.finale}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
