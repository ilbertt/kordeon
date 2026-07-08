import type { MentionKind } from '@repo/domain/workspace';
import { cn } from '@repo/ui/lib/utils';
import { Calendar, Clock, Hash } from 'lucide-react';
import { KIND_HEADING } from './constants';
import type { MentionSuggestion } from './types';

export function MentionMenu({
  items,
  activeId,
  onPick,
  onPickDate,
}: {
  items: MentionSuggestion[];
  activeId?: string;
  onPick: (item: MentionSuggestion) => void;
  onPickDate?: () => void;
}) {
  let lastKind: MentionKind | null = null;
  return (
    <div className="absolute bottom-full left-0 z-30 mb-2 max-h-64 w-72 max-w-[calc(100vw-3rem)] overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
      {items.map((item) => {
        const heading = item.kind === lastKind ? null : KIND_HEADING[item.kind];
        lastKind = item.kind;
        return (
          <div key={item.id}>
            {heading ? (
              <div className="px-2 pt-1.5 pb-1 font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
                {heading}
              </div>
            ) : null}
            <button
              type="button"
              // Keep focus (and the caret) in the field so insertion targets it.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(item)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                item.id === activeId ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
              )}
            >
              <MentionGlyph item={item} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.detail ? (
                <span className="ml-2 max-w-32 shrink-0 truncate text-muted-foreground text-xs">
                  {item.detail}
                </span>
              ) : null}
            </button>
          </div>
        );
      })}
      {onPickDate ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onPickDate}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground text-sm hover:bg-muted"
        >
          <span className="flex size-4 shrink-0 items-center justify-center">
            <Calendar className="size-3.5" />
          </span>
          Pick a date…
        </button>
      ) : null}
    </div>
  );
}

function MentionGlyph({ item }: { item: MentionSuggestion }) {
  if (item.kind === 'person') {
    return item.avatar ? (
      <img
        src={item.avatar}
        alt=""
        className="size-4 shrink-0 rounded-full object-cover"
        style={{ backgroundColor: item.color }}
      />
    ) : (
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
    );
  }
  return (
    <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
      {item.kind === 'channel' ? <Hash className="size-3.5" /> : <Clock className="size-3.5" />}
    </span>
  );
}
