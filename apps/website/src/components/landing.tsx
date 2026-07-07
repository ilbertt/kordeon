import { Badge } from '@repo/ui/components/badge';
import { Button, buttonVariants } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import {
  ArrowRight,
  Check,
  Clock,
  Eye,
  FileText,
  GitMerge,
  GitPullRequest,
  GitPullRequestDraft,
  Home,
  type LucideIcon,
  Mic,
  Play,
  Plus,
  Search,
  Send,
  SmilePlus,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useRef, useState, useSyncExternalStore } from 'react';
import adaAvatar from '#assets/avatars/ada.svg';
import kordeAvatar from '#assets/avatars/korde.svg';
import mayaAvatar from '#assets/avatars/maya.svg';
import theoAvatar from '#assets/avatars/theo.svg';
import youAvatar from '#assets/avatars/you.svg';
import { CollabPrompt } from '#components/collab-prompt';
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
  you: { id: 'you', name: 'You', initials: 'YO', color: 'var(--chart-2)', kind: 'human' },
  korde: { id: 'korde', name: 'Korde', initials: 'KO', color: 'var(--primary)', kind: 'agent' },
} satisfies Record<string, Person>;

type PersonId = keyof typeof PEOPLE;

// Cartoon avatars — DiceBear "notionists" for people, "bottts" for the agent —
// as static SVGs, so there's no runtime library and nothing blocks page load.
// notionists © Zoish (CC BY 4.0); bottts © Pablo Stanley (Free).
const AVATARS: Record<string, string> = {
  maya: mayaAvatar,
  theo: theoAvatar,
  ada: adaAvatar,
  you: youAvatar,
  korde: kordeAvatar,
};

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
  main: { icon: Home, className: 'text-muted-foreground' },
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

// Everyone gets a cartoon avatar; the coloured initials remain a graceful
// fallback if the SVG hasn't loaded.
function Avatar({ person, className }: { person: Person; className?: string }) {
  const src = AVATARS[person.id];
  if (src) {
    return (
      <img
        src={src}
        alt={person.name}
        className={cn('shrink-0 rounded-full object-cover', className)}
        style={{ backgroundColor: person.color }}
      />
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
      <div className="hidden items-center gap-2.5 border-border border-t px-3 py-3 md:flex">
        <Avatar person={PEOPLE.you} className="size-8" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-sm">You</div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <span className="size-1.5 rounded-full bg-chart-2" />
            Active
          </div>
        </div>
      </div>
    </aside>
  );
}

function Thread({ channel, active }: { channel: Channel; active: boolean }) {
  // Messages the visitor sends are kept locally, just for feel — nothing is
  // persisted, so they reset on reload.
  const [sent, setSent] = useState<Message[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    setSent((prev) => [
      ...prev,
      { id: `${channel.slug}-sent-${prev.length}`, kind: 'msg', from: 'you', text },
    ]);
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  };

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
      <div ref={listRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
        {[...channel.messages, ...sent].map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      <Composer channel={channel} onSend={send} />
    </section>
  );
}

// Dictation — a message (or prompt) can be spoken, not just typed.
function MicButton() {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground"
      aria-label="Dictate message"
    >
      <Mic />
    </Button>
  );
}

// The chat panel's message bar — type and send a message to the people in the
// channel. Sent messages are local and unsaved, just for feel; the mic is a
// non-functional placeholder for now.
function MessageBar({ channel, onSend }: { channel: Channel; onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm">
      <Plus className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submit();
          }
        }}
        aria-label={`Message #${channel.slug}`}
        placeholder={`Message #${channel.slug}…`}
        className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
      />
      <MicButton />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-muted-foreground"
        aria-label="Send message"
        onClick={submit}
      >
        <Send />
      </Button>
    </div>
  );
}

// The composer lives in the chat panel. A collaborative channel adds a live,
// co-written prompt above the message bar — composing the agent's brief is a
// chat activity, not something that belongs in the preview. The message bar
// below it still messages the people in the channel (and is where dictation
// lives — the prompt hands off to the agent instead).
function Composer({ channel, onSend }: { channel: Channel; onSend: (text: string) => void }) {
  if (channel.compose === 'collab') {
    const typist = channel.typing ? PEOPLE[channel.typing] : null;
    return (
      <div className="shrink-0 space-y-2 px-5 pb-5">
        <div className="overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <CollabPrompt />
          <div className="flex items-center gap-2 border-border border-t px-3 py-2">
            {typist ? (
              <TypingIndicator person={typist} />
            ) : (
              <span className="flex-1 text-muted-foreground text-xs">
                Co-writing with your team — anyone can edit
              </span>
            )}
            <Button size="sm">
              <Play />
              Hand off to agent
            </Button>
          </div>
        </div>
        <MessageBar channel={channel} onSend={onSend} />
      </div>
    );
  }
  return (
    <div className="shrink-0 px-5 pb-5">
      <MessageBar channel={channel} onSend={onSend} />
    </div>
  );
}

const TYPING_DELAYS = ['0ms', '150ms', '300ms'];

function TypingIndicator({ person }: { person: Person }) {
  return (
    <div className="flex flex-1 items-center gap-2 text-muted-foreground text-xs">
      <Avatar person={person} className="size-5 text-[0.5rem]" />
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
      <Avatar person={person} className="size-8 text-xs" />
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

const QUICK_EMOJIS = ['👍', '❤️', '🎉', '🚀', '👀', '😄'];

// Visitors can react for fun — nothing is persisted. Base counts come from the
// seeded `items`; the viewer's own reactions live in local state and add +1.
function Reactions({ items }: { items: Reaction[] }) {
  const [mine, setMine] = useState<Record<string, boolean>>({});
  const [picking, setPicking] = useState(false);

  const base = new Map(items.map((reaction) => [reaction.emoji, reaction.by.length]));
  const toggle = (emoji: string) => setMine((prev) => ({ ...prev, [emoji]: !prev[emoji] }));
  const add = (emoji: string) => {
    setMine((prev) => ({ ...prev, [emoji]: true }));
    setPicking(false);
  };

  const emojis = [
    ...base.keys(),
    ...Object.keys(mine).filter((emoji) => mine[emoji] && !base.has(emoji)),
  ];

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {emojis.map((emoji) => {
        const count = (base.get(emoji) ?? 0) + (mine[emoji] ? 1 : 0);
        if (count === 0) {
          return null;
        }
        const reacted = Boolean(mine[emoji]);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
              reacted
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-muted/40 hover:bg-muted',
            )}
          >
            <span>{emoji}</span>
            <span className={reacted ? 'text-primary' : 'text-muted-foreground'}>{count}</span>
          </button>
        );
      })}

      {picking ? (
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-card px-1 py-1 shadow-sm">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => add(emoji)}
              className="flex size-6 items-center justify-center rounded-full text-sm leading-none hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          aria-label="Add reaction"
          onClick={() => setPicking(true)}
          className="flex items-center rounded-full border border-border bg-muted/40 px-1.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <SmilePlus className="size-3.5" />
        </button>
      )}
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
        {channel.slug === ChannelSlug.LivePreview ? <AppPreview /> : <PreviewPlaceholder />}
      </div>
    </aside>
  );
}

// The preview channel is the one place with completed agent work to show — the
// running product, the way a website preview renders it. Presence surfaces as
// the online facepile (the built feature); live editing cursors belong in the
// chat, not in the preview.
function AppPreview() {
  return (
    <PreviewFrame title="kordeon · editor">
      <div className="min-h-[15rem]">
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
      </div>
    </PreviewFrame>
  );
}

// Every other channel is mid-flight — nothing to render until the agent ships.
function PreviewPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Clock className="size-5" />
      </span>
      <p className="text-balance text-muted-foreground text-sm">
        Previews are available after the agent completes the work.
      </p>
    </div>
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
