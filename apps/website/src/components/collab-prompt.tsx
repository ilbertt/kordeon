// biome-ignore-all lint/style/noMagicNumbers: motion + layout tuning constants
import { CollabDoc, type DocBlock } from '@repo/ui/custom/collab-doc';
import { Cursor } from '@repo/ui/custom/cursor';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useRef, useState } from 'react';

// The collaborate composer: the team co-writes the prompt handed to the agent,
// rendered with the product's editable CollabDoc primitive. Maya's and Theo's
// cursors float over it, and on hover the viewer's own pointer becomes a
// labelled "You" cursor — one of the collaborators. Nothing is saved; the box
// starts tall and can be dragged higher.

const PROMPT_DOC: DocBlock[] = [
  { kind: 'h1', id: 'title', text: 'Realtime presence in the editor' },
  {
    kind: 'p',
    id: 'intro',
    runs: [
      {
        t: 'text',
        v: 'Let a team edit the same document together and see each other live — presence, cursors, and selections, synced on every keystroke.',
      },
    ],
  },
  { kind: 'h2', id: 'req', text: 'Requirements' },
  {
    kind: 'list',
    id: 'req-list',
    items: [
      { id: 'r-online', text: 'Show who’s online, with avatars and a per-person color' },
      { id: 'r-cursors', text: 'Live cursors with name labels, updated as they move' },
      { id: 'r-sel', text: 'Shared text selections, highlighted per collaborator' },
      { id: 'r-crdt', text: 'Broadcast edits on every keystroke; merge with a CRDT' },
      { id: 'r-reconnect', text: 'Reconnect and resync cleanly after a dropped connection' },
    ],
  },
  { kind: 'h2', id: 'con', text: 'Constraints' },
  {
    kind: 'list',
    id: 'con-list',
    items: [
      { id: 'c-latency', text: 'p95 cursor latency under 80ms on the presence channel' },
      { id: 'c-degrade', text: 'Degrade to a plain “N online” count if a client can’t sync' },
      { id: 'c-deps', text: 'Reuse the existing realtime layer — no new dependencies' },
    ],
  },
  { kind: 'h2', id: 'done', text: 'Done when' },
  {
    kind: 'list',
    id: 'done-list',
    items: [
      { id: 'd-browsers', text: 'Two browsers show each other’s cursors and selections' },
      { id: 'd-clears', text: 'Presence clears within 2s of a tab closing' },
    ],
  },
];

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

function rand({ min, max }: { min: number; max: number }) {
  return min + Math.random() * (max - min);
}

function pickTarget() {
  const anchor = ANCHORS[Math.floor(Math.random() * ANCHORS.length)] ?? ANCHORS[0]!;
  return { x: anchor.x + (Math.random() - 0.5) * 0.08, y: anchor.y + (Math.random() - 0.5) * 0.05 };
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
    <div>
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
        <div className="h-[20rem] max-h-[40rem] min-h-[12rem] resize-y overflow-auto">
          <CollabDoc contentClassName="max-w-none px-1 py-1" doc={PROMPT_DOC} editable size="sm" />
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

        <div ref={youRef} className={cn('pointer-events-none absolute z-20', !joined && 'hidden')}>
          <Cursor color={YOU_COLOR} name="You" />
        </div>
      </div>
    </div>
  );
}
