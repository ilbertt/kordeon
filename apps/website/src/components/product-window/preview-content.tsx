import type { Channel } from '@repo/domain/workspace';
import { GithubIcon } from '@repo/ui/custom/github-icon';
import { PersonAvatar } from '@repo/ui/custom/workspace/person-avatar';
import { AppWindow, ArrowRight, Database, LoaderCircle, TrendingUp } from 'lucide-react';
import { ChannelSlug, PEOPLE, REPO_URL } from './data';

// The landing's static preview content, selected by channel. The reusable
// <PreviewPane> supplies the frame; this fills it.
export function PreviewContent({ channel }: { channel: Channel }) {
  if (channel.slug === ChannelSlug.LivePreview) {
    return <DashboardPreview />;
  }
  if (channel.slug === ChannelSlug.Build) {
    return <BuildingPreview />;
  }
  if (channel.slug === ChannelSlug.OpenSource) {
    return <SelfHostPreview />;
  }
  return <PreviewPlaceholder />;
}

// Kept as data (not inline literals) to steer clear of the no-magic-numbers rule.
const SIGNUP_BARS = [
  { week: 'w1', height: '34%' },
  { week: 'w2', height: '48%' },
  { week: 'w3', height: '42%' },
  { week: 'w4', height: '58%' },
  { week: 'w5', height: '52%' },
  { week: 'w6', height: '70%' },
  { week: 'w7', height: '64%' },
  { week: 'w8', height: '82%' },
  { week: 'w9', height: '76%' },
  { week: 'w10', height: '96%' },
];

const CHANNELS = [
  { name: 'Organic', rate: '51%' },
  { name: 'Referral', rate: '38%' },
  { name: 'Paid', rate: '24%' },
];

function DashboardPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-primary" />
          <span className="font-medium text-sm">Activation</span>
        </div>
        <span className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          <LiveDot />
          Live
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-xs">Signups by week</span>
          <span className="flex items-center gap-0.5 text-[0.7rem] text-chart-2">
            <TrendingUp className="size-3" />
            18%
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="font-semibold text-2xl tabular-nums">2,730</span>
          <span className="text-[0.7rem] text-muted-foreground">this quarter</span>
        </div>
        <div className="mt-3 flex h-10 items-end gap-1">
          {SIGNUP_BARS.map((bar) => (
            <div
              key={bar.week}
              className="flex-1 rounded-[2px] bg-primary/80"
              style={{ height: bar.height }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2.5 rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-xs">Activation by channel</span>
          <span className="text-[0.7rem] text-muted-foreground">rate</span>
        </div>
        {CHANNELS.map((channel) => (
          <div key={channel.name} className="space-y-1">
            <div className="flex items-center justify-between text-[0.7rem]">
              <span className="text-foreground/80">{channel.name}</span>
              <span className="text-muted-foreground tabular-nums">{channel.rate}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: channel.rate }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
        <Database className="size-3" />
        Synced from the warehouse · updated 2m ago
      </div>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-1.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-2/70" />
      <span className="relative inline-flex size-1.5 rounded-full bg-chart-2" />
    </span>
  );
}

// Kept as data (not inline literals) to steer clear of the no-magic-numbers rule.
const BUILD_SHIMMER = [
  { width: '85%', delay: '0ms' },
  { width: '70%', delay: '150ms' },
  { width: '55%', delay: '300ms' },
];

function BuildingPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="relative">
        <PersonAvatar person={PEOPLE.korde} className="size-12" />
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

// The right panel is empty on channels where nothing's been built yet — so it
// explains what the preview *is* rather than reporting a status, since "what's a
// preview?" is the thing first-time visitors most often miss.
function PreviewPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <AppWindow className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-sm">The live preview</p>
        <p className="text-balance text-muted-foreground text-sm">
          The real, running product renders right here — updating live as the agent builds it. No
          tabbing to a separate tool.
        </p>
      </div>
    </div>
  );
}

// Kept as data (not inline literals) to steer clear of the no-magic-numbers rule.
const SELF_HOST_STEPS = [
  { key: 'clone', text: 'git clone https://github.com/ilbertt/kordeon' },
  { key: 'install', text: 'bun install' },
  { key: 'run', text: 'bun dev' },
];

function SelfHostPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <GithubIcon className="size-3.5 text-foreground" />
        <span className="font-medium text-sm">Open source · self-hostable</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center gap-1.5 border-border border-b px-3 py-2">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="ml-1.5 text-[0.7rem] text-muted-foreground">Run it yourself</span>
        </div>
        <div className="space-y-1.5 px-3 py-3 font-mono text-[0.72rem] leading-relaxed">
          {SELF_HOST_STEPS.map((step) => (
            <div key={step.key} className="flex gap-2">
              <span className="select-none text-primary">$</span>
              <span className="text-foreground/90">{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-balance text-muted-foreground text-xs">
        Run kordeon on your own infrastructure and keep your data in-house — nothing’s locked behind
        our servers.
      </p>

      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 font-medium text-primary text-xs hover:underline"
      >
        View source on GitHub
        <ArrowRight className="size-3.5" />
      </a>
    </div>
  );
}
