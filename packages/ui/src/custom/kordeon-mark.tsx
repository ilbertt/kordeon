// The kordeon chord mark: three bars for the product's three panels —
// explorer, chat, and the accented preview (the panel other collaborative
// chat apps don't have). A logo is a brand asset, not themeable chrome, so it
// carries the same fixed hex as the favicon and leaves the shadcn theme
// untouched. Sit it on a `bg-foreground` tile (ink on light, white on dark):
// the teal brightens on the ink tile and deepens on the white one.
export function KordeonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        className="fill-[#00bba7] dark:fill-[#00786f]"
        x="3"
        y="8"
        width="4"
        height="8"
        rx="2"
      />
      <rect
        className="fill-[#00bba7] dark:fill-[#00786f]"
        x="10"
        y="3"
        width="4"
        height="18"
        rx="2"
      />
      <rect className="fill-[#ff6900]" x="17" y="5" width="4" height="14" rx="2" />
    </svg>
  );
}
