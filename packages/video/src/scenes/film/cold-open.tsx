// biome-ignore-all lint/style/noMagicNumbers: intro motion + layout tuning
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { AnimatedChordMark } from '#components/chord-mark-animated';
import { KineticCaption } from '#components/kinetic-caption';
import { EASE } from '#lib/motion';

// The three panels the whole product is — explorer · chat · the accented preview.
// They spring in from spread-apart, converge to touching (the window silhouette
// locking in), then recede as the brand resolves over them.
const PANELS = [
  { label: 'Explorer', width: 190, height: 300, accent: false, from: -150 },
  { label: 'Chat', width: 322, height: 346, accent: false, from: 0 },
  { label: 'Preview', width: 250, height: 320, accent: true, from: 150 },
];

function Panel({ panel, index }: { panel: (typeof PANELS)[number]; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - index * 6,
    fps,
    config: { damping: 18, mass: 0.7, stiffness: 120 },
    durationInFrames: 26,
  });
  const converge = interpolate(frame, [18, 52], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  return (
    <Interactive.Div
      name={`Panel ${panel.label}`}
      className={`flex flex-col gap-3 rounded-2xl border p-4 ${panel.accent ? 'border-primary/60 bg-primary/5' : 'border-border bg-muted/20'}`}
      style={{
        width: panel.width,
        height: panel.height,
        opacity: enter,
        translate: `${panel.from * converge}px ${interpolate(enter, [0, 1], [50, 0])}px`,
        scale: interpolate(enter, [0, 1], [0.85, 1]),
      }}
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

export function ColdOpen({
  subtitle,
  wordmark,
  durationInFrames,
}: {
  subtitle: string;
  wordmark: string;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brand = spring({
    frame: frame - 52,
    fps,
    config: { damping: 20, mass: 0.8 },
    durationInFrames: 24,
  });
  const panelsFade = interpolate(frame, [52, 74], [1, 0.16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  return (
    <AbsoluteFill className="dark bg-background text-foreground">
      <AbsoluteFill className="items-center justify-center">
        <div className="flex items-end gap-3" style={{ opacity: panelsFade }}>
          {[...PANELS.entries()].map(([index, panel]) => (
            <Panel key={panel.label} panel={panel} index={index} />
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill className="items-center justify-center">
        <Interactive.Div
          name="Cold open brand"
          className="flex items-center gap-3"
          style={{
            opacity: brand,
            translate: `0 ${interpolate(brand, [0, 1], [22, 0])}px`,
            scale: interpolate(brand, [0, 1], [0.9, 1]),
          }}
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-foreground">
            <AnimatedChordMark className="size-7" delay={54} />
          </span>
          <span className="font-semibold text-4xl tracking-tight">{wordmark}</span>
        </Interactive.Div>
      </AbsoluteFill>
      <Sequence from={4} durationInFrames={durationInFrames - 4}>
        <KineticCaption text={subtitle} durationInFrames={durationInFrames - 4} />
      </Sequence>
    </AbsoluteFill>
  );
}
