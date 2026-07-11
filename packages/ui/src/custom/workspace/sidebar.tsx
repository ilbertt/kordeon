import type { Channel } from '@repo/domain/workspace';
import { Button } from '@repo/ui/components/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@repo/ui/components/input-group';
import { Item, ItemContent, ItemMedia, ItemTitle } from '@repo/ui/components/item';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Separator } from '@repo/ui/components/separator';
import { cn } from '@repo/ui/lib/utils';
import { Plus, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCurrentUser } from './context';
import { CreateChannelButton, type NewChannel } from './create-channel';
import { PersonAvatar } from './person-avatar';
import { StatusIcon } from './status-icon';
import { useWorkspacePanels } from './workspace-ui';

// The features rail: every channel is a feature (branch/PR), so the list reads
// like a stacked-PR view. Presentational — channels come in as a prop, and the
// footer identity resolves through the workspace context. On md+ it's a fixed
// rail; below that it collapses behind the header toggle and slides over as a
// drawer (the `sidebar` panel in the workspace-panels context). `renderIcon`
// overrides the per-channel glyph (the landing shows purpose icons instead of
// the git-status default).
export function Sidebar({
  channels,
  activeSlug,
  channelHref = (slug) => `#${slug}`,
  renderIcon,
  onCreateChannel,
  email,
}: {
  channels: Channel[];
  activeSlug: string;
  channelHref?: (slug: string) => string;
  renderIcon?: (channel: Channel) => ReactNode;
  // Wires the header "+" to the create-feature flow (name + icon). Without it the
  // "+" is an inert glyph.
  onCreateChannel?: (value: NewChannel) => void;
  // The visitor's waitlist email, shown under their name once captured. Omitted
  // until they send one, so the identity stays a single centered line.
  email?: string;
}) {
  const currentUser = useCurrentUser();
  const { openPanel, close } = useWorkspacePanels();
  const isOpen = openPanel === 'sidebar';
  return (
    <>
      {/* Scrim behind the mobile drawer — tap to dismiss. */}
      {isOpen ? (
        <button
          type="button"
          aria-label="Close features"
          onClick={close}
          className="absolute inset-0 z-30 bg-foreground/30 backdrop-blur-xs duration-200 animate-in fade-in md:hidden"
        />
      ) : null}
      <aside
        className={cn(
          'w-64 shrink-0 flex-col border-border border-r bg-background md:static md:z-auto md:flex md:translate-x-0 md:animate-none md:bg-muted/30 md:shadow-none',
          isOpen
            ? 'absolute inset-y-0 left-0 z-40 flex shadow-xl duration-200 animate-in slide-in-from-left'
            : 'hidden',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-medium text-sm">Features</span>
          <div className="flex items-center gap-1">
            {onCreateChannel ? (
              <CreateChannelButton onCreate={onCreateChannel} />
            ) : (
              <Plus className="size-4 text-muted-foreground" />
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground md:hidden"
              aria-label="Close features"
              onClick={close}
            >
              <X />
            </Button>
          </div>
        </div>
        <div className="mt-2 px-2">
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
                  onClick={close}
                  className={cn(
                    'text-muted-foreground',
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'transition-colors hover:bg-muted hover:text-foreground',
                  )}
                >
                  <ItemMedia variant="icon">
                    {renderIcon ? renderIcon(channel) : <StatusIcon status={channel.status} />}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="truncate">#{channel.slug}</ItemTitle>
                  </ItemContent>
                </Item>
              );
            })}
          </nav>
        </ScrollArea>
        <Separator />
        {/* Without an email the identity is a single line; once captured it
            stacks name + email. Either way the avatar stays vertically centered
            (no `item-description` slot, so the media's top-align rule doesn't
            kick in). */}
        <Item size="sm" className="mx-1">
          <ItemMedia>
            <PersonAvatar person={currentUser} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle className="truncate text-sm">{currentUser.name}</ItemTitle>
            {email ? <span className="truncate text-muted-foreground text-xs">{email}</span> : null}
          </ItemContent>
        </Item>
      </aside>
    </>
  );
}
