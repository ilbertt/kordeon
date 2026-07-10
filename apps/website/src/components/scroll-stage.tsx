// biome-ignore-all lint/style/noMagicNumbers: scroll-scrub interpolation constants
import { buttonVariants } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { ArrowDown } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * The product renders at full layout and scales like a screenshot: it starts
 * small — peeking from the bottom (the cue to scroll) — and zooms to full-bleed
 * as the user scrolls, so text and spacing scale together. Behind it sits a
 * faint, static canvas grid.
 */
export function ScrollStage({
  children,
  openFullOnLoad,
}: {
  children: React.ReactNode;
  openFullOnLoad?: () => boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);

  // Runs the scroll-scrub to the end of the track, so the product zooms to full
  // and becomes interactive — the CTA does what scrolling down does.
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
    const frame = frameRef.current;
    const intro = introRef.current;
    if (!(wrap && frame)) {
      return;
    }

    // Deep-linked to a section: jump to the end of the scroll track so the
    // product is already full at that section, instead of playing the intro.
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
      const p = Math.min(1, Math.max(0, raw));
      const ease = p * p * (3 - 2 * p);
      const rest = 1 - ease;

      const vw = window.innerWidth;
      let startScale = 0.5;
      if (vw < 768) {
        startScale = 0.92;
      } else if (vw < 1024) {
        startScale = 0.7;
      }
      const scale = startScale + (1 - startScale) * ease;

      frame.style.transform = `translateY(${85 * rest}vh) scale(${scale})`;
      frame.style.borderRadius = `${22 * rest}px`;
      frame.style.boxShadow = `0 ${6 * rest}px ${50 * rest}px rgb(0 0 0 / ${0.18 * rest})`;
      frame.style.pointerEvents = ease > 0.99 ? 'auto' : 'none';

      if (intro) {
        intro.style.opacity = `${Math.max(0, 1 - ease * 2.2)}`;
        intro.style.transform = `translateY(${-20 * ease}px)`;
        // Once it starts fading out, stop the intro (and its CTA) from catching
        // clicks over the product beneath it.
        intro.style.pointerEvents = ease > 0.15 ? 'none' : 'auto';
      }
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
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center"
        >
          <h1 className="text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
            Where humans collaborate and agents execute
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Chat, refine the plan, and hand it to an agent — together, in one place.
          </p>
          <button
            type="button"
            onClick={revealProduct}
            className={cn(buttonVariants({ size: 'lg' }), 'pointer-events-auto mt-8 gap-2')}
          >
            Try it now
            <ArrowDown className="size-4" />
          </button>
        </div>
        <div
          ref={frameRef}
          className="absolute inset-0 z-20 overflow-hidden bg-card"
          style={{
            transformOrigin: 'top center',
            transform: 'translateY(85vh) scale(0.5)',
            borderRadius: '22px',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
