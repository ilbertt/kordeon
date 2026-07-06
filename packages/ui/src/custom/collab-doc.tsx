import { Cursor } from '@repo/ui/custom/cursor';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * A collaborative document: markdown-shaped content (headings, paragraphs with
 * bold/code, checklists, blockquote, fenced code) with presence overlaid on top
 * — selection highlights behind the text, cursors above it.
 *
 * It is stateless: pass the `doc` and the current `presence` and it renders that
 * snapshot, measuring real anchor elements so highlights and cursors stay glued
 * to the content. The product drives presence from its realtime layer; the
 * marketing scene drives it from a looping timeline.
 */

export type DocInlineRun =
  | { t: 'text'; v: string }
  | { t: 'bold'; v: string }
  | { t: 'code'; v: string };

export type DocListItem = { id: string; text: string; done?: boolean };

export type DocBlock =
  | { kind: 'h1'; id: string; text: string }
  | { kind: 'h2'; id: string; text: string }
  | { kind: 'p'; id: string; runs: DocInlineRun[] }
  | { kind: 'quote'; id: string; text: string }
  | { kind: 'code'; id: string; lang: string; text: string }
  | { kind: 'list'; id: string; items: DocListItem[] };

export type CollabPresence = {
  id: string;
  name: string;
  color: string;
  kind: 'human' | 'agent';
  /** Anchor id the cursor sits at. */
  anchor?: string;
  /** Anchor ids to paint as a selection. */
  selection?: string[];
};

export type DocSize = 'sm' | 'md' | 'lg';

type Rect = { left: number; top: number; width: number; height: number };

// Pixel insets so selection pills breathe around the text they wrap.
const SEL_INSET_X = 6;
const SEL_INSET_Y = 2;
// Nudge so the marker tip/center lands on the anchor's top-left corner.
const HUMAN_OFFSET_X = 2;
const HUMAN_OFFSET_Y = 1;
const AGENT_CENTER = 7;
const SEL_OPACITY = 0.22;

const SIZES: Record<
  DocSize,
  {
    col: string;
    gap: string;
    pad: string;
    h1: string;
    h2: string;
    p: string;
    listGap: string;
    list: string;
    quote: string;
    code: string;
    codeLang: string;
    inline: string;
    check: string;
    checkIcon: string;
  }
> = {
  sm: {
    col: 'max-w-sm',
    gap: 'space-y-3',
    pad: 'py-6',
    h1: 'text-base',
    h2: 'text-xs',
    p: 'text-xs',
    listGap: 'space-y-1.5',
    list: 'text-xs',
    quote: 'text-xs',
    code: 'text-[0.6rem]',
    codeLang: 'text-[0.6rem]',
    inline: 'text-[0.85em]',
    check: 'size-3',
    checkIcon: 'size-2',
  },
  md: {
    col: 'max-w-lg',
    gap: 'space-y-4',
    pad: 'py-8',
    h1: 'text-xl',
    h2: 'text-sm',
    p: 'text-sm',
    listGap: 'space-y-2',
    list: 'text-sm',
    quote: 'text-sm',
    code: 'text-[0.7rem]',
    codeLang: 'text-[0.65rem]',
    inline: 'text-[0.8em]',
    check: 'size-3.5',
    checkIcon: 'size-2.5',
  },
  lg: {
    col: 'max-w-2xl',
    gap: 'space-y-6',
    pad: 'py-10',
    h1: 'text-3xl',
    h2: 'text-base',
    p: 'text-lg',
    listGap: 'space-y-3',
    list: 'text-lg',
    quote: 'text-lg',
    code: 'text-sm',
    codeLang: 'text-xs',
    inline: 'text-[0.85em]',
    check: 'size-4',
    checkIcon: 'size-3',
  },
};

export function CollabDoc({
  doc,
  presence = [],
  size = 'md',
  className,
  contentClassName,
}: {
  doc: DocBlock[];
  presence?: CollabPresence[];
  size?: DocSize;
  className?: string;
  /** Applied to the text layer only — overlays stay at full strength. */
  contentClassName?: string;
}) {
  const s = SIZES[size];
  const containerRef = useRef<HTMLDivElement>(null);
  const anchors = useRef<Map<string, HTMLElement>>(new Map());
  const [rects, setRects] = useState<Record<string, Rect>>({});

  function setAnchor(id: string) {
    return (node: HTMLElement | null) => {
      const map = anchors.current;
      if (node) {
        map.set(id, node);
      } else {
        map.delete(id);
      }
    };
  }

  const measureRef = useRef<() => void>(() => {});
  measureRef.current = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const base = container.getBoundingClientRect();
    const next: Record<string, Rect> = {};
    for (const [id, node] of anchors.current) {
      const r = node.getBoundingClientRect();
      next[id] = {
        left: r.left - base.left,
        top: r.top - base.top,
        width: r.width,
        height: r.height,
      };
    }
    // Avoid a render loop: only commit when the layout actually changed.
    if (signature(next) !== signature(rects)) {
      setRects(next);
    }
  };

  // Measure after every DOM mutation (cheap for a handful of anchors) so
  // highlights/cursors track the content.
  useIsoLayoutEffect(() => {
    measureRef.current();
  });

  // Track container resizes with a single observer.
  useIsoLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const ro = new ResizeObserver(() => measureRef.current());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="pointer-events-none absolute inset-0 z-0">
        {presence.map((actor) =>
          (actor.selection ?? []).map((id) => {
            const r = rects[id];
            if (!r) {
              return null;
            }
            return (
              <span
                aria-hidden="true"
                key={`${actor.id}-sel-${id}`}
                className="absolute animate-in rounded-md fade-in duration-300"
                style={{
                  left: r.left - SEL_INSET_X,
                  top: r.top - SEL_INSET_Y,
                  width: r.width + SEL_INSET_X * 2,
                  height: r.height + SEL_INSET_Y * 2,
                  backgroundColor: actor.color,
                  opacity: SEL_OPACITY,
                }}
              />
            );
          }),
        )}
      </div>

      <div
        className={cn('relative z-10 mx-auto w-full px-6', s.col, s.gap, s.pad, contentClassName)}
      >
        {doc.map((block) => (
          <Block key={block.id} block={block} setAnchor={setAnchor} s={s} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-20">
        {presence.map((actor) => {
          if (!actor.anchor) {
            return null;
          }
          const r = rects[actor.anchor];
          if (!r) {
            return null;
          }
          const isAgent = actor.kind === 'agent';
          const left = isAgent ? r.left - AGENT_CENTER : r.left + HUMAN_OFFSET_X;
          const top = isAgent ? r.top - AGENT_CENTER : r.top + HUMAN_OFFSET_Y;
          return (
            <div
              key={`${actor.id}-cursor`}
              className="absolute animate-in fade-in transition-all duration-700 ease-out"
              style={{ left, top }}
            >
              <Cursor color={actor.color} kind={actor.kind} name={actor.name} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SizeTokens = (typeof SIZES)[DocSize];

function Block({
  block,
  setAnchor,
  s,
}: {
  block: DocBlock;
  setAnchor: (id: string) => (node: HTMLElement | null) => void;
  s: SizeTokens;
}) {
  switch (block.kind) {
    case 'h1': {
      return (
        <h1 ref={setAnchor(block.id)} className={cn('font-semibold tracking-tight', s.h1)}>
          {block.text}
        </h1>
      );
    }
    case 'h2': {
      return (
        <h2
          ref={setAnchor(block.id)}
          className={cn(
            'flex items-center gap-2 font-semibold tracking-wide text-muted-foreground uppercase',
            s.h2,
          )}
        >
          {block.text}
        </h2>
      );
    }
    case 'p': {
      return (
        <p ref={setAnchor(block.id)} className={cn('text-pretty leading-relaxed', s.p)}>
          {block.runs.map((run) => (
            <Run key={run.v} inline={s.inline} run={run} />
          ))}
        </p>
      );
    }
    case 'quote': {
      return (
        <blockquote
          ref={setAnchor(block.id)}
          className={cn(
            'border-l-2 border-border pl-3 text-muted-foreground italic leading-relaxed',
            s.quote,
          )}
        >
          {block.text}
        </blockquote>
      );
    }
    case 'code': {
      return (
        <div
          ref={setAnchor(block.id)}
          className="overflow-hidden rounded-lg border border-border bg-muted/50"
        >
          <div className="flex items-center justify-between border-border border-b px-3 py-1">
            <span className={cn('font-mono text-muted-foreground', s.codeLang)}>{block.lang}</span>
            <span className="size-1.5 rounded-full bg-foreground/20" />
          </div>
          <pre className={cn('overflow-x-auto px-3 py-2 font-mono leading-relaxed', s.code)}>
            <code>{block.text}</code>
          </pre>
        </div>
      );
    }
    case 'list': {
      return (
        <ul ref={setAnchor(block.id)} className={s.listGap}>
          {block.items.map((item) => (
            <li
              key={item.id}
              ref={setAnchor(item.id)}
              className={cn('flex items-center gap-2.5', s.list)}
            >
              <Check done={Boolean(item.done)} s={s} />
              <span className={item.done ? 'text-muted-foreground line-through' : ''}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      );
    }
  }
}

function Run({ run, inline }: { run: DocInlineRun; inline: string }) {
  switch (run.t) {
    case 'bold': {
      return <strong className="font-semibold">{run.v}</strong>;
    }
    case 'code': {
      return (
        <code className={cn('rounded bg-muted px-1.5 py-0.5 font-mono', inline)}>{run.v}</code>
      );
    }
    case 'text': {
      return run.v;
    }
  }
}

function Check({ done, s }: { done: boolean; s: SizeTokens }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[3px]',
        done ? 'bg-foreground text-background' : 'border border-foreground/40',
        s.check,
      )}
    >
      {done ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className={s.checkIcon}
        >
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

function signature(map: Record<string, Rect>): string {
  let out = '';
  for (const [id, r] of Object.entries(map)) {
    out += `${id}:${r.left | 0},${r.top | 0},${r.width | 0},${r.height | 0};`;
  }
  return out;
}
