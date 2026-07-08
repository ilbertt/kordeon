// Owner: explorer panel — see product-window ownership. Shared state is read-only from ./data.
import { Plus, Search, Users } from 'lucide-react';
import { type ChannelSlug, channels, PEOPLE } from './data';
import { Avatar } from './presence';
import { StatusIcon } from './status-icon';

export function Sidebar({ activeSlug }: { activeSlug: ChannelSlug }) {
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
      <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
        {channels.map((channel) => {
          const isActive = channel.slug === activeSlug;
          const className = isActive
            ? 'flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-2 text-left font-medium text-primary text-sm'
            : 'flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground';
          return (
            <a key={channel.slug} href={`#${channel.slug}`} className={className}>
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
      <div className="hidden items-center gap-2.5 border-border border-t px-3 py-3 md:flex">
        <Avatar person={PEOPLE.you} className="size-8" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-sm">You</div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <span className="size-1.5 rounded-full bg-chart-2" />
            Active
          </div>
        </div>
      </div>
    </aside>
  );
}
