import { cn } from '@repo/ui/lib/utils';
import { MENTION_CHIP_CLASS } from './constants';
import type { MentionTagData } from './types';

// Rendered-message counterpart of the composer's chips (styling stays in sync via
// MENTION_CHIP_CLASS). People/agents are clickable but inert — no profile page yet.
export function MentionTag({ tag }: { tag: MentionTagData }) {
  if (tag.kind === 'channel') {
    return (
      <a
        href={`#${tag.token.replace(/^#/, '')}`}
        className={cn(MENTION_CHIP_CLASS.channel, 'transition-colors hover:bg-chart-2/20')}
      >
        {tag.token}
      </a>
    );
  }
  if (tag.kind === 'person') {
    return (
      <button
        type="button"
        className={cn(MENTION_CHIP_CLASS.person, 'transition-colors hover:bg-primary/20')}
      >
        {tag.token}
      </button>
    );
  }
  return (
    <span className={MENTION_CHIP_CLASS.time} title={tag.tooltip}>
      {tag.token}
    </span>
  );
}
