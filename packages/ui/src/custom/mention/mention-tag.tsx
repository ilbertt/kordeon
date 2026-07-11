import type { MentionTagData } from '@repo/domain/workspace';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useState } from 'react';
import { MENTION_CHIP_CLASS } from './constants';
import { relativeDateLabel } from './dates';
import { timeTagFromValue } from './time-tag';

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
  return <TimeTag tag={tag} />;
}

// A date chip belongs to whoever reads it, not whoever sent it. The stored
// token/tooltip is the SSR-safe first paint; once mounted it resolves for the
// reader: a custom date (date + zone) re-renders in the reader's own timezone,
// and a relative label (Today/Tomorrow) gains a tooltip naming the day it points
// to — so every date chip reads the same on hover, not just custom ones.
function TimeTag({ tag }: { tag: MentionTagData }) {
  const [display, setDisplay] = useState<{ token: string; tooltip?: string }>({
    token: tag.token,
    tooltip: tag.tooltip,
  });

  useEffect(() => {
    if (tag.date) {
      const local = timeTagFromValue(tag.date);
      setDisplay({ token: local.token, tooltip: local.tooltip });
      return;
    }
    setDisplay({ token: tag.token, tooltip: relativeDateLabel(tag.token) });
  }, [tag.date, tag.token]);

  if (!display.tooltip) {
    return <span className={MENTION_CHIP_CLASS.time}>{display.token}</span>;
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
        {display.token}
      </TooltipTrigger>
      <TooltipContent side="top">{display.tooltip}</TooltipContent>
    </Tooltip>
  );
}
