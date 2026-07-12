import type { Channel, Message } from '@repo/domain/workspace';
import { AppWindow, CreditCard, Home, type LucideIcon, Smartphone, TrendingUp } from 'lucide-react';
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

// The hero feature thread — a team and the agent shaping one idea into a shipped
// dashboard. The video reveals these one at a time and swaps `compose`/preview
// per beat; the message stream itself is the spine of the film.
const activationMessages: Message[] = [
  { id: 'a0', kind: 'system', text: 'You created the feature #activation-dashboard' },
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
      { type: 'text', text: ' to draft a plan we can shape together.' },
    ],
  },
  {
    id: 'a4',
    kind: 'msg',
    from: 'korde',
    text: 'On it. Here’s a plan — tweak anything before we build:',
    plan: [
      { id: 'p1', label: 'Pull signups from the warehouse on a schedule', done: true },
      { id: 'p2', label: 'Compute weekly activation cohorts', done: true },
      { id: 'p3', label: 'Break activation down by acquisition channel', done: false },
      { id: 'p4', label: 'Render the dashboard in the preview', done: false },
    ],
    reactions: [
      { emoji: '🔥', by: ['ada', 'maya'] },
      { emoji: '🚀', by: ['you'] },
    ],
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
    slug: 'activation-dashboard',
    status: 'open',
    topic: 'Activation by weekly cohort, split by channel',
    members: ALL,
    icon: TrendingUp,
    compose: 'collab',
    messages: activationMessages,
  },
  {
    slug: 'billing-usage',
    status: 'draft',
    topic: 'Usage-based billing meter',
    members: ['maya', 'you', 'korde'],
    icon: CreditCard,
    messages: [{ id: 'b0', kind: 'system', text: 'Draft feature' }],
  },
  {
    slug: 'mobile-onboarding',
    status: 'merged',
    topic: 'Shipped last week',
    members: ['theo', 'ada', 'korde'],
    icon: Smartphone,
    messages: [{ id: 'm0', kind: 'system', text: 'Merged' }],
  },
  {
    slug: 'live-preview',
    status: 'open',
    topic: 'The running product, rendering as it builds',
    members: ALL,
    icon: AppWindow,
    messages: [{ id: 'l0', kind: 'system', text: 'Preview' }],
  },
];

export const HERO_SLUG = 'activation-dashboard';

export function channelBySlug(slug: string): SceneChannel | undefined {
  return CHANNELS.find((channel) => channel.slug === slug);
}
