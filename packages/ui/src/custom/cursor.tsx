import { cn } from '@repo/ui/lib/utils';
import { Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';

type CursorKind = 'human' | 'agent';

/**
 * Presence cursor used by the product and marketing alike. Positioning is left
 * to the parent (via `className`/`style`); this only draws the marker + label.
 *
 * `kind` separates collaborators at a glance: people get the classic arrow,
 * agents get a glowing dot so machine presence reads instantly.
 */
function Cursor({
  name,
  color = 'currentColor',
  kind = 'human',
  className,
  style,
}: {
  name?: string;
  color?: string;
  kind?: CursorKind;
  className?: string;
  style?: CSSProperties;
}) {
  return kind === 'agent' ? (
    <AgentCursor className={className} color={color} name={name} style={style} />
  ) : (
    <HumanCursor className={className} color={color} name={name} style={style} />
  );
}

function HumanCursor({
  name,
  color,
  className,
  style,
}: {
  name?: string;
  color: string;
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
      {name ? <Label color={color} name={name} /> : null}
    </div>
  );
}

function AgentCursor({
  name,
  color,
  className,
  style,
}: {
  name?: string;
  color: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none flex select-none items-start', className)}
      style={style}
    >
      <span className="relative flex size-4 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inline-flex size-4 animate-pulse rounded-full opacity-40"
          style={{ backgroundColor: color }}
        />
        <span
          className="relative flex size-3.5 items-center justify-center rounded-full ring-2 ring-white"
          style={{ backgroundColor: color }}
        >
          <Sparkles aria-hidden="true" className="size-2 text-white" strokeWidth={2.5} />
        </span>
      </span>
      {name ? <AgentLabel color={color} name={name} /> : null}
    </div>
  );
}

function Label({ color, name }: { color: string; name: string }) {
  return (
    <span
      className="-translate-y-1 ml-0.5 whitespace-nowrap rounded-md rounded-tl-none px-1.5 py-0.5 font-medium text-[0.6875rem] text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}

function AgentLabel({ color, name }: { color: string; name: string }) {
  return (
    <span
      className="-translate-y-1 ml-1 inline-flex items-center gap-1 whitespace-nowrap rounded-md rounded-tl-none px-1.5 py-0.5 font-medium text-[0.6875rem] text-white shadow-sm ring-1 ring-white/30"
      style={{ backgroundColor: color }}
    >
      <Sparkles aria-hidden="true" className="size-2.5" />
      {name}
    </span>
  );
}

export { Cursor };
