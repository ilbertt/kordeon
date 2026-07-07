// biome-ignore-all lint/style/noMagicNumbers: motion + layout tuning constants
import { Cursor } from '@repo/ui/custom/cursor';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { PromptEditor } from '#components/prompt-editor';

// The collaborate composer: the team co-writes the prompt handed to the agent
// in a real WYSIWYG editor (see PromptEditor). Maya's and Theo's cursors float
// over it, and on hover the viewer's own pointer becomes a labelled "You"
// cursor — one of the collaborators. Nothing is saved. The box starts tall and
// grows when you drag the handle at its top.

type Mate = { id: string; name: string; color: string; start: { x: number; y: number } };

const MATES: Mate[] = [
  { id: 'maya', name: 'Maya', color: 'var(--chart-3)', start: { x: 0.16, y: 0.24 } },
  { id: 'theo', name: 'Theo', color: 'var(--chart-4)', start: { x: 0.62, y: 0.5 } },
];

const YOU_COLOR = 'var(--chart-2)';

// Anchors spread across the draft in both axes, so the cursors float around it
// rather than sliding straight up and down.
const ANCHORS = [
  { x: 0.16, y: 0.24 },
  { x: 0.62, y: 0.3 },
  { x: 0.34, y: 0.48 },
  { x: 0.72, y: 0.6 },
  { x: 0.22, y: 0.72 },
  { x: 0.52, y: 0.84 },
];

const EASE = 0.06;
const ARRIVE_PX = 4;
const REST_MIN = 400;
const REST_MAX = 1500;

// Drag-to-resize bounds (px): the box starts tall and grows as the top handle is
// dragged upward.
const MIN_H = 176;
const MAX_H = 640;
const DEFAULT_H = 320;

function rand({ min, max }: { min: number; max: number }) {
  return min + Math.random() * (max - min);
}

function pickTarget() {
  const anchor = ANCHORS[Math.floor(Math.random() * ANCHORS.length)] ?? ANCHORS[0]!;
  return { x: anchor.x + (Math.random() - 0.5) * 0.08, y: anchor.y + (Math.random() - 0.5) * 0.05 };
}

type Drift = { x: number; y: number; tx: number; ty: number; restUntil: number };

export function CollabPrompt({ onText }: { onText?: (text: string) => void }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const mateRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const youRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);
  const [height, setHeight] = useState(DEFAULT_H);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startY: 0, startH: DEFAULT_H });

  useEffect(() => {
    const area = areaRef.current;
    if (!area) {
      return;
    }
    let width = area.clientWidth;
    let height2 = area.clientHeight;
    const ro = new ResizeObserver(() => {
      width = area.clientWidth;
      height2 = area.clientHeight;
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
        if (Math.hypot(dx * width, dy * height2) < ARRIVE_PX) {
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
          node.style.top = `${drift.y * height2}px`;
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

  useEffect(() => {
    if (!dragging) {
      return;
    }
    const onMove = (event: PointerEvent) => {
      const { startY, startH } = dragRef.current;
      setHeight(Math.min(MAX_H, Math.max(MIN_H, startH + (startY - event.clientY))));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

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
    <div className={cn(dragging && 'select-none')}>
      <div
        className="flex h-5 cursor-ns-resize touch-none items-center justify-center"
        onPointerDown={(event) => {
          dragRef.current = { startY: event.clientY, startH: height };
          setDragging(true);
        }}
      >
        <div className="h-1 w-8 rounded-full bg-border" />
      </div>

      <div className="px-3 pb-1">
        <div className="mb-1 font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wide">
          New prompt
        </div>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: presence demo, pointer-only affordance */}
        <div
          ref={areaRef}
          className={cn('relative', joined && 'cursor-none')}
          onMouseEnter={(event) => {
            place({ x: event.clientX, y: event.clientY });
            setJoined(true);
          }}
          onMouseLeave={() => setJoined(false)}
          onMouseMove={(event) => place({ x: event.clientX, y: event.clientY })}
        >
          <div className="overflow-auto" style={{ height }}>
            <PromptEditor onText={onText} />
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
              <Cursor color={mate.color} name={mate.name} />
            </div>
          ))}

          <div
            ref={youRef}
            className={cn('pointer-events-none absolute z-20', !joined && 'hidden')}
          >
            <Cursor color={YOU_COLOR} name="You" />
          </div>
        </div>
      </div>
    </div>
  );
}
