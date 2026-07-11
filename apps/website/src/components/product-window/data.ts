import type { Channel, MentionTagData, Person } from '@repo/domain/workspace';
import type { MentionSuggestion } from '@repo/ui/custom/mention/types';
import { AppWindow, Code, Hammer, Home, type LucideIcon, Sparkles, Tag, Users } from 'lucide-react';
import adaAvatar from '#assets/avatars/ada.svg';
import kordeAvatar from '#assets/avatars/korde.svg';
import mayaAvatar from '#assets/avatars/maya.svg';
import theoAvatar from '#assets/avatars/theo.svg';
import youAvatar from '#assets/avatars/you.svg';

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
  Details = 'the-details',
  OpenSource = 'open-source',
  Pricing = 'pricing',
}

// The seeded date chip in #the-details. `token`/`tooltip` are literal strings —
// the source-zone rendering of KICKOFF_VALUE, kept as constants (not computed via
// Intl at module load) so the prerender and client agree byte-for-byte, exactly
// like the relative labels below. Once mounted, MentionTag re-renders the chip in
// the reader's own timezone from `date`: that flip *is* the feature. Keep the
// literals in sync with KICKOFF_VALUE (15:00 America/Los_Angeles = 3:00 PM PDT).
const KICKOFF_VALUE = { date: '2026-08-14', time: '15:00', timeZone: 'America/Los_Angeles' };
const KICKOFF_TOKEN = 'Aug 14, 3:00 PM PDT';
const KICKOFF_TAG: MentionTagData = {
  kind: 'time',
  token: KICKOFF_TOKEN,
  tooltip: `${KICKOFF_TOKEN} — shown in your time`,
  date: KICKOFF_VALUE,
};

// A landing channel satisfies the domain `Channel` shape and carries a purpose
// icon: cold visitors can't decode the git-status metaphor, so the rail shows
// what each channel is *for* instead (the shared components fall back to the
// status icon when no override is passed). The seeded channels pin their slug to
// `ChannelSlug`; visitor-created ones (see the dynamic registry below) carry a
// plain slugified string, so the slug stays a string here.
export type LandingChannel = Channel & { icon: LucideIcon };

export const channels: LandingChannel[] = [
  {
    slug: ChannelSlug.Welcome,
    status: 'main',
    icon: Home,
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
        text: 'Your team and I work across all three panels — talk it through here, I pull the context and build it, and it renders live in the preview on the right. No tabbing away. Browse the features on the left, or just tell me what to build.',
        reactions: [{ emoji: '👋', by: ['maya', 'theo', 'ada'] }],
      },
      {
        id: 'w3',
        kind: 'msg',
        from: 'maya',
        text: 'Yes — let’s shape the plans together, that’s the fun part.',
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
    icon: Users,
    topic: 'Turn the idea into a plan, together',
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
        text: 'Drafted that into the plan above. I checked the warehouse — the signups table already has a channel column, so no new pipeline needed, and I matched the finance export’s definition so the numbers reconcile. Does a paid trial count as activated, or only a conversion?',
      },
      {
        id: 'c4',
        kind: 'msg',
        from: 'ada',
        text: 'Only conversions. @Korde can you take the warehouse query? I’m heads-down on billing.',
        segments: [
          { type: 'text', text: 'Only conversions. ' },
          { type: 'tag', tag: { kind: 'person', token: '@Korde' } },
          { type: 'text', text: ' can you take the warehouse query? I’m heads-down on billing.' },
        ],
      },
      {
        id: 'c5',
        kind: 'msg',
        from: 'korde',
        text: 'On it — drafting it off the existing connection, no new access needed. @Ada I’ll tag you to review before it runs.',
        segments: [
          {
            type: 'text',
            text: 'On it — drafting it off the existing connection, no new access needed. ',
          },
          { type: 'tag', tag: { kind: 'person', token: '@Ada' } },
          { type: 'text', text: ' I’ll tag you to review before it runs.' },
        ],
        reactions: [{ emoji: '👍', by: ['ada'] }],
      },
      {
        id: 'c6',
        kind: 'msg',
        from: 'maya',
        text: 'And drop the scheduled refresh — next sprint.',
        reactions: [{ emoji: '✅', by: ['you', 'theo'] }],
      },
      {
        id: 'c7',
        kind: 'msg',
        from: 'korde',
        text: 'Updated. The plan’s ready whenever you want to hand it to me.',
      },
    ],
  },
  {
    slug: ChannelSlug.Build,
    status: 'open',
    icon: Hammer,
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
        text: 'On it. Step 1 of 3 done — ran the query @Ada signed off on, metrics defined. Charting signups by week now.',
        segments: [
          { type: 'text', text: 'On it. Step 1 of 3 done — ran the query ' },
          { type: 'tag', tag: { kind: 'person', token: '@Ada' } },
          { type: 'text', text: ' signed off on, metrics defined. Charting signups by week now.' },
        ],
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
    icon: AppWindow,
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
        from: 'korde',
        text: 'Same thing jumped out at me — organic’s converting about 2× better than paid. Want me to add a cohort breakdown by signup month so we can see if it holds?',
      },
      {
        id: 'v4',
        kind: 'msg',
        from: 'you',
        text: 'Ship it — and yes, do the breakdown.',
      },
    ],
  },
  {
    slug: ChannelSlug.Details,
    status: 'main',
    icon: Sparkles,
    topic: 'The little things other chat apps skip',
    members: ['you', 'maya', 'ada', 'korde'],
    messages: [
      {
        id: 'td1',
        kind: 'msg',
        from: 'korde',
        text: 'A few things we sweat that most chat apps skip. Exhibit A: a date in a message isn’t plain text — it’s a real, timezone-aware chip.',
      },
      {
        id: 'td2',
        kind: 'msg',
        from: 'maya',
        text: `Kickoff’s locked for ${KICKOFF_TOKEN}. Works for everyone?`,
        segments: [
          { type: 'text', text: 'Kickoff’s locked for ' },
          { type: 'tag', tag: KICKOFF_TAG },
          { type: 'text', text: '. Works for everyone?' },
        ],
      },
      {
        id: 'td3',
        kind: 'msg',
        from: 'ada',
        text: 'Perfect — and it’s already showing in my timezone, no mental math.',
        reactions: [{ emoji: '🙌', by: ['maya', 'you'] }],
      },
      {
        id: 'td4',
        kind: 'msg',
        from: 'korde',
        text: 'Every date works like this: hover to read it in your time, click to change it. Your turn — type @ in the box below and pick a date. It’ll land in your timezone.',
      },
    ],
  },
  {
    slug: ChannelSlug.OpenSource,
    status: 'main',
    icon: Code,
    topic: 'Open source, and yours to self-host',
    members: ['you', 'korde'],
    messages: [
      {
        id: 'os1',
        kind: 'msg',
        from: 'you',
        text: 'Is kordeon actually open source? Can we run it ourselves?',
      },
      {
        id: 'os2',
        kind: 'msg',
        from: 'korde',
        text: 'Yep — the whole thing is open source, and self-hostable. Clone it, run it on your own infra, keep your data in-house. Nothing’s locked behind our servers — the setup’s on the right.',
      },
    ],
  },
  {
    slug: ChannelSlug.Pricing,
    status: 'open',
    icon: Tag,
    topic: 'Pricing’s still taking shape — get on the list',
    members: ['you', 'korde'],
    messages: [
      {
        id: 'pr1',
        kind: 'msg',
        from: 'you',
        text: 'Hey @Korde, how much is this going to cost?',
        segments: [
          { type: 'text', text: 'Hey ' },
          { type: 'tag', tag: { kind: 'person', token: '@Korde' } },
          { type: 'text', text: ', how much is this going to cost?' },
        ],
      },
      {
        id: 'pr2',
        kind: 'msg',
        from: 'korde',
        text: 'Honest answer: we’re still figuring that out — we want to talk to early teams before we lock in a price. Planning together will always be free; you’d only ever pay for agent runs as you scale.',
      },
      {
        id: 'pr3',
        kind: 'msg',
        from: 'korde',
        text: 'Want first access? Send me your email below and I’ll save you a spot on the waitlist.',
      },
    ],
  },
];

// The public repo — surfaced in the top bar and the open-source preview.
export const REPO_URL = 'https://github.com/ilbertt/kordeon';

// The agent's open-source reply that carries the live GitHub star (see GithubStar).
export const OPEN_SOURCE_STAR_MESSAGE_ID = 'os2';

// Relative time tags, Notion-style. Kept as labels (not computed dates) so the
// prerender and client agree and there's no date math to drift.
export const TIME_MENTIONS = ['Today', 'Tomorrow'];

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

// Visitor-created channels live only in the browser session (never persisted),
// so they sit in a tiny module-level registry the routing consults alongside the
// seeded list. `EMPTY_DYNAMIC_CHANNELS` is a stable reference so the
// `useSyncExternalStore` server snapshot never changes identity between renders.
const EMPTY_DYNAMIC_CHANNELS: LandingChannel[] = [];
let dynamicChannels: LandingChannel[] = EMPTY_DYNAMIC_CHANNELS;
const dynamicChannelListeners = new Set<() => void>();

export function getDynamicChannels(): LandingChannel[] {
  return dynamicChannels;
}

export function getDynamicChannelsServerSnapshot(): LandingChannel[] {
  return EMPTY_DYNAMIC_CHANNELS;
}

export function subscribeDynamicChannels(onChange: () => void): () => void {
  dynamicChannelListeners.add(onChange);
  return () => {
    dynamicChannelListeners.delete(onChange);
  };
}

export function addDynamicChannel(channel: LandingChannel): void {
  dynamicChannels = [...dynamicChannels, channel];
  for (const listener of dynamicChannelListeners) {
    listener();
  }
}

// Turns a visitor's feature name into a unique, fragment-safe slug so a created
// channel routes through `location.hash` exactly like a seeded one.
export function slugifyChannelName(name: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'feature';
  let slug = base;
  let suffix = 2;
  while (channelBySlug(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

// Builds a freshly created feature: the agent greets it and invites the visitor
// to say what to build — the create → ask handoff. There's no auto-reply beyond
// this greeting.
export function createChannel({ name, icon }: { name: string; icon: LucideIcon }): LandingChannel {
  const slug = slugifyChannelName(name);
  return {
    slug,
    status: 'draft',
    icon,
    topic: 'A new feature — tell Korde what to build',
    members: ['you', 'korde'],
    messages: [
      {
        id: `${slug}-intro`,
        kind: 'msg',
        from: 'korde',
        text: `New feature #${slug} — what are we building here? Tell me what you have in mind and I’ll draft the plan.`,
      },
    ],
  };
}

// The feature the page opens on when there's no fragment. Because there are no
// per-feature routes, all channels render into the one prerendered page — only
// the active one is shown — so every feature's content stays in the crawlable
// HTML and remains SEO-indexable.
export const DEFAULT_SLUG = ChannelSlug.Welcome;

export function channelBySlug(slug: string): LandingChannel | undefined {
  return (
    channels.find((channel) => channel.slug === slug) ??
    dynamicChannels.find((channel) => channel.slug === slug)
  );
}
