import adaAvatar from '#assets/avatars/ada.svg';
import kordeAvatar from '#assets/avatars/korde.svg';
import mayaAvatar from '#assets/avatars/maya.svg';
import theoAvatar from '#assets/avatars/theo.svg';
import youAvatar from '#assets/avatars/you.svg';
import type { MentionSuggestion, MessageSegment } from '#components/mention/types';

// The cast that populates every feature thread — a small product team plus the
// agent. Colors come from the shared chart tokens (agent in teal `primary`), so
// presence reads consistently everywhere. Single source of truth: everything
// else references people by id.
export type Person = {
  id: string;
  name: string;
  initials: string;
  color: string;
  kind: 'human' | 'agent';
};

export const PEOPLE = {
  maya: { id: 'maya', name: 'Maya', initials: 'MR', color: 'var(--chart-3)', kind: 'human' },
  theo: { id: 'theo', name: 'Theo', initials: 'TK', color: 'var(--chart-4)', kind: 'human' },
  ada: { id: 'ada', name: 'Ada', initials: 'AL', color: 'var(--chart-5)', kind: 'human' },
  you: { id: 'you', name: 'You', initials: 'YO', color: 'var(--chart-2)', kind: 'human' },
  korde: { id: 'korde', name: 'Korde', initials: 'KO', color: 'var(--primary)', kind: 'agent' },
} satisfies Record<string, Person>;

export type PersonId = keyof typeof PEOPLE;

export const AVATARS: Record<string, string> = {
  maya: mayaAvatar,
  theo: theoAvatar,
  ada: adaAvatar,
  you: youAvatar,
  korde: kordeAvatar,
};

export type PlanItem = { id: string; label: string; done: boolean };

export type Reaction = { emoji: string; by: PersonId[] };

export type Message =
  | { id: string; kind: 'system'; text: string }
  | {
      id: string;
      kind: 'msg';
      from: PersonId;
      text: string;
      plan?: PlanItem[];
      reactions?: Reaction[];
      replies?: PersonId[];
      cta?: boolean;
      // Renders an inline channel tag after the text — a link into another feature.
      channel?: ChannelSlug;
      // A visitor-sent message: text interleaved with clickable tags (see MentionTag).
      segments?: MessageSegment[];
    };

// Each channel is a feature — a branch/PR — so it carries a git status that
// drives its icon and accent, the way a stacked-PR list reads at a glance.
export type ChannelStatus = 'main' | 'draft' | 'open' | 'merged';

// A channel's slug is its single identifier: the URL fragment (`#refine-the-plan`),
// the sidebar/thread display name, and the React key — so there's no separate id
// to drift out of sync. Adding a channel means adding a member here first.
export enum ChannelSlug {
  Welcome = 'welcome',
  Collaborate = 'collaborate',
  Build = 'build',
  LivePreview = 'live-preview',
  Pricing = 'pricing',
}

export type Channel = {
  slug: ChannelSlug;
  status: ChannelStatus;
  topic: string;
  members: PersonId[];
  typing?: PersonId;
  // When set, the composer in the chat panel hosts a prompt above the message
  // bar: `collab` is a live, co-written draft; `build` is that same prompt
  // locked read-only while the agent works; `built` is it once shipped.
  compose?: 'collab' | 'build' | 'built';
  messages: Message[];
};

export const channels: Channel[] = [
  {
    slug: ChannelSlug.Welcome,
    status: 'main',
    topic: 'One surface — chat, the work, and the live preview',
    members: ['you', 'maya', 'theo', 'ada', 'korde'],
    messages: [
      {
        id: 'w1',
        kind: 'system',
        text: 'This is kordeon — one workspace, three panels: your features on the left, the conversation here, the live product on the right.',
      },
      {
        id: 'w2',
        kind: 'msg',
        from: 'korde',
        text: 'Your team and I work across all three — talk it through here, I pull the context and build it, and it renders in the preview. No tabbing away. Browse the features on the left, or start a thread and tell me what to build.',
        reactions: [{ emoji: '👋', by: ['maya', 'theo', 'ada'] }],
      },
      {
        id: 'w3',
        kind: 'msg',
        from: 'maya',
        text: 'Yes — let’s shape the prompts together, that’s the fun part.',
        reactions: [{ emoji: '💯', by: ['theo', 'you'] }],
      },
      {
        id: 'w4',
        kind: 'msg',
        from: 'theo',
        text: 'And it renders live in the preview as it’s built — no tab-hopping.',
      },
      {
        id: 'w5',
        kind: 'msg',
        from: 'ada',
        text: 'I’ll pick up the backend pieces as they land.',
      },
      {
        id: 'w6',
        kind: 'msg',
        from: 'maya',
        text: 'Let’s kick this off in',
        channel: ChannelSlug.Collaborate,
      },
    ],
  },
  {
    slug: ChannelSlug.Collaborate,
    status: 'draft',
    topic: 'Shape the ask and the plan, together',
    members: ['maya', 'theo', 'ada', 'you', 'korde'],
    typing: 'ada',
    compose: 'collab',
    messages: [
      {
        id: 'c1',
        kind: 'msg',
        from: 'maya',
        text: 'We need realtime presence in the editor — cursors and who’s online.',
      },
      {
        id: 'c2',
        kind: 'msg',
        from: 'theo',
        text: 'Agreed. Let’s sync cursors too, not just presence.',
        reactions: [{ emoji: '👍', by: ['maya', 'you'] }],
      },
      {
        id: 'c3',
        kind: 'msg',
        from: 'ada',
        text: 'I’ll take the presence channel on the backend.',
      },
      {
        id: 'c4',
        kind: 'msg',
        from: 'korde',
        text: 'Got it — presence + cursor sync, Ada on the backend. Here’s a plan — edit any step, reorder, or add your own before we start.',
        plan: [
          { id: 'm', label: 'Add workspace + membership models', done: true },
          { id: 'r', label: 'Realtime channel with presence', done: true },
          { id: 'c', label: 'Cursor sync across collaborators', done: false },
          { id: 'i', label: 'Invite flow with magic links', done: false },
        ],
      },
      {
        id: 'c5',
        kind: 'msg',
        from: 'maya',
        text: 'Looks great. Drop the invite step for now — we’ll do that next sprint.',
        reactions: [{ emoji: '✅', by: ['you', 'theo'] }],
      },
      {
        id: 'c6',
        kind: 'msg',
        from: 'theo',
        text: 'Moving cursor sync above the invite flow so it lands first.',
      },
    ],
  },
  {
    slug: ChannelSlug.Build,
    status: 'open',
    topic: 'Plan approved — the agent builds it',
    members: ['maya', 'theo', 'you', 'korde'],
    compose: 'build',
    messages: [
      {
        id: 'h1',
        kind: 'msg',
        from: 'you',
        text: 'Plan approved. Hand it off. 🚀',
        reactions: [{ emoji: '🚀', by: ['maya', 'theo', 'ada'] }],
      },
      {
        id: 'h2',
        kind: 'msg',
        from: 'korde',
        text: 'On it. Implementing step 1 of 3 — scaffolding the workspace models and migrations.',
      },
      {
        id: 'h3',
        kind: 'msg',
        from: 'korde',
        text: 'Opened PR #128 with the models + presence channel — the preview goes live once it ships.',
      },
    ],
  },
  {
    slug: ChannelSlug.LivePreview,
    status: 'merged',
    topic: 'Watch it render as the agent ships each step',
    members: ['maya', 'theo', 'ada', 'you', 'korde'],
    compose: 'built',
    messages: [
      {
        id: 'v1',
        kind: 'msg',
        from: 'korde',
        text: 'Step 2 is live — presence is wired up. The preview on the right is running the latest build.',
      },
      {
        id: 'v2',
        kind: 'msg',
        from: 'maya',
        text: 'Cursors are buttery.',
        reactions: [{ emoji: '🔥', by: ['theo', 'ada', 'you'] }],
      },
      {
        id: 'v3',
        kind: 'msg',
        from: 'you',
        text: 'Ship it.',
      },
    ],
  },
  {
    slug: ChannelSlug.Pricing,
    status: 'open',
    topic: 'Simple, usage-based pricing',
    members: ['you', 'korde'],
    messages: [
      {
        id: 'pr1',
        kind: 'msg',
        from: 'you',
        text: 'How much does this cost?',
      },
      {
        id: 'pr2',
        kind: 'msg',
        from: 'korde',
        text: 'Free to start — invite your team and plan as much as you like. You only pay for agent runs as you scale.',
        cta: true,
      },
    ],
  },
];

// Relative time tags, Notion-style. Kept as labels (not computed dates) so the
// prerender and client agree and there's no date math to drift.
export const TIME_MENTIONS = ['Today', 'Tomorrow', 'This afternoon', 'Next Monday', 'In two weeks'];

// Everything the message composer can tag: the team and agent, every feature
// channel, and a few times — derived from the same single sources of truth so
// the tagger never drifts from the roster or the sidebar.
export const MENTION_SUGGESTIONS: MentionSuggestion[] = [
  ...Object.values(PEOPLE)
    .filter((person) => person.id !== 'you')
    .map((person) => ({
      id: `person-${person.id}`,
      kind: 'person' as const,
      label: person.name,
      token: `@${person.name}`,
      detail: person.kind === 'agent' ? 'Agent' : 'Member',
      color: person.color,
      avatar: AVATARS[person.id],
    })),
  ...channels.map((channel) => ({
    id: `channel-${channel.slug}`,
    kind: 'channel' as const,
    label: channel.slug,
    token: `#${channel.slug}`,
    detail: channel.topic,
  })),
  ...TIME_MENTIONS.map((label) => ({
    id: `time-${label}`,
    kind: 'time' as const,
    label,
    token: label,
  })),
];

// The feature the page opens on when there's no fragment. Because there are no
// per-feature routes, all channels render into the one prerendered page — only
// the active one is shown — so every feature's content stays in the crawlable
// HTML and remains SEO-indexable.
export const DEFAULT_SLUG = ChannelSlug.Welcome;

export function channelBySlug(slug: string): Channel | undefined {
  return channels.find((channel) => channel.slug === slug);
}
