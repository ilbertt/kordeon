// biome-ignore-all lint/style/noMagicNumbers: scroll-scrub interpolation constants
import { buttonVariants } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { WorkspaceProvider } from '@repo/ui/custom/workspace/context';
import { ChatMessage, ThreadTypingRow } from '@repo/ui/custom/workspace/message';
import { cn } from '@repo/ui/lib/utils';
import { ArrowDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '#hooks/use-isomorphic-layout-effect';
import { ChannelSlug, channelBySlug, MENTION_SUGGESTIONS, PEOPLE } from './product-window/data';

const LOGO_SLOT_PX = 120;

// The tour is the #welcome thread, scrubbed to scroll: the same messages that top
// the live chat, so the window slides in around the very conversation you read.
const TOUR_MESSAGES = channelBySlug(ChannelSlug.Welcome)?.messages ?? [];
const TOUR_AUTHORS = TOUR_MESSAGES.map((message) => (message.kind === 'msg' ? message.from : null));
const TOUR_N = TOUR_MESSAGES.length;

// Fraction of the scroll track spent on the tour; the rest slides the window in.
const TOUR_FRACTION = 0.6;
// The hero rises and clears over the first stretch of the tour — it scrolls up and
// out as the conversation takes the centre.
const HERO_RISE_VH = 48;
const HERO_FADE_END = 0.42;
// The bubbles fade in just after the hero starts leaving.
const TOUR_FADE_IN = 0.1;
// Messages land across [CONTENT_START, CONTENT_END]; the tail is a dwell where the
// full conversation and the CTA sit still before the window comes.
const CONTENT_START = 0.14;
const CONTENT_END = 0.85;
// The bubbles clear as the window slides up over them, handing the conversation to
// the real thread (same messages) inside the window.
const SLIDE_BUBBLE_FADE = 0.4;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

type TourState = { count: number; typingId: string | null; cta: boolean };

/**
 * The hero is the kordeon mark and headline. Scroll and it rises out of the way as
 * Korde types you a tour — the #welcome messages arrive one by one, scrubbed to the
 * wheel, centred on screen, ending on a "Try it out" beat. Keep scrolling (or click
 * it) and the product window slides up from below and lands around that
 * conversation, which becomes the live thread — nothing resets.
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
  const tourRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // The tour bubbles are React-rendered (real ChatMessage rows), so their reveal is
  // state — but it only changes at the handful of message boundaries, never per
  // frame, so the scroll loop stays on the compositor. `mounted` keeps the tour
  // client-only: SSR serves the plain hero + full product beneath.
  const [mounted, setMounted] = useState(false);
  const [tour, setTour] = useState<TourState>({ count: 0, typingId: null, cta: false });
  const tourStateRef = useRef<TourState>({ count: 0, typingId: null, cta: false });

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
    setMounted(true);
    const wrap = wrapRef.current;
    const intro = introRef.current;
    const tourEl = tourRef.current;
    const frame = frameRef.current;
    if (!(wrap && intro && tourEl && frame)) {
      return;
    }

    // Reduced motion: drop the movement (tour scrub or slide) but still fade the
    // window in rather than hard-cutting — fewer and gentler, not zero.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.style.display = 'none';
      tourEl.style.display = 'none';
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

    // Only the resize-variant geometry is measured here (and on resize), so the
    // per-frame loop does zero forced layout: it reads `window.scrollY` — which
    // doesn't flush layout — and writes only compositor transforms.
    let total = 0;
    let wrapTop = 0;
    const measure = () => {
      total = Math.max(0, wrap.offsetHeight - window.innerHeight);
      wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
    };

    // The hero scrolls up and fades as the tour begins, clearing the centre for the
    // conversation.
    const updateHero = (tourProgress: number) => {
      const gone = smoothstep(clamp01(tourProgress / HERO_FADE_END));
      intro.style.transform = `translateY(${-HERO_RISE_VH * gone}vh)`;
      intro.style.opacity = `${1 - gone}`;
      intro.style.pointerEvents = tourProgress > 0.04 ? 'none' : 'auto';
    };

    // The tour: centred bubbles land one by one as the visitor scrolls, then the
    // whole column fades as the window slides up over it — the real thread (same
    // messages) takes its place inside the landed window.
    const updateTour = ({ tourProgress, reveal }: { tourProgress: number; reveal: number }) => {
      const p = clamp01((tourProgress - CONTENT_START) / (CONTENT_END - CONTENT_START));
      const count = Math.min(TOUR_N, Math.floor(p * TOUR_N));
      const cta = count >= TOUR_N;
      const typingId = cta ? null : (TOUR_AUTHORS[count] ?? null);
      const prev = tourStateRef.current;
      if (count !== prev.count || typingId !== prev.typingId || cta !== prev.cta) {
        tourStateRef.current = { count, typingId, cta };
        setTour({ count, typingId, cta });
      }

      const fadeIn = smoothstep(tourProgress / TOUR_FADE_IN);
      const fadeOut = 1 - smoothstep(reveal / SLIDE_BUBBLE_FADE);
      tourEl.style.opacity = `${fadeIn * fadeOut}`;
      // The CTA stays clickable through the dwell; once the slide is under way the
      // scroll has taken over anyway.
      tourEl.style.pointerEvents = cta && reveal < 0.02 ? 'auto' : 'none';
    };

    // The pre-#34 reveal, restored: the product slides up from fully below to
    // full-bleed, scaling and shedding its rounding + shadow as it lands — a
    // screenshot sliding into view. It starts off-screen (not a peek) so it stays
    // out of sight behind the tour above it. `rest` is the inverse of the eased
    // progress, so the offset, rounding and shadow all relax to 0 as it lands.
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
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, [openFullOnLoad]);

  return (
    <div ref={wrapRef} className="relative h-[320vh]">
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

        {/* The window slides up from below and lands around the conversation. */}
        <div
          ref={frameRef}
          className="tour-frame absolute inset-0 z-20 overflow-hidden bg-card"
          style={{ opacity: 0, transformOrigin: 'center', pointerEvents: 'none' }}
        >
          {children}
        </div>

        {/* The tour bubbles, centred, riding above the sliding window and fading as
            it covers them — the real thread (same messages) takes over. */}
        <div
          ref={tourRef}
          className="pointer-events-none absolute inset-0 z-30"
          style={{ opacity: 0 }}
        >
          {mounted ? <TourColumn tour={tour} onCta={revealProduct} /> : null}
        </div>
      </div>
    </div>
  );
}

// The bubble column, centred on screen below where the headline was — a clean chat
// preview the window then slides in around. Rendered with the real ChatMessage rows
// so the conversation is byte-identical to the live thread it becomes.
function TourColumn({ tour, onCta }: { tour: TourState; onCta: () => void }) {
  const shown = TOUR_MESSAGES.slice(0, tour.count);
  return (
    <WorkspaceProvider people={PEOPLE} currentUserId="you" mentionSuggestions={MENTION_SUGGESTIONS}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-5">
          {shown.map((message) => (
            <div
              key={message.id}
              className="duration-300 animate-in fade-in slide-in-from-bottom-2"
            >
              <ChatMessage message={message} />
            </div>
          ))}
          {tour.typingId ? <ThreadTypingRow ids={[tour.typingId]} /> : null}
          {tour.cta ? (
            <div className="pointer-events-auto flex justify-center pt-4 duration-300 animate-in fade-in slide-in-from-bottom-2">
              <button
                type="button"
                onClick={onCta}
                className={cn(buttonVariants({ size: 'lg' }), 'gap-2 shadow-lg')}
              >
                Try it out
                <ArrowDown className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </WorkspaceProvider>
  );
}
