// biome-ignore-all lint/style/noMagicNumbers: motion + layout tuning constants
import { Cursor } from '@repo/ui/custom/cursor';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useRef, useState } from 'react';

// The collaborate preview: the team co-writes a prompt (the instruction handed
// to the agent) while their cursors drift over it. On hover, the viewer's own
// pointer becomes a labelled "You" cursor — they become one of the collaborators.

type Mate = { id: string; name: string; color: string; start: { x: number; y: number } };

const MATES: Mate[] = [
  { id: 'maya', name: 'Maya', color: 'var(--chart-3)', start: { x: 0.14, y: 0.36 } },
  { id: 'theo', name: 'Theo', color: 'var(--chart-4)', start: { x: 0.32, y: 0.52 } },
];

const YOU_COLOR = 'var(--chart-2)';

// Fractional anchors near the prompt's lines — cursors hop between them, so they
// read as teammates editing the text rather than drifting at random.
const ANCHORS = [
  { x: 0.14, y: 0.36 },
  { x: 0.32, y: 0.52 },
  { x: 0.26, y: 0.64 },
  { x: 0.2, y: 0.76 },
];

const EASE = 0.07;
const ARRIVE_PX = 4;
const REST_MIN = 500;
const REST_MAX = 1600;

function rand({ min, max }: { min: number; max: number }) {
  return min + Math.random() * (max - min);
}

function pickTarget() {
  const anchor = ANCHORS[Math.floor(Math.random() * ANCHORS.length)] ?? ANCHORS[0]!;
  return { x: anchor.x + (Math.random() - 0.5) * 0.06, y: anchor.y + (Math.random() - 0.5) * 0.04 };
}

type Drift = { x: number; y: number; tx: number; ty: number; restUntil: number };

export function CollabPrompt() {
  const areaRef = useRef<HTMLDivElement>(null);
  const mateRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const youRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) {
      return;
    }
    let width = area.clientWidth;
    let height = area.clientHeight;
    const ro = new ResizeObserver(() => {
      width = area.clientWidth;
      height = area.clientHeight;
    });
    ro.observe(area);

    const drifts: Record<string, Drift> = {};
    for (const mate of MATES) {
      drifts[mate.id] = {
        x: mate.start.x,
        y: mate.start.y,
        tx: mate.start.x,
        ty: mate.start.y,
        restUntil: 0,
      };
    }

    let raf = 0;
    const frame = (now: number) => {
      for (const mate of MATES) {
        const drift = drifts[mate.id]!;
        const dx = drift.tx - drift.x;
        const dy = drift.ty - drift.y;
        if (Math.hypot(dx * width, dy * height) < ARRIVE_PX) {
          if (drift.restUntil === 0) {
            drift.restUntil = now + rand({ min: REST_MIN, max: REST_MAX });
          } else if (now >= drift.restUntil) {
            const target = pickTarget();
            drift.tx = target.x;
            drift.ty = target.y;
            drift.restUntil = 0;
          }
        } else {
          drift.x += dx * EASE;
          drift.y += dy * EASE;
        }
        const node = mateRefs.current[mate.id];
        if (node) {
          node.style.left = `${drift.x * width}px`;
          node.style.top = `${drift.y * height}px`;
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

  const place = ({ x, y }: { x: number; y: number }) => {
    const area = areaRef.current;
    const node = youRef.current;
    if (!(area && node)) {
      return;
    }
    const rect = area.getBoundingClientRect();
    node.style.left = `${x - rect.left}px`;
    node.style.top = `${y - rect.top}px`;
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: presence demo, pointer-only affordance
    <div
      ref={areaRef}
      className={cn('relative min-h-[13rem] select-none', joined && 'cursor-none')}
      onMouseEnter={(event) => {
        place({ x: event.clientX, y: event.clientY });
        setJoined(true);
      }}
      onMouseMove={(event) => place({ x: event.clientX, y: event.clientY })}
      onMouseLeave={() => setJoined(false)}
    >
      <div className="flex items-center gap-2 text-[0.65rem] text-muted-foreground">
        <span className="flex items-center gap-1">
          {MATES.map((mate) => (
            <span
              key={mate.id}
              className="size-2 rounded-full ring-1 ring-card"
              style={{ backgroundColor: mate.color }}
            />
          ))}
          <span
            className={cn('size-2 rounded-full ring-1 ring-card transition-opacity', {
              'opacity-0': !joined,
            })}
            style={{ backgroundColor: YOU_COLOR }}
          />
        </span>
        {joined ? 'You, Maya, Theo editing' : 'Maya, Theo editing'}
      </div>

      <div className="mt-3 font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wide">
        New prompt
      </div>
      <div className="mt-1 font-semibold text-sm">Realtime presence</div>
      <div className="mt-2 space-y-1 text-foreground/80 text-xs leading-relaxed">
        <p>Add presence to the editor:</p>
        <p>• show who’s online</p>
        <p>• live cursors + selections</p>
        <p className="flex items-center">
          • sync on every keystroke
          <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-foreground" />
        </p>
      </div>

      {MATES.map((mate) => (
        <div
          key={mate.id}
          ref={(node) => {
            mateRefs.current[mate.id] = node;
          }}
          className="pointer-events-none absolute z-10"
          style={{ left: `${mate.start.x * 100}%`, top: `${mate.start.y * 100}%` }}
        >
          <Cursor name={mate.name} color={mate.color} />
        </div>
      ))}

      <div ref={youRef} className={cn('pointer-events-none absolute z-20', !joined && 'hidden')}>
        <Cursor name="You" color={YOU_COLOR} />
      </div>

      {joined ? null : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-1 text-[0.65rem] text-muted-foreground">
          Hover to join →
        </div>
      )}
    </div>
  );
}
