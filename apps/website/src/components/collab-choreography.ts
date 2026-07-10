// biome-ignore-all lint/style/noMagicNumbers: motion + choreography tuning constants
import type { PromptEditorHandle } from '@repo/ui/custom/prompt-editor';
import { type RefObject, useEffect } from 'react';
import { PEOPLE } from './product-window/data';

// Drives the collaborate prompt's presence cursors: Maya and Theo travel to real
// lines in the draft, highlight them, and change the text (checking a requirement
// off, refining a phrase) on a loop — so it reads as live collaboration rather
// than aimless drift. Positioning and mutation go through the editor handle; the
// hook only moves the cursor/highlight nodes it's handed.

export type MateId = 'maya' | 'theo';
export type Mate = { id: MateId; name: string; color: string; start: { x: number; y: number } };

export const MATES: Mate[] = [
  { id: 'maya', name: 'Maya', color: PEOPLE.maya.color, start: { x: 0.14, y: 0.2 } },
  { id: 'theo', name: 'Theo', color: PEOPLE.theo.color, start: { x: 0.6, y: 0.55 } },
];

// The scripted edits, keyed to lines the draft actually contains. Each `run`
// mutates the draft and returns its undo, so the loop replays cleanly.
type Act = {
  mate: MateId;
  locate: string;
  run: (handle: PromptEditorHandle) => (() => void) | null;
};

const ACTS: Act[] = [
  {
    mate: 'maya',
    locate: 'Keep it fresh from the warehouse on a schedule',
    run: (handle) => handle.toggleTask('Keep it fresh from the warehouse on a schedule'),
  },
  {
    mate: 'theo',
    locate: 'quarter-over-quarter',
    run: (handle) =>
      handle.replaceText({ find: 'quarter-over-quarter', replace: 'week-over-week' }),
  },
];

const EASE = 0.14;
const ARRIVE_PX = 3;
const ARRIVE_POLL_MS = 60;
const ARRIVE_MAX_POLLS = 200;
const HANDLE_POLL_MS = 120;
const FOCUS_POLL_MS = 300;
const HIGHLIGHT_HOLD_MS = 750;
const EDIT_HOLD_MS = 1600;
const BETWEEN_ACTS_MS = 1200;
const HIGHLIGHT_OPACITY = '0.22';
// Nudge the cursor so its tip sits just onto the start of the line it's working.
const CURSOR_DX = 5;
const CURSOR_DY = -3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mateColor(id: MateId): string {
  return (MATES.find((mate) => mate.id === id) ?? MATES[0]!).color;
}

type NodeMap = RefObject<Record<string, HTMLDivElement | null>>;

export function useCollabChoreography({
  enabled,
  areaRef,
  mateRefs,
  highlightRefs,
  handleRef,
}: {
  enabled: boolean;
  areaRef: RefObject<HTMLDivElement | null>;
  mateRefs: NodeMap;
  highlightRefs: NodeMap;
  handleRef: RefObject<PromptEditorHandle | null>;
}): void {
  useEffect(() => {
    const area = areaRef.current;
    if (!(enabled && area)) {
      return;
    }
    let cancelled = false;

    // Live cursor positions (px, relative to the area) eased toward their target.
    const pos: Record<MateId, { x: number; y: number }> = {
      maya: { x: 0, y: 0 },
      theo: { x: 0, y: 0 },
    };
    const target: Record<MateId, { x: number; y: number }> = {
      maya: { x: 0, y: 0 },
      theo: { x: 0, y: 0 },
    };
    for (const mate of MATES) {
      const start = { x: mate.start.x * area.clientWidth, y: mate.start.y * area.clientHeight };
      pos[mate.id] = { ...start };
      target[mate.id] = { ...start };
    }

    let raf = requestAnimationFrame(function frame() {
      for (const mate of MATES) {
        const current = pos[mate.id];
        const goal = target[mate.id];
        current.x += (goal.x - current.x) * EASE;
        current.y += (goal.y - current.y) * EASE;
        const node = mateRefs.current[mate.id];
        if (node) {
          node.style.left = `${current.x}px`;
          node.style.top = `${current.y}px`;
        }
      }
      raf = requestAnimationFrame(frame);
    });

    const arrived = (id: MateId) =>
      Math.hypot(target[id].x - pos[id].x, target[id].y - pos[id].y) < ARRIVE_PX;

    const moveTo = async ({ id, point }: { id: MateId; point: { x: number; y: number } }) => {
      target[id] = point;
      let polls = 0;
      while (!cancelled && !arrived(id) && polls < ARRIVE_MAX_POLLS) {
        await sleep(ARRIVE_POLL_MS);
        polls += 1;
      }
    };

    const showHighlight = ({
      id,
      rect,
    }: {
      id: MateId;
      rect: { left: number; top: number; width: number; height: number };
    }) => {
      const node = highlightRefs.current[id];
      if (!node) {
        return;
      }
      const areaBox = area.getBoundingClientRect();
      node.style.left = `${rect.left - areaBox.left}px`;
      node.style.top = `${rect.top - areaBox.top}px`;
      node.style.width = `${rect.width}px`;
      node.style.height = `${rect.height}px`;
      node.style.backgroundColor = mateColor(id);
      node.style.opacity = HIGHLIGHT_OPACITY;
    };

    const hideHighlight = (id: MateId) => {
      const node = highlightRefs.current[id];
      if (node) {
        node.style.opacity = '0';
      }
    };

    const runScript = async () => {
      while (!cancelled && !handleRef.current) {
        await sleep(HANDLE_POLL_MS);
      }
      while (!cancelled) {
        for (const act of ACTS) {
          if (cancelled) {
            return;
          }
          const handle = handleRef.current;
          if (!handle) {
            await sleep(HANDLE_POLL_MS);
            continue;
          }
          // Hold while the visitor is typing in the draft — others "wait".
          while (!cancelled && handle.isFocused()) {
            await sleep(FOCUS_POLL_MS);
          }
          const located = handle.locateLine(act.locate);
          if (!located) {
            await sleep(HANDLE_POLL_MS);
            continue;
          }
          const areaBox = area.getBoundingClientRect();
          await moveTo({
            id: act.mate,
            point: {
              x: located.point.x - areaBox.left + CURSOR_DX,
              y: located.point.y - areaBox.top + CURSOR_DY,
            },
          });
          if (cancelled) {
            return;
          }
          const spot = handle.locateLine(act.locate) ?? located;
          showHighlight({ id: act.mate, rect: spot.rect });
          await sleep(HIGHLIGHT_HOLD_MS);
          if (cancelled) {
            hideHighlight(act.mate);
            return;
          }
          const undo = act.run(handle);
          await sleep(EDIT_HOLD_MS);
          hideHighlight(act.mate);
          undo?.();
          await sleep(BETWEEN_ACTS_MS);
        }
      }
    };
    void runScript();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [enabled, areaRef, mateRefs, highlightRefs, handleRef]);
}
