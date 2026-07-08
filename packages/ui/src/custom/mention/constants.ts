import type { MentionKind } from '@repo/domain/workspace';

export const TRIGGER_KINDS: Record<string, MentionKind[]> = {
  '@': ['person', 'time'],
  '#': ['channel'],
};

export const KIND_HEADING: Record<MentionKind, string> = {
  person: 'People & agents',
  time: 'Time',
  channel: 'Channels',
};

// The pill's base look per kind — shared by the in-field chips and MentionTag so
// a tag reads the same in the composer and in the thread.
export const MENTION_CHIP_CLASS: Record<MentionKind, string> = {
  person:
    'mx-0.5 inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 align-baseline font-medium text-primary text-xs',
  channel:
    'mx-0.5 inline-flex items-center rounded-md bg-chart-2/10 px-1.5 py-0.5 align-baseline font-medium text-chart-2 text-xs',
  time: 'mx-0.5 inline-flex items-center rounded-md bg-chart-4/15 px-1.5 py-0.5 align-baseline font-medium text-chart-4 text-xs',
};

export const FIELD_CLASS =
  'w-full rounded-md border border-border bg-background px-2 py-1 text-foreground text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30';

// The trigger + query run immediately before a collapsed caret, e.g. `@ma`.
export const TRIGGER_RE = /(?:^|\s)([@#])([\w-]*)$/;
