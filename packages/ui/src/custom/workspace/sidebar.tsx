'use client';

import type { Channel } from '@repo/domain/workspace';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Separator } from '@repo/ui/components/separator';
import { Plus, Search, Users } from 'lucide-react';
import { useCurrentUser } from './context';
import { PersonAvatar } from './person-avatar';
import { StatusIcon } from './status-icon';

// The features rail: every channel is a feature (branch/PR), so the list reads
// like a stacked-PR view. Presentational — channels come in as a prop, and the
// footer identity resolves through the workspace context.
export function Sidebar({
  channels,
  activeSlug,
  channelHref = (slug) => `#${slug}`,
}: {
  channels: Channel[];
  activeSlug: string;
  channelHref?: (slug: string) => string;
}) {
  const currentUser = useCurrentUser();
  return (
    <aside className="flex w-16 shrink-0 flex-col border-border border-r bg-muted/30 md:w-64">
      <div className="hidden items-center justify-between px-4 py-3 md:flex">
        <span className="font-medium text-sm">Features</span>
        <Plus className="size-4 text-muted-foreground" />
      </div>
      <div className="mx-2 mt-2 hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-muted-foreground text-xs md:flex">
        <Search className="size-3.5" />
        Search
      </div>
      <ScrollArea className="mt-2 flex-1">
        <nav className="flex flex-col gap-0.5 px-2 py-2">
          {channels.map((channel) => {
            const isActive = channel.slug === activeSlug;
            const className = isActive
              ? 'flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-2 text-left font-medium text-primary text-sm'
              : 'flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground';
            return (
              <a key={channel.slug} href={channelHref(channel.slug)} className={className}>
                <StatusIcon status={channel.status} />
                <span className="hidden truncate md:inline">#{channel.slug}</span>
                <span className="ml-auto hidden items-center gap-1 text-muted-foreground text-xs md:flex">
                  <Users className="size-3" />
                  {channel.members.length}
                </span>
              </a>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="hidden items-center gap-2.5 px-3 py-3 md:flex">
        <PersonAvatar person={currentUser} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-sm">{currentUser.name}</div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <span className="size-1.5 rounded-full bg-chart-2" />
            Active
          </div>
        </div>
      </div>
    </aside>
  );
}
