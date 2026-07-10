import { cn } from '@repo/ui/lib/utils';

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
}: {
  emoji: string;
  count: number | null;
  reacted: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
        reacted
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-muted/40 hover:bg-muted',
      )}
    >
      <span>{emoji}</span>
      {count !== null ? (
        <span className={reacted ? 'text-primary' : 'text-muted-foreground'}>
          {count.toLocaleString()}
        </span>
      ) : null}
    </button>
  );
}
