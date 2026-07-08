// biome-ignore-all lint/style/noMagicNumbers: caret math + menu layout constants
import { cn } from '@repo/ui/lib/utils';
import { Clock, Hash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// A message input with Notion-style inline tags: `@` mentions a person or agent
// or picks a time, `#` links another channel. Tags render as inline, read-only
// pills; otherwise it behaves like a plain input and reports its text as you
// type. It's deliberately self-contained and data-driven — every suggestion
// arrives via props — so the same component powers the product's composer, not
// just this demo. Content is managed imperatively (React renders the field
// empty and never reconciles its children), which is what keeps the caret
// stable while tags are inserted.

export type MentionKind = 'person' | 'channel' | 'time';

export type MentionSuggestion = {
  id: string;
  kind: MentionKind;
  // Shown in the menu and inside the pill (without the trigger character).
  label: string;
  // What the pill serialises to in the field's plain text (e.g. `@Maya`).
  token: string;
  // Secondary line in the menu row.
  detail?: string;
  // Person/agent dot colour and avatar — person kind only.
  color?: string;
  avatar?: string;
};

// Which suggestion kinds each trigger character offers. Adding a trigger is a
// one-line change here.
const TRIGGER_KINDS: Record<string, MentionKind[]> = {
  '@': ['person', 'time'],
  '#': ['channel'],
};

const KIND_HEADING: Record<MentionKind, string> = {
  person: 'People & agents',
  time: 'Time',
  channel: 'Channels',
};

const CHIP_CLASS: Record<MentionKind, string> = {
  person:
    'mx-0.5 inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 align-baseline font-medium text-primary text-xs',
  channel:
    'mx-0.5 inline-flex items-center rounded-md bg-chart-2/10 px-1.5 py-0.5 align-baseline font-medium text-chart-2 text-xs',
  time: 'mx-0.5 inline-flex items-center rounded-md bg-chart-4/15 px-1.5 py-0.5 align-baseline font-medium text-chart-4 text-xs',
};

// The trigger + query run immediately before a collapsed caret, e.g. `@ma`.
const TRIGGER_RE = /(?:^|\s)([@#])([\w-]*)$/;

type ActiveTrigger = { char: string; query: string };

function readActiveTrigger(root: HTMLElement): ActiveTrigger | null {
  const selection = window.getSelection();
  if (!selection?.isCollapsed || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE || !root.contains(node)) {
    return null;
  }
  const left = (node.textContent ?? '').slice(0, range.startOffset);
  const match = TRIGGER_RE.exec(left);
  if (!match) {
    return null;
  }
  const [, char, query] = match;
  return char && char in TRIGGER_KINDS ? { char, query: query ?? '' } : null;
}

// The pill's textContent is the token itself (the dot span holds no text), so
// the field's plain text is just `editor.textContent`.
function buildChip(item: MentionSuggestion): HTMLSpanElement {
  const chip = document.createElement('span');
  chip.contentEditable = 'false';
  chip.dataset.mention = item.kind;
  chip.className = CHIP_CLASS[item.kind];
  if (item.kind === 'person' && item.color) {
    const dot = document.createElement('span');
    dot.className = 'size-1.5 shrink-0 rounded-full';
    dot.style.backgroundColor = item.color;
    chip.appendChild(dot);
  }
  chip.appendChild(document.createTextNode(item.token));
  return chip;
}

export function MentionInput({
  suggestions,
  placeholder,
  ariaLabel,
  autoFocus = false,
  className,
  onChange,
  onSubmit,
}: {
  suggestions: MentionSuggestion[];
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
  className?: string;
  onChange?: (text: string) => void;
  onSubmit?: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(true);
  const [trigger, setTrigger] = useState<ActiveTrigger | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (autoFocus) {
      editorRef.current?.focus();
    }
  }, [autoFocus]);

  const matches =
    trigger === null
      ? []
      : suggestions.filter(
          (item) =>
            TRIGGER_KINDS[trigger.char]?.includes(item.kind) &&
            item.label.toLowerCase().includes(trigger.query.toLowerCase()),
        );
  const open = matches.length > 0;

  const emit = () => {
    const text = editorRef.current?.textContent ?? '';
    setEmpty(text.trim().length === 0);
    onChange?.(text);
  };

  const syncTrigger = () => {
    const root = editorRef.current;
    setTrigger(root ? readActiveTrigger(root) : null);
    setActive(0);
  };

  const insert = (item: MentionSuggestion) => {
    const root = editorRef.current;
    const selection = window.getSelection();
    if (!(root && selection) || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    const parent = node.parentNode;
    if (node.nodeType !== Node.TEXT_NODE || !parent) {
      return;
    }
    const caret = range.startOffset;
    const runLength = 1 + (trigger?.query.length ?? 0);
    const text = node.textContent ?? '';
    const after = text.slice(caret);
    node.textContent = text.slice(0, caret - runLength);

    const chip = buildChip(item);
    const space = document.createTextNode(' ');
    parent.insertBefore(chip, node.nextSibling);
    parent.insertBefore(space, chip.nextSibling);
    if (after) {
      parent.insertBefore(document.createTextNode(after), space.nextSibling);
    }
    const next = document.createRange();
    next.setStart(space, 1);
    next.collapse(true);
    selection.removeAllRanges();
    selection.addRange(next);

    setTrigger(null);
    setActive(0);
    emit();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (open) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((index) => (index + 1) % matches.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((index) => (index - 1 + matches.length) % matches.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const item = matches[active];
        if (item) {
          insert(item);
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setTrigger(null);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div className={cn('relative flex-1', className)}>
      {open ? <MentionMenu items={matches} activeId={matches[active]?.id} onPick={insert} /> : null}
      {empty ? (
        <span className="pointer-events-none absolute inset-0 truncate text-muted-foreground text-sm">
          {placeholder}
        </span>
      ) : null}
      {/* biome-ignore lint/a11y/useFocusableInteractive: contentEditable is inherently focusable */}
      {/* biome-ignore lint/a11y/useSemanticElements: inline tag pills need contentEditable, not <input> */}
      <div
        ref={editorRef}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          emit();
          syncTrigger();
        }}
        onKeyDown={onKeyDown}
        onClick={syncTrigger}
        onBlur={() => setTrigger(null)}
        className="max-h-32 min-h-5 overflow-y-auto whitespace-pre-wrap break-words text-foreground text-sm outline-none"
      />
    </div>
  );
}

function MentionMenu({
  items,
  activeId,
  onPick,
}: {
  items: MentionSuggestion[];
  activeId?: string;
  onPick: (item: MentionSuggestion) => void;
}) {
  let lastKind: MentionKind | null = null;
  return (
    <div className="absolute bottom-full left-0 z-30 mb-2 max-h-64 w-72 max-w-[calc(100vw-3rem)] overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
      {items.map((item) => {
        const heading = item.kind === lastKind ? null : KIND_HEADING[item.kind];
        lastKind = item.kind;
        return (
          <div key={item.id}>
            {heading ? (
              <div className="px-2 pt-1.5 pb-1 font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
                {heading}
              </div>
            ) : null}
            <button
              type="button"
              // Keep focus (and the caret) in the field so insertion targets it.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(item)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                item.id === activeId ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
              )}
            >
              <MentionGlyph item={item} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.detail ? (
                <span className="ml-2 max-w-32 shrink-0 truncate text-muted-foreground text-xs">
                  {item.detail}
                </span>
              ) : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MentionGlyph({ item }: { item: MentionSuggestion }) {
  if (item.kind === 'person') {
    return item.avatar ? (
      <img
        src={item.avatar}
        alt=""
        className="size-4 shrink-0 rounded-full object-cover"
        style={{ backgroundColor: item.color }}
      />
    ) : (
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
    );
  }
  return (
    <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
      {item.kind === 'channel' ? <Hash className="size-3.5" /> : <Clock className="size-3.5" />}
    </span>
  );
}
