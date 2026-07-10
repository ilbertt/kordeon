import type { Message, Person, PlanItem, Reaction } from '@repo/domain/workspace';
import { AvatarGroup } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Marker, MarkerContent } from '@repo/ui/components/marker';
import {
  MessageAvatar,
  MessageContent,
  MessageHeader,
  Message as MessageRow,
} from '@repo/ui/components/message';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';
import { MentionTag } from '@repo/ui/custom/mention/mention-tag';
import { SmilePlus, Zap } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { usePerson, useWorkspace } from './context';
import { PersonAvatar } from './person-avatar';
import { ReactionPill } from './reaction-pill';

// `renderExtra` appends caller-owned content under a message (after reactions) —
// used by the landing to hang a GitHub star off the agent's open-source reply.
export function ChatMessage({
  message,
  renderExtra,
}: {
  message: Message;
  renderExtra?: (message: Message) => ReactNode;
}) {
  if (message.kind === 'system') {
    return (
      <Marker variant="separator" className="text-sm">
        <MarkerContent className="max-w-md text-balance">{message.text}</MarkerContent>
      </Marker>
    );
  }

  return <PersonMessage message={message} renderExtra={renderExtra} />;
}

function PersonMessage({
  message,
  renderExtra,
}: {
  message: Extract<Message, { kind: 'msg' }>;
  renderExtra?: (message: Message) => ReactNode;
}) {
  const person = usePerson(message.from);
  const isAgent = person.kind === 'agent';
  return (
    <MessageRow align="start" className="gap-3">
      <MessageAvatar className="min-w-8 self-start bg-transparent">
        <PersonAvatar person={person} className="size-8" />
      </MessageAvatar>
      <MessageContent className="gap-0">
        <MessageHeader className="items-baseline gap-2 px-0 text-foreground text-sm">
          <span className="font-medium">{person.name}</span>
          {isAgent ? (
            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[0.625rem]">
              <Zap className="size-2.5" />
              AI
            </Badge>
          ) : null}
        </MessageHeader>
        <p className="mt-0.5 text-pretty text-foreground/90 text-sm leading-relaxed">
          <MessageBody message={message} />
        </p>
        {message.plan ? <PlanCard items={message.plan} /> : null}
        {message.reactions ? <Reactions items={message.reactions} /> : null}
        {renderExtra ? renderExtra(message) : null}
        {message.replies ? <Replies ids={message.replies} /> : null}
      </MessageContent>
    </MessageRow>
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

// Visitors can react for fun — nothing is persisted. Base counts exclude the
// viewer, whose own reactions live in local state — seeded from `by` so a
// reaction they're already part of renders highlighted, and toggling adds/drops
// the +1 without ever double-counting them.
// Kept as bespoke pills: shadcn's Toggle bakes in a muted pressed background
// that fights these brand-tinted chips, so it isn't a clean drop-in here.
function Reactions({ items }: { items: Reaction[] }) {
  const { currentUserId } = useWorkspace();
  const [mine, setMine] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      items
        .filter((reaction) => reaction.by.includes(currentUserId))
        .map((reaction) => [reaction.emoji, true]),
    ),
  );
  const [picking, setPicking] = useState(false);

  const base = new Map(
    items.map((reaction) => [
      reaction.emoji,
      reaction.by.filter((id) => id !== currentUserId).length,
    ]),
  );
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
        return (
          <ReactionPill
            key={emoji}
            emoji={emoji}
            count={count}
            reacted={Boolean(mine[emoji])}
            onClick={() => toggle(emoji)}
          />
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
      <AvatarGroup className="-space-x-1.5">
        {resolved.map((person) => (
          <PersonAvatar key={person.id} person={person} className="size-5" />
        ))}
      </AvatarGroup>
      {resolved.length} replies
    </button>
  );
}

function PlanCard({ items }: { items: PlanItem[] }) {
  const done = items.filter((item) => item.done).length;
  return (
    <Card size="sm" className="mt-3 max-w-md gap-2.5">
      <CardHeader className="px-3">
        <CardTitle>Implementation plan</CardTitle>
        <CardAction className="text-muted-foreground text-xs">
          {done}/{items.length}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2 px-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={item.done} readOnly tabIndex={-1} className="pointer-events-none" />
            <span className={item.done ? 'text-muted-foreground line-through' : ''}>
              {item.label}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
