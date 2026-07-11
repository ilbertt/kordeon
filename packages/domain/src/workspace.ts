// The framework-agnostic workspace contract. These types describe the shape the
// UI renders — the landing feeds them static data, a future product feeds them
// server data — so ids are plain strings here (no landing-only enums).

export type MentionKind = 'person' | 'channel' | 'time';

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

// A member of the workspace — a person or the agent. `color` drives the presence
// dot / avatar fallback; `avatarUrl` is the optional image.
export type Person = {
  id: string;
  name: string;
  initials: string;
  color: string;
  kind: 'human' | 'agent';
  avatarUrl?: string;
};

export type PlanItem = { id: string; label: string; done: boolean };

export type Reaction = { emoji: string; by: string[] };

export type Message =
  | { id: string; kind: 'system'; text: string }
  | {
      id: string;
      kind: 'msg';
      from: string;
      text: string;
      plan?: PlanItem[];
      reactions?: Reaction[];
      replies?: string[];
      // Renders an inline channel tag after the text — a link into another feature.
      channel?: string;
      // A visitor-sent message: text interleaved with clickable tags (see MentionTag).
      segments?: MessageSegment[];
    };

// Each channel is a feature — a branch/PR — so it carries a git status that
// drives its icon and accent, the way a stacked-PR list reads at a glance.
export type ChannelStatus = 'main' | 'draft' | 'open' | 'merged';

export type Channel = {
  slug: string;
  status: ChannelStatus;
  topic: string;
  members: string[];
  typing?: string;
  // When set, the composer in the chat panel hosts a prompt above the message
  // bar: `collab` is a live, co-written draft; `build` is that same prompt
  // locked read-only while the agent works; `built` is it once shipped.
  compose?: 'collab' | 'build' | 'built';
  messages: Message[];
};
