import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion';
import { z } from 'zod';
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
} from '#scenes/beats';
import { MorphFinale } from '#scenes/finale';
import { MeetMorph } from '#scenes/meet-morph';
import { ThePivot } from '#scenes/pivot';
import { CollaborateAfter } from '#scenes/problem';

// The launch film. Ten beats, each a pure function of its local frame, mounting the
// real @repo/ui product window and driving it frame-by-frame:
//
//   problem → pivot → meet → home → shape → plan → hand-off → ship → pull-back → finale
//
// The desaturated "collaborate after the code" problem cuts to the pivot, the mark
// forms and unfolds into the product window, the team shapes a brief with the agent
// and hands it off with a Build click, the work renders live beside the chat, then
// the window folds back into the mark for the closing lockup. Every on-screen line is
// a schema field so all copy stays Studio-editable.
export const launchFilmSchema = z.object({
  problemCaption: z.string(),
  problemTitle: z.string(),
  problemStatus: z.string(),
  pivotLine: z.string(),
  meetLine: z.string(),
  homeSubtitle: z.string(),
  chatSubtitle: z.string(),
  planSubtitle: z.string(),
  handoffSubtitle: z.string(),
  shipSubtitle: z.string(),
  pullbackSubtitle: z.string(),
  wordmark: z.string(),
  tagline: z.string(),
  closingCaption: z.string(),
  waitlist: z.string(),
});

export const launchFilmDefaultProps: z.infer<typeof launchFilmSchema> = {
  problemCaption: 'Today, collaboration comes after the code.',
  problemTitle: 'The next feature',
  problemStatus: 'Changes requested',
  pivotLine: 'What if you could plan together first?',
  meetLine: 'Meet kordeon.',
  homeSubtitle: 'Every channel is a thread for one piece of work.',
  chatSubtitle: 'Agents are present from the first message.',
  planSubtitle: 'Shape the plan together first.',
  handoffSubtitle: 'Hand off. The agent executes.',
  shipSubtitle: 'See the work take shape — beside the chat.',
  pullbackSubtitle: 'One surface. Nothing tabs away.',
  wordmark: 'kordeon',
  tagline: 'Where humans collaborate and agents execute.',
  closingCaption: 'Self-hostable. Bring your own agents.',
  waitlist: 'Join the waitlist at kordeon.com',
};

// The demo opens straight on the hero feature channel (Maya mid-typing), held
// identical across meet → home so their crossfade blends one window into the next.
const HOME_CHANNEL: HomeChannelState = { slug: HERO_SLUG, visibleCount: 2, typingId: 'maya' };

const BEATS = {
  problem: 200,
  pivot: 130,
  meet: 210,
  home: 186,
  shape: 196,
  plan: 200,
  handoff: 194,
  ship: 212,
  pullback: 194,
  finale: 310,
} as const;

const CROSSFADE_FRAMES = 24;

type BeatKey = keyof typeof BEATS;
const ORDER: BeatKey[] = [
  'problem',
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

// Each beat overlaps its neighbour by one crossfade, so a beat's global start is the
// running sum of prior (duration − crossfade). Passed to the product beats as `phase`
// so the slab's continuous float doesn't snap at a cut (local frame resets to 0).
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
  BEATS.problem +
  BEATS.pivot +
  BEATS.meet +
  BEATS.home +
  BEATS.shape +
  BEATS.plan +
  BEATS.handoff +
  BEATS.ship +
  BEATS.pullback +
  BEATS.finale;

export const FILM_DURATION = BEATS_TOTAL - (ORDER.length - 1) * CROSSFADE_FRAMES;

// Music bed — an energetic Uppbeat instrumental (no vocals, so it never competes with
// the captions). The 164s track is longer than the cut; we play its opening, fade in
// off the desaturated problem, and fade out under the finale lockup. NB: Uppbeat's
// free licence needs the attribution in the *published post's* description, not here.
//
// The track's drop lands at 9.2s (frame 276); we delay the audio by MUSIC_DELAY so it
// hits at frame 293 — the black beat where "What if you could plan together first?" has
// dipped out, right before "Meet kordeon" fades in.
const MUSIC_SRC = 'music/better-together-bastian.mp3';
const MUSIC_PEAK = 0.9;
const MUSIC_FADE_IN = 20;
const MUSIC_FADE_OUT = 36;
const MUSIC_DELAY = 17;
const MUSIC_DURATION = FILM_DURATION - MUSIC_DELAY;

// Matched slab-to-slab cuts crossfade opacity; brand↔product mismatches (problem →
// pivot → meet) dip through the opaque background so they don't ghost as a double
// image. A fresh element each call so TransitionSeries sees a distinct child.
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

export function LaunchFilm(props: z.infer<typeof launchFilmSchema>) {
  return (
    <AbsoluteFill className="dark bg-background" style={fontStyle}>
      <Sequence from={MUSIC_DELAY} name="Music">
        <Audio
          src={staticFile(MUSIC_SRC)}
          volume={(f) =>
            interpolate(
              f,
              [0, MUSIC_FADE_IN, MUSIC_DURATION - MUSIC_FADE_OUT, MUSIC_DURATION],
              [0, MUSIC_PEAK, MUSIC_PEAK, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            )
          }
        />
      </Sequence>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BEATS.problem}>
          <CollaborateAfter
            caption={props.problemCaption}
            title={props.problemTitle}
            statusLabel={props.problemStatus}
            durationInFrames={BEATS.problem}
          />
        </TransitionSeries.Sequence>
        {dipCut()}
        <TransitionSeries.Sequence durationInFrames={BEATS.pivot}>
          <ThePivot line1={props.pivotLine} durationInFrames={BEATS.pivot} />
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
            subtitle={props.pullbackSubtitle}
            phase={STARTS.pullback}
            durationInFrames={BEATS.pullback}
          />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence durationInFrames={BEATS.finale}>
          <MorphFinale
            wordmark={props.wordmark}
            tagline={props.tagline}
            foldCaption={props.closingCaption}
            waitlist={props.waitlist}
            phase={STARTS.finale}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
