// biome-ignore-all lint/style/noMagicNumbers: metamorphosis geometry + motion tuning
import { buttonVariants } from '@repo/ui/components/button';
import { ArrowRight } from 'lucide-react';
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { EASE } from '#lib/motion';

// Beat 8 — the metamorphosis: the product's three sections (explorer · chat ·
// preview) shrink and fold into the three bars of the kordeon mark, then the
// wordmark, promise and CTA resolve under it. A rect (px, over the 1920×1080
// grid) for each section morphs from a panel into its bar; the panel look
// crossfades to the bar's solid brand colour as the geometry closes in.
type Rect = { x: number; y: number; w: number; h: number; r: number };

type Section = {
  key: string;
  label: string;
  accent: boolean;
  bar: string;
  from: Rect;
  to: Rect;
};

// `to` rects are the mark's bars (viewBox 3/8/4/8 · 10/3/4/18 · 17/5/4/14) scaled
// ×6.667 into a 160px box centred at (960, 400); `from` rects are a centred
// three-column window abstraction. Explorer + chat land teal, preview lands orange.
const SECTIONS: Section[] = [
  {
    key: 'explorer',
    label: 'Explorer',
    accent: false,
    bar: 'bg-primary',
    from: { x: 517, y: 320, w: 200, h: 440, r: 18 },
    to: { x: 900, y: 373, w: 27, h: 53, r: 13 },
  },
  {
    key: 'chat',
    label: 'Chat',
    accent: false,
    bar: 'bg-primary',
    from: { x: 735, y: 300, w: 380, h: 480, r: 18 },
    to: { x: 947, y: 340, w: 27, h: 120, r: 13 },
  },
  {
    key: 'preview',
    label: 'Preview',
    accent: true,
    bar: 'bg-[#ff6900]',
    from: { x: 1133, y: 315, w: 270, h: 450, r: 18 },
    to: { x: 993, y: 353, w: 27, h: 93, r: 13 },
  },
];

const MORPH_START = 28;
const MORPH_END = 78;

function mix({ from, to, t }: { from: number; to: number; t: number }): number {
  return from + (to - from) * t;
}

function MorphSection({ section }: { section: Section }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [MORPH_START, MORPH_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  const { from, to } = section;
  const box = {
    left: mix({ from: from.x, to: to.x, t }),
    top: mix({ from: from.y, to: to.y, t }),
    width: mix({ from: from.w, to: to.w, t }),
    height: mix({ from: from.h, to: to.h, t }),
    borderRadius: mix({ from: from.r, to: to.r, t }),
  };
  // The panel look fades out early; the solid bar fades in as the shape closes in.
  const panelOpacity = interpolate(frame, [30, 50], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const barOpacity = interpolate(frame, [44, 66], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelOpacity = interpolate(frame, [22, 38], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <>
      <div
        className={`absolute flex flex-col items-center justify-end border p-3 ${section.accent ? 'border-primary/60 bg-primary/10' : 'border-border bg-muted/25'}`}
        style={{ ...box, opacity: panelOpacity }}
      >
        <span
          className="font-medium text-muted-foreground text-sm"
          style={{ opacity: labelOpacity }}
        >
          {section.label}
        </span>
      </div>
      <div className={`absolute ${section.bar}`} style={{ ...box, opacity: barOpacity }} />
    </>
  );
}

export function Finale({
  wordmark,
  tagline,
  button,
  meta,
}: {
  wordmark: string;
  tagline: string;
  button: string;
  meta: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tile = interpolate(frame, [66, 84], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  const lockup = spring({
    frame: frame - 80,
    fps,
    config: { damping: 20, mass: 0.8 },
    durationInFrames: 26,
  });
  const cta = spring({
    frame: frame - 112,
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 130 },
    durationInFrames: 22,
  });
  const metaOpacity = interpolate(frame, [124, 146], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill className="dark bg-background text-foreground">
      {/* The brand tile resolves behind the bars once they've formed the mark. */}
      <div
        className="absolute rounded-3xl bg-foreground"
        style={{ left: 858, top: 298, width: 204, height: 204, opacity: tile }}
      />
      {SECTIONS.map((section) => (
        <MorphSection key={section.key} section={section} />
      ))}

      {/* The lockup resolves just below the formed mark (centred at y≈400). */}
      <Interactive.Div
        name="Finale lockup"
        className="absolute inset-x-0 flex flex-col items-center gap-6"
        style={{
          top: 548,
          opacity: lockup,
          translate: `0 ${interpolate(lockup, [0, 1], [22, 0])}px`,
        }}
      >
        <h1 className="font-semibold text-7xl tracking-tight">{wordmark}</h1>
        <p className="max-w-3xl text-center text-2xl text-muted-foreground">{tagline}</p>
        <div
          className="mt-2 flex items-center gap-5"
          style={{
            opacity: cta,
            translate: `0 ${interpolate(cta, [0, 1], [18, 0])}px`,
            scale: interpolate(cta, [0, 1], [0.9, 1]),
          }}
        >
          <span className={`${buttonVariants({ size: 'lg' })} h-12 rounded-2xl px-7 text-base`}>
            {button}
            <ArrowRight />
          </span>
          <span className="text-lg text-muted-foreground" style={{ opacity: metaOpacity }}>
            {meta}
          </span>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
}
