// biome-ignore-all lint/style/noMagicNumbers: scroll-scrub interpolation constants
import { buttonVariants } from '@repo/ui/components/button';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { cn } from '@repo/ui/lib/utils';
import { ArrowDown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { barGeometry, MORPH_BARS, morphPhases } from './logo-morph-geometry';

const LOGO_SLOT_PX = 132;

/**
 * The hero is the kordeon mark. Scroll (or hit "Try it now") and the three bars
 * grow, then unfold into the product's three panels while the real window fades
 * in over them and becomes usable — the logo metamorphosing into the app rather
 * than a screenshot sliding up. The maths lives in `logo-morph-geometry`.
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

  // Runs the scroll to the end of the track, so the mark finishes its
  // metamorphosis and the product becomes interactive — the CTA does what
  // scrolling down does.
  const revealProduct = () => {
    const wrap = wrapRef.current;
    if (wrap) {
      window.scrollTo({
        top: Math.max(0, wrap.offsetHeight - window.innerHeight),
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const intro = introRef.current;
    const slot = slotRef.current;
    const bars = barsRef.current;
    const frame = frameRef.current;
    if (!(wrap && intro && slot && bars && frame)) {
      return;
    }

    // Reduced motion: skip the metamorphosis and present the usable window.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.style.display = 'none';
      bars.style.display = 'none';
      frame.style.opacity = '1';
      frame.style.transform = 'none';
      frame.style.pointerEvents = 'auto';
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

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = wrap.offsetHeight - window.innerHeight;
      const raw = total > 0 ? -wrap.getBoundingClientRect().top / total : 1;
      const progress = Math.min(1, Math.max(0, raw));

      const stage = { width: window.innerWidth, height: window.innerHeight };
      const box = slot.getBoundingClientRect();
      const slotRect = { left: box.left, top: box.top, width: box.width };

      for (const [index] of MORPH_BARS.entries()) {
        const el = barRefs.current[index];
        if (!el) {
          continue;
        }
        const r = barGeometry({ index, progress, stage, slot: slotRect });
        el.style.transform = `translate(${r.left}px, ${r.top}px)`;
        el.style.width = `${r.width}px`;
        el.style.height = `${r.height}px`;
        el.style.borderRadius = `${r.radius}px`;
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
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
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
              take over on the first scroll (see `logoOpacity`). */}
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
                'absolute top-0 left-0 will-change-transform',
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
