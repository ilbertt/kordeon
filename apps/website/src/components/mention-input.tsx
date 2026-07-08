// biome-ignore-all lint/style/noMagicNumbers: caret math, date math + menu layout constants
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Calendar, Clock, Hash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// A message input with Notion-style inline tags: `@` mentions a person or agent
// or picks a time, `#` links another channel. Tags render as inline, read-only
// pills; otherwise it behaves like a plain input and reports its text as you
// type. It's deliberately self-contained and data-driven — every suggestion
// arrives via props — so the same component powers the product's composer, not
// just this demo. Content is managed imperatively (React renders the field
// empty and never reconciles its children), which is what keeps the caret
// stable while tags are inserted. On submit it emits structured segments so the
// same tags stay clickable once the message lands in the thread (see MentionTag).

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

// The minimal data a tag needs to render as a pill, both inside the field (as a
// contentEditable chip) and in a sent message (as MentionTag).
export type MentionTagData = {
  kind: MentionKind;
  token: string;
  color?: string;
  avatar?: string;
  // Time tags: the source time + zone, shown on hover ("… in your time").
  tooltip?: string;
};

// A sent message is a list of plain-text runs and tags, so the tags survive as
// interactive pills instead of collapsing to text.
export type MessageSegment = { type: 'text'; text: string } | { type: 'tag'; tag: MentionTagData };

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

// The pill's base look per kind — shared by the in-field chips and MentionTag so
// a tag reads the same in the composer and in the thread.
export const MENTION_CHIP_CLASS: Record<MentionKind, string> = {
  person:
    'mx-0.5 inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 align-baseline font-medium text-primary text-xs',
  channel:
    'mx-0.5 inline-flex items-center rounded-md bg-chart-2/10 px-1.5 py-0.5 align-baseline font-medium text-chart-2 text-xs',
  time: 'mx-0.5 inline-flex items-center rounded-md bg-chart-4/15 px-1.5 py-0.5 align-baseline font-medium text-chart-4 text-xs',
};

const FIELD_CLASS =
  'w-full rounded-md border border-border bg-background px-2 py-1 text-foreground text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30';

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

// The chip carries everything a tag needs (kind, token, colour, tooltip) as data
// attributes, so a sent message can be reconstructed as structured segments.
function buildChip(tag: MentionTagData): HTMLSpanElement {
  const chip = document.createElement('span');
  chip.contentEditable = 'false';
  chip.dataset.mention = tag.kind;
  chip.dataset.token = tag.token;
  chip.className = MENTION_CHIP_CLASS[tag.kind];
  if (tag.color) {
    chip.dataset.color = tag.color;
  }
  if (tag.avatar) {
    chip.dataset.avatar = tag.avatar;
  }
  if (tag.tooltip) {
    chip.dataset.tooltip = tag.tooltip;
    chip.title = tag.tooltip;
  }
  if (tag.kind === 'person' && tag.color) {
    const dot = document.createElement('span');
    dot.className = 'size-1.5 shrink-0 rounded-full';
    dot.style.backgroundColor = tag.color;
    chip.appendChild(dot);
  }
  chip.appendChild(document.createTextNode(tag.token));
  return chip;
}

function tagFromChip(element: HTMLElement): MentionTagData {
  return {
    kind: element.dataset.mention as MentionKind,
    token: element.dataset.token ?? element.textContent ?? '',
    color: element.dataset.color,
    avatar: element.dataset.avatar,
    tooltip: element.dataset.tooltip,
  };
}

// Walk the field into plain text (for the empty/enabled check) and structured
// segments (so tags stay tags in the sent message).
function serialize(root: HTMLElement): { text: string; segments: MessageSegment[] } {
  const segments: MessageSegment[] = [];
  let text = '';
  for (const node of Array.from(root.childNodes)) {
    if (node instanceof HTMLElement && node.dataset.mention) {
      const tag = tagFromChip(node);
      segments.push({ type: 'tag', tag });
      text += node.textContent ?? '';
      continue;
    }
    const chunk = node.textContent ?? '';
    if (chunk) {
      segments.push({ type: 'text', text: chunk });
      text += chunk;
    }
  }
  return { text, segments };
}

// --- timezone-aware dates -------------------------------------------------

const TIME_ZONES: string[] =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : [
        'UTC',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Rome',
        'Asia/Tokyo',
      ];

function systemTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Offset (ms) of a zone from UTC at a given instant — derived from the Intl
// formatter, so DST is handled without a date library.
function zoneOffset({ instant, timeZone }: { instant: Date; timeZone: string }): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return asUtc - instant.getTime();
}

// A wall-clock date/time in `timeZone` → the absolute instant it refers to.
function zonedToInstant({
  date,
  time,
  timeZone,
}: {
  date: string;
  time: string;
  timeZone: string;
}): Date {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  return new Date(naiveUtc - zoneOffset({ instant: new Date(naiveUtc), timeZone }));
}

function formatInZone({ instant, timeZone }: { instant: Date; timeZone?: string }): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: timeZone ? 'short' : undefined,
  }).format(instant);
}

function todayInputValue(): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// --- component ------------------------------------------------------------

export function MentionInput({
  suggestions,
  placeholder,
  ariaLabel,
  autoFocus = false,
  allowCustomDate = false,
  className,
  onChange,
  onSubmit,
}: {
  suggestions: MentionSuggestion[];
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
  allowCustomDate?: boolean;
  className?: string;
  onChange?: (value: { text: string; segments: MessageSegment[] }) => void;
  onSubmit?: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<{ range: Range; runLength: number } | null>(null);
  const [empty, setEmpty] = useState(true);
  const [trigger, setTrigger] = useState<ActiveTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [pickingDate, setPickingDate] = useState(false);

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
  const offersTime = trigger !== null && (TRIGGER_KINDS[trigger.char]?.includes('time') ?? false);
  const showCustomDate = allowCustomDate && offersTime;
  const open = !pickingDate && (matches.length > 0 || showCustomDate);

  const emit = () => {
    const root = editorRef.current;
    const { text, segments } = root ? serialize(root) : { text: '', segments: [] };
    setEmpty(text.trim().length === 0);
    onChange?.({ text, segments });
  };

  const syncTrigger = () => {
    const root = editorRef.current;
    setTrigger(root ? readActiveTrigger(root) : null);
    setActive(0);
  };

  const insertAt = ({
    tag,
    range,
    runLength,
  }: {
    tag: MentionTagData;
    range: Range;
    runLength: number;
  }) => {
    const node = range.startContainer;
    const parent = node.parentNode;
    if (node.nodeType !== Node.TEXT_NODE || !parent) {
      return;
    }
    const caret = range.startOffset;
    const text = node.textContent ?? '';
    const after = text.slice(caret);
    node.textContent = text.slice(0, caret - runLength);

    const chip = buildChip(tag);
    const space = document.createTextNode(' ');
    parent.insertBefore(chip, node.nextSibling);
    parent.insertBefore(space, chip.nextSibling);
    if (after) {
      parent.insertBefore(document.createTextNode(after), space.nextSibling);
    }
    editorRef.current?.focus();
    const next = document.createRange();
    next.setStart(space, 1);
    next.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(next);

    setTrigger(null);
    setActive(0);
    emit();
  };

  const insert = (item: MentionSuggestion) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    insertAt({
      tag: { kind: item.kind, token: item.token, color: item.color, avatar: item.avatar },
      range: selection.getRangeAt(0),
      runLength: 1 + (trigger?.query.length ?? 0),
    });
  };

  const openPicker = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRange.current = {
        range: selection.getRangeAt(0).cloneRange(),
        runLength: 1 + (trigger?.query.length ?? 0),
      };
    }
    setPickingDate(true);
  };

  const closePicker = () => {
    setPickingDate(false);
    setTrigger(null);
    editorRef.current?.focus();
  };

  const addCustomDate = (value: { date: string; time: string; timeZone: string }) => {
    const saved = savedRange.current;
    if (saved) {
      const instant = zonedToInstant(value);
      insertAt({
        tag: {
          kind: 'time',
          token: formatInZone({ instant }),
          tooltip: `${formatInZone({ instant, timeZone: value.timeZone })} — shown in your time`,
        },
        range: saved.range,
        runLength: saved.runLength,
      });
    }
    setPickingDate(false);
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
        } else if (showCustomDate) {
          openPicker();
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
      {pickingDate ? <DatePicker onAdd={addCustomDate} onCancel={closePicker} /> : null}
      {open ? (
        <MentionMenu
          items={matches}
          activeId={matches[active]?.id}
          onPick={insert}
          onPickDate={showCustomDate ? openPicker : undefined}
        />
      ) : null}
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
        onBlur={() => {
          if (!pickingDate) {
            setTrigger(null);
          }
        }}
        className="max-h-32 min-h-5 overflow-y-auto whitespace-pre-wrap break-words text-foreground text-sm outline-none"
      />
    </div>
  );
}

function MentionMenu({
  items,
  activeId,
  onPick,
  onPickDate,
}: {
  items: MentionSuggestion[];
  activeId?: string;
  onPick: (item: MentionSuggestion) => void;
  onPickDate?: () => void;
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
      {onPickDate ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onPickDate}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground text-sm hover:bg-muted"
        >
          <span className="flex size-4 shrink-0 items-center justify-center">
            <Calendar className="size-3.5" />
          </span>
          Pick a date…
        </button>
      ) : null}
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

function DatePicker({
  onAdd,
  onCancel,
}: {
  onAdd: (value: { date: string; time: string; timeZone: string }) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(todayInputValue);
  const [time, setTime] = useState('09:00');
  const [timeZone, setTimeZone] = useState(systemTimeZone);
  const valid = Boolean(date && time);
  const preview = valid ? formatInZone({ instant: zonedToInstant({ date, time, timeZone }) }) : '';

  return (
    <div className="absolute bottom-full left-0 z-30 mb-2 w-72 max-w-[calc(100vw-3rem)] space-y-2 rounded-lg border border-border bg-card p-3 shadow-lg">
      <div className="font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
        Pick a date
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={FIELD_CLASS}
          aria-label="Date"
        />
        <input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          className={FIELD_CLASS}
          aria-label="Time"
        />
      </div>
      <select
        value={timeZone}
        onChange={(event) => setTimeZone(event.target.value)}
        className={FIELD_CLASS}
        aria-label="Timezone"
      >
        {TIME_ZONES.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
      {preview ? (
        <div className="text-muted-foreground text-xs">
          In your time: <span className="font-medium text-foreground">{preview}</span>
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!valid}
          onClick={() => onAdd({ date, time, timeZone })}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// The rendered-message counterpart of the field's chips: a tag stays a styled
// pill and, where it points somewhere, stays clickable. Channels link to the
// feature; people/agents are clickable (no profile page yet); time is a static
// pill with the source time on hover.
export function MentionTag({ tag }: { tag: MentionTagData }) {
  if (tag.kind === 'channel') {
    return (
      <a
        href={`#${tag.token.replace(/^#/, '')}`}
        className={cn(MENTION_CHIP_CLASS.channel, 'transition-colors hover:bg-chart-2/20')}
      >
        {tag.token}
      </a>
    );
  }
  if (tag.kind === 'person') {
    return (
      <button
        type="button"
        className={cn(MENTION_CHIP_CLASS.person, 'transition-colors hover:bg-primary/20')}
      >
        {tag.color ? (
          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
        ) : null}
        {tag.token}
      </button>
    );
  }
  return (
    <span className={MENTION_CHIP_CLASS.time} title={tag.tooltip}>
      {tag.token}
    </span>
  );
}
