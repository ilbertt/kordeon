import { Badge } from '@repo/ui/components/badge';
import { Button, buttonVariants } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import {
  ArrowRight,
  Bot,
  Check,
  Eye,
  FileText,
  GitBranch,
  GitMerge,
  GitPullRequest,
  GitPullRequestDraft,
  type LucideIcon,
  Mic,
  Plus,
  Search,
  Send,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { CollabPrompt } from '#components/collab-prompt';
import { CursorField } from '#components/cursor-field';
import { ScrollStage } from '#components/scroll-stage';
import { ThemeToggle } from '#components/theme-toggle';

// The cast that populates every feature thread — a small product team plus the
// agent. Colors come from the shared chart tokens (agent in teal `primary`), so
// presence reads consistently everywhere. Single source of truth: everything
// else references people by id.
type Person = {
  id: string;
  name: string;
  initials: string;
  color: string;
  kind: 'human' | 'agent';
};

const PEOPLE = {
  maya: { id: 'maya', name: 'Maya', initials: 'MR', color: 'var(--chart-3)', kind: 'human' },
  theo: { id: 'theo', name: 'Theo', initials: 'TK', color: 'var(--chart-4)', kind: 'human' },
  ada: { id: 'ada', name: 'Ada', initials: 'AL', color: 'var(--chart-5)', kind: 'human' },
  sam: { id: 'sam', name: 'Sam', initials: 'SI', color: 'var(--chart-2)', kind: 'human' },
  you: { id: 'you', name: 'You', initials: 'YO', color: 'var(--chart-2)', kind: 'human' },
  korde: { id: 'korde', name: 'Korde', initials: 'KO', color: 'var(--primary)', kind: 'agent' },
} satisfies Record<string, Person>;

type PersonId = keyof typeof PEOPLE;

const TEAM: PersonId[] = ['maya', 'theo', 'ada', 'you', 'korde'];

type PreviewKind = 'app' | 'code' | 'pricing';

type PlanItem = { id: string; label: string; done: boolean };

type Reaction = { emoji: string; by: PersonId[] };

type Message =
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
    };

// Each channel is a feature — a branch/PR — so it carries a git status that
// drives its icon and accent, the way a stacked-PR list reads at a glance.
type ChannelStatus = 'main' | 'draft' | 'open' | 'merged';

const STATUS: Record<ChannelStatus, { icon: LucideIcon; className: string }> = {
  main: { icon: GitBranch, className: 'text-muted-foreground' },
  draft: { icon: GitPullRequestDraft, className: 'text-muted-foreground' },
  open: { icon: GitPullRequest, className: 'text-chart-2' },
  merged: { icon: GitMerge, className: 'text-primary' },
};

function StatusIcon({ status, className }: { status: ChannelStatus; className?: string }) {
  const { icon: Icon, className: color } = STATUS[status];
  return <Icon className={cn('size-4 shrink-0', color, className)} />;
}

// A channel's slug is its single identifier: the URL fragment (`#refine-the-plan`),
// the sidebar/thread display name, and the React key — so there's no separate id
// to drift out of sync. Adding a channel means adding a member here first.
enum ChannelSlug {
  Welcome = 'welcome',
  Collaborate = 'collaborate',
  HandOff = 'hand-off',
  LivePreview = 'live-preview',
  Pricing = 'pricing',
}

type Channel = {
  slug: ChannelSlug;
  status: ChannelStatus;
  topic: string;
  members: PersonId[];
  typing?: PersonId;
  preview: PreviewKind;
  // When set, the composer in the chat panel hosts a live, co-written draft
  // instead of a plain input — collaborative composing is a chat activity.
  compose?: 'collab';
  messages: Message[];
};

const channels: Channel[] = [
  {
    slug: ChannelSlug.Welcome,
    status: 'main',
    topic: 'One surface — chat, the work, and the live preview',
    members: ['you', 'maya', 'theo', 'ada', 'korde'],
    preview: 'app',
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
    ],
  },
  {
    slug: ChannelSlug.Collaborate,
    status: 'draft',
    topic: 'Shape the ask and the plan, together',
    members: ['maya', 'theo', 'ada', 'you', 'korde'],
    typing: 'ada',
    preview: 'app',
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
    slug: ChannelSlug.HandOff,
    status: 'open',
    topic: 'Approve the plan, the agent implements it',
    members: ['maya', 'theo', 'you', 'korde'],
    preview: 'code',
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
        text: 'Opened PR #128 with the models + presence channel. Review it in the preview →',
      },
    ],
  },
  {
    slug: ChannelSlug.LivePreview,
    status: 'merged',
    topic: 'Watch it render as the agent ships each step',
    members: ['maya', 'theo', 'ada', 'you', 'korde'],
    preview: 'app',
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
    preview: 'pricing',
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

function Avatar({
  person,
  className,
  iconClassName,
}: {
  person: Person;
  className?: string;
  iconClassName?: string;
}) {
  if (person.kind === 'agent') {
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground',
          className,
        )}
      >
        <Bot className={cn('size-4', iconClassName)} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-medium text-white',
        className,
      )}
      style={{ backgroundColor: person.color }}
    >
      {person.initials}
    </span>
  );
}

function Facepile({ ids, online }: { ids: PersonId[]; online?: boolean }) {
  const people = ids.map((id) => PEOPLE[id]);
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {people.map((person) => (
          <Avatar
            key={person.id}
            person={person}
            className="size-6 text-[0.6rem] ring-2 ring-card"
            iconClassName="size-3.5"
          />
        ))}
      </div>
      {online ? (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <span className="size-1.5 rounded-full bg-chart-2" />
          {people.length} online
        </span>
      ) : null}
    </div>
  );
}

// The feature the page opens on when there's no fragment. Because there are no
// per-feature routes, all channels render into the one prerendered page — only
// the active one is shown — so every feature's content stays in the crawlable
// HTML and remains SEO-indexable.
const DEFAULT_SLUG = ChannelSlug.Welcome;

function channelBySlug(slug: string): Channel | undefined {
  return channels.find((channel) => channel.slug === slug);
}

// On load, a URL that deep-links to a real section (e.g. `#refine-the-plan`)
// should present the product already full at that section, skipping the
// scroll-in intro. A missing or unknown hash keeps the intro. Module-scope so
// its identity is stable — ScrollStage runs it once on mount.
function hasSectionHash(): boolean {
  return channelBySlug(window.location.hash.slice(1)) !== undefined;
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

// The active feature is derived from `location.hash`. `useSyncExternalStore` is
// the SSR-safe way to read it: the prerender/hydration pass uses the default and
// the client re-reads after mount, so there's no hydration mismatch. TanStack
// Router has no type-safe hash validation, so `ChannelSlug` is what keeps the
// fragment type-safe end to end.
function useActiveSlug(): ChannelSlug {
  return useSyncExternalStore(
    subscribeToHash,
    () => channelBySlug(window.location.hash.slice(1))?.slug ?? DEFAULT_SLUG,
    () => DEFAULT_SLUG,
  );
}

export function Landing() {
  const activeSlug = useActiveSlug();

  return (
    <ScrollStage openFullOnLoad={hasSectionHash}>
      <AppShell activeSlug={activeSlug} />
    </ScrollStage>
  );
}

function AppShell({ activeSlug }: { activeSlug: ChannelSlug }) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar activeSlug={activeSlug} />
        {channels.map((channel) => (
          <Thread key={channel.slug} channel={channel} active={channel.slug === activeSlug} />
        ))}
        {channels.map((channel) => (
          <PreviewPane key={channel.slug} channel={channel} active={channel.slug === activeSlug} />
        ))}
      </div>
    </div>
  );
}

const REPO_URL = 'https://github.com/ilbertt/kordeon';

// lucide-react no longer ships brand marks, so the GitHub logo is inlined.
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-border border-b px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Workflow className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">kordeon</span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="kordeon on GitHub"
          className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
        >
          <GithubIcon />
        </a>
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
          Sign in
        </Button>
        <Button size="sm">
          Get started — free
          <ArrowRight />
        </Button>
      </div>
    </header>
  );
}

function Sidebar({ activeSlug }: { activeSlug: ChannelSlug }) {
  return (
    <aside className="flex w-16 shrink-0 flex-col border-border border-r bg-muted/30 md:w-64">
      <div className="hidden items-center justify-between px-4 py-3 md:flex">
        <span className="font-medium text-sm">Features</span>
        <Plus className="size-4 text-muted-foreground" />
      </div>
      <div className="mx-2 mt-2 hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-muted-foreground text-xs md:flex">
        <Search className="size-3.5" />
        Search
      </div>
      <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
        {channels.map((channel) => {
          const isActive = channel.slug === activeSlug;
          const className = isActive
            ? 'flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-2 text-left font-medium text-primary text-sm'
            : 'flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground';
          return (
            <a key={channel.slug} href={`#${channel.slug}`} className={className}>
              <StatusIcon status={channel.status} />
              <span className="hidden truncate md:inline">#{channel.slug}</span>
              <span className="ml-auto hidden items-center gap-1 text-muted-foreground text-xs md:flex">
                <Users className="size-3" />
                {channel.members.length}
              </span>
            </a>
          );
        })}
      </nav>
      <div className="hidden items-center gap-2 border-border border-t px-3 py-3 md:flex">
        <Facepile ids={TEAM} />
        <span className="text-muted-foreground text-sm">Your team</span>
      </div>
    </aside>
  );
}

function Thread({ channel, active }: { channel: Channel; active: boolean }) {
  const typist = channel.typing ? PEOPLE[channel.typing] : null;
  return (
    <section className={cn('min-w-0 flex-1 flex-col', active ? 'flex' : 'hidden')}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-border border-b px-5">
        <StatusIcon status={channel.status} />
        <span className="font-medium">#{channel.slug}</span>
        <span className="mx-2 hidden text-border sm:inline">|</span>
        <span className="hidden truncate text-muted-foreground text-sm lg:inline">
          {channel.topic}
        </span>
        <div className="ml-auto hidden shrink-0 sm:block">
          <Facepile ids={channel.members} online />
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
        {channel.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      {typist ? <TypingIndicator person={typist} /> : null}
      <Composer channel={channel} />
    </section>
  );
}

// Dictation sits next to send on every composer — a message can be spoken, not
// just typed.
function ComposerActions() {
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground"
        aria-label="Dictate message"
      >
        <Mic />
      </Button>
      <Button size="sm" variant="ghost" className="text-muted-foreground" aria-label="Send message">
        <Send />
      </Button>
    </>
  );
}

// The composer lives in the chat panel. A collaborative channel composes its
// message as a live, co-written draft — presence cursors and all — because
// composing is a chat activity, not something that belongs in the preview.
function Composer({ channel }: { channel: Channel }) {
  if (channel.compose === 'collab') {
    return (
      <div className="shrink-0 px-5 pb-5">
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <div className="px-3 pt-3">
            <CollabPrompt />
          </div>
          <div className="flex items-center gap-2 border-border border-t px-3 py-2">
            <Plus className="size-4 text-muted-foreground" />
            <span className="flex-1 text-muted-foreground text-xs">
              Co-writing with your team — anyone can edit
            </span>
            <ComposerActions />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="shrink-0 px-5 pb-5">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm">
        <Plus className="size-4 text-muted-foreground" />
        <span className="flex-1 text-muted-foreground text-sm">Message #{channel.slug}…</span>
        <ComposerActions />
      </div>
    </div>
  );
}

const TYPING_DELAYS = ['0ms', '150ms', '300ms'];

function TypingIndicator({ person }: { person: Person }) {
  return (
    <div className="flex shrink-0 items-center gap-2 px-5 pb-1 text-muted-foreground text-xs">
      <Avatar person={person} className="size-5 text-[0.5rem]" iconClassName="size-3" />
      <span>{person.name} is typing</span>
      <span className="flex items-center gap-0.5">
        {TYPING_DELAYS.map((delay) => (
          <span
            key={delay}
            className="size-1 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: delay }}
          />
        ))}
      </span>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  if (message.kind === 'system') {
    return (
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <span className="h-px flex-1 bg-border" />
        <span className="max-w-md text-center text-balance">{message.text}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  const person = PEOPLE[message.from];
  const isAgent = person.kind === 'agent';
  return (
    <div className="flex gap-3">
      <Avatar person={person} className="size-8 text-xs" iconClassName="size-4.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">{person.name}</span>
          {isAgent ? (
            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[0.625rem]">
              <Zap className="size-2.5" />
              AI
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-pretty text-foreground/90 text-sm leading-relaxed">
          {message.text}
        </p>
        {message.plan ? <PlanCard items={message.plan} /> : null}
        {message.reactions ? <Reactions items={message.reactions} /> : null}
        {message.replies ? <Replies ids={message.replies} /> : null}
        {message.cta ? (
          <Button size="sm" className="mt-3">
            Create your workspace
            <ArrowRight />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Reactions({ items }: { items: Reaction[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((reaction) => (
        <span
          key={reaction.emoji}
          className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs"
        >
          <span>{reaction.emoji}</span>
          <span className="text-muted-foreground">{reaction.by.length}</span>
        </span>
      ))}
    </div>
  );
}

function Replies({ ids }: { ids: PersonId[] }) {
  const people = ids.map((id) => PEOPLE[id]);
  return (
    <button
      type="button"
      className="mt-2 flex items-center gap-2 rounded-md py-0.5 font-medium text-primary text-xs hover:underline"
    >
      <div className="flex -space-x-1.5">
        {people.map((person) => (
          <Avatar
            key={person.id}
            person={person}
            className="size-5 text-[0.5rem] ring-2 ring-card"
            iconClassName="size-3"
          />
        ))}
      </div>
      {people.length} replies
    </button>
  );
}

function PlanCard({ items }: { items: PlanItem[] }) {
  const done = items.filter((item) => item.done).length;
  return (
    <div className="mt-3 max-w-md rounded-lg border border-border bg-card p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-medium text-sm">Implementation plan</span>
        <span className="text-muted-foreground text-xs">
          {done}/{items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 text-sm">
            <span
              className={
                item.done
                  ? 'flex size-4 items-center justify-center rounded-[4px] bg-primary text-primary-foreground'
                  : 'size-4 rounded-[4px] border border-border'
              }
            >
              {item.done ? <Check className="size-3" /> : null}
            </span>
            <span className={item.done ? 'text-muted-foreground line-through' : ''}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewPane({ channel, active }: { channel: Channel; active: boolean }) {
  return (
    <aside
      className={cn(
        'w-[22rem] shrink-0 flex-col border-border border-l bg-muted/20',
        active ? 'hidden xl:flex' : 'hidden',
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-border border-b px-5">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Eye className="size-4 text-muted-foreground" />
          Preview
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <PreviewSurface kind={channel.preview} />
      </div>
    </aside>
  );
}

function PreviewSurface({ kind }: { kind: PreviewKind }) {
  if (kind === 'code') {
    return (
      <PreviewFrame title="PR #128 · workspace models">
        <div className="flex items-center gap-2 text-chart-2 text-xs">
          <GitPullRequest className="size-3.5" />
          Open · 6 files changed
        </div>
        <div className="mt-3 space-y-1 font-mono text-[0.7rem] leading-relaxed">
          <div className="rounded-sm bg-chart-2/10 px-2 text-chart-2">+ model Workspace {'{'}</div>
          <div className="px-2 text-muted-foreground">&nbsp;&nbsp;id String @id</div>
          <div className="rounded-sm bg-chart-2/10 px-2 text-chart-2">+ members Member[]</div>
          <div className="px-2 text-muted-foreground">{'}'}</div>
          <div className="rounded-sm bg-destructive/10 px-2 text-destructive">
            {'- // todo: presence'}
          </div>
        </div>
      </PreviewFrame>
    );
  }

  if (kind === 'pricing') {
    return (
      <div className="space-y-3">
        <PriceTier name="Starter" price="$0" note="for small teams" highlight={false} />
        <PriceTier name="Pro" price="$20" note="per agent / month" highlight />
        <PriceTier name="Scale" price="Custom" note="usage-based" highlight={false} />
      </div>
    );
  }

  // The running product: the presence feature the team just built, live. Real
  // cursors (the shared `CursorField`) drift over the doc and the online facepile
  // includes the agent — so the preview *is* the artifact, not a mock of one.
  return (
    <PreviewFrame title="kordeon · editor">
      <div className="relative min-h-[15rem]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
            <FileText className="size-3.5" />
            Realtime presence
          </div>
          <Facepile ids={['maya', 'theo', 'ada', 'korde']} online />
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="h-2.5 w-1/2 rounded-full bg-foreground/20" />
          <div className="h-2 w-full rounded-full bg-foreground/10" />
          <div className="h-2 w-5/6 rounded-full bg-foreground/10" />
          <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
          <div className="h-2 w-4/5 rounded-full bg-foreground/10" />
          <div className="h-2 w-3/5 rounded-full bg-foreground/10" />
        </div>
        <CursorField />
      </div>
    </PreviewFrame>
  );
}

function PreviewFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-border border-b bg-muted/40 px-3 py-2">
        <span className="size-2 rounded-full bg-destructive/50" />
        <span className="size-2 rounded-full bg-chart-4/60" />
        <span className="size-2 rounded-full bg-chart-2/60" />
        <span className="ml-2 truncate text-muted-foreground text-[0.7rem]">{title}</span>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}

function PriceTier({
  name,
  price,
  note,
  highlight,
}: {
  name: string;
  price: string;
  note: string;
  highlight: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? 'rounded-lg border border-primary/40 bg-card p-4 ring-1 ring-primary/20'
          : 'rounded-lg border border-border bg-card p-4'
      }
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{name}</span>
        {highlight ? (
          <Badge variant="secondary" className="text-[0.625rem]">
            Popular
          </Badge>
        ) : null}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-semibold text-xl tracking-tight">{price}</span>
        <span className="text-muted-foreground text-xs">{note}</span>
      </div>
    </div>
  );
}
