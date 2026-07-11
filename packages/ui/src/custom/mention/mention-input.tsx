// biome-ignore-all lint/style/noMagicNumbers: caret math

import type { MentionTagData, MessageSegment, TimeTagValue } from '@repo/domain/workspace';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { TRIGGER_KINDS } from './constants';
import { DatePicker } from './date-picker';
import { relativeDateInputValue, systemTimeZone } from './dates';
import { MentionMenu } from './mention-menu';
import { type ActiveTrigger, buildChip, readActiveTrigger, serialize } from './serialize';
import { timeTagFromValue } from './time-tag';
import type { MentionSuggestion } from './types';

// A message input with Notion-style inline tags: `@` mentions a person or agent
// or picks a time, `#` links another channel. Tags render as inline, read-only
// pills; otherwise it behaves like a plain input and reports its text as you
// type. It's deliberately self-contained and data-driven — every suggestion
// arrives via props — so the same component powers the product's composer, not
// just this demo. Content is managed imperatively (React renders the field
// empty and never reconciles its children), which is what keeps the caret
// stable while tags are inserted. On submit it emits structured segments so the
// same tags stay clickable once the message lands in the thread (see MentionTag).
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
  // A chip being edited in place (vs. a freshly opened picker) — set on click.
  const editingChip = useRef<HTMLSpanElement | null>(null);
  const [empty, setEmpty] = useState(true);
  const [trigger, setTrigger] = useState<ActiveTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [pickingDate, setPickingDate] = useState(false);
  const [pickerInitial, setPickerInitial] = useState<TimeTagValue>();

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
  // The custom-date row sits after the matches, so it owns index `matches.length`.
  const optionCount = matches.length + (showCustomDate ? 1 : 0);
  const dateActive = showCustomDate && active === matches.length;
  const open = !pickingDate && optionCount > 0;

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
    setPickerInitial(undefined);
    setPickingDate(true);
  };

  const closePicker = () => {
    setPickingDate(false);
    setPickerInitial(undefined);
    editingChip.current = null;
    setTrigger(null);
    editorRef.current?.focus();
  };

  const editChip = (chip: HTMLSpanElement) => {
    editingChip.current = chip;
    setPickerInitial({
      date:
        chip.dataset.date ?? relativeDateInputValue(chip.dataset.token ?? chip.textContent ?? ''),
      time: chip.dataset.time ?? '09:00',
      timeZone: chip.dataset.timeZone ?? systemTimeZone(),
    });
    setPickingDate(true);
  };

  const addCustomDate = (value: TimeTagValue) => {
    const editing = editingChip.current;
    if (editing) {
      editing.replaceWith(buildChip(timeTagFromValue(value)));
      editingChip.current = null;
      editorRef.current?.focus();
      emit();
    } else {
      const saved = savedRange.current;
      if (saved) {
        insertAt({
          tag: timeTagFromValue(value),
          range: saved.range,
          runLength: saved.runLength,
        });
      }
    }
    setPickerInitial(undefined);
    setPickingDate(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (open) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((index) => (index + 1) % optionCount);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((index) => (index - 1 + optionCount) % optionCount);
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
      {pickingDate ? (
        <DatePicker initialValue={pickerInitial} onAdd={addCustomDate} onCancel={closePicker} />
      ) : null}
      {open ? (
        <MentionMenu
          items={matches}
          activeId={matches[active]?.id}
          dateActive={dateActive}
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
          // If the chip being edited was removed (e.g. backspaced), drop the
          // picker too — otherwise it floats over a chip that no longer exists.
          if (editingChip.current && !editingChip.current.isConnected) {
            closePicker();
          }
        }}
        onKeyDown={onKeyDown}
        onClick={(event) => {
          // A time chip reopens the picker prefilled — custom dates with their
          // stored value, relative labels (Today, Tomorrow) with the day they
          // name so they can be refined into a concrete date.
          const chip = (event.target as HTMLElement).closest<HTMLSpanElement>(
            '[data-mention="time"]',
          );
          if (chip) {
            editChip(chip);
            return;
          }
          syncTrigger();
        }}
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
