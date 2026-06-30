// biome-ignore-all lint/style/noMagicNumbers: scroll-scrub interpolation constants
import { useEffect, useRef } from 'react';
import { CursorField } from '#components/cursor-field';

/**
 * The product window peeks ~15% from the bottom and rises to full-bleed as the
 * user scrolls — the peek is the (intuitive) cue to scroll. Behind it, a field
 * of collaborative cursors drifts across a faint canvas grid.
 */
export function ScrollStage({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const frame = frameRef.current;
    const intro = introRef.current;
    if (!(wrap && frame)) {
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = wrap.offsetHeight - window.innerHeight;
      const raw = total > 0 ? -wrap.getBoundingClientRect().top / total : 1;
      const p = Math.min(1, Math.max(0, raw));
      const ease = p * p * (3 - 2 * p);
      const rest = 1 - ease;

      frame.style.width = `${94 + 6 * ease}%`;
      frame.style.transform = `translateX(-50%) translateY(${85 * rest}%)`;
      frame.style.borderTopLeftRadius = `${20 * rest}px`;
      frame.style.borderTopRightRadius = `${20 * rest}px`;
      frame.style.boxShadow = `0 ${-10 * rest}px ${48 * rest}px rgb(0 0 0 / ${0.2 * rest})`;
      frame.style.pointerEvents = ease > 0.99 ? 'auto' : 'none';

      if (intro) {
        intro.style.opacity = `${Math.max(0, 1 - ease * 1.8)}`;
        intro.style.transform = `translateY(${-20 * ease}px)`;
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
  }, []);

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
        <CursorField className="z-0" />
        <div ref={introRef} className="absolute inset-x-0 top-[15vh] z-10 px-4 text-center">
          <h1 className="text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
            Where humans and agents collaborate
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Chat, refine the plan, and hand it to an agent — together, in one place.
          </p>
        </div>
        <div
          ref={frameRef}
          className="absolute bottom-0 left-1/2 z-20 h-svh overflow-hidden bg-card"
          style={{
            width: '94%',
            transform: 'translateX(-50%) translateY(85%)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
