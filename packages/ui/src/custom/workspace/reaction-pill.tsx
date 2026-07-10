import { cn } from '@repo/ui/lib/utils';
import type { CSSProperties } from 'react';

// A single reaction chip — emoji plus count. Shared so the landing's GitHub star
// can pass for an ordinary reaction (see the website's GithubStar): identical
// pill, except clicking it also opens the repo. A null count renders the emoji
// alone (e.g. while the live star total is still loading).
export function ReactionPill({
  emoji,
  count,
  reacted,
  onClick,
  label,
  className,
  style,
  live = false,
}: {
  emoji: string;
  count: number | null;
  reacted: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
  style?: CSSProperties;
  // When set, the count re-keys on each change so it pops as it ticks up — used
  // while reactions are arriving live (see the landing playback).
  live?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={style}
      className={cn(
        'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
        reacted
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-muted/40 hover:bg-muted',
        className,
      )}
    >
      <span>{emoji}</span>
      {count !== null ? (
        <span
          key={live ? count : undefined}
          className={cn(
            'tabular-nums',
            reacted ? 'text-primary' : 'text-muted-foreground',
            live && 'zoom-in-75 animate-in duration-200',
          )}
        >
          {count.toLocaleString()}
        </span>
      ) : null}
    </button>
  );
}
