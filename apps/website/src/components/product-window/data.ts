import type { Channel, Person } from '@repo/domain/workspace';
import type { MentionSuggestion } from '@repo/ui/custom/mention/types';
import adaAvatar from '#assets/avatars/ada.svg';
import kordeAvatar from '#assets/avatars/korde.svg';
import mayaAvatar from '#assets/avatars/maya.svg';
import theoAvatar from '#assets/avatars/theo.svg';
import youAvatar from '#assets/avatars/you.svg';
import { PRICING_TIERS } from './pricing';

// The cast that populates every feature thread — a small product team plus the
// agent. Colors come from the shared chart tokens (agent in teal `primary`), so
// presence reads consistently everywhere. Single source of truth: everything
// else references people by id. Each carries its avatar image (the fallback is
// the coloured initials).
export const PEOPLE = {
  maya: {
    id: 'maya',
    name: 'Maya',
    initials: 'MR',
    color: 'var(--chart-3)',
    kind: 'human',
    avatarUrl: mayaAvatar,
  },
  theo: {
    id: 'theo',
    name: 'Theo',
    initials: 'TK',
    color: 'var(--chart-4)',
    kind: 'human',
    avatarUrl: theoAvatar,
  },
  ada: {
    id: 'ada',
    name: 'Ada',
    initials: 'AL',
    color: 'var(--chart-5)',
    kind: 'human',
    avatarUrl: adaAvatar,
  },
  you: {
    id: 'you',
    name: 'You',
    initials: 'YO',
    color: 'var(--chart-2)',
    kind: 'human',
    avatarUrl: youAvatar,
  },
  korde: {
    id: 'korde',
    name: 'Korde',
    initials: 'KO',
    color: 'var(--primary)',
    kind: 'agent',
    avatarUrl: kordeAvatar,
  },
} satisfies Record<string, Person>;

// A channel's slug is its single identifier: the URL fragment (`#refine-the-plan`),
// the sidebar/thread display name, and the React key — so there's no separate id
// to drift out of sync. Adding a channel means adding a member here first. This
// is a landing-only device; the domain `Channel.slug` is a plain string.
export enum ChannelSlug {
  Welcome = 'welcome',
  Collaborate = 'collaborate',
  Build = 'build',
  LivePreview = 'live-preview',
  Pricing = 'pricing',
}

// The landing pins each channel's slug to the enum, while still satisfying the
// domain `Channel` shape (whose slug is a plain string).
type LandingChannel = Channel & { slug: ChannelSlug };

export const channels: LandingChannel[] = [
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
        text: 'Your team and I work across all three — talk it through here, I pull the context and build it, and it renders in the preview. No tabbing away. Browse the features on the left, or start a thread and tell me what to build. And kordeon itself is open source — the whole thing’s on GitHub.',
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
    topic: 'Turn the idea into a prompt, together',
    members: ['maya', 'theo', 'ada', 'you', 'korde'],
    typing: 'ada',
    compose: 'collab',
    messages: [
      {
        id: 'c1',
        kind: 'msg',
        from: 'maya',
        text: 'I want one view of how new signups actually convert.',
      },
      {
        id: 'c2',
        kind: 'msg',
        from: 'theo',
        text: 'Signups by week, and activation rate by channel.',
      },
      {
        id: 'c3',
        kind: 'msg',
        from: 'korde',
        text: 'Drafted that into the prompt above and added the warehouse source. One thing to pin down — does a paid trial count as activated, or only a conversion?',
      },
      {
        id: 'c4',
        kind: 'msg',
        from: 'ada',
        text: 'Only conversions. I’ll handle the warehouse query.',
        reactions: [{ emoji: '👍', by: ['maya'] }],
      },
      {
        id: 'c5',
        kind: 'msg',
        from: 'maya',
        text: 'And drop the scheduled refresh — next sprint.',
        reactions: [{ emoji: '✅', by: ['you', 'theo'] }],
      },
      {
        id: 'c6',
        kind: 'msg',
        from: 'korde',
        text: 'Updated. The prompt’s ready whenever you want to hand it to me.',
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
        text: 'On it. Step 1 of 3 done — warehouse connected, metrics defined. Charting signups by week now.',
      },
      {
        id: 'h3',
        kind: 'msg',
        from: 'korde',
        text: 'Step 2 in — signups-by-week trend is live. Opened PR #128 with the query + charts; the preview goes live as each step ships.',
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
        text: 'Step 3 is live — activation by channel is wired up. Both charts are rendering; the preview on the right is running the latest build.',
      },
      {
        id: 'v2',
        kind: 'msg',
        from: 'maya',
        text: 'Organic’s converting at 51% — worth doubling down.',
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
        text: 'Hey @Korde, can you show me the pricing?',
        segments: [
          { type: 'text', text: 'Hey ' },
          { type: 'tag', tag: { kind: 'person', token: '@Korde' } },
          { type: 'text', text: ', can you show me the pricing?' },
        ],
      },
      {
        id: 'pr2',
        kind: 'msg',
        from: 'korde',
        text: 'Of course! Planning and collaborating is always free — you only pay for the agent runs you actually ship. Here are the plans:',
        pricing: PRICING_TIERS,
      },
    ],
  },
];

// Relative time tags, Notion-style. Kept as labels (not computed dates) so the
// prerender and client agree and there's no date math to drift.
export const TIME_MENTIONS = ['Today', 'Tomorrow', 'This afternoon', 'Next Monday', 'In two weeks'];

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
      avatar: person.avatarUrl,
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

export function channelBySlug(slug: string) {
  return channels.find((channel) => channel.slug === slug);
}
