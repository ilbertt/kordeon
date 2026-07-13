// biome-ignore-all lint/style/noMagicNumbers: problem-scene motion + layout tuning
import { Bot, GitPullRequest, X } from 'lucide-react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { PEOPLE } from '#data/people';

// The old way: the agent builds first, alone, and opens a pull request — so the
// only place to collaborate is a review, after the fact, on the wrong thing.
const DIFF = [
  'Activation rate — computed daily',
  'Signups grouped by day',
  'All acquisition channels combined',
];

// The team only gets to weigh in once it's built — and it's wrong.
const REVIEWS = [
  { person: PEOPLE.maya, text: 'This is daily — we agreed on weekly cohorts.' },
  { person: PEOPLE.theo, text: 'And it isn’t split by channel.' },
  { person: PEOPLE.you, text: 'This isn’t what we meant. Let’s redo it.' },
];

function DiffLine({ text, index }: { text: string; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - 8 - index * 4,
    fps,
    config: { damping: 18 },
    durationInFrames: 14,
  });
  return (
    <div
      className="flex items-center gap-3 rounded bg-emerald-500/10 px-2 py-1 text-emerald-300 text-base"
      style={{ opacity: s, translate: `0 ${interpolate(s, [0, 1], [8, 0])}px` }}
    >
      <span className="font-semibold">+</span>
      <span>{text}</span>
    </div>
  );
}

function ReviewRow({
  person,
  text,
  index,
}: {
  person: (typeof REVIEWS)[number]['person'];
  text: string;
  index: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - 40 - index * 22,
    fps,
    config: { damping: 18, mass: 0.7 },
    durationInFrames: 18,
  });
  return (
    <div
      className="flex items-start gap-3"
      style={{ opacity: s, translate: `0 ${interpolate(s, [0, 1], [10, 0])}px` }}
    >
      <Img src={person.avatarUrl} className="size-7 rounded-full" />
      <p className="text-lg leading-snug">
        <span className="font-medium">{person.name}</span>{' '}
        <span className="text-muted-foreground">{text}</span>
      </p>
    </div>
  );
}

// Beat P1 — the broken "collaborate after" flow, on a fake, simplified PR page.
export function BrokenFlow({
  caption,
  durationInFrames,
}: {
  caption: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 20, mass: 0.8 }, durationInFrames: 22 });
  const stamp = spring({
    frame: frame - 98,
    fps,
    config: { damping: 11, mass: 0.7, stiffness: 150 },
    durationInFrames: 22,
  });
  return (
    <AbsoluteFill className="dark items-center justify-center bg-background text-foreground">
      <div
        className="relative mb-28 w-[1040px]"
        style={{ opacity: enter, translate: `0 ${interpolate(enter, [0, 1], [30, 0])}px` }}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-3 border-border border-b px-6 py-4">
            <GitPullRequest className="size-6 text-muted-foreground" />
            <span className="font-semibold text-2xl">Add activation dashboard</span>
            <span className="text-muted-foreground text-xl">#128</span>
            <span className="ml-auto rounded-full border border-border px-3 py-1 text-muted-foreground text-sm">
              Open
            </span>
          </div>
          <div className="flex items-center gap-2.5 border-border border-b px-6 py-3 text-muted-foreground text-sm">
            <span className="flex size-6 items-center justify-center rounded-full bg-muted">
              <Bot className="size-3.5" />
            </span>
            <span>
              <span className="font-medium text-foreground">agent</span> built it alone and opened
              this pull request
            </span>
          </div>
          <div className="space-y-1.5 px-6 py-4">
            <div className="mb-1 text-muted-foreground text-xs">dashboard.tsx</div>
            {[...DIFF.entries()].map(([index, text]) => (
              <DiffLine key={text} text={text} index={index} />
            ))}
          </div>
          <div className="space-y-3.5 border-border border-t px-6 py-5">
            {[...REVIEWS.entries()].map(([index, review]) => (
              <ReviewRow
                key={review.person.id}
                person={review.person}
                text={review.text}
                index={index}
              />
            ))}
          </div>
        </div>
        <div
          className="absolute -top-5 -right-4"
          style={{ opacity: stamp, scale: interpolate(stamp, [0, 1], [1.5, 1]) }}
        >
          <span className="flex rotate-[-7deg] items-center gap-1.5 rounded-lg bg-rose-500 px-3.5 py-1.5 font-semibold text-base text-white shadow-lg">
            <X className="size-4" strokeWidth={3} />
            Changes requested
          </span>
        </div>
      </div>
      <Sequence from={14} durationInFrames={durationInFrames - 14}>
        <KineticCaption text={caption} durationInFrames={durationInFrames - 14} />
      </Sequence>
    </AbsoluteFill>
  );
}

// Beat P2 — the pivot, owning the frame.
export function TheQuestion({
  line,
  durationInFrames,
}: {
  line: string;
  durationInFrames: number;
}) {
  return (
    <AbsoluteFill className="dark bg-background text-foreground">
      <KineticCaption text={line} durationInFrames={durationInFrames} variant="hero" />
    </AbsoluteFill>
  );
}
