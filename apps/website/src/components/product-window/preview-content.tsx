import type { Channel } from '@repo/domain/workspace';
import { PersonAvatar } from '@repo/ui/custom/workspace/person-avatar';
import { Clock, Database, LoaderCircle, TrendingUp } from 'lucide-react';
import { ChannelSlug, PEOPLE } from './data';

// The landing's static preview content, selected by channel. The reusable
// <PreviewPane> supplies the frame; this fills it.
export function PreviewContent({ channel }: { channel: Channel }) {
  if (channel.slug === ChannelSlug.LivePreview) {
    return <DashboardPreview />;
  }
  if (channel.slug === ChannelSlug.Build) {
    return <BuildingPreview />;
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
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-warm/70" />
      <span className="relative inline-flex size-1.5 rounded-full bg-accent-warm" />
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
