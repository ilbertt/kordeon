// Owner: preview panel — see product-window ownership. Shared state is read-only from ./data.
import { cn } from '@repo/ui/lib/utils';
import { Check, Clock, Eye, FileText, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { type Channel, ChannelSlug, PEOPLE } from './data';
import { Avatar, Facepile } from './presence';

export function PreviewPane({ channel, active }: { channel: Channel; active: boolean }) {
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
        {channel.slug === ChannelSlug.LivePreview ? (
          <AppPreview />
        ) : channel.slug === ChannelSlug.Build ? (
          <BuildingPreview />
        ) : (
          <PreviewPlaceholder />
        )}
      </div>
    </aside>
  );
}

// Sample content for the preview app — a real-looking doc so the preview reads
// as a running product, not a skeleton.
const DOC_TASKS = [
  { label: 'Draft launch messaging with Maya', done: true },
  { label: 'Instrument activation events', done: true },
  { label: 'Design review with Theo', done: false },
  { label: 'Roll out to 10% of new signups', done: false },
];

// The preview channel is the one place with finished agent work to show: the
// running product, rendered the way a website preview would. It's a real (if
// small) editor app — the artifact the prompt asked for — with the built
// "realtime presence" feature visible as the who's-online facepile and an
// editing status line, not a live cursor demo.
function AppPreview() {
  return (
    <PreviewFrame title="kordeon · editor">
      <div className="flex min-h-[15rem] flex-col">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium text-sm">Q3 launch plan</span>
          </div>
          <Facepile ids={['maya', 'theo', 'ada', 'korde']} online />
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-pretty text-foreground/80 text-xs leading-relaxed">
            Ship the new onboarding flow and instrument activation so we can see where people drop
            off. Owners and review dates below.
          </p>
          <div className="space-y-1.5">
            {DOC_TASKS.map((task) => (
              <div key={task.label} className="flex items-center gap-2 text-xs">
                <span
                  className={
                    task.done
                      ? 'flex size-3.5 items-center justify-center rounded-[4px] bg-primary text-primary-foreground'
                      : 'size-3.5 rounded-[4px] border border-border'
                  }
                >
                  {task.done ? <Check className="size-2.5" /> : null}
                </span>
                <span
                  className={
                    task.done ? 'text-muted-foreground line-through' : 'text-foreground/80'
                  }
                >
                  {task.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-1.5 border-border border-t pt-2.5 text-[0.7rem] text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-2/70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-chart-2" />
          </span>
          Maya is editing · Theo viewing
        </div>
      </div>
    </PreviewFrame>
  );
}

// Widths + stagger for the build shimmer, kept as data (not inline literals) to
// steer clear of the no-magic-numbers rule, matching TYPING_DELAYS above.
const BUILD_SHIMMER = [
  { width: '85%', delay: '0ms' },
  { width: '70%', delay: '150ms' },
  { width: '55%', delay: '300ms' },
];

// The build channel is mid-flight: the agent is implementing the handed-off
// prompt, so the preview shows Korde at work rather than a finished artifact.
function BuildingPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="relative">
        <Avatar person={PEOPLE.korde} className="size-12 text-sm" />
        <span className="-right-1 -bottom-1 absolute flex size-5 items-center justify-center rounded-full bg-card ring-2 ring-card">
          <LoaderCircle className="size-4 animate-spin text-primary" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">Korde is building…</p>
        <p className="text-balance text-muted-foreground text-xs">
          Implementing the handed-off prompt — the preview goes live as each step ships.
        </p>
      </div>
      <div className="w-full max-w-[13rem] space-y-2">
        {BUILD_SHIMMER.map((bar) => (
          <div
            key={bar.width}
            className="h-2 animate-pulse rounded-full bg-foreground/10"
            style={{ width: bar.width, animationDelay: bar.delay }}
          />
        ))}
      </div>
    </div>
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

function PreviewFrame({ title, children }: { title: string; children: ReactNode }) {
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
