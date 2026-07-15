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
// The headline clears this early into the reveal, before the product materialises.
const HERO_REVEAL_FADE = 0.4;
const WIN_FORM_START = 0.04;
const WIN_FORM_END = 0.15;
const REVEAL_RISE_VH = 12;

// The reveal is one continuous metamorphosis, ported from the logo→product morph: the
// cheap shell *grows* into the product's shape *first*, and only once that shape already
// matches does the real UI crossfade in over it — never a curtain opening on a static
// product. The single window the visitor was reading (`win`) is that shell: its frame
// grows from the tour rect to full-bleed and its side panels unfold (`open` / `panels`,
// done by `GROW_END`) around the still-readable chat; then the live product materialises
// over the now full-size, aligned shell (`materialize`), the shell dissolving in lockstep
// so the same chat lines sharpen into the real thread instead of a second copy ghosting.
const PANELS_START = 0.06;
const PANELS_END = 0.6;
const GROW_END = 0.66;
const MATERIALIZE_START = 0.66;
const MATERIALIZE_END = 0.97;
const WINDOW_RADIUS_PX = 16;
// The shell's chrome: the tour title bar grows into the product's top bar, and the two
// side columns open to the product's real panel widths. These track the workspace
// layout (sidebar `w-64`, preview `w-[22rem]`, top bar `h-14`) and the breakpoints that
// drop each side panel — off them a column stays collapsed, exactly as the product will.
const TOUR_TOPBAR_PX = 36;
const PRODUCT_TOPBAR_PX = 56;
const SIDEBAR_W = 256;
const PREVIEW_W = 352;
const SIDEBAR_BP = 768;
const PREVIEW_BP = 1280;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const mix = ({ a, b, t }: { a: number; b: number; t: number }) => a + (b - a) * t;

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
 * shows, then that same window *grows* into the full product — its frame expanding to
 * full-bleed and its panels unfolding around the chat you were reading, the real UI
 * resolving in over the matched shape. Nothing resets.
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
  const skelTopRef = useRef<HTMLDivElement>(null);
  const skelLeftRef = useRef<HTMLDivElement>(null);
  const skelRightRef = useRef<HTMLDivElement>(null);
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

    const skelTop = skelTopRef.current;
    const skelLeft = skelLeftRef.current;
    const skelRight = skelRightRef.current;

    // Reduced motion: drop the movement (tour forming or the grow) but still fade the
    // product in rather than hard-cutting — fewer and gentler, not zero.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.style.display = 'none';
      win.style.display = 'none';
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
    // The tour window's rect in px (matching the card's CSS: top 34vh, bottom 8vh,
    // centred, width min(760, 92vw)) and the product's panel metrics — so the shell
    // grows from exactly the window's edges to the product's real layout. Measured on
    // resize only; the loop stays layout-free above the shell's own contained reflow.
    let clip = { top: 0, right: 0, bottom: 0, left: 0 };
    let shell = { sidebar: 0, preview: 0, topbar: PRODUCT_TOPBAR_PX };
    const measure = () => {
      total = Math.max(0, wrap.offsetHeight - window.innerHeight);
      wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const winW = Math.min(760, vw * 0.92);
      const side = (vw - winW) / 2;
      clip = { top: vh * 0.34, right: side, bottom: vh * 0.08, left: side };
      shell = {
        sidebar: vw >= SIDEBAR_BP ? SIDEBAR_W : 0,
        preview: vw >= PREVIEW_BP ? PREVIEW_W : 0,
        topbar: PRODUCT_TOPBAR_PX,
      };
    };

    const mark = markRef.current;
    const heroCta = heroCtaRef.current;

    // The headline shrinks and rises into a compact title above the window (and clears
    // in the reveal); the mark and CTA fade as it goes, leaving just the headline +
    // tagline. Scaling about the viewport centre keeps it centred as it shrinks. It
    // fades out early in the reveal (`HERO_REVEAL_FADE`), well before the product
    // materialises, so it never ghosts over the app.
    const updateHero = ({ form, reveal }: { form: number; reveal: number }) => {
      const scale = 1 - (1 - HERO_SCALE) * form;
      intro.style.transform = `translateY(${-(HERO_RISE_VH * form + REVEAL_RISE_VH * reveal)}vh) scale(${scale})`;
      intro.style.opacity = `${1 - smoothstep(clamp01(reveal / HERO_REVEAL_FADE))}`;
      intro.style.pointerEvents = form > 0.05 ? 'none' : 'auto';
      if (mark) {
        mark.style.opacity = `${1 - form}`;
      }
      if (heroCta) {
        heroCta.style.opacity = `${1 - form}`;
        heroCta.style.pointerEvents = form > 0.05 ? 'none' : 'auto';
      }
    };

    // The window is the shell. `form` fades and lifts it in as Korde starts (Act 1);
    // `reveal` then grows it into the product (Act 2): its frame expands to full-bleed
    // (`open`) and its top bar + side columns unfold to the product's real metrics
    // (`panels`) around the still-readable chat, *finishing* the shape by `GROW_END`.
    // Only then does it dissolve in lockstep with the live product crossfading in over
    // the matched shape (`materialize`) — so the window *becomes* the app, the same chat
    // lines sharpening into the real thread, never a curtain over a static product.
    const updateWindow = ({ form, reveal }: { form: number; reveal: number }) => {
      const open = smoothstep(clamp01(reveal / GROW_END));
      const grow = 1 - open;
      const panels = smoothstep(clamp01((reveal - PANELS_START) / (PANELS_END - PANELS_START)));
      const materialize = smoothstep(
        clamp01((reveal - MATERIALIZE_START) / (MATERIALIZE_END - MATERIALIZE_START)),
      );

      win.style.top = `${clip.top * grow}px`;
      win.style.right = `${clip.right * grow}px`;
      win.style.bottom = `${clip.bottom * grow}px`;
      win.style.left = `${clip.left * grow}px`;
      win.style.borderRadius = `${WINDOW_RADIUS_PX * grow}px`;
      win.style.opacity = `${form * (1 - materialize)}`;
      win.style.transform = `translateY(${(1 - form) * 3}vh)`;
      win.style.filter = materialize > 0 && materialize < 1 ? `blur(${4 * materialize}px)` : 'none';
      win.style.pointerEvents = materialize > 0.5 ? 'none' : 'auto';

      if (skelTop) {
        skelTop.style.height = `${mix({ a: TOUR_TOPBAR_PX, b: shell.topbar, t: panels })}px`;
      }
      if (skelLeft) {
        skelLeft.style.width = `${shell.sidebar * panels}px`;
        skelLeft.style.opacity = `${panels}`;
      }
      if (skelRight) {
        skelRight.style.width = `${shell.preview * panels}px`;
        skelRight.style.opacity = `${panels}`;
      }

      frame.style.opacity = `${materialize}`;
      frame.style.filter =
        materialize > 0 && materialize < 1 ? `blur(${8 * (1 - materialize)}px)` : 'none';
      frame.style.pointerEvents = materialize >= 1 ? 'auto' : 'none';
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

        {/* The window is the shell that grows into the product. It forms around Korde's
            tour as a plain framed card — a title bar and the chat — then, in the reveal,
            its frame expands to full-bleed while its top bar and side columns unfold to
            the product's real layout around the chat. The live product then crossfades
            in over the matched shape (see `frame`), and this dissolves behind it. */}
        <div
          ref={windowRef}
          className="absolute z-20 flex flex-col overflow-hidden border border-border bg-card shadow-2xl will-change-transform"
          style={{
            top: '34vh',
            bottom: '8vh',
            left: 'calc((100% - min(760px, 92vw)) / 2)',
            right: 'calc((100% - min(760px, 92vw)) / 2)',
            borderRadius: `${WINDOW_RADIUS_PX}px`,
            opacity: 0,
            transform: 'translateY(3vh)',
          }}
        >
          <div
            ref={skelTopRef}
            className="flex shrink-0 items-center gap-2 border-border border-b px-4"
            style={{ height: TOUR_TOPBAR_PX }}
          >
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            </span>
            <span className="ml-1 text-muted-foreground text-xs">#welcome</span>
          </div>
          <div className="flex min-h-0 flex-1">
            {/* The side columns open to the product's real panel widths as the window
                grows — muted placeholders the live UI paints over when it materialises. */}
            <div
              ref={skelLeftRef}
              aria-hidden
              className="shrink-0 overflow-hidden border-border border-r bg-muted/20"
              style={{ width: 0, opacity: 0 }}
            />
            {/* The conversation, bottom-anchored and width-capped so the newest message
                and the typing row sit at the reading line — a real chat, played by
                scroll — and land exactly where the product's #welcome thread will as the
                window grows. Pointer-events on so reactions and mention tags are live. */}
            <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-5 pt-6 pb-6">
              {mounted ? (
                <WorkspaceProvider
                  people={PEOPLE}
                  currentUserId="you"
                  mentionSuggestions={MENTION_SUGGESTIONS}
                >
                  {/* Left-aligned + width-capped to match the product's own chat
                      (`px-5`, `max-w-44rem`, left-aligned) so, as the window grows, the
                      messages sit exactly where the live thread's do — the crossfade
                      reinforces the same lines instead of ghosting a shifted copy. */}
                  <div className="pointer-events-auto flex w-full max-w-[44rem] flex-col">
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
            <div
              ref={skelRightRef}
              aria-hidden
              className="shrink-0 overflow-hidden border-border border-l bg-muted/20"
              style={{ width: 0, opacity: 0 }}
            />
          </div>
        </div>

        {/* The live product. It stays hidden until the shell above has grown into its
            shape, then crossfades in over it (blurred over the hand-off) — the window
            *becoming* the app, not a curtain lifting on a static screenshot. */}
        <div
          ref={frameRef}
          className="tour-frame absolute inset-0 z-30 overflow-hidden bg-card"
          style={{
            opacity: 0,
            pointerEvents: 'none',
            willChange: 'opacity, filter',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
