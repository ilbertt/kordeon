// biome-ignore-all lint/style/noMagicNumbers: scroll-scrub interpolation constants
import { buttonVariants } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { WorkspaceProvider } from '@repo/ui/custom/workspace/context';
import { ChatMessage, ThreadTypingRow } from '@repo/ui/custom/workspace/message';
import { cn } from '@repo/ui/lib/utils';
import { ArrowDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '#hooks/use-isomorphic-layout-effect';
import { barBase, barGeometry, MORPH_BARS, morphPhases, SIDEBAR_BP } from './logo-morph-geometry';
import { ChannelSlug, channelBySlug, MENTION_SUGGESTIONS, PEOPLE } from './product-window/data';

const LOGO_SLOT_PX = 132;

// The tour is the #welcome thread, scrubbed to scroll: the same messages that top
// the live chat, so the window forms around the very conversation you just read.
const TOUR_MESSAGES = channelBySlug(ChannelSlug.Welcome)?.messages ?? [];
const TOUR_AUTHORS = TOUR_MESSAGES.map((message) => (message.kind === 'msg' ? message.from : null));
const TOUR_N = TOUR_MESSAGES.length;

// Fraction of the scroll track spent on the tour; the rest runs the morph. The
// wrapper is tall enough (h-[320vh]) that each gets a comfortable stretch.
const TOUR_FRACTION = 0.55;
// The headline clears almost immediately as Korde starts typing; the mark lingers
// a touch longer, then hands the reveal to the bars when the morph begins.
const HEADLINE_FADE_END = 0.1;
const MARK_FADE_END = 0.2;
// The bubbles fade in just after the headline starts leaving.
const TOUR_FADE_IN = 0.08;
// Messages land across [CONTENT_START, CONTENT_END]; the tail of the tour is a
// dwell where the full conversation and the "Try it out" CTA sit still before the
// morph, so the closing beat gets a moment to read.
const CONTENT_START = 0.16;
const CONTENT_END = 0.82;
// The bubbles clear fast once the morph starts — before the mark blooms big and
// centred — so the growing bars never collide with the still-crisp conversation.
// The real thread (same messages, same place) takes over as the window lands.
const MORPH_BUBBLE_FADE = 0.22;
// With the mark gone through the tour, the bars bloom back in over this lead-in as
// the morph begins, then grow into the panels.
const BARS_LEAD_IN = 0.1;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

type TourState = { count: number; typingId: string | null; cta: boolean };

/**
 * The hero is the kordeon mark and headline. Scroll and Korde types you a tour —
 * the #welcome messages arrive one by one, scrubbed to the wheel, ending on a
 * "Try it out" beat. Click it (or keep scrolling) and the mark metamorphoses into
 * the product: on desktop the three bars unfold into the three panels while the
 * real window fades in over them, forming around the chat column the tour bubbles
 * already sit in. The maths lives in `logo-morph-geometry`.
 *
 * On mobile the window's side panels are drawers, so there are no three columns
 * for the bars to become. Below the sidebar breakpoint we keep the tour but drop
 * the morph for the pre-#34 reveal: the window scales up from a peek at the
 * bottom, like a screenshot sliding into view. Both are scroll-driven off the
 * same track, so the CTA and deep-links work either way.
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
  const headlineRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Array<HTMLDivElement | null>>([]);
  const tourRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // The tour bubbles are React-rendered (real ChatMessage rows), so their reveal
  // is state — but it only changes at the handful of message boundaries, never
  // per frame, so the scroll loop stays on the compositor. `mounted` keeps the
  // tour client-only: SSR serves the plain hero + full product beneath.
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
    const headline = headlineRef.current;
    const slot = slotRef.current;
    const bars = barsRef.current;
    const tourEl = tourRef.current;
    const frame = frameRef.current;
    if (!(wrap && intro && headline && slot && bars && tourEl && frame)) {
      return;
    }

    // Reduced motion: drop the movement (tour scrub or morph) but still fade the
    // window in rather than hard-cutting — fewer and gentler, not zero.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.style.display = 'none';
      bars.style.display = 'none';
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

    // Everything that only changes on resize is measured once here (and on
    // resize), so the per-frame loop does zero forced layout: it reads
    // `window.scrollY` — which doesn't flush layout — and writes only compositor
    // transforms. The viewport also picks which reveal runs; crossing the
    // breakpoint on resize re-measures and hands off cleanly.
    let mobile = false;
    let total = 0;
    let wrapTop = 0;
    let stage = { width: 0, height: 0 };
    let slotRect = { left: 0, top: 0, width: 0 };
    const bases: Array<{ width: number; height: number }> = [];
    const measure = () => {
      stage = { width: window.innerWidth, height: window.innerHeight };
      total = Math.max(0, wrap.offsetHeight - window.innerHeight);
      wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
      mobile = stage.width < SIDEBAR_BP;
      // The mark and its tweened bars only belong to the morph; the slide-up
      // grows the window off its top edge.
      slot.style.display = mobile ? 'none' : '';
      bars.style.display = mobile ? 'none' : '';
      frame.style.transformOrigin = mobile ? 'top center' : 'center';
      if (mobile) {
        return;
      }
      // Back on desktop: clear any slide-up residue before the morph resumes, and
      // re-pin each bar's resting size so the scroll drives a pure `scale()` off
      // it instead of relaying out the box every frame.
      frame.style.borderRadius = '';
      frame.style.boxShadow = '';
      intro.style.transform = '';
      const box = slot.getBoundingClientRect();
      slotRect = { left: box.left, top: box.top, width: box.width };
      for (const [index] of MORPH_BARS.entries()) {
        const el = barRefs.current[index];
        if (!el) {
          continue;
        }
        const base = barBase({ index, slot: slotRect });
        bases[index] = base;
        el.style.width = `${base.width}px`;
        el.style.height = `${base.height}px`;
      }
    };

    const updateMorph = (progress: number) => {
      for (const [index] of MORPH_BARS.entries()) {
        const el = barRefs.current[index];
        const base = bases[index];
        if (!(el && base)) {
          continue;
        }
        const r = barGeometry({ index, progress, stage, slot: slotRect });
        const sx = base.width > 0 ? r.width / base.width : 0;
        const sy = base.height > 0 ? r.height / base.height : 0;
        // border-radius rides the transform, so author it pre-scale to render
        // `r.radius` on the (dominant) horizontal axis — exact at rest where the
        // mark reads, and ≈0 by the panels where corners go sharp anyway.
        el.style.transform = `translate(${r.left}px, ${r.top}px) scale(${sx}, ${sy})`;
        el.style.borderRadius = sx > 0 ? `${r.radius / sx}px` : '0px';
      }

      const phases = morphPhases({ progress });
      // The crisp mark faded during the tour; the bars carry the reveal, blooming
      // back in over the lead-in before they grow.
      bars.style.opacity = `${phases.barsOpacity * smoothstep(progress / BARS_LEAD_IN)}`;
      frame.style.opacity = `${phases.productOpacity}`;
      frame.style.transform = `scale(${phases.productScale})`;
      frame.style.pointerEvents = phases.productOpacity > 0.99 ? 'auto' : 'none';
    };

    // The reveal kept for mobile: the product slides up from fully below to
    // full-bleed as the morph progresses. It starts off-screen (not a peek) so it
    // stays out of sight through the tour above it, then rises. `rest` is the
    // inverse of the eased progress, so the offset, rounding and shadow all relax
    // to 0 as the window lands.
    const updateSlide = (progress: number) => {
      const ease = smoothstep(progress);
      const rest = 1 - ease;
      const startScale = 0.92;
      const scale = startScale + (1 - startScale) * ease;
      frame.style.opacity = '1';
      frame.style.transform = `translateY(${100 * rest}vh) scale(${scale})`;
      frame.style.borderRadius = `${22 * rest}px`;
      frame.style.boxShadow = `0 ${6 * rest}px ${50 * rest}px rgb(0 0 0 / ${0.18 * rest})`;
      frame.style.pointerEvents = ease > 0.99 ? 'auto' : 'none';
    };

    // The tour: the headline and mark clear, then the bubbles land one by one as
    // the visitor scrolls, and the whole column fades out exactly as the product
    // materializes — so the real thread (the same messages) takes its place under
    // the forming window. `morph` is the morph/slide progress, used only to time
    // that handoff.
    const updateTour = ({ tourProgress, morph }: { tourProgress: number; morph: number }) => {
      headline.style.opacity = `${1 - smoothstep(tourProgress / HEADLINE_FADE_END)}`;
      headline.style.pointerEvents = tourProgress > 0.04 ? 'none' : 'auto';
      slot.style.opacity = `${1 - smoothstep(tourProgress / MARK_FADE_END)}`;

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
      const fadeOut = 1 - smoothstep(morph / MORPH_BUBBLE_FADE);
      tourEl.style.opacity = `${fadeIn * fadeOut}`;
      // The CTA stays clickable through the dwell; once the morph is under way the
      // scroll has taken over anyway.
      tourEl.style.pointerEvents = cta && morph < 0.02 ? 'auto' : 'none';
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const scrolled = window.scrollY - wrapTop;
      const tourEnd = total * TOUR_FRACTION;
      let tourProgress = 1;
      let morph = 0;
      if (total <= 0) {
        tourProgress = 1;
        morph = 1;
      } else if (scrolled <= tourEnd) {
        tourProgress = tourEnd > 0 ? clamp01(scrolled / tourEnd) : 1;
        morph = 0;
      } else {
        tourProgress = 1;
        morph = clamp01((scrolled - tourEnd) / (total - tourEnd));
      }
      updateTour({ tourProgress, morph });
      if (mobile) {
        updateSlide(morph);
      } else {
        updateMorph(morph);
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
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center"
        >
          {/* The resting mark. It fades as Korde starts typing; the bars bloom back
              in to metamorphose once the morph begins. Hidden on mobile, where the
              mark doesn't morph. */}
          <div ref={slotRef} aria-hidden style={{ width: LOGO_SLOT_PX, height: LOGO_SLOT_PX }}>
            <KordeonMark className="size-full" />
          </div>
          {/* Split from the mark so it can clear on its own as the tour begins. */}
          <div ref={headlineRef}>
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
        </div>

        <div
          ref={frameRef}
          className="tour-frame absolute inset-0 z-20 overflow-hidden bg-card"
          style={{ opacity: 0, transformOrigin: 'center', pointerEvents: 'none' }}
        >
          {children}
        </div>

        <div ref={barsRef} className="pointer-events-none absolute inset-0 z-30">
          {[...MORPH_BARS.entries()].map(([index, bar]) => (
            <div
              key={bar.key}
              ref={(el) => {
                barRefs.current[index] = el;
              }}
              className={cn(
                'absolute top-0 left-0 origin-top-left will-change-transform',
                bar.tone === 'orange' ? 'bg-[#ff6900]' : 'bg-[#00bba7] dark:bg-[#00786f]',
              )}
            />
          ))}
        </div>

        {/* The tour bubbles ride above the forming window and fade out as it
            materializes, revealing the identical real thread beneath. */}
        <div
          ref={tourRef}
          className="pointer-events-none absolute inset-0 z-40"
          style={{ opacity: 0 }}
        >
          {mounted ? <TourColumn tour={tour} onCta={revealProduct} /> : null}
        </div>
      </div>
    </div>
  );
}

// The bubble column. Positioned to match the real chat panel — full width below
// the sidebar breakpoint, inset by the sidebar at md+ and the preview at xl+, and
// starting below where the two 56px header bars will be — so when the window
// materializes the conversation is already sitting in its middle panel.
function TourColumn({ tour, onCta }: { tour: TourState; onCta: () => void }) {
  const shown = TOUR_MESSAGES.slice(0, tour.count);
  return (
    <WorkspaceProvider people={PEOPLE} currentUserId="you" mentionSuggestions={MENTION_SUGGESTIONS}>
      <div className="absolute top-28 right-0 bottom-0 left-0 overflow-hidden md:left-64 xl:right-[22rem]">
        <div className="flex h-full flex-col gap-5 px-5 pt-6 sm:px-8">
          {shown.map((message) => (
            <div
              key={message.id}
              className="duration-300 animate-in fade-in slide-in-from-bottom-2"
            >
              <ChatMessage message={message} />
            </div>
          ))}
          {tour.typingId ? <ThreadTypingRow ids={[tour.typingId]} /> : null}
        </div>
        {tour.cta ? (
          <div className="pointer-events-auto absolute inset-x-0 bottom-8 flex justify-center px-5 duration-300 animate-in fade-in slide-in-from-bottom-2">
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
    </WorkspaceProvider>
  );
}
