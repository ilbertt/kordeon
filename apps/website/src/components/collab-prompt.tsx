// biome-ignore-all lint/style/noMagicNumbers: layout tuning constants
import { Cursor } from '@repo/ui/custom/cursor';
import { PromptEditor, type PromptEditorHandle } from '@repo/ui/custom/prompt-editor';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { MATES, useCollabChoreography } from './collab-choreography';
import { PEOPLE } from './product-window/data';

// The collaborate composer: the team co-writes the prompt handed to the agent in
// a real WYSIWYG editor (see PromptEditor). Maya's and Theo's cursors travel to
// actual lines, highlight them, and change the draft on a loop (see
// useCollabChoreography), so it reads as live collaboration. On hover the
// viewer's own pointer becomes a labelled "You" cursor. Nothing is saved; the box
// starts tall and grows via the top handle.

const YOU_COLOR = PEOPLE.you.color;

const MIN_H = 176;
const MAX_H = 640;
const DEFAULT_H = 320;

export function CollabPrompt({
  onText,
  editable = true,
  label = 'New plan',
}: {
  onText?: (text: string) => void;
  // Read-only renders the same prompt as a locked, handed-off brief (no live
  // cursors), while keeping the drag-to-resize handle.
  editable?: boolean;
  label?: string;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const mateRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const youRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<PromptEditorHandle | null>(null);
  const [joined, setJoined] = useState(false);
  const [height, setHeight] = useState(DEFAULT_H);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startY: 0, startH: DEFAULT_H });

  useCollabChoreography({ enabled: editable, areaRef, mateRefs, highlightRefs, handleRef });

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
          {label}
        </div>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: presence demo, pointer-only affordance */}
        <div
          ref={areaRef}
          className={cn('relative', editable && joined && 'cursor-none')}
          onMouseEnter={(event) => {
            if (!editable) {
              return;
            }
            place({ x: event.clientX, y: event.clientY });
            setJoined(true);
          }}
          onMouseLeave={() => setJoined(false)}
          onMouseMove={(event) => {
            if (editable) {
              place({ x: event.clientX, y: event.clientY });
            }
          }}
        >
          {editable
            ? MATES.map((mate) => (
                <div
                  key={`highlight-${mate.id}`}
                  ref={(node) => {
                    highlightRefs.current[mate.id] = node;
                  }}
                  className="pointer-events-none absolute top-0 left-0 rounded-[3px] opacity-0 transition-opacity duration-200"
                />
              ))
            : null}

          <div className="relative overflow-auto" style={{ height }}>
            <PromptEditor
              onText={onText}
              editable={editable}
              onReady={
                editable
                  ? (handle) => {
                      handleRef.current = handle;
                    }
                  : undefined
              }
            />
          </div>

          {editable
            ? MATES.map((mate) => (
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
              ))
            : null}

          {editable ? (
            <div
              ref={youRef}
              className={cn('pointer-events-none absolute z-20', !joined && 'hidden')}
            >
              <Cursor color={YOU_COLOR} name="You" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
