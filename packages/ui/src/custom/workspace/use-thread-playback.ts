// biome-ignore-all lint/style/noMagicNumbers: playback pacing + intersection thresholds
import type { Message } from '@repo/domain/workspace';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// A seeded thread plays back like a live conversation: each message is preceded
// by a reading beat (long enough to take in the previous one) and a "typing"
// beat for its author, then it lands. Busy stretches briefly show two people
// typing at once ("Maya and Theo are typing"). All timing is client-only — the
// server and first client render show the whole thread (see `useThreadPlayback`
// returning `total` until it opts in), so the prerendered HTML stays complete
// and there's no hydration mismatch.

const TYPE_MIN_MS = 700;
const TYPE_MAX_MS = 2600;
const TYPE_PER_CHAR_MS = 20;
// The reading beat after a message lands, before the next author starts typing —
// generous so each message is actually readable before the thread moves on.
const READ_MIN_MS = 1000;
const READ_MAX_MS = 3800;
const READ_PER_CHAR_MS = 30;
// System notes (e.g. the welcome intro) have no author, so they get a flat beat
// instead of a length-scaled typing pause.
const SYSTEM_BEAT_MS = 1000;
// Fraction of a message's typing beat after which the next author "joins in",
// turning the indicator into "A and B are typing".
const CO_TYPING_AT = 0.55;
// The thread starts its timeline once this much of it has scrolled into view, so
// the intro plays as the product zooms in rather than while it peeks off-screen.
const IN_VIEW_RATIO = 0.35;

// Client-only: SSR renders the full thread, so this only ever runs in the browser.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function clamp({ value, min, max }: { value: number; min: number; max: number }) {
  return Math.min(max, Math.max(min, value));
}

function authorOf(message: Message): string | null {
  return message.kind === 'msg' ? message.from : null;
}

function readBeat(message: Message): number {
  if (message.kind === 'system') {
    return SYSTEM_BEAT_MS;
  }
  return clamp({
    value: message.text.length * READ_PER_CHAR_MS,
    min: READ_MIN_MS,
    max: READ_MAX_MS,
  });
}

function typeBeat(message: Message): number {
  if (message.kind === 'system') {
    return SYSTEM_BEAT_MS;
  }
  return clamp({
    value: message.text.length * TYPE_PER_CHAR_MS,
    min: TYPE_MIN_MS,
    max: TYPE_MAX_MS,
  });
}

export type TypingState = { ids: string[] };

// `revealCount` is how many of the seeded messages to show; `typing` is who is
// composing the next one (null between/after). While `playing` is false the
// thread is static — the resting state for reduced-motion, no-JS, and once the
// playback has finished.
export function useThreadPlayback({
  messages,
  active,
  animate,
  rootRef,
}: {
  messages: Message[];
  active: boolean;
  animate: boolean;
  rootRef: React.RefObject<HTMLElement | null>;
}): { revealCount: number; typing: TypingState | null; playing: boolean } {
  const total = messages.length;
  // Read the latest messages without making them an effect dependency: the array
  // identity changes every render, which would otherwise tear down a running
  // timeline mid-play.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const [revealCount, setRevealCount] = useState(total);
  const [typing, setTyping] = useState<TypingState | null>(null);
  const [playing, setPlaying] = useState(false);
  const playedRef = useRef(false);

  const shouldAnimate = useCallback(() => {
    if (!animate || playedRef.current || total <= 1) {
      return false;
    }
    return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }, [animate, total]);

  // Collapse to the first message before paint the moment the channel is active,
  // so the full thread never flashes; the timeline below waits for it to scroll
  // into view before revealing the rest.
  useIsomorphicLayoutEffect(() => {
    if (active && shouldAnimate()) {
      setPlaying(true);
      setRevealCount(1);
    }
  }, [active, shouldAnimate]);

  useEffect(() => {
    const node = rootRef.current;
    if (!(active && node) || !shouldAnimate()) {
      return;
    }

    let cancelled = false;
    let started = false;
    const timers: number[] = [];
    const push = ({ fn, delay }: { fn: () => void; delay: number }) => {
      timers.push(window.setTimeout(fn, delay));
    };

    const revealFrom = ({ index, preTyping }: { index: number; preTyping: boolean }) => {
      if (cancelled) {
        return;
      }
      if (index >= total) {
        setTyping(null);
        setRevealCount(total);
        setPlaying(false);
        playedRef.current = true;
        return;
      }
      const list = messagesRef.current;
      // No reading pause when this author was already co-typing the previous
      // message — their "is typing" carries straight over instead of blinking out.
      push({
        delay: preTyping ? 0 : readBeat(list[index - 1]!),
        fn: () => {
          if (cancelled) {
            return;
          }
          const current = list[index]!;
          const author = authorOf(current);
          const beat = typeBeat(current);
          const nextAuthor = index + 1 < total ? authorOf(list[index + 1]!) : null;
          if (author) {
            setTyping({ ids: [author] });
            if (nextAuthor && nextAuthor !== author) {
              push({
                delay: beat * CO_TYPING_AT,
                fn: () => !cancelled && setTyping({ ids: [author, nextAuthor] }),
              });
            }
          } else {
            setTyping(null);
          }
          push({
            delay: beat,
            fn: () => {
              if (cancelled) {
                return;
              }
              setRevealCount(index + 1);
              // Hand the indicator straight to the next author when they were
              // co-typing, so it never blanks between back-to-back authors.
              const handoff = Boolean(author && nextAuthor && nextAuthor !== author);
              setTyping(handoff ? { ids: [nextAuthor!] } : null);
              revealFrom({ index: index + 1, preTyping: handoff });
            },
          });
        },
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!started && entry.isIntersecting && entry.intersectionRatio >= IN_VIEW_RATIO) {
            started = true;
            observer.disconnect();
            revealFrom({ index: 1, preTyping: false });
            break;
          }
        }
      },
      { threshold: [0, IN_VIEW_RATIO, 0.6] },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      for (const id of timers) {
        clearTimeout(id);
      }
    };
  }, [active, shouldAnimate, total, rootRef]);

  return { revealCount: playing ? revealCount : total, typing, playing };
}
