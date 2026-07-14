// biome-ignore-all lint/style/noMagicNumbers: brand-mark viewBox geometry
// The kordeon chord mark: three bars for the product's three panels —
// explorer, chat, and the accented preview (the panel other collaborative
// chat apps don't have). A logo is a brand asset, not themeable chrome, so it
// carries the same fixed hex as the favicon and leaves the shadcn theme
// untouched. Sit it on a `bg-foreground` tile (ink on light, white on dark):
// the teal brightens on the ink tile and deepens on the white one.

const FILL = {
  teal: 'fill-[#00bba7] dark:fill-[#00786f]',
  orange: 'fill-[#ff6900]',
} as const;

// The three bars in the 24×24 viewBox, in panel order (explorer · chat · preview).
// Exported so motion code (e.g. the launch film's logo→product morph) can tween the
// real geometry instead of re-typing these coordinates.
export const MARK_VIEWBOX = 24;
export const MARK_BAR_RADIUS = 2;
export const MARK_BARS = [
  { key: 'explorer', tone: 'teal', x: 3, y: 8, w: 4, h: 8 },
  { key: 'chat', tone: 'teal', x: 10, y: 3, w: 4, h: 18 },
  { key: 'preview', tone: 'orange', x: 17, y: 5, w: 4, h: 14 },
] as const;

export function KordeonMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {MARK_BARS.map((bar) => (
        <rect
          key={bar.key}
          className={FILL[bar.tone]}
          x={bar.x}
          y={bar.y}
          width={bar.w}
          height={bar.h}
          rx={MARK_BAR_RADIUS}
        />
      ))}
    </svg>
  );
}
