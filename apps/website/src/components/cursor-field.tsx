// biome-ignore-all lint/style/noMagicNumbers: motion/easing math constants
import { Cursor } from '@repo/ui/custom/cursor';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useRef } from 'react';

type Actor = { id: string; name: string; color: string; kind: 'human' | 'agent' };

// A few teammates and an agent present on the canvas. No document — just their
// cursors drifting, so the hero reads as "people (and an agent) working here."
const CAST: Actor[] = [
  { id: 'maya', name: 'Maya', color: 'var(--chart-1)', kind: 'human' },
  { id: 'theo', name: 'Theo', color: 'var(--chart-2)', kind: 'human' },
  { id: 'ada', name: 'Ada', color: 'var(--chart-3)', kind: 'human' },
  { id: 'korde', name: 'Korde', color: 'var(--primary)', kind: 'agent' },
];

// Fractional opening layout (0..1 of the field) — deterministic so SSR and the
// first client paint agree before the animation loop takes over.
const INITIAL: Record<string, { x: number; y: number }> = {
  maya: { x: 0.24, y: 0.3 },
  theo: { x: 0.72, y: 0.36 },
  ada: { x: 0.32, y: 0.7 },
  korde: { x: 0.64, y: 0.64 },
};

// Roam bounds (fractions of the field), with a margin so nobody clips an edge.
const X_MIN = 0.06;
const X_MAX = 0.9;
const Y_MIN = 0.12;
const Y_MAX = 0.86;

// Motion feel. Speed varies per leg (px/ms) so some moves dart and some drift;
// each leg's duration is distance / speed (clamped), and rests between moves
// vary too — together that reads as slow-then-fast-then-stop, fairly randomly.
const SPEED_MIN = 0.25;
const SPEED_MAX = 1.9;
const DUR_MIN_MS = 320;
const DUR_MAX_MS = 2600;
const REST_MIN_MS = 140;
const REST_MAX_MS = 1500;

type Anim = {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  start: number;
  dur: number;
  restUntil: number;
  moving: boolean;
};

function rand(range: { min: number; max: number }): number {
  return range.min + Math.random() * (range.max - range.min);
}

// Minimum-jerk easing — the smooth accelerate-then-decelerate profile of a real
// hand reaching for a target.
function minJerk(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function CursorField({ className }: { className?: string }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) {
      return;
    }

    let width = field.clientWidth;
    let height = field.clientHeight;
    const ro = new ResizeObserver(() => {
      width = field.clientWidth;
      height = field.clientHeight;
    });
    ro.observe(field);

    const anims: Record<string, Anim> = {};
    for (const actor of CAST) {
      const p = INITIAL[actor.id] ?? { x: 0.5, y: 0.5 };
      anims[actor.id] = {
        x: p.x,
        y: p.y,
        fromX: p.x,
        fromY: p.y,
        toX: p.x,
        toY: p.y,
        start: 0,
        dur: 0,
        restUntil: 0,
        moving: false,
      };
    }

    let raf = 0;
    const frame = (now: number) => {
      for (const actor of CAST) {
        const a = anims[actor.id];
        if (!a) {
          continue;
        }
        if (a.moving) {
          const t = a.dur > 0 ? (now - a.start) / a.dur : 1;
          if (t >= 1) {
            a.x = a.toX;
            a.y = a.toY;
            a.moving = false;
            a.restUntil = now + rand({ min: REST_MIN_MS, max: REST_MAX_MS });
          } else {
            const e = minJerk(t);
            a.x = a.fromX + (a.toX - a.fromX) * e;
            a.y = a.fromY + (a.toY - a.fromY) * e;
          }
        } else if (now >= a.restUntil) {
          a.fromX = a.x;
          a.fromY = a.y;
          a.toX = rand({ min: X_MIN, max: X_MAX });
          a.toY = rand({ min: Y_MIN, max: Y_MAX });
          const dist = Math.hypot((a.toX - a.fromX) * width, (a.toY - a.fromY) * height);
          a.dur = Math.min(
            DUR_MAX_MS,
            Math.max(DUR_MIN_MS, dist / rand({ min: SPEED_MIN, max: SPEED_MAX })),
          );
          a.start = now;
          a.moving = true;
        }
        const el = nodes.current[actor.id];
        if (el) {
          el.style.left = `${a.x * width}px`;
          el.style.top = `${a.y * height}px`;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={fieldRef}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {CAST.map((actor) => {
        const p = INITIAL[actor.id] ?? { x: 0.5, y: 0.5 };
        return (
          <div
            key={actor.id}
            ref={(el) => {
              nodes.current[actor.id] = el;
            }}
            className="absolute"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          >
            <Cursor color={actor.color} kind={actor.kind} name={actor.name} />
          </div>
        );
      })}
    </div>
  );
}
