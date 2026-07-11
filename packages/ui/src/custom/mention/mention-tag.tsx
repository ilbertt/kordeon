import type { MentionTagData } from '@repo/domain/workspace';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip';
import { cn } from '@repo/ui/lib/utils';
import { MENTION_CHIP_CLASS } from './constants';

// Rendered-message counterpart of the composer's chips (styling stays in sync via
// MENTION_CHIP_CLASS). People/agents are clickable but inert — no profile page yet.
export function MentionTag({ tag }: { tag: MentionTagData }) {
  if (tag.kind === 'channel') {
    return (
      <a
        href={`#${tag.token.replace(/^#/, '')}`}
        className={cn(MENTION_CHIP_CLASS.channel, 'transition-colors hover:bg-primary/20')}
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
  // A custom date carries its exact source time + zone — surface it on hover as
  // a popover. Relative labels (Today, …) carry no tooltip and stay inert.
  if (!tag.tooltip) {
    return <span className={MENTION_CHIP_CLASS.time}>{tag.token}</span>;
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className={cn(
          MENTION_CHIP_CLASS.time,
          'cursor-default transition-colors hover:bg-primary/20',
        )}
      >
        {tag.token}
      </TooltipTrigger>
      <TooltipContent side="top">{tag.tooltip}</TooltipContent>
    </Tooltip>
  );
}
