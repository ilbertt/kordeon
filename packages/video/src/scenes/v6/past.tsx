// biome-ignore-all lint/style/noMagicNumbers: past-act motion + layout tuning
import { Check, Lock, X } from 'lucide-react';
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
import { EASE } from '#lib/motion';

// A faded-photo past: fully desaturated with lifted blacks, so the "collaborate
// after" world reads as *before*. Full colour only returns at Meet kordeon.
const PAST_FILTER = 'grayscale(1) contrast(0.94) brightness(1.05)';

// The finished artifact's abstract body — monochrome skeletons + a chart block, so
// it reads as "a built deliverable" without literal copy (keeps text minimal).
const SKELETON_LINES = [
  { id: 'title', className: 'h-4 w-2/5 rounded-full bg-muted-foreground/45' },
  { id: 'line-a', className: 'h-2.5 w-4/5 rounded-full bg-muted-foreground/20' },
  { id: 'line-b', className: 'h-2.5 w-3/5 rounded-full bg-muted-foreground/20' },
];

const BARS = [
  { id: 'a', h: 44 },
  { id: 'b', h: 78 },
  { id: 'c', h: 56 },
  { id: 'd', h: 96 },
  { id: 'e', h: 70 },
  { id: 'f', h: 86 },
];

// The humans arrive only after it's sealed — the same avatars the viewer meets
// again later, each dropping a wordless objection pin onto the locked artifact.
const REACTIONS = [
  { person: PEOPLE.maya, left: -30, top: 92, delay: 30 },
  { person: PEOPLE.theo, left: 902, top: 168, delay: 48 },
  { person: PEOPLE.you, left: 120, top: 300, delay: 66 },
];

function ArtifactBody() {
  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <div className="flex flex-col gap-3">
        {SKELETON_LINES.map((line) => (
          <div key={line.id} className={line.className} />
        ))}
      </div>
      <div className="flex h-40 items-end gap-4 rounded-xl border border-border/60 bg-muted/10 px-6 py-5">
        {BARS.map((bar) => (
          <div
            key={bar.id}
            className="flex-1 rounded-t bg-muted-foreground/30"
            style={{ height: `${bar.h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ReactionPin({ reaction }: { reaction: (typeof REACTIONS)[number] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - reaction.delay,
    fps,
    config: { damping: 13, mass: 0.7, stiffness: 170 },
    durationInFrames: 20,
  });
  return (
    <div
      className="absolute"
      style={{
        left: reaction.left,
        top: reaction.top,
        opacity: s,
        translate: `0 ${interpolate(s, [0, 1], [-16, 0])}px`,
        scale: interpolate(s, [0, 1], [0.6, 1]),
      }}
    >
      <div className="relative rounded-2xl rounded-bl-sm border border-border bg-card p-1.5 shadow-2xl">
        <Img src={reaction.person.avatarUrl} className="size-9 rounded-full" />
        <span className="-top-2 -right-2 absolute flex size-5 items-center justify-center rounded-full bg-rose-500 text-white shadow">
          <X className="size-3" strokeWidth={3.5} />
        </span>
      </div>
    </div>
  );
}

// Beat past-1 — the old way, desaturated: an agent-built artifact sits DONE and
// locked while the humans pile objection pins on top, too late to change it.
export function CollaborateAfter({
  caption,
  authorLabel,
  statusLabel,
  durationInFrames,
}: {
  caption: string;
  authorLabel: string;
  statusLabel: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 20, mass: 0.85 }, durationInFrames: 24 });
  const stamp = spring({
    frame: frame - 16,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 150 },
    durationInFrames: 22,
  });
  const captionStart = 22;
  return (
    <AbsoluteFill
      className="dark items-center justify-center bg-background text-foreground"
      style={{ filter: PAST_FILTER }}
    >
      <div
        className="relative mb-28 w-[980px]"
        style={{ opacity: enter, translate: `0 ${interpolate(enter, [0, 1], [28, 0])}px` }}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-3 border-border border-b px-8 py-5">
            <Img src={PEOPLE.korde.avatarUrl} className="size-8 rounded-full" />
            <span className="font-medium text-lg text-muted-foreground">{authorLabel}</span>
            <span className="ml-auto text-muted-foreground">
              <Lock className="size-5" />
            </span>
          </div>
          <ArtifactBody />
        </div>
        <div
          className="-top-5 -right-4 absolute"
          style={{ opacity: stamp, scale: interpolate(stamp, [0, 1], [1.6, 1]) }}
        >
          <span className="flex rotate-[-7deg] items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 font-semibold text-background text-lg shadow-xl">
            <Check className="size-5" strokeWidth={3} />
            {statusLabel}
          </span>
        </div>
        {REACTIONS.map((reaction) => (
          <ReactionPin key={reaction.person.id} reaction={reaction} />
        ))}
      </div>
      <Sequence from={captionStart} durationInFrames={durationInFrames - captionStart}>
        <KineticCaption text={caption} durationInFrames={durationInFrames - captionStart} />
      </Sequence>
    </AbsoluteFill>
  );
}

// Beat past-2 — the pivot: hero copy cross-dissolves as the desaturation lifts,
// priming the full-colour Meet kordeon the crossfade hands off to. `line2` is
// optional — with a single line it simply owns the whole beat.
export function ThePivot({
  line1,
  line2,
  durationInFrames,
}: {
  line1: string;
  line2?: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const gray = interpolate(frame, [durationInFrames * 0.5, durationInFrames], [1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  const line1Dur = line2 ? Math.round(durationInFrames * 0.52) : durationInFrames;
  const line2From = line1Dur - 6;
  return (
    <AbsoluteFill
      className="dark bg-background text-foreground"
      style={{ filter: `grayscale(${gray})` }}
    >
      <Sequence durationInFrames={line1Dur}>
        <KineticCaption text={line1} durationInFrames={line1Dur} variant="hero" />
      </Sequence>
      {line2 ? (
        <Sequence from={line2From}>
          <KineticCaption text={line2} durationInFrames={durationInFrames} variant="hero" />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
}
