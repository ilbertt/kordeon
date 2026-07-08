'use client';

import type { Channel } from '@repo/domain/workspace';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@repo/ui/components/input-group';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@repo/ui/components/item';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Separator } from '@repo/ui/components/separator';
import { cn } from '@repo/ui/lib/utils';
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
      <div className="mt-2 hidden px-2 md:block">
        <InputGroup className="h-8 bg-background">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search" readOnly />
        </InputGroup>
      </div>
      <ScrollArea className="mt-2 flex-1">
        <nav className="flex flex-col gap-0.5 px-2 py-2">
          {channels.map((channel) => {
            const isActive = channel.slug === activeSlug;
            return (
              <Item
                key={channel.slug}
                size="xs"
                render={<a href={channelHref(channel.slug)} />}
                className={cn(
                  'text-muted-foreground',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'transition-colors hover:bg-muted hover:text-foreground',
                )}
              >
                <ItemMedia variant="icon">
                  <StatusIcon status={channel.status} />
                </ItemMedia>
                <ItemContent className="hidden md:flex">
                  <ItemTitle className="truncate">#{channel.slug}</ItemTitle>
                </ItemContent>
                <ItemActions className="hidden text-muted-foreground text-xs md:flex">
                  <Users className="size-3" />
                  {channel.members.length}
                </ItemActions>
              </Item>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <Item size="sm" className="mx-1 hidden md:flex">
        <ItemMedia>
          <PersonAvatar person={currentUser} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="truncate text-sm">{currentUser.name}</ItemTitle>
          <ItemDescription className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-chart-2" />
            Active
          </ItemDescription>
        </ItemContent>
      </Item>
    </aside>
  );
}
