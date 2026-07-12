// biome-ignore-all lint/style/noMagicNumbers: intro motion + layout tuning
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// The three panels the whole product is — explorer · chat · preview — the shape
// the vision opens on. Each is a labelled silhouette; the preview carries the
// accent, the one panel other collaborative chat tools don't have.
const PANELS = [
  { label: 'Explorer', width: 150, height: 300, accent: false },
  { label: 'Chat', width: 300, height: 340, accent: false },
  { label: 'Preview', width: 220, height: 320, accent: true },
];

function Panel({ panel, index }: { panel: (typeof PANELS)[number]; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    delay: index * 8,
    config: { damping: 200 },
    durationInFrames: 26,
  });
  const y = interpolate(enter, [0, 1], [40, 0]);

  return (
    <div
      style={{
        width: panel.width,
        height: panel.height,
        opacity: enter,
        transform: `translateY(${y}px)`,
      }}
      className={`flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 ${panel.accent ? 'border-primary/60' : 'border-border'}`}
    >
      <div
        className={`h-2.5 w-1/2 rounded-full ${panel.accent ? 'bg-primary/70' : 'bg-muted-foreground/40'}`}
      />
      <div className="h-2 w-3/4 rounded-full bg-muted-foreground/20" />
      <div className="h-2 w-2/3 rounded-full bg-muted-foreground/20" />
      <div className="mt-auto font-medium text-muted-foreground text-sm">{panel.label}</div>
    </div>
  );
}

export function Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brand = spring({ frame, fps, delay: 30, config: { damping: 200 }, durationInFrames: 24 });

  return (
    <AbsoluteFill className="dark items-center justify-center gap-12 bg-background text-foreground">
      <div className="flex items-end gap-4">
        {[...PANELS.entries()].map(([index, panel]) => (
          <Panel key={panel.label} panel={panel} index={index} />
        ))}
      </div>
      <div style={{ opacity: brand }} className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-foreground">
            <KordeonMark className="size-5" />
          </span>
          <span className="font-semibold text-2xl tracking-tight">kordeon</span>
        </div>
        <p className="font-medium text-muted-foreground text-xl">
          One surface: explorer · chat · live preview
        </p>
      </div>
    </AbsoluteFill>
  );
}
