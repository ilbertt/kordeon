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

// The three panels the product is — held long enough to read before they settle
// and the mark resolves (the previous cut rushed this).
const PANELS = [
  { label: 'Explorer', width: 210, height: 320, accent: false, from: -170 },
  { label: 'Chat', width: 340, height: 366, accent: false, from: 0 },
  { label: 'Preview', width: 270, height: 340, accent: true, from: 170 },
];

function Panel({ panel, index }: { panel: (typeof PANELS)[number]; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Panels rise after the "Meet kordeon" line and hold, readable, before converging.
  const enter = spring({
    frame: frame - 48 - index * 9,
    fps,
    config: { damping: 20, mass: 0.8 },
    durationInFrames: 34,
  });
  const converge = interpolate(frame, [118, 162], [1, 0], {
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

// Beat P3 — "Meet kordeon": the line lands, then the three panels rise, hold, and
// fold toward the mark as the wordmark + promise resolve.
export function MeetKordeon({
  meetLine,
  subtitle,
  wordmark,
}: {
  meetLine: string;
  subtitle: string;
  wordmark: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brand = spring({
    frame: frame - 138,
    fps,
    config: { damping: 22, mass: 0.9 },
    durationInFrames: 30,
  });
  const panelsFade = interpolate(frame, [138, 162], [1, 0.14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  return (
    <AbsoluteFill className="dark bg-background text-foreground">
      <Sequence durationInFrames={56}>
        <KineticCaption text={meetLine} durationInFrames={56} variant="hero" />
      </Sequence>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex items-end gap-3" style={{ opacity: panelsFade }}>
          {[...PANELS.entries()].map(([index, panel]) => (
            <Panel key={panel.label} panel={panel} index={index} />
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill className="items-center justify-center">
        <Interactive.Div
          name="Meet brand"
          className="flex flex-col items-center gap-5"
          style={{
            opacity: brand,
            translate: `0 ${interpolate(brand, [0, 1], [24, 0])}px`,
            scale: interpolate(brand, [0, 1], [0.9, 1]),
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-xl bg-foreground">
              <AnimatedChordMark className="size-8" delay={140} />
            </span>
            <span className="font-semibold text-5xl tracking-tight">{wordmark}</span>
          </div>
          <p className="font-medium text-muted-foreground text-2xl">{subtitle}</p>
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
