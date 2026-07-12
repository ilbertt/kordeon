// biome-ignore-all lint/style/noMagicNumbers: intro motion + layout tuning
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from 'remotion';

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

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
  const start = index * 8;
  return (
    <Interactive.Div
      name={`Panel ${panel.label}`}
      style={{
        width: panel.width,
        height: panel.height,
        opacity: interpolate(frame, [start, start + 26], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: EASE,
        }),
        translate: `0 ${interpolate(frame, [start, start + 26], [40, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: EASE,
        })}px`,
      }}
      className={`flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 ${panel.accent ? 'border-primary/60' : 'border-border'}`}
    >
      <div
        className={`h-2.5 w-1/2 rounded-full ${panel.accent ? 'bg-primary/70' : 'bg-muted-foreground/40'}`}
      />
      <div className="h-2 w-3/4 rounded-full bg-muted-foreground/20" />
      <div className="h-2 w-2/3 rounded-full bg-muted-foreground/20" />
      <div className="mt-auto font-medium text-muted-foreground text-sm">{panel.label}</div>
    </Interactive.Div>
  );
}

export function Hook({ tagline }: { tagline: string }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="dark items-center justify-center gap-12 bg-background text-foreground">
      <div className="flex items-end gap-4">
        {[...PANELS.entries()].map(([index, panel]) => (
          <Panel key={panel.label} panel={panel} index={index} />
        ))}
      </div>
      <Interactive.Div
        name="Hook brand"
        className="flex flex-col items-center gap-4"
        style={{
          opacity: interpolate(frame, [30, 54], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: EASE,
          }),
        }}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-foreground">
            <KordeonMark className="size-5" />
          </span>
          <span className="font-semibold text-2xl tracking-tight">kordeon</span>
        </div>
        <p className="font-medium text-muted-foreground text-xl">{tagline}</p>
      </Interactive.Div>
    </AbsoluteFill>
  );
}
