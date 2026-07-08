export type MentionKind = 'person' | 'channel' | 'time';

export type MentionSuggestion = {
  id: string;
  kind: MentionKind;
  // Shown in the menu and inside the pill (without the trigger character).
  label: string;
  // What the pill serialises to in the field's plain text (e.g. `@Maya`).
  token: string;
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
