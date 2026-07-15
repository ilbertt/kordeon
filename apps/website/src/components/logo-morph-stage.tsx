// biome-ignore-all lint/style/noMagicNumbers: scroll-scrub interpolation constants
import type { Message } from '@repo/domain/workspace';
import { buttonVariants } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { cn } from '@repo/ui/lib/utils';
import { ArrowDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '#hooks/use-isomorphic-layout-effect';
import { ChannelSlug, channelBySlug } from './product-window/data';
import { setTourReveal } from './product-window/use-tour-reveal';

const LOGO_SLOT_PX = 120;

// The tour plays inside the real product's #welcome thread (see use-tour-reveal): the
// window that forms around the chat *is* the product window, clipped small, so there's
// one chat and no crossfade. This drives how many messages have arrived and who's typing.
const TOUR_MESSAGES = channelBySlug(ChannelSlug.Welcome)?.messages ?? [];
const TOUR_N = TOUR_MESSAGES.length;
const authorOf = (message: Message) => (message.kind === 'msg' ? message.from : null);

// Scroll is the clock: each beat (`PER_MSG_VH`, generous so the reader sets the pace)
// sends the message Korde is typing. A trailing beat holds the finished thread with the
// CTA. The wrapper is sized from all the beats plus the reveal that grows the window.
const PER_MSG_VH = 50;
const REVEAL_VH = 130;
const TOUR_BEATS = TOUR_N + 1;
const TOUR_VH = TOUR_BEATS * PER_MSG_VH;
const WRAP_VH = 100 + TOUR_VH + REVEAL_VH;
const TOUR_FRACTION = TOUR_VH / (TOUR_VH + REVEAL_VH);
// A hair of scroll before Korde starts typing, so the hero reads clean at rest.
const START_GATE = 0.02;
// The hero shrinks and rises into a compact title, staggered *ahead* of the window
// forming so the headline clears the window's top before the card appears.
const HERO_RISE_VH = 34;
const HERO_SCALE = 0.82;
const HERO_FORM_END = 0.05;
const WIN_FORM_START = 0.04;
const WIN_FORM_END = 0.15;
// The reveal grows the window into the product; the window's chrome (title bar, CTA)
// dissolves over the first slice of it as the product's own chrome arrives.
const REVEAL_RISE_VH = 12;
const CHROME_FADE = 0.18;
const WINDOW_RADIUS_PX = 16;
// How long "Tell me more" takes to play the whole tour — long enough to read each line.
const TOUR_PLAY_MS = 4200;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

type TourState = { count: number; typingIds: string[]; cta: boolean };

// Where the scroll lands the playback: how many messages have arrived, who's typing the
// next one (always someone until the thread is done), and whether the CTA beat shows.
function playbackAt(tourProgress: number): TourState {
  const gated = (tourProgress - START_GATE) / (1 - START_GATE);
  if (gated <= 0) {
    return { count: 0, typingIds: [], cta: false };
  }
  const count = Math.min(Math.floor(gated * TOUR_BEATS), TOUR_N);
  if (count >= TOUR_N) {
    return { count: TOUR_N, typingIds: [], cta: true };
  }
  const author = authorOf(TOUR_MESSAGES[count]!);
  return { count, typingIds: author ? [author] : [], cta: false };
}

/**
 * The hero is the kordeon mark and headline. Scroll and the headline stays as a title
 * while a window forms around Korde's tour — and that window *is* the product window,
 * clipped down to a small centred card so only the chat shows (the tour plays in the
 * product's real `#welcome` thread, driven by scroll). At the end the CTA shows, then
 * the reveal opens the clip from the card's rect to full-bleed: the same window grows,
 * its panels resolving in from the centre out. One element, no crossfade — the small
 * window is the product window, shrunk and simplified.
 *
 * Both the CTA and section deep-links drive the same scroll track.
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
  const markRef = useRef<HTMLDivElement>(null);
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // The tour is client-only: SSR serves the plain hero + full product beneath, so the
  // crawlable HTML stays complete and there's no hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [cta, setCta] = useState(false);
  const ctaShownRef = useRef(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Eases the page to a scroll target and yields the instant the visitor takes the
  // wheel — the scroll *is* the animation clock, so native smooth-scroll is too quick.
  const easeScrollTo = ({ target, durationMs }: { target: number; durationMs: number }) => {
    const start = window.scrollY;
    const distance = target - start;
    if (Math.abs(distance) < 1) {
      return;
    }
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    const stop = () => {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
    };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    let startedAt = 0;
    const step = (now: number) => {
      if (cancelled) {
        stop();
        return;
      }
      startedAt = startedAt || now;
      const t = Math.min(1, (now - startedAt) / durationMs);
      const eased = t * t * (3 - 2 * t);
      window.scrollTo(0, start + distance * eased);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        stop();
      }
    };
    requestAnimationFrame(step);
  };

  const trackMetrics = () => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return null;
    }
    const total = Math.max(0, wrap.offsetHeight - window.innerHeight);
    const wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
    return { total, wrapTop };
  };

  // "Tell me more" plays the whole tour: it eases to the "Try it out" beat so the
  // conversation arrives message by message — slow enough to read.
  const playTour = () => {
    const m = trackMetrics();
    if (m) {
      easeScrollTo({ target: m.wrapTop + m.total * TOUR_FRACTION, durationMs: TOUR_PLAY_MS });
    }
  };

  // "Try it out" finishes the track: the window grows into the full product.
  const revealProduct = () => {
    const m = trackMetrics();
    if (m) {
      easeScrollTo({ target: m.wrapTop + m.total, durationMs: 1800 });
    }
  };

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const intro = introRef.current;
    const chrome = chromeRef.current;
    const frame = frameRef.current;
    if (!(mounted && wrap && intro && chrome && frame)) {
      return;
    }

    // Reduced motion: no forming or growing — the product is shown directly (its
    // welcome thread stays full, since the tour store defaults to the whole thread).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.style.display = 'none';
      chrome.style.display = 'none';
      frame.style.clipPath = 'none';
      frame.style.filter = 'none';
      frame.style.pointerEvents = 'auto';
      requestAnimationFrame(() => {
        frame.style.transition = 'opacity 260ms ease-out';
        frame.style.opacity = '1';
      });
      return;
    }

    // Deep-linked to a section: jump to the end so the product is already full there.
    if (openFullOnLoad?.()) {
      window.scrollTo({
        top: Math.max(0, wrap.offsetHeight - window.innerHeight),
        behavior: 'instant',
      });
    }

    let total = 0;
    let wrapTop = 0;
    // The window's rect in px (its CSS: top 34vh, bottom 8vh, centred, width
    // min(760, 92vw)), so the reveal's clip-path opens from exactly its edges to
    // full-bleed. Measured on resize only — the scroll loop stays layout-free.
    let clip = { top: 0, right: 0, bottom: 0, left: 0 };
    const measure = () => {
      total = Math.max(0, wrap.offsetHeight - window.innerHeight);
      wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const winW = Math.min(760, vw * 0.92);
      const side = (vw - winW) / 2;
      clip = { top: vh * 0.34, right: side, bottom: vh * 0.08, left: side };
    };

    const mark = markRef.current;
    const heroCta = heroCtaRef.current;
    const ctaEl = ctaRef.current;

    // The headline shrinks and rises into a compact title above the window (and clears
    // in the reveal); the mark and CTA fade as it goes. Scaling about the viewport
    // centre keeps it centred as it shrinks.
    const updateHero = ({ form, reveal }: { form: number; reveal: number }) => {
      const scale = 1 - (1 - HERO_SCALE) * form;
      intro.style.transform = `translateY(${-(HERO_RISE_VH * form + REVEAL_RISE_VH * reveal)}vh) scale(${scale})`;
      intro.style.opacity = `${1 - reveal}`;
      intro.style.pointerEvents = form > 0.05 ? 'none' : 'auto';
      if (mark) {
        mark.style.opacity = `${1 - form}`;
      }
      if (heroCta) {
        heroCta.style.opacity = `${1 - form}`;
        heroCta.style.pointerEvents = form > 0.05 ? 'none' : 'auto';
      }
    };

    // The window: the product, clipped to the small rect while it forms (fading and
    // rising in as Korde starts), then growing to full-bleed in the reveal as the clip
    // opens with an ease-in-out — the same window, its panels resolving in from the
    // centre out. A drop-shadow rides the clipped edge like a floating window.
    const updateWindow = ({ form, reveal }: { form: number; reveal: number }) => {
      const open = smoothstep(reveal);
      const rest = 1 - open;
      frame.style.opacity = `${form}`;
      frame.style.transform = open > 0 ? 'none' : `translateY(${(1 - form) * 2}vh)`;
      if (open >= 1) {
        frame.style.clipPath = 'none';
        frame.style.filter = 'none';
        frame.style.pointerEvents = 'auto';
      } else {
        const t = clip.top * rest;
        const r = clip.right * rest;
        const b = clip.bottom * rest;
        const l = clip.left * rest;
        frame.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px round ${WINDOW_RADIUS_PX * rest}px)`;
        frame.style.filter = `drop-shadow(0 ${18 * rest}px ${40 * rest}px rgb(0 0 0 / ${0.32 * rest}))`;
        frame.style.pointerEvents = 'none';
      }

      // The window's own title bar + CTA fade in with the window and clear early in the
      // reveal, handing off to the product's real header and composer.
      const chromeGone = smoothstep(clamp01(reveal / CHROME_FADE));
      const chromeShown = form * (1 - chromeGone);
      chrome.style.opacity = `${chromeShown}`;
      chrome.style.transform = `translate(-50%, ${(1 - form) * 2}vh)`;
      if (ctaEl) {
        ctaEl.style.opacity = `${1 - chromeGone}`;
        ctaEl.style.pointerEvents = chromeGone < 0.5 ? 'auto' : 'none';
      }
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
      const formHero = smoothstep(clamp01(tourProgress / HERO_FORM_END));
      const formWin = smoothstep(
        clamp01((tourProgress - WIN_FORM_START) / (WIN_FORM_END - WIN_FORM_START)),
      );
      updateHero({ form: formHero, reveal });
      updateWindow({ form: formWin, reveal });

      const next = playbackAt(tourProgress);
      setTourReveal({ count: next.count, typingIds: next.typingIds });
      if (next.cta !== ctaShownRef.current) {
        ctaShownRef.current = next.cta;
        setCta(next.cta);
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
      {/* Landing-only overrides on the shared chat scroller (scoped to `.tour-frame`):
          relax `overscroll-contain` so scrolling up past the top of the messages rewinds
          the reveal instead of trapping the wheel, and bottom-anchor the messages so the
          thread sits at the reading line like a real chat. */}
      <style>
        {
          '.tour-frame [data-slot="message-scroller-viewport"]{overscroll-behavior:auto}.tour-frame [data-slot="message-scroller-content"]{justify-content:flex-end;max-width:44rem}'
        }
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
          <div ref={markRef} style={{ width: LOGO_SLOT_PX, height: LOGO_SLOT_PX }}>
            <KordeonMark className="size-full" />
          </div>
          <h1 className="mt-8 text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
            Where humans collaborate and agents execute
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Chat, refine the plan, and hand it to an agent — together, in one place.
          </p>
          <button
            ref={heroCtaRef}
            type="button"
            onClick={playTour}
            className={cn(buttonVariants({ size: 'lg' }), 'mt-8 gap-2')}
          >
            Tell me more
            <ArrowDown className="size-4" />
          </button>
        </div>

        {/* The product. During the tour a `clip-path` holds it to the window's rect
            (showing just the chat); the reveal opens the clip to full-bleed. */}
        <div
          ref={frameRef}
          className="tour-frame absolute inset-0 z-20 overflow-hidden bg-card"
          style={{
            opacity: 0,
            pointerEvents: 'none',
            clipPath: 'inset(34vh calc((100% - min(760px, 92vw)) / 2) 8vh round 16px)',
            willChange: 'clip-path, opacity, filter',
          }}
        >
          {children}
        </div>

        {/* The window's own chrome, overlaid on the clipped product: a title bar that
            reads as a window, and the "Try it out" CTA at the end of the tour. Both fade
            in as the window forms and clear early in the reveal, handing off to the
            product's real header and composer. */}
        {mounted ? (
          <>
            <div
              ref={chromeRef}
              aria-hidden
              className="absolute top-[34vh] left-1/2 z-30 flex h-9 w-[min(760px,92vw)] items-center gap-2 rounded-t-2xl border-border border-b bg-card px-4"
              style={{ opacity: 0, transform: 'translate(-50%, 2vh)' }}
            >
              <span className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              </span>
              <span className="ml-1 text-muted-foreground text-xs">#welcome</span>
            </div>
            <div
              ref={ctaRef}
              className="absolute bottom-[2.5vh] left-1/2 z-30 -translate-x-1/2"
              style={{ opacity: 0, pointerEvents: 'none' }}
            >
              {cta ? (
                <button
                  type="button"
                  onClick={revealProduct}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'gap-2 shadow-lg duration-500 animate-in fade-in slide-in-from-bottom-3',
                  )}
                >
                  Try it out
                  <ArrowDown className="size-4" />
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
