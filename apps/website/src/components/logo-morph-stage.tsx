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
// window that forms around them opens straight into the very conversation you watched.
const TOUR_MESSAGES = channelBySlug(ChannelSlug.Welcome)?.messages ?? [];
const TOUR_N = TOUR_MESSAGES.length;
const authorOf = (message: Message) => (message.kind === 'msg' ? message.from : null);

// Scroll-driven playback: the conversation plays out like a real chat, but *scroll is
// the clock*. Korde's typing indicator is pinned at the bottom the whole time — as if
// the agent is always ready to send the next line. Each scroll beat (`PER_MSG_VH`,
// generous so the reader sets the pace) sends the message it's typing. A trailing beat
// swaps the typing row for the CTA. The wrapper is sized from all the beats, plus the
// reveal where the simple window expands into the full product.
const PER_MSG_VH = 50;
const REVEAL_VH = 120;
const TOUR_BEATS = TOUR_N + 1;
const TOUR_VH = TOUR_BEATS * PER_MSG_VH;
const WRAP_VH = 100 + TOUR_VH + REVEAL_VH;
const TOUR_FRACTION = TOUR_VH / (TOUR_VH + REVEAL_VH);
// A hair of scroll before Korde starts typing, so the hero reads clean at rest.
const START_GATE = 0.02;
// The hero rises and shrinks into a compact title above the window; its mark and CTA
// fade out. It's *staggered ahead* of the window forming (finishing by `HERO_FORM_END`)
// so the headline has cleared the window's top before the chrome appears — otherwise
// the two cross through each other. The window then forms over its own window.
const HERO_RISE_VH = 34;
const HERO_SCALE = 0.82;
const HERO_FORM_END = 0.05;
const WIN_FORM_START = 0.04;
const WIN_FORM_END = 0.15;
// The reveal: the window *grows* into the product. A `clip-path` opens the product from
// the window's rect to full-bleed while its content resolves in (opacity), and a visible
// window-frame overlay grows alongside so it reads as the window expanding, not a curtain
// dropping. `REVEAL_RESOLVE` is the fraction of the reveal over which the product resolves
// in (the tour chat handing off to the product's, blurred to blend); the frame overlay
// fades out over the last stretch as it reaches full-bleed (edges = the viewport).
const REVEAL_RISE_VH = 12;
const REVEAL_RESOLVE = 0.6;
// The tour window fades out ahead of the product resolving in, so its window-specific
// chrome (title bar, CTA) doesn't linger doubled over the product.
const REVEAL_WIN_GONE = 0.38;
const WINDOW_RADIUS_PX = 16;

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
 * The hero is the kordeon mark and headline. Scroll and the headline stays as a title
 * while a simple window *forms around* Korde's tour: the chrome fades and scales in as
 * the agent starts talking, and the #welcome messages play out inside it like a real
 * chat (scroll is the clock, the typing row pinned at the bottom). At the end the CTA
 * shows, then the little window expands and hands off to the full-bleed product — the
 * same conversation, now live. Nothing resets.
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
  const windowRef = useRef<HTMLDivElement>(null);
  const frameBorderRef = useRef<HTMLDivElement>(null);
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
    const win = windowRef.current;
    const frame = frameRef.current;
    if (!(mounted && wrap && intro && win && frame)) {
      return;
    }

    const frameBorder = frameBorderRef.current;

    // Reduced motion: drop the movement (tour forming or reveal) but still fade the
    // window in rather than hard-cutting — fewer and gentler, not zero.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.style.display = 'none';
      win.style.display = 'none';
      if (frameBorder) {
        frameBorder.style.display = 'none';
      }
      frame.style.clipPath = 'none';
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
    // The window's rect in px (matching the card's CSS: top 34vh, bottom 8vh, centred,
    // width min(760, 92vw)), so the reveal's clip-path and the frame overlay grow from
    // exactly its edges to full-bleed. Measured on resize only — the loop stays
    // layout-free.
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

    // The headline shrinks and rises into a compact title above the window (and clears
    // in the reveal); the mark and CTA fade as it goes, leaving just the headline +
    // tagline. Scaling about the viewport centre keeps it centred as it shrinks.
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

    // The simple window forms around the chat as Korde starts (`form`), holds through the
    // conversation, then in the reveal hands its chat to the product's: it stays put
    // (aligned) and fades — blurred — as the product resolves in over the same rect, so
    // the messages never jump. Gone by the time the product is opaque.
    const updateWindow = ({ form, reveal }: { form: number; reveal: number }) => {
      const gone = smoothstep(clamp01(reveal / REVEAL_WIN_GONE));
      win.style.opacity = `${form * (1 - gone)}`;
      win.style.transform = `translate(-50%, ${(1 - form) * 3}vh) scale(${0.96 + 0.04 * form})`;
      win.style.filter = gone > 0 && gone < 1 ? `blur(${5 * gone}px)` : 'none';
    };

    // The reveal grows the window into the product. The product is full-bleed at final
    // layout throughout; a `clip-path` opens it from the window's rect to full-bleed with
    // an ease-in-out (so it never scales or reflows), while its content resolves in
    // (opacity, blurred over the handoff). The frame overlay is a hollow bordered box
    // that grows on exactly the same rect — the visible window frame expanding — and
    // fades out over the last stretch as its edges reach the viewport.
    const updateReveal = (reveal: number) => {
      const open = smoothstep(reveal);
      const rest = 1 - open;
      const resolve = smoothstep(clamp01(reveal / REVEAL_RESOLVE));
      frame.style.opacity = `${resolve}`;
      frame.style.filter = resolve > 0 && resolve < 1 ? `blur(${3 * (1 - resolve)}px)` : 'none';
      if (open >= 1) {
        frame.style.clipPath = 'none';
        frame.style.pointerEvents = 'auto';
      } else {
        const t = clip.top * rest;
        const r = clip.right * rest;
        const b = clip.bottom * rest;
        const l = clip.left * rest;
        frame.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px round ${WINDOW_RADIUS_PX * rest}px)`;
        frame.style.pointerEvents = 'none';
      }

      if (frameBorder) {
        // Fades in with the window's own border as it takes over, out as it hits full-bleed.
        const shown =
          smoothstep(clamp01(reveal / 0.06)) * (1 - smoothstep(clamp01((reveal - 0.7) / 0.3)));
        frameBorder.style.opacity = `${shown}`;
        frameBorder.style.top = `${clip.top * rest}px`;
        frameBorder.style.right = `${clip.right * rest}px`;
        frameBorder.style.bottom = `${clip.bottom * rest}px`;
        frameBorder.style.left = `${clip.left * rest}px`;
        frameBorder.style.borderRadius = `${WINDOW_RADIUS_PX * rest}px`;
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
      // The heading rises first, then the window forms — so they never cross.
      const formHero = smoothstep(clamp01(tourProgress / HERO_FORM_END));
      const formWin = smoothstep(
        clamp01((tourProgress - WIN_FORM_START) / (WIN_FORM_END - WIN_FORM_START)),
      );
      updateHero({ form: formHero, reveal });
      updateWindow({ form: formWin, reveal });
      updateReveal(reveal);

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
      {/* Landing-only overrides on the shared chat scroller (scoped to `.tour-frame`):
          relax `overscroll-contain` so scrolling up past the top of the messages rewinds
          the reveal instead of trapping the wheel, and bottom-anchor + width-cap the
          messages so the product's #welcome thread sits exactly where the tour's did —
          same content, same place — for a seamless hand-off as the window grows. */}
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
            onClick={revealProduct}
            className={cn(buttonVariants({ size: 'lg' }), 'mt-8 gap-2')}
          >
            Try it now
            <ArrowDown className="size-4" />
          </button>
        </div>

        {/* The simple window that forms around the conversation. It's a plain framed
            card — a title bar and the chat — so it reads as a window without pretending
            to be the whole product yet; that arrives when it expands in the reveal. */}
        <div
          ref={windowRef}
          className="absolute top-[34vh] bottom-[8vh] left-1/2 z-20 flex w-[min(760px,92vw)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          style={{
            opacity: 0,
            transformOrigin: 'center',
            transform: 'translate(-50%, 3vh) scale(0.96)',
          }}
        >
          <div className="flex h-9 shrink-0 items-center gap-2 border-border border-b px-4">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            </span>
            <span className="ml-1 text-muted-foreground text-xs">#welcome</span>
          </div>
          {/* The conversation, bottom-anchored so the newest message and the typing
              row sit at the reading line with history above — a real chat, played by
              scroll. Pointer-events on so the reactions and mention tags are live. */}
          <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-4 pt-4 pb-6">
            {mounted ? (
              <WorkspaceProvider
                people={PEOPLE}
                currentUserId="you"
                mentionSuggestions={MENTION_SUGGESTIONS}
              >
                <div className="pointer-events-auto flex w-full flex-col">
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
        </div>

        {/* The product. During the reveal a `clip-path` grows it from the window's rect
            to full-bleed while its content resolves in — the window growing into the app. */}
        <div
          ref={frameRef}
          className="tour-frame absolute inset-0 z-30 overflow-hidden bg-card"
          style={{
            opacity: 0,
            pointerEvents: 'none',
            clipPath: 'inset(34vh calc((100% - min(760px, 92vw)) / 2) 8vh round 16px)',
            willChange: 'clip-path, opacity',
          }}
        >
          {children}
        </div>

        {/* The visible window frame: a hollow bordered box that grows on the same rect as
            the clip, so the eye reads the window *expanding* to full-screen rather than a
            curtain dropping. It fades out as its edges reach the viewport. */}
        <div
          ref={frameBorderRef}
          aria-hidden
          className="pointer-events-none absolute z-40 border border-border/70"
          style={{
            opacity: 0,
            top: '34vh',
            bottom: '8vh',
            left: 'calc((100% - min(760px, 92vw)) / 2)',
            right: 'calc((100% - min(760px, 92vw)) / 2)',
            borderRadius: '16px',
            boxShadow: '0 24px 60px rgb(0 0 0 / 0.35)',
          }}
        />
      </div>
    </div>
  );
}
