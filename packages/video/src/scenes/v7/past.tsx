// biome-ignore-all lint/style/noMagicNumbers: past-act motion + layout tuning
import { Bot, X } from 'lucide-react';
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

// A faded-photo past: fully desaturated with lifted blacks, so the "collaborate
// after" world reads as *before*. Full colour only returns at Meet kordeon.
const PAST_FILTER = 'grayscale(1) contrast(0.94) brightness(1.05)';

// The change a *generic* agent already wrote — abstracted to a few monochrome
// added lines, enough to read "the code exists" without any literal chrome. It is
// deliberately not Korde: Korde is the product, not the problem.
const CODE_LINES = [
  { id: 'a', w: '66%' },
  { id: 'b', w: '48%' },
  { id: 'c', w: '58%' },
];

// The humans only get to weigh in once the agent has opened the PR — in review,
// asking for the context that should have shaped the work in the first place.
const REVIEWS = [
  { person: PEOPLE.maya, text: 'Can you add more context on this?', delay: 30 },
  { person: PEOPLE.theo, text: 'Why weekly, not daily — did we decide that?', delay: 52 },
  { person: PEOPLE.you, text: 'This isn’t quite what we discussed.', delay: 74 },
];

function CodeLine({ line, index }: { line: (typeof CODE_LINES)[number]; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - 12 - index * 4,
    fps,
    config: { damping: 18 },
    durationInFrames: 14,
  });
  return (
    <div className="flex items-center gap-3" style={{ opacity: s }}>
      <span className="w-3 text-center text-emerald-400/70 text-sm">+</span>
      <div className="h-2.5 rounded-full bg-muted-foreground/25" style={{ width: line.w }} />
    </div>
  );
}

function ReviewRow({ review }: { review: (typeof REVIEWS)[number] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - review.delay,
    fps,
    config: { damping: 16, mass: 0.7 },
    durationInFrames: 18,
  });
  return (
    <div
      className="flex items-start gap-3"
      style={{ opacity: s, translate: `0 ${interpolate(s, [0, 1], [12, 0])}px` }}
    >
      <Img src={review.person.avatarUrl} className="mt-0.5 size-8 rounded-full" />
      <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/25 px-4 py-2.5">
        <span className="font-medium text-base">{review.person.name}</span>
        <span className="ml-2 text-muted-foreground text-sm">commented</span>
        <p className="mt-0.5 text-lg text-foreground/90">{review.text}</p>
      </div>
    </div>
  );
}

// Beat past-1 — the old way, desaturated: a generic agent opens a pull request and
// only *then* do the humans get to weigh in, in review, asking for the context that
// should have shaped the work — so it comes back with changes requested.
export function CollaborateAfter({
  caption,
  title,
  statusLabel,
  durationInFrames,
}: {
  caption: string;
  title: string;
  statusLabel: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 20, mass: 0.85 }, durationInFrames: 22 });
  const stamp = spring({
    frame: frame - 96,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 150 },
    durationInFrames: 22,
  });
  const captionStart = 84;
  return (
    <AbsoluteFill
      className="dark items-center justify-center bg-background text-foreground"
      style={{ filter: PAST_FILTER }}
    >
      <div
        className="relative mb-24 w-[1000px]"
        style={{ opacity: enter, translate: `0 ${interpolate(enter, [0, 1], [28, 0])}px` }}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-3 border-border border-b px-7 py-4">
            <span className="flex size-8 items-center justify-center rounded-full bg-muted">
              <Bot className="size-4" />
            </span>
            <span className="text-lg">
              <span className="font-medium">an agent</span>
              <span className="text-muted-foreground"> opened a pull request</span>
            </span>
          </div>
          <div className="space-y-2.5 px-7 py-5">
            <div className="font-semibold text-xl">{title}</div>
            <div className="space-y-1.5 pt-1">
              {[...CODE_LINES.entries()].map(([index, line]) => (
                <CodeLine key={line.id} line={line} index={index} />
              ))}
            </div>
          </div>
          <div className="space-y-4 border-border border-t px-7 py-5">
            {REVIEWS.map((review) => (
              <ReviewRow key={review.person.id} review={review} />
            ))}
          </div>
        </div>
        <div
          className="-top-5 -right-4 absolute"
          style={{ opacity: stamp, scale: interpolate(stamp, [0, 1], [1.5, 1]) }}
        >
          <span className="flex rotate-[-7deg] items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 font-semibold text-background text-base shadow-xl">
            <X className="size-4" strokeWidth={3} />
            {statusLabel}
          </span>
        </div>
      </div>
      <Sequence from={captionStart} durationInFrames={durationInFrames - captionStart}>
        <KineticCaption text={caption} durationInFrames={durationInFrames - captionStart} />
      </Sequence>
    </AbsoluteFill>
  );
}
