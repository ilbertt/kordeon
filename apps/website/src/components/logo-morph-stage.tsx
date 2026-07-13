// biome-ignore-all lint/style/noMagicNumbers: scroll-scrub interpolation constants
import { buttonVariants } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { cn } from '@repo/ui/lib/utils';
import { ArrowDown } from 'lucide-react';
import { useRef } from 'react';
import { useIsomorphicLayoutEffect } from '#hooks/use-isomorphic-layout-effect';
import { barBase, barGeometry, MORPH_BARS, morphPhases, SIDEBAR_BP } from './logo-morph-geometry';

const LOGO_SLOT_PX = 132;

/**
 * The hero is the kordeon mark. On desktop, scroll (or hit "Try it now") and the
 * three bars grow, then unfold into the product's three panels while the real
 * window fades in over them and becomes usable — the logo metamorphosing into
 * the app. The maths lives in `logo-morph-geometry`.
 *
 * On mobile the window's side panels are drawers, so there are no three columns
 * for the bars to become and the mark-into-panels reading falls apart. Below the
 * sidebar breakpoint we drop the morph and keep the pre-#34 reveal: the window
 * scales up from a peek at the bottom, like a screenshot sliding into view. Both
 * are scroll-driven off the same track, so the CTA and deep-links work either way.
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
  const slotRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<HTMLDivElement>(null);

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
    const slot = slotRef.current;
    const bars = barsRef.current;
    const frame = frameRef.current;
    if (!(wrap && intro && slot && bars && frame)) {
      return;
    }

    // Reduced motion: drop the movement (morph or slide) but still fade the
    // window in rather than hard-cutting — fewer and gentler, not zero.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.style.display = 'none';
      bars.style.display = 'none';
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

    let raf = 0;
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
      slot.style.opacity = `${phases.logoOpacity}`;
      intro.style.opacity = `${phases.introOpacity}`;
      intro.style.pointerEvents = progress > 0.05 ? 'none' : 'auto';
      bars.style.opacity = `${phases.barsOpacity}`;
      frame.style.opacity = `${phases.productOpacity}`;
      frame.style.transform = `scale(${phases.productScale})`;
      frame.style.pointerEvents = phases.productOpacity > 0.99 ? 'auto' : 'none';
    };

    // The pre-#34 reveal, kept for mobile: the product scales up from a peek at
    // the bottom to full-bleed as the headline clears. `rest` is the inverse of
    // the eased progress, so the offset, rounding and shadow all relax to 0 as
    // the window lands.
    const updateSlide = (progress: number) => {
      const ease = progress * progress * (3 - 2 * progress);
      const rest = 1 - ease;
      const startScale = 0.92;
      const scale = startScale + (1 - startScale) * ease;
      frame.style.opacity = '1';
      frame.style.transform = `translateY(${85 * rest}vh) scale(${scale})`;
      frame.style.borderRadius = `${22 * rest}px`;
      frame.style.boxShadow = `0 ${6 * rest}px ${50 * rest}px rgb(0 0 0 / ${0.18 * rest})`;
      frame.style.pointerEvents = ease > 0.99 ? 'auto' : 'none';
      intro.style.opacity = `${Math.max(0, 1 - ease * 2.2)}`;
      intro.style.transform = `translateY(${-20 * ease}px)`;
      intro.style.pointerEvents = ease > 0.15 ? 'none' : 'auto';
    };

    const update = () => {
      raf = 0;
      const progress = total > 0 ? Math.min(1, Math.max(0, (window.scrollY - wrapTop) / total)) : 1;
      if (mobile) {
        updateSlide(progress);
      } else {
        updateMorph(progress);
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
    <div ref={wrapRef} className="relative h-[200vh]">
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
          {/* The resting mark lives here; the tweened bars start exactly on it and
              take over on the first scroll (see `logoOpacity`). Hidden on mobile,
              where the mark doesn't morph. */}
          <div ref={slotRef} aria-hidden style={{ width: LOGO_SLOT_PX, height: LOGO_SLOT_PX }}>
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

        <div
          ref={frameRef}
          className="absolute inset-0 z-20 overflow-hidden bg-card"
          style={{ opacity: 0, transformOrigin: 'center', pointerEvents: 'none' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
