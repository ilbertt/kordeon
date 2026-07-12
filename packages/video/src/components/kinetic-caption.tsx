// biome-ignore-all lint/style/noMagicNumbers: caption motion + layout tuning
// biome-ignore-all lint/suspicious/noArrayIndexKey: words repeat, so a word's position is its identity
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { EASE } from '#lib/motion';

// Frames between successive word reveals — the karaoke cadence.
const STRIDE = 4;
const CONTAINER_IN = 12;
const OUT = 12;
// How long the leading (just-revealed) word stays accented before settling.
const HIGHLIGHT_TAIL = 10;

// One word: springs up into place, and glows in `primary` while it's the leading
// edge of the reveal, then settles to `foreground`. Unrevealed words still occupy
// their box (opacity 0), so the line never reflows as it fills in.
function Word({
  word,
  index,
  frame,
  fps,
  leading,
}: {
  word: string;
  index: number;
  frame: number;
  fps: number;
  leading: boolean;
}) {
  const enter = spring({
    frame: frame - index * STRIDE,
    fps,
    config: { damping: 16, mass: 0.5, stiffness: 130 },
    durationInFrames: 18,
  });
  return (
    <span
      className={leading ? 'text-primary' : 'text-foreground'}
      style={{
        display: 'inline-block',
        opacity: enter,
        translate: `0 ${interpolate(enter, [0, 1], [18, 0])}px`,
        scale: interpolate(enter, [0, 1], [0.82, 1]),
      }}
    >
      {word}
    </span>
  );
}

// Kinetic subtitle: the beat's one line, revealed word-by-word with a per-word
// spring and a travelling `primary` highlight, sitting in the bottom safe area on
// a subtle blurred scrim. Wrap it in a <Sequence> so `useCurrentFrame` is local to
// the line and `durationInFrames` is the sequence length (it fades out at the end).
export function KineticCaption({
  text,
  durationInFrames,
}: {
  text: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  const revealDone = (words.length - 1) * STRIDE;
  // The leading word is the newest revealed; once the sweep finishes (+ tail), no
  // word is highlighted, so the line rests in solid `foreground` during the hold.
  const leadingIndex =
    frame <= revealDone + HIGHLIGHT_TAIL
      ? Math.max(0, Math.min(words.length - 1, Math.floor(frame / STRIDE)))
      : -1;
  const opacity = Math.min(
    interpolate(frame, [0, CONTAINER_IN], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE,
    }),
    interpolate(frame, [durationInFrames - OUT, durationInFrames], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const rise = interpolate(frame, [0, CONTAINER_IN], [22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  return (
    <AbsoluteFill className="items-center justify-end pb-24">
      <div
        className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-[0.28em] gap-y-1 rounded-2xl border border-border/50 bg-background/70 px-10 py-6 text-center font-semibold text-5xl leading-[1.15] tracking-tight backdrop-blur-md"
        style={{ opacity, translate: `0 ${rise}px` }}
      >
        {[...words.entries()].map(([index, word]) => (
          <Word
            key={`${index}-${word}`}
            word={word}
            index={index}
            frame={frame}
            fps={fps}
            leading={index === leadingIndex}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}
