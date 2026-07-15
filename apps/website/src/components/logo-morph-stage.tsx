// biome-ignore-all lint/style/noMagicNumbers: scroll-scrub interpolation constants
import type { Message } from '@repo/domain/workspace';
import { buttonVariants } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { WorkspaceProvider } from '@repo/ui/custom/workspace/context';
import { ChatMessage, ThreadTypingRow } from '@repo/ui/custom/workspace/message';
import { cn } from '@repo/ui/lib/utils';
import { ArrowDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '#hooks/use-isomorphic-layout-effect';
import { ChannelSlug, channelBySlug, MENTION_SUGGESTIONS, PEOPLE } from './product-window/data';

const LOGO_SLOT_PX = 120;

// The tour is the #welcome thread: the same messages that top the live chat, so the
// window slides in around the very conversation you just watched arrive.
const TOUR_MESSAGES = channelBySlug(ChannelSlug.Welcome)?.messages ?? [];
const TOUR_N = TOUR_MESSAGES.length;
const authorOf = (message: Message) => (message.kind === 'msg' ? message.from : null);

// Scroll-driven playback: the conversation plays out like a real chat, but *scroll
// is the clock*. Korde's typing indicator is pinned at the bottom the whole time — it
// never leaves, as if the agent is always ready to send the next line. Each scroll
// beat (`PER_MSG_VH`, generous so the reader sets the pace) sends the message it's
// typing: it rises into the thread above, and the row starts typing the next one. A
// trailing beat holds the finished thread with the CTA. The wrapper is sized from all
// the beats, plus the window slide-in.
const PER_MSG_VH = 50;
const SLIDE_VH = 120;
// One beat per message, plus a trailing beat that swaps the typing row for the CTA and
// holds the finished conversation before the window slides in.
const TOUR_BEATS = TOUR_N + 1;
const TOUR_VH = TOUR_BEATS * PER_MSG_VH;
const WRAP_VH = 100 + TOUR_VH + SLIDE_VH;
const TOUR_FRACTION = TOUR_VH / (TOUR_VH + SLIDE_VH);
// A hair of scroll before Korde starts typing, so the hero reads clean at rest.
const START_GATE = 0.02;
// The hero scrolls up and clears as the first message arrives.
const HERO_RISE_VH = 42;
const HERO_FADE_END = 0.12;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

type TourState = { landed: number; typingId: string | null; cta: boolean };

// Where the scroll position lands the playback: how many messages have arrived, who's
// typing the next one (always someone, until the thread is done), and whether the CTA
// beat is showing. Discrete — it only changes at the beats, so the scroll loop pushes
// it to state sparingly.
function playbackAt(tourProgress: number): TourState {
  const gated = (tourProgress - START_GATE) / (1 - START_GATE);
  if (gated <= 0) {
    return { landed: 0, typingId: null, cta: false };
  }
  const landed = Math.min(Math.floor(gated * TOUR_BEATS), TOUR_N);
  if (landed >= TOUR_N) {
    return { landed: TOUR_N, typingId: null, cta: true };
  }
  return { landed, typingId: authorOf(TOUR_MESSAGES[landed]!), cta: false };
}

// Each message opens up from the typing row: its slot expands from zero height,
// pushing the history above it up while the typing row holds steady at the bottom, so
// the line rises into the thread from exactly where it was being typed. Height and a
// short lift, no fade — it arrives, it doesn't materialise.
function EnteringMessage({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div
      className="grid transition-[grid-template-rows] duration-500 ease-out"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <div
          className="pb-5 transition-transform duration-500 ease-out"
          style={{ transform: open ? 'translateY(0)' : 'translateY(1.5rem)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * The hero is the kordeon mark and headline. Scroll and it rises out of the way as
 * Korde's tour plays out — the #welcome messages arrive like a real chat (a typing
 * beat, then the message lands, climbing up from below), but scroll is the clock, so
 * the reader decides when the next one comes. At the end a "Try it out" beat, then
 * the product window slides up from below and lands around that conversation, which
 * becomes the live thread — nothing resets.
 *
 * The reveal is the pre-#34 slide-in on every viewport (the mark-into-panels morph
 * is gone). Both the CTA and section deep-links drive the same scroll track.
 */
export function LogoMorphStage({
  children,
  openFullOnLoad,
}: {
  children: React.ReactNode;
  openFullOnLoad?: () => boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // The tour is client-only: SSR serves the plain hero + full product beneath, so
  // the crawlable HTML stays complete and there's no hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [tour, setTour] = useState<TourState>({ landed: 0, typingId: null, cta: false });
  const tourStateRef = useRef<TourState>({ landed: 0, typingId: null, cta: false });
  useEffect(() => {
    setMounted(true);
  }, []);

  // Drives the scroll to the end of the track, so the reveal finishes and the
  // product becomes interactive — the CTA does what scrolling down does. Native
  // `behavior: 'smooth'` is too quick to read the transition, so this eases over
  // ~1.8s (and yields the moment the visitor takes the wheel).
  const revealProduct = () => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const start = window.scrollY;
    const distance = Math.max(0, wrap.offsetHeight - window.innerHeight) - start;
    if (distance <= 0) {
      return;
    }
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    const durationMs = 1800;
    let startedAt = 0;
    const step = (now: number) => {
      if (cancelled) {
        window.removeEventListener('wheel', cancel);
        window.removeEventListener('touchstart', cancel);
        return;
      }
      startedAt = startedAt || now;
      const t = Math.min(1, (now - startedAt) / durationMs);
      const eased = t * t * (3 - 2 * t);
      window.scrollTo(0, start + distance * eased);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        window.removeEventListener('wheel', cancel);
        window.removeEventListener('touchstart', cancel);
      }
    };
    requestAnimationFrame(step);
  };

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const intro = introRef.current;
    const band = bandRef.current;
    const frame = frameRef.current;
    if (!(mounted && wrap && intro && band && frame)) {
      return;
    }

    // Reduced motion: drop the movement (tour playback or slide) but still fade the
    // window in rather than hard-cutting — fewer and gentler, not zero.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.style.display = 'none';
      band.style.display = 'none';
      frame.style.transform = 'none';
      frame.style.pointerEvents = 'auto';
      requestAnimationFrame(() => {
        frame.style.transition = 'opacity 260ms ease-out';
        frame.style.opacity = '1';
      });
      return;
    }

    // Deep-linked to a section: jump to the end so the product is already full at
    // that section, instead of replaying the intro.
    if (openFullOnLoad?.()) {
      window.scrollTo({
        top: Math.max(0, wrap.offsetHeight - window.innerHeight),
        behavior: 'instant',
      });
    }

    let total = 0;
    let wrapTop = 0;
    const measure = () => {
      total = Math.max(0, wrap.offsetHeight - window.innerHeight);
      wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
    };

    // The hero scrolls up and fades as the first message arrives, clearing the
    // centre for the conversation.
    const updateHero = (tourProgress: number) => {
      const gone = smoothstep(clamp01(tourProgress / HERO_FADE_END));
      intro.style.transform = `translateY(${-HERO_RISE_VH * gone}vh)`;
      intro.style.opacity = `${1 - gone}`;
      intro.style.pointerEvents = tourProgress > 0.04 ? 'none' : 'auto';
    };

    // The pre-#34 reveal, restored: the product slides up from fully below to
    // full-bleed, scaling and shedding its rounding + shadow as it lands — a
    // screenshot sliding into view. Riding above the conversation (z-30), it covers
    // it from the bottom up as it rises, then holds the real thread (same messages).
    const updateSlide = (reveal: number) => {
      const ease = smoothstep(reveal);
      const rest = 1 - ease;
      const startScale = 0.94;
      const scale = startScale + (1 - startScale) * ease;
      frame.style.opacity = '1';
      frame.style.transform = `translateY(${100 * rest}vh) scale(${scale})`;
      frame.style.borderRadius = `${20 * rest}px`;
      frame.style.boxShadow = `0 ${8 * rest}px ${60 * rest}px rgb(0 0 0 / ${0.22 * rest})`;
      frame.style.pointerEvents = ease > 0.99 ? 'auto' : 'none';
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const scrolled = window.scrollY - wrapTop;
      const tourEnd = total * TOUR_FRACTION;
      let tourProgress = 1;
      let reveal = 0;
      if (total <= 0) {
        tourProgress = 1;
        reveal = 1;
      } else if (scrolled <= tourEnd) {
        tourProgress = tourEnd > 0 ? clamp01(scrolled / tourEnd) : 1;
        reveal = 0;
      } else {
        tourProgress = 1;
        reveal = clamp01((scrolled - tourEnd) / (total - tourEnd));
      }
      updateHero(tourProgress);
      updateSlide(reveal);

      const next = playbackAt(tourProgress);
      const prev = tourStateRef.current;
      if (next.landed !== prev.landed || next.typingId !== prev.typingId || next.cta !== prev.cta) {
        tourStateRef.current = next;
        setTour(next);
      }
    };
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(update);
      }
    };
    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, [mounted, openFullOnLoad]);

  return (
    <div ref={wrapRef} className="relative" style={{ height: `${WRAP_VH}vh` }}>
      {/* On the landing the chat lives inside a scrollable page, so upward scroll
          past the top of the messages must return to the hero — the shared
          scroller's `overscroll-contain` (right for the real app) would trap it. */}
      <style>
        {'.tour-frame [data-slot="message-scroller-viewport"]{overscroll-behavior:auto}'}
      </style>
      <div className="sticky top-0 h-svh overflow-hidden bg-background">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div
          ref={introRef}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center will-change-transform"
        >
          <div style={{ width: LOGO_SLOT_PX, height: LOGO_SLOT_PX }}>
            <KordeonMark className="size-full" />
          </div>
          <h1 className="mt-8 text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
            Where humans collaborate and agents execute
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Chat, refine the plan, and hand it to an agent — together, in one place.
          </p>
          <button
            type="button"
            onClick={revealProduct}
            className={cn(buttonVariants({ size: 'lg' }), 'mt-8 gap-2')}
          >
            Try it now
            <ArrowDown className="size-4" />
          </button>
        </div>

        {/* The conversation, bottom-anchored so the newest message and the typing
            row sit at the reading line with history above — a real chat, played out
            by scroll. Each message climbs up from below as it lands. */}
        <div
          ref={bandRef}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-end overflow-hidden px-4 pb-[16vh]"
        >
          {mounted ? (
            <WorkspaceProvider
              people={PEOPLE}
              currentUserId="you"
              mentionSuggestions={MENTION_SUGGESTIONS}
            >
              {/* Pointer-events on so the reactions and mention tags are live —
                  visitors can react for fun (nothing persists). */}
              <div className="pointer-events-auto flex w-full max-w-2xl flex-col">
                {TOUR_MESSAGES.slice(0, tour.landed).map((message) => (
                  <EnteringMessage key={message.id}>
                    <ChatMessage message={message} />
                  </EnteringMessage>
                ))}
                {tour.typingId ? (
                  <ThreadTypingRow key={tour.typingId} ids={[tour.typingId]} />
                ) : null}
                {tour.cta ? (
                  <div className="flex animate-in justify-center pt-1 slide-in-from-bottom-3 duration-500">
                    <button
                      type="button"
                      onClick={revealProduct}
                      className={cn(buttonVariants({ size: 'lg' }), 'gap-2 shadow-lg')}
                    >
                      Try it out
                      <ArrowDown className="size-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </WorkspaceProvider>
          ) : null}
        </div>

        {/* The window slides up from below and lands around the conversation. */}
        <div
          ref={frameRef}
          className="tour-frame absolute inset-0 z-30 overflow-hidden bg-card"
          style={{ opacity: 0, transformOrigin: 'center', pointerEvents: 'none' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
