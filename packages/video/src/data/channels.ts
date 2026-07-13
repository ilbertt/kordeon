import type { Channel, Message } from '@repo/domain/workspace';
import { Bug, CreditCard, Filter, Home, type LucideIcon, TrendingUp } from 'lucide-react';
import { PEOPLE } from '#data/people';

// A channel is a feature — a branch/PR — so the rail reads like a stacked-PR list.
// Cold viewers can't decode the git-status glyph, so each carries a purpose icon
// (the same override the landing uses).
export type SceneChannel = Channel & { icon: LucideIcon };

const kordeTag = {
  kind: 'person',
  token: '@Korde',
  color: PEOPLE.korde.color,
  avatar: PEOPLE.korde.avatarUrl,
} as const;

export const HERO_SLUG = 'feat-activation-dashboard';

// The hero feature thread — a team and the agent shaping one idea into a shipped
// dashboard. The plan itself isn't a message the agent sends; it's the brief the
// team co-writes with Korde in the composer (see the collaborate plan), so the
// thread just gets them there and hands it off.
const activationMessages: Message[] = [
  { id: 'a0', kind: 'system', text: `You created the feature #${HERO_SLUG}` },
  {
    id: 'a1',
    kind: 'msg',
    from: 'you',
    text: "We keep guessing which signups actually stick. Let's see activation by cohort.",
  },
  {
    id: 'a2',
    kind: 'msg',
    from: 'maya',
    text: 'Yes — weekly cohorts, split by acquisition channel.',
    reactions: [{ emoji: '👍', by: ['theo', 'you'] }],
  },
  {
    id: 'a3',
    kind: 'msg',
    from: 'theo',
    text: '',
    segments: [
      { type: 'text', text: 'Let’s get ' },
      { type: 'tag', tag: kordeTag },
      { type: 'text', text: ' to draft the brief with us.' },
    ],
  },
  {
    id: 'a4',
    kind: 'msg',
    from: 'korde',
    text: 'On it — I’ve started the brief in the composer. Let’s shape it together before I build.',
  },
  {
    id: 'a5',
    kind: 'msg',
    from: 'ada',
    text: 'This is exactly the view I keep asking for.',
  },
  { id: 'a6', kind: 'msg', from: 'you', text: 'Perfect. Hand it off.' },
];

const ALL = ['maya', 'theo', 'ada', 'you', 'korde'];

// The rail reads like the fictional team's stacked branches — their features and
// fixes, not kordeon's. `feat-`/`fix-` prefixes make each a unit of work you can
// tell apart at a glance; the hero is the one open feature being built on-camera.
export const CHANNELS: SceneChannel[] = [
  {
    slug: 'welcome',
    status: 'main',
    topic: 'Where humans collaborate and agents execute',
    members: ALL,
    icon: Home,
    messages: [
      { id: 'w0', kind: 'system', text: 'Welcome to your workspace' },
      {
        id: 'w1',
        kind: 'msg',
        from: 'korde',
        text: 'Explorer, chat, preview — one surface. Talk it through here, I build on the right.',
      },
    ],
  },
  {
    slug: HERO_SLUG,
    status: 'open',
    topic: 'Activation by weekly cohort, split by channel',
    members: ALL,
    icon: TrendingUp,
    compose: 'collab',
    messages: activationMessages,
  },
  {
    slug: 'fix-signup-dropoff',
    status: 'merged',
    topic: 'Recover the drop-off on signup step 3',
    members: ['maya', 'ada', 'korde'],
    icon: Filter,
    messages: [{ id: 'f0', kind: 'system', text: 'Merged' }],
  },
  {
    slug: 'feat-usage-billing',
    status: 'draft',
    topic: 'Usage-based billing meter',
    members: ['maya', 'you', 'korde'],
    icon: CreditCard,
    messages: [{ id: 'b0', kind: 'system', text: 'Draft feature' }],
  },
  {
    slug: 'fix-onboarding-crash',
    status: 'merged',
    topic: 'Onboarding crash on Android 14',
    members: ['theo', 'ada', 'korde'],
    icon: Bug,
    messages: [{ id: 'm0', kind: 'system', text: 'Merged' }],
  },
];

export function channelBySlug(slug: string): SceneChannel | undefined {
  return CHANNELS.find((channel) => channel.slug === slug);
}
