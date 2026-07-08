'use client';

import type { Message, Person, PlanItem, Reaction } from '@repo/domain/workspace';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';
import { MentionTag } from '@repo/ui/custom/mention/mention-tag';
import { cn } from '@repo/ui/lib/utils';
import { ArrowRight, Check, SmilePlus, Zap } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { usePerson, useWorkspace } from './context';
import { PersonAvatar } from './person-avatar';

export function ChatMessage({ message }: { message: Message }) {
  if (message.kind === 'system') {
    return (
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <span className="h-px flex-1 bg-border" />
        <span className="max-w-md text-center text-balance">{message.text}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return <PersonMessage message={message} />;
}

function PersonMessage({ message }: { message: Extract<Message, { kind: 'msg' }> }) {
  const person = usePerson(message.from);
  const isAgent = person.kind === 'agent';
  return (
    <div className="flex gap-3">
      <PersonAvatar person={person} className="size-8" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">{person.name}</span>
          {isAgent ? (
            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[0.625rem]">
              <Zap className="size-2.5" />
              AI
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-pretty text-foreground/90 text-sm leading-relaxed">
          <MessageBody message={message} />
        </p>
        {message.plan ? <PlanCard items={message.plan} /> : null}
        {message.reactions ? <Reactions items={message.reactions} /> : null}
        {message.replies ? <Replies ids={message.replies} /> : null}
        {message.cta ? (
          <Button size="sm" className="mt-3">
            Create your workspace
            <ArrowRight />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// A sent message's body. Visitor messages carry structured segments so their
// tags stay clickable (see MentionTag); seeded messages are plain text, plus an
// optional trailing channel tag.
function MessageBody({ message }: { message: Extract<Message, { kind: 'msg' }> }) {
  if (message.segments) {
    const nodes: ReactNode[] = [];
    let index = 0;
    for (const segment of message.segments) {
      index += 1;
      if (segment.type === 'text') {
        nodes.push(segment.text);
      } else {
        nodes.push(<MentionTag key={`${segment.tag.token}-${index}`} tag={segment.tag} />);
      }
    }
    return <>{nodes}</>;
  }
  return (
    <>
      {message.text}
      {message.channel ? (
        <>
          {' '}
          <MentionTag tag={{ kind: 'channel', token: `#${message.channel}` }} />
        </>
      ) : null}
    </>
  );
}

const QUICK_EMOJIS = ['👍', '❤️', '🎉', '🚀', '👀', '😄'];

// Visitors can react for fun — nothing is persisted. Base counts come from the
// seeded `items`; the viewer's own reactions live in local state and add +1.
function Reactions({ items }: { items: Reaction[] }) {
  const [mine, setMine] = useState<Record<string, boolean>>({});
  const [picking, setPicking] = useState(false);

  const base = new Map(items.map((reaction) => [reaction.emoji, reaction.by.length]));
  const toggle = (emoji: string) => setMine((prev) => ({ ...prev, [emoji]: !prev[emoji] }));
  const add = (emoji: string) => {
    setMine((prev) => ({ ...prev, [emoji]: true }));
    setPicking(false);
  };

  const emojis = [
    ...base.keys(),
    ...Object.keys(mine).filter((emoji) => mine[emoji] && !base.has(emoji)),
  ];

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {emojis.map((emoji) => {
        const count = (base.get(emoji) ?? 0) + (mine[emoji] ? 1 : 0);
        if (count === 0) {
          return null;
        }
        const reacted = Boolean(mine[emoji]);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
              reacted
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-muted/40 hover:bg-muted',
            )}
          >
            <span>{emoji}</span>
            <span className={reacted ? 'text-primary' : 'text-muted-foreground'}>{count}</span>
          </button>
        );
      })}

      <Popover open={picking} onOpenChange={setPicking}>
        <PopoverTrigger
          aria-label="Add reaction"
          className="flex items-center rounded-full border border-border bg-muted/40 px-1.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[popup-open]:bg-muted data-[popup-open]:text-foreground"
        >
          <SmilePlus className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={6}
          aria-label="Pick a reaction"
          className="w-auto flex-row gap-0.5 p-1"
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => add(emoji)}
              className="flex size-6 items-center justify-center rounded-full text-sm leading-none hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Replies({ ids }: { ids: string[] }) {
  const { people } = useWorkspace();
  const resolved = ids
    .map((id) => people[id])
    .filter((person): person is Person => Boolean(person));
  return (
    <button
      type="button"
      className="mt-2 flex items-center gap-2 rounded-md py-0.5 font-medium text-primary text-xs hover:underline"
    >
      <div className="flex -space-x-1.5">
        {resolved.map((person) => (
          <PersonAvatar key={person.id} person={person} className="size-5 ring-2 ring-card" />
        ))}
      </div>
      {resolved.length} replies
    </button>
  );
}

function PlanCard({ items }: { items: PlanItem[] }) {
  const done = items.filter((item) => item.done).length;
  return (
    <div className="mt-3 max-w-md rounded-lg border border-border bg-card p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-medium text-sm">Implementation plan</span>
        <span className="text-muted-foreground text-xs">
          {done}/{items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 text-sm">
            <span
              className={
                item.done
                  ? 'flex size-4 items-center justify-center rounded-[4px] bg-primary text-primary-foreground'
                  : 'size-4 rounded-[4px] border border-border'
              }
            >
              {item.done ? <Check className="size-3" /> : null}
            </span>
            <span className={item.done ? 'text-muted-foreground line-through' : ''}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
