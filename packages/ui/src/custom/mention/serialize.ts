import { MENTION_CHIP_CLASS, TRIGGER_KINDS, TRIGGER_RE } from './constants';
import type { MentionKind, MentionTagData, MessageSegment } from './types';

export type ActiveTrigger = { char: string; query: string };

export function readActiveTrigger(root: HTMLElement): ActiveTrigger | null {
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
export function buildChip(tag: MentionTagData): HTMLSpanElement {
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

// Plain text feeds the empty/enabled check; segments keep tags as tags in
// the sent message.
export function serialize(root: HTMLElement): { text: string; segments: MessageSegment[] } {
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
