import { cn } from '@repo/ui/lib/utils';
import { MENTION_CHIP_CLASS } from '#components/mention/constants';
import type { MentionTagData } from '#components/mention/types';

// The rendered-message counterpart of the field's chips: a tag stays a styled
// pill and, where it points somewhere, stays clickable. Channels link to the
// feature; people/agents are clickable (no profile page yet); time is a static
// pill with the source time on hover.
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
