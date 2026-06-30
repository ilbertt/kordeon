import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Cursor } from '@repo/ui/components/cursor';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowRight,
  Bot,
  Check,
  CreditCard,
  Eye,
  GitPullRequest,
  Hash,
  ListChecks,
  type LucideIcon,
  Plus,
  Search,
  Send,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { ScrollStage } from '#components/scroll-stage';
import { ThemeToggle } from '#components/theme-toggle';

export const Route = createFileRoute('/')({ component: Home });

type PreviewKind = 'app' | 'chat' | 'plan' | 'code' | 'pricing';

type PlanItem = { id: string; label: string; done: boolean };

type Message = {
  id: string;
  role: 'human' | 'agent' | 'system';
  author: string;
  initials?: string;
  text: string;
  plan?: PlanItem[];
  cta?: boolean;
};

type Channel = {
  id: string;
  label: string;
  icon: LucideIcon;
  topic: string;
  members: string;
  preview: PreviewKind;
  messages: Message[];
};

const channels: Channel[] = [
  {
    id: 'welcome',
    label: 'welcome',
    icon: Sparkles,
    topic: 'Where humans and agents collaborate',
    members: 'You, Agent',
    preview: 'app',
    messages: [
      {
        id: 'w1',
        role: 'system',
        author: 'system',
        text: 'This is kordeon — a workspace where your team and AI agents build software together.',
      },
      {
        id: 'w2',
        role: 'agent',
        author: 'Agent',
        text: 'Browse the channels on the left to see how it works — or just start a thread and tell me what you want to build.',
      },
    ],
  },
  {
    id: 'collaborate',
    label: 'collaborate',
    icon: Users,
    topic: 'Humans and agents in one thread',
    members: 'Luca, Maya, Agent',
    preview: 'chat',
    messages: [
      {
        id: 'c1',
        role: 'human',
        author: 'Maya',
        initials: 'MR',
        text: 'We need realtime presence in the editor — cursors and who’s online.',
      },
      {
        id: 'c2',
        role: 'human',
        author: 'Luca',
        initials: 'LB',
        text: 'Agreed. Let’s sync cursors too, not just presence.',
      },
      {
        id: 'c3',
        role: 'agent',
        author: 'Agent',
        text: 'Got it — presence + cursor sync. Everyone’s in the same conversation, including me. Want me to draft a plan?',
      },
    ],
  },
  {
    id: 'plan',
    label: 'refine-the-plan',
    icon: ListChecks,
    topic: 'Shape the spec together before any code is written',
    members: 'Luca, Agent',
    preview: 'plan',
    messages: [
      {
        id: 'p1',
        role: 'agent',
        author: 'Agent',
        text: 'Here’s the plan. Edit any step, reorder, or add your own before we start.',
        plan: [
          { id: 'm', label: 'Add workspace + membership models', done: true },
          { id: 'r', label: 'Realtime channel with presence', done: true },
          { id: 'c', label: 'Cursor sync across collaborators', done: false },
          { id: 'i', label: 'Invite flow with magic links', done: false },
        ],
      },
      {
        id: 'p2',
        role: 'human',
        author: 'Luca',
        initials: 'LB',
        text: 'Looks great. Drop the invite step for now — we’ll do that next sprint.',
      },
    ],
  },
  {
    id: 'handoff',
    label: 'hand-off',
    icon: Bot,
    topic: 'Approve the plan, the agent implements it',
    members: 'Luca, Agent',
    preview: 'code',
    messages: [
      {
        id: 'h1',
        role: 'human',
        author: 'Luca',
        initials: 'LB',
        text: 'Plan approved. Hand it off. 🚀',
      },
      {
        id: 'h2',
        role: 'agent',
        author: 'Agent',
        text: 'On it. Implementing step 1 of 3 — scaffolding the workspace models and migrations.',
      },
      {
        id: 'h3',
        role: 'agent',
        author: 'Agent',
        text: 'Opened PR #128 with the models + presence channel. Review it in the preview →',
      },
    ],
  },
  {
    id: 'preview',
    label: 'live-preview',
    icon: Eye,
    topic: 'Watch it render as the agent ships each step',
    members: 'Luca, Agent',
    preview: 'app',
    messages: [
      {
        id: 'v1',
        role: 'agent',
        author: 'Agent',
        text: 'Step 2 is live — presence is wired up. The preview on the right is running the latest build.',
      },
      {
        id: 'v2',
        role: 'human',
        author: 'Luca',
        initials: 'LB',
        text: 'Cursors are buttery. Ship it.',
      },
    ],
  },
  {
    id: 'pricing',
    label: 'pricing',
    icon: CreditCard,
    topic: 'Simple, usage-based pricing',
    members: 'You, Agent',
    preview: 'pricing',
    messages: [
      {
        id: 'pr1',
        role: 'human',
        author: 'You',
        initials: 'Yo',
        text: 'How much does this cost?',
      },
      {
        id: 'pr2',
        role: 'agent',
        author: 'Agent',
        text: 'Free to start — invite your team and plan as much as you like. You only pay for agent runs as you scale.',
        cta: true,
      },
    ],
  },
];

function Home() {
  return (
    <ScrollStage>
      <AppShell />
    </ScrollStage>
  );
}

function AppShell() {
  const [activeId, setActiveId] = useState('welcome');
  const active = channels.find((channel) => channel.id === activeId)!;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar activeId={active.id} onSelect={setActiveId} />
        <Thread channel={active} />
        <PreviewPane channel={active} />
      </div>
    </div>
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
        <Badge variant="secondary" className="ml-1 hidden gap-1 sm:inline-flex">
          <span className="size-1.5 rounded-full bg-chart-2" />
          Private beta
        </Badge>
      </div>
      <div className="flex items-center gap-2">
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

function Sidebar({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
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
          const isActive = channel.id === activeId;
          return (
            <button
              type="button"
              key={channel.id}
              onClick={() => onSelect(channel.id)}
              className={
                isActive
                  ? 'flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-2 text-left font-medium text-primary text-sm'
                  : 'flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground'
              }
            >
              <channel.icon className="size-4 shrink-0" />
              <span className="hidden truncate md:inline">{channel.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="hidden items-center gap-2 border-border border-t px-3 py-3 md:flex">
        <span className="flex size-7 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs">
          YO
        </span>
        <span className="text-muted-foreground text-sm">Your workspace</span>
      </div>
    </aside>
  );
}

function Thread({ channel }: { channel: Channel }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-border border-b px-5">
        <Hash className="size-4 text-muted-foreground" />
        <span className="font-medium">{channel.label}</span>
        <span className="mx-2 hidden text-border sm:inline">|</span>
        <span className="hidden truncate text-muted-foreground text-sm sm:inline">
          {channel.topic}
        </span>
        <span className="ml-auto hidden items-center gap-1.5 text-muted-foreground text-xs sm:flex">
          <Users className="size-3.5" />
          {channel.members}
        </span>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
        {channel.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      <div className="shrink-0 px-5 pb-5">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm">
          <Plus className="size-4 text-muted-foreground" />
          <span className="flex-1 text-muted-foreground text-sm">Message #{channel.label}…</span>
          <Button size="sm" variant="ghost" className="text-muted-foreground">
            <Send />
          </Button>
        </div>
      </div>
    </section>
  );
}

function ChatMessage({ message }: { message: Message }) {
  if (message.role === 'system') {
    return (
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <span className="h-px flex-1 bg-border" />
        <span className="max-w-md text-center text-balance">{message.text}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  const isAgent = message.role === 'agent';
  return (
    <div className="flex gap-3">
      <span
        className={
          isAgent
            ? 'flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground'
            : 'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted font-medium text-muted-foreground text-xs'
        }
      >
        {isAgent ? <Bot className="size-4.5" /> : message.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">{message.author}</span>
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

function PreviewPane({ channel }: { channel: Channel }) {
  return (
    <aside className="hidden w-[22rem] shrink-0 flex-col border-border border-l bg-muted/20 xl:flex">
      <div className="flex h-14 shrink-0 items-center justify-between border-border border-b px-5">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Eye className="size-4 text-muted-foreground" />
          Preview
        </div>
        <span className="flex items-center gap-1.5 text-chart-2 text-xs">
          <span className="size-1.5 animate-pulse rounded-full bg-chart-2" />
          Live
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <PreviewSurface kind={channel.preview} />
      </div>
    </aside>
  );
}

function PreviewSurface({ kind }: { kind: PreviewKind }) {
  if (kind === 'plan') {
    return (
      <PreviewFrame title="spec.md">
        <div className="space-y-3">
          <div className="h-3 w-1/2 rounded-full bg-foreground/20" />
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-foreground/10" />
            <div className="h-2 w-5/6 rounded-full bg-foreground/10" />
            <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
          </div>
          <div className="rounded-md bg-muted/60 p-3 ring-1 ring-border">
            <div className="mb-2 h-2 w-1/3 rounded-full bg-foreground/15" />
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-foreground/10" />
              <div className="h-2 w-4/5 rounded-full bg-foreground/10" />
            </div>
          </div>
        </div>
      </PreviewFrame>
    );
  }

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

  if (kind === 'chat') {
    return (
      <PreviewFrame title="kordeon · editor">
        <div className="relative">
          <Cursor
            name="Maya"
            color="var(--chart-1)"
            className="absolute z-10"
            style={{ left: '2%', top: '-6%' }}
          />
          <Cursor
            name="Theo"
            color="var(--chart-2)"
            className="absolute z-10"
            style={{ right: '0%', top: '46%' }}
          />
          <div className="flex items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[0.55rem] text-primary-foreground">
              MR
            </span>
            <span className="-ml-2 flex size-6 items-center justify-center rounded-full bg-secondary text-[0.55rem] ring-1 ring-card">
              LB
            </span>
            <span className="ml-1 text-muted-foreground text-xs">2 online</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="ml-auto w-3/4 rounded-lg rounded-tr-sm bg-primary/15 p-2.5">
              <div className="h-2 w-full rounded-full bg-foreground/15" />
              <div className="mt-1.5 h-2 w-1/2 rounded-full bg-foreground/10" />
            </div>
            <div className="w-3/4 rounded-lg rounded-tl-sm bg-muted/60 p-2.5">
              <div className="h-2 w-2/3 rounded-full bg-foreground/15" />
            </div>
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

  return (
    <PreviewFrame title="kordeon · realtime-chat">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded-full bg-foreground/20" />
        <div className="size-6 rounded-full bg-primary/25" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="h-12 rounded-md bg-card ring-1 ring-border" />
        <div className="h-12 rounded-md bg-card ring-1 ring-border" />
        <div className="h-12 rounded-md bg-card ring-1 ring-border" />
      </div>
      <div className="mt-2 space-y-2 rounded-md bg-card p-3 ring-1 ring-border">
        <div className="h-2 w-2/3 rounded-full bg-foreground/15" />
        <div className="h-2 w-1/2 rounded-full bg-foreground/10" />
        <div className="mt-2 flex gap-2">
          <div className="h-6 w-16 rounded-md bg-primary" />
          <div className="h-6 w-16 rounded-md bg-secondary ring-1 ring-border" />
        </div>
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
