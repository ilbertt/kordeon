// biome-ignore-all lint/style/noMagicNumbers: playback pacing constants
import type { Message } from '@repo/domain/workspace';

// A deterministic, frame-addressable port of the product's thread playback: given
// a frame, how many seeded messages are revealed and who is composing the next.
// The real hook (`useThreadPlayback`) is timer-driven, so it can't animate inside
// a Remotion render — this replays the same feel as a pure function of time.
//
// Beats are tuned tighter than the landing's leisurely pacing so a ~7-message
// thread lands inside a single social-video scene. `speed` scales them globally.

const FIRST_AT_MS = 0;
const TYPE_PER_CHAR_MS = 16;
const TYPE_MIN_MS = 520;
const TYPE_MAX_MS = 1500;
const SYSTEM_BEAT_MS = 460;

function clamp({ value, min, max }: { value: number; min: number; max: number }): number {
  return Math.min(max, Math.max(min, value));
}

// The dwell before a message lands — read as its author composing it.
function beatFor(message: Message): number {
  if (message.kind === 'system') {
    return SYSTEM_BEAT_MS;
  }
  return clamp({
    value: message.text.length * TYPE_PER_CHAR_MS,
    min: TYPE_MIN_MS,
    max: TYPE_MAX_MS,
  });
}

function authorOf(message: Message | undefined): string | undefined {
  return message && message.kind === 'msg' ? message.from : undefined;
}

export type ThreadState = { visibleCount: number; typingId?: string };

// Cumulative land time (ms) of each message: the first shows at 0, each later one
// after the previous plus its own composing beat.
function landTimes(messages: Message[]): number[] {
  const times: number[] = [];
  let elapsed = FIRST_AT_MS;
  for (const message of messages) {
    if (times.length === 0) {
      times.push(FIRST_AT_MS);
      continue;
    }
    elapsed += beatFor(message);
    times.push(elapsed);
  }
  return times;
}

export function threadStateAt({
  messages,
  fps,
  frame,
  speed = 1,
  currentUserId,
}: {
  messages: Message[];
  fps: number;
  frame: number;
  speed?: number;
  // The viewer never watches themselves type — suppress the typing row when the
  // next message is theirs (it just appears, as if they sent it).
  currentUserId?: string;
}): ThreadState {
  const elapsedMs = (frame / fps) * 1000 * speed;
  const times = landTimes(messages);

  let visibleCount = 0;
  for (const time of times) {
    if (time <= elapsedMs) {
      visibleCount += 1;
    }
  }
  visibleCount = Math.max(1, visibleCount);

  // Whoever composes the next-to-land message is shown typing until it lands.
  const nextAuthor = visibleCount < messages.length ? authorOf(messages[visibleCount]) : undefined;
  const typingId = nextAuthor === currentUserId ? undefined : nextAuthor;
  return { visibleCount, typingId };
}

// Total frames the full reveal occupies — lets a scene size itself to its thread.
export function threadDurationInFrames({
  messages,
  fps,
  speed = 1,
}: {
  messages: Message[];
  fps: number;
  speed?: number;
}): number {
  const times = landTimes(messages);
  const lastMs = times[times.length - 1] ?? 0;
  return Math.ceil(((lastMs / 1000) * fps) / speed);
}
