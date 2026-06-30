import { cn } from '@repo/ui/lib/utils';
import type { CSSProperties } from 'react';

/**
 * Figma-style presence cursor: an arrow pointer with an optional name label,
 * tinted by `color`. Positioning is left to the parent (via `className`/`style`),
 * so it can be dropped into a collaborative canvas, the product, or a marketing
 * scene alike.
 */
function Cursor({
  name,
  color = 'currentColor',
  className,
  style,
}: {
  name?: string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none flex select-none items-start', className)}
      style={style}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="drop-shadow-sm"
        aria-hidden="true"
      >
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .68-.54.36-.85L6.35 2.85a.5.5 0 0 0-.85.36Z" />
      </svg>
      {name ? (
        <span
          className="-translate-y-1 ml-0.5 whitespace-nowrap rounded-md rounded-tl-none px-1.5 py-0.5 font-medium text-[0.6875rem] text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {name}
        </span>
      ) : null}
    </div>
  );
}

export { Cursor };
