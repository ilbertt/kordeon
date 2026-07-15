// biome-ignore-all lint/style/noMagicNumbers: scroll-scrub interpolation constants
import { buttonVariants } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { WorkspaceProvider } from '@repo/ui/custom/workspace/context';
import { ChatMessage } from '@repo/ui/custom/workspace/message';
import { cn } from '@repo/ui/lib/utils';
import { ArrowDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '#hooks/use-isomorphic-layout-effect';
import { ChannelSlug, channelBySlug, MENTION_SUGGESTIONS, PEOPLE } from './product-window/data';

const LOGO_SLOT_PX = 120;

// The tour is the #welcome thread: the same messages that top the live chat, so the
// window slides in around the very conversation you just scrolled through.
const TOUR_MESSAGES = channelBySlug(ChannelSlug.Welcome)?.messages ?? [];
const TOUR_N = TOUR_MESSAGES.length;

// The conversation is scrubbed to scroll — the column is tied to `window.scrollY`,
// so each message rises up from below as you scroll (no fade-in pop). Each message
// gets a generous slice of the track (`PER_MSG_VH`) so there's room to read it
// before the next arrives. The wrapper is sized from that so the whole tour, plus
// the window slide-in, fits the sticky track.
const PER_MSG_VH = 58;
const SLIDE_VH = 120;
const TOUR_VH = TOUR_N * PER_MSG_VH;
const WRAP_VH = 100 + TOUR_VH + SLIDE_VH;
const TOUR_FRACTION = TOUR_VH / (TOUR_VH + SLIDE_VH);

// The read line: where the message being read settles (a little below centre, so
// history sits above and the next message rises into the space below it).
const READ_FRAC = 0.5;
// Message 0 starts this far below the read line — off the bottom of the screen — so
// the conversation rises in from nothing rather than sitting there at rest.
const START_GAP_FRAC = 0.66;
// The hero scrolls up and clears as the first message arrives.
const HERO_RISE_VH = 42;
const HERO_FADE_END = 0.12;
// The CTA fades up in the last stretch of the tour, once the conversation's read.
const CTA_START = 0.9;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/**
 * The hero is the kordeon mark and headline. Scroll and it rises out of the way as
 * Korde's tour rises in from below — the #welcome messages, centred on screen and
 * scrubbed to the wheel so each climbs into the read line as you scroll. At the end
 * a "Try it out" beat, then the product window slides up from below and lands around
 * that conversation, which becomes the live thread — nothing resets.
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
  const columnRef = useRef<HTMLDivElement>(null);
  const msgRefs = useRef<Array<HTMLDivElement | null>>([]);
  const ctaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // The tour is client-only: SSR serves the plain hero + full product beneath, so
  // the crawlable HTML stays complete and there's no hydration mismatch. The scroll
  // effect below waits for this (its refs only exist once the tour is rendered).
  const [mounted, setMounted] = useState(false);
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
    const column = columnRef.current;
    const cta = ctaRef.current;
    const frame = frameRef.current;
    // Waits for the client-only tour to render — its refs are null until then.
    if (!(mounted && wrap && intro && band && column && cta && frame)) {
      return;
    }

    // Reduced motion: drop the movement (tour scrub or slide) but still fade the
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

    // Measured on mount, on resize, and whenever the column's height changes (the
    // reactions tick in a beat after paint and grow their rows). `centers[i]` is
    // each message's vertical middle within the column; the scroll loop places the
    // current one on the read line by translating the column — a compositor-only
    // transform, no per-frame layout.
    let total = 0;
    let wrapTop = 0;
    let readLine = 0;
    let startGap = 0;
    let centers: number[] = [];
    const measure = () => {
      total = Math.max(0, wrap.offsetHeight - window.innerHeight);
      wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
      readLine = window.innerHeight * READ_FRAC;
      startGap = window.innerHeight * START_GAP_FRAC;
      centers = msgRefs.current.map((el) => (el ? el.offsetTop + el.offsetHeight / 2 : 0));
    };

    // The hero scrolls up and fades as the first message arrives, clearing the
    // centre for the conversation.
    const updateHero = (tourProgress: number) => {
      const gone = smoothstep(clamp01(tourProgress / HERO_FADE_END));
      intro.style.transform = `translateY(${-HERO_RISE_VH * gone}vh)`;
      intro.style.opacity = `${1 - gone}`;
      intro.style.pointerEvents = tourProgress > 0.04 ? 'none' : 'auto';
    };

    // The conversation, scrubbed: `float` runs from -1 (message 0 off the bottom) to
    // N-1 (last message on the read line). Between two messages the column slides
    // linearly, so the next one climbs up from below into place.
    const updateTour = ({ tourProgress, reveal }: { tourProgress: number; reveal: number }) => {
      if (centers.length) {
        const float = -1 + tourProgress * TOUR_N;
        const i = Math.floor(float);
        const frac = float - i;
        const centerAt = (index: number) =>
          index < 0 ? centers[0]! - startGap : (centers[index] ?? centers[centers.length - 1]!);
        // Ease within each slot so a message settles on the read line and dwells
        // there (time to read) before the next climbs up into its place.
        const target = centerAt(i) + (centerAt(i + 1) - centerAt(i)) * smoothstep(frac);
        column.style.transform = `translateY(${readLine - target}px)`;
      }

      const appear = smoothstep(clamp01((tourProgress - CTA_START) / (1 - CTA_START)));
      const leaving = smoothstep(reveal / 0.12);
      const visible = appear * (1 - leaving);
      cta.style.opacity = `${visible}`;
      cta.style.transform = `translateY(${(1 - appear) * 16}px)`;
      cta.style.pointerEvents = visible > 0.5 ? 'auto' : 'none';
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
      updateTour({ tourProgress, reveal });
      updateSlide(reveal);
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
    // Re-measure when the reactions land and re-flow the rows.
    const observer = new ResizeObserver(() => {
      measure();
      update();
    });
    observer.observe(column);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
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

        {/* The scrubbed conversation, centred and clipped to the screen: the column
            is translated per frame so each message rises from below into the read
            line. */}
        <div ref={bandRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {mounted ? (
            <WorkspaceProvider
              people={PEOPLE}
              currentUserId="you"
              mentionSuggestions={MENTION_SUGGESTIONS}
            >
              <div ref={columnRef} className="absolute inset-x-0 top-0 will-change-transform">
                {/* Messages are spaced ~a third of the viewport apart so each takes
                    the read line on its own, the next rising up from below. */}
                <div className="mx-auto flex max-w-2xl flex-col gap-[34vh] px-4">
                  {[...TOUR_MESSAGES.entries()].map(([index, message]) => (
                    <div
                      key={message.id}
                      ref={(el) => {
                        msgRefs.current[index] = el;
                      }}
                    >
                      <ChatMessage message={message} />
                    </div>
                  ))}
                </div>
              </div>
              <div
                ref={ctaRef}
                className="pointer-events-none absolute inset-x-0 bottom-[12%] flex justify-center px-4"
                style={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={revealProduct}
                  className={cn(buttonVariants({ size: 'lg' }), 'gap-2 shadow-lg')}
                >
                  Try it out
                  <ArrowDown className="size-4" />
                </button>
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
