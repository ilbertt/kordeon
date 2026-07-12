// biome-ignore-all lint/style/noMagicNumbers: preview chart display tuning
import { Spinner } from '@repo/ui/components/spinner';
import { GitPullRequest, TrendingUp } from 'lucide-react';

const COHORTS = [
  { week: 'W1', height: 34 },
  { week: 'W2', height: 48 },
  { week: 'W3', height: 43 },
  { week: 'W4', height: 60 },
  { week: 'W5', height: 55 },
  { week: 'W6', height: 72 },
  { week: 'W7', height: 68 },
  { week: 'W8', height: 88 },
];

const CHANNELS = [
  { name: 'Organic', rate: 54 },
  { name: 'Referral', rate: 39 },
  { name: 'Paid', rate: 26 },
];

// The activation dashboard that renders in the preview as the feature ships.
// `reveal` (0..1) drives the bars growing in — the video passes a frame-derived
// value; a still just passes 1.
export function DashboardPreview({ reveal = 1 }: { reveal?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-primary" />
          <span className="font-medium text-sm">Activation by cohort</span>
        </div>
        <span className="font-semibold text-primary text-sm tabular-nums">
          {Math.round(reveal * 62)}%
        </span>
      </div>

      <div className="flex h-32 items-end gap-1.5">
        {COHORTS.map((cohort) => (
          <div
            key={cohort.week}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <div
              className="w-full rounded-t-sm bg-primary/80"
              style={{ height: `${cohort.height * reveal}%` }}
            />
            <span className="text-[0.5rem] text-muted-foreground">{cohort.week}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-border border-t pt-3">
        {CHANNELS.map((channel) => (
          <div key={channel.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{channel.name}</span>
              <span className="tabular-nums">{Math.round(channel.rate * reveal)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${channel.rate * reveal}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PreviewPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground text-sm">
      The running product renders here as the work is built.
    </div>
  );
}

const SKELETON_WIDTHS = ['92%', '78%', '85%', '64%'];

// The preview while the agent works: it picks up the handed-off plan, builds, and
// opens a PR — the same "compose is locked, agent is on it" state the product shows.
export function BuildingPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <Spinner className="size-4 text-primary" />
        <span className="font-medium text-sm">Building the dashboard…</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <GitPullRequest className="size-3.5 text-primary" />
        Opened PR #128 · activation-dashboard
      </div>
      <div className="space-y-2 pt-1">
        {SKELETON_WIDTHS.map((width) => (
          <div key={width} className="h-3 rounded bg-muted" style={{ width }} />
        ))}
      </div>
    </div>
  );
}
