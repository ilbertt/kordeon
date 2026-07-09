import type { ChannelStatus } from '@repo/domain/workspace';
import { cn } from '@repo/ui/lib/utils';
import { GitMerge, GitPullRequest, GitPullRequestDraft, Home, type LucideIcon } from 'lucide-react';

const STATUS: Record<ChannelStatus, { icon: LucideIcon; className: string }> = {
  main: { icon: Home, className: 'text-muted-foreground' },
  draft: { icon: GitPullRequestDraft, className: 'text-muted-foreground' },
  open: { icon: GitPullRequest, className: 'text-primary' },
  merged: { icon: GitMerge, className: 'text-primary' },
};

export function StatusIcon({ status, className }: { status: ChannelStatus; className?: string }) {
  const { icon: Icon, className: color } = STATUS[status];
  return <Icon className={cn('size-4 shrink-0', color, className)} />;
}
