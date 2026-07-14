import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { AbsoluteFill } from 'remotion';
import { z } from 'zod';
import { filmV12Schema } from '#compositions/LaunchFilmV12';
import { filmV17DefaultProps } from '#compositions/LaunchFilmV17';
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
import { SelfHostable } from '#scenes/v18/self-host';

// Cut 18 — cut 17, but the ownership beat is no longer a stray word floating beside
// the mark. The finale's "Self-hostable." label is dropped; instead, right before the
// window folds into the logo, a caption lands over the pulled-back product —
// "Self-hostable. Bring your own agents." — matching the film's terse caption rhythm.
export const filmV18Schema = filmV12Schema.extend({
  selfHostSubtitle: z.string(),
});

export const filmV18DefaultProps: z.infer<typeof filmV18Schema> = {
  ...filmV17DefaultProps,
  // Empty so the finale drops its floating label; the point is the caption beat below.
  selfHost: '',
  selfHostSubtitle: 'Self-hostable. Bring your own agents.',
};

const HOME_CHANNEL: HomeChannelState = { slug: HERO_SLUG, visibleCount: 2, typingId: 'maya' };

const BEATS = {
  past: 200,
  pivot: 130,
  meet: 210,
  home: 186,
  shape: 196,
  plan: 200,
  handoff: 194,
  ship: 212,
  pullback: 194,
  selfHost: 160,
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
  'selfHost',
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
  BEATS.selfHost +
  BEATS.finale;

export const FILM_V18_DURATION = BEATS_TOTAL - (ORDER.length - 1) * CROSSFADE_FRAMES;

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

export function LaunchFilmV18(props: z.infer<typeof filmV18Schema>) {
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
            panLeftDown
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
        <TransitionSeries.Sequence durationInFrames={BEATS.selfHost}>
          <SelfHostable
            subtitle={props.selfHostSubtitle}
            phase={STARTS.selfHost}
            durationInFrames={BEATS.selfHost}
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
