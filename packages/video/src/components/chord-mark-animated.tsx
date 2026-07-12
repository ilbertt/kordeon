// biome-ignore-all lint/style/noMagicNumbers: brand-mark geometry + strike timing
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

// The kordeon chord mark, but struck: three bars — explorer · chat · the accented
// preview — grow up from their baseline like a chord, left to right. Same geometry
// and fixed brand hexes as `KordeonMark` (a logo isn't themeable chrome), so it
// drops onto the same `bg-foreground` tile the wordmark lockup uses.
const BARS = [
  { key: 'explorer', className: 'fill-[#00bba7] dark:fill-[#00786f]', x: 3, y: 8, w: 4, h: 8 },
  { key: 'chat', className: 'fill-[#00bba7] dark:fill-[#00786f]', x: 10, y: 3, w: 4, h: 18 },
  { key: 'preview', className: 'fill-[#ff6900]', x: 17, y: 5, w: 4, h: 14 },
];

export function AnimatedChordMark({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {[...BARS.entries()].map(([index, bar]) => {
        // Slight overshoot (low damping) so each bar lands with a struck snap.
        const strike = spring({
          frame: frame - delay - index * 4,
          fps,
          config: { damping: 12, mass: 0.6, stiffness: 150 },
          durationInFrames: 22,
        });
        const baseline = bar.y + bar.h;
        const height = bar.h * strike;
        return (
          <rect
            key={bar.key}
            className={bar.className}
            x={bar.x}
            y={baseline - height}
            width={bar.w}
            height={height}
            rx={2}
          />
        );
      })}
    </svg>
  );
}
