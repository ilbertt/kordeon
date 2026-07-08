// Owner: chat panel — see product-window ownership. Shared state is read-only from ./data.
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { ArrowRight, Check, LoaderCircle, Mic, Play, Send, SmilePlus, Zap } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { CollabPrompt } from '#components/collab-prompt';
import { MentionInput } from '#components/mention/mention-input';
import { MentionTag } from '#components/mention/mention-tag';
import type { MessageSegment } from '#components/mention/types';
import { useTokenCount } from '#lib/use-token-count';
import { ConnectorsButton } from './connectors-menu';
import {
  type Channel,
  MENTION_SUGGESTIONS,
  type Message,
  PEOPLE,
  type Person,
  type PersonId,
  type PlanItem,
  type Reaction,
} from './data';
import { Avatar, Facepile } from './presence';
import { StatusIcon } from './status-icon';

export function Thread({ channel, active }: { channel: Channel; active: boolean }) {
  // Messages the visitor sends are kept locally, just for feel — nothing is
  // persisted, so they reset on reload.
  const [sent, setSent] = useState<Message[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const send = ({ text, segments }: { text: string; segments: MessageSegment[] }) => {
    setSent((prev) => [
      ...prev,
      { id: `${channel.slug}-sent-${prev.length}`, kind: 'msg', from: 'you', text, segments },
    ]);
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  };

  return (
    <section className={cn('min-w-0 flex-1 flex-col', active ? 'flex' : 'hidden')}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-border border-b px-5">
        <StatusIcon status={channel.status} />
        <span className="font-medium">#{channel.slug}</span>
        <span className="mx-2 hidden text-border sm:inline">|</span>
        <span className="hidden truncate text-muted-foreground text-sm lg:inline">
          {channel.topic}
        </span>
        <div className="ml-auto hidden shrink-0 sm:block">
          <Facepile ids={channel.members} online />
        </div>
      </div>
      <div ref={listRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
        {[...channel.messages, ...sent].map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      <Composer channel={channel} onSend={send} />
    </section>
  );
}

// Dictation — a message (or prompt) can be spoken, not just typed.
function MicButton() {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground"
      aria-label="Dictate message"
    >
      <Mic />
    </Button>
  );
}

// The chat panel's message bar — type and send a message to the people in the
// channel. It supports Notion-style `@`/`#` tags (see MentionInput). Sent
// messages are local and unsaved, just for feel; the mic is a non-functional
// placeholder for now. The Send button starts as a disabled primary action and
// lights up once there's something to send. `seq` bumps on send to remount the
// (uncontrolled) input, clearing it and returning focus.
function MessageBar({
  channel,
  onSend,
}: {
  channel: Channel;
  onSend: (value: { text: string; segments: MessageSegment[] }) => void;
}) {
  const [value, setValue] = useState<{ text: string; segments: MessageSegment[] }>({
    text: '',
    segments: [],
  });
  const [seq, setSeq] = useState(0);

  const submit = () => {
    if (!value.text.trim()) {
      return;
    }
    onSend(value);
    setValue({ text: '', segments: [] });
    setSeq((n) => n + 1);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm">
      <ConnectorsButton />
      <MentionInput
        key={seq}
        autoFocus={seq > 0}
        allowCustomDate
        suggestions={MENTION_SUGGESTIONS}
        ariaLabel={`Message #${channel.slug}`}
        placeholder={`Message #${channel.slug}…`}
        onChange={setValue}
        onSubmit={submit}
      />
      <MicButton />
      <Button
        type="button"
        size="sm"
        aria-label="Send message"
        disabled={!value.text.trim()}
        onClick={submit}
      >
        <Send />
      </Button>
    </div>
  );
}

// The composer lives in the chat panel. A collaborative channel adds a live,
// co-written prompt above the message bar — composing the agent's brief is a
// chat activity, not something that belongs in the preview. The message bar
// below it still messages the people in the channel (and is where dictation
// lives — the prompt hands off to the agent instead).
function Composer({
  channel,
  onSend,
}: {
  channel: Channel;
  onSend: (value: { text: string; segments: MessageSegment[] }) => void;
}) {
  // Live token count of the co-written prompt, mirroring what the agent would be
  // billed to build it. Counted with the model tokenizer (see useTokenCount).
  const [promptText, setPromptText] = useState('');
  const tokens = useTokenCount(promptText);
  // The typing indicator belongs with the message bar (someone drafting a chat
  // message); in the prompt editor, the live cursors convey presence already.
  const typist = channel.typing ? PEOPLE[channel.typing] : null;
  // Collaborate, build and built share one composer — same prompt component,
  // token count, and footer. Only `collab` is editable; the footer action tracks
  // where the prompt is in its lifecycle: Build → Building → Built.
  if (channel.compose === 'collab' || channel.compose === 'build' || channel.compose === 'built') {
    const editable = channel.compose === 'collab';
    return (
      <div className="shrink-0 space-y-2 px-5 pb-5">
        <div className="overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <CollabPrompt
            onText={setPromptText}
            editable={editable}
            label={editable ? undefined : 'Prompt'}
          />
          <div className="flex items-center gap-2 border-border border-t px-3 py-2">
            <span className="flex-1 text-muted-foreground text-xs tabular-nums">
              {tokens.toLocaleString()} tokens
            </span>
            <ComposerAction compose={channel.compose} />
          </div>
        </div>
        <div className="space-y-1">
          {typist ? <TypingIndicator person={typist} /> : null}
          <MessageBar channel={channel} onSend={onSend} />
        </div>
      </div>
    );
  }
  return (
    <div className="shrink-0 space-y-1 px-5 pb-5">
      {typist ? <TypingIndicator person={typist} /> : null}
      <MessageBar channel={channel} onSend={onSend} />
    </div>
  );
}

// The footer action reflects the prompt's lifecycle: an active Build button
// while collaborating, then disabled Building / Built states once handed off.
function ComposerAction({ compose }: { compose: 'collab' | 'build' | 'built' }) {
  if (compose === 'build') {
    return (
      <Button size="sm" disabled>
        <LoaderCircle className="animate-spin" />
        Building
      </Button>
    );
  }
  if (compose === 'built') {
    return (
      <Button size="sm" disabled>
        <Check />
        Built
      </Button>
    );
  }
  return (
    <Button size="sm">
      <Play />
      Build
    </Button>
  );
}

const TYPING_DELAYS = ['0ms', '150ms', '300ms'];

function TypingIndicator({ person }: { person: Person }) {
  return (
    <div className="flex items-center gap-2 px-1 text-muted-foreground text-xs">
      <Avatar person={person} className="size-5 text-[0.5rem]" />
      <span>{person.name} is typing</span>
      <span className="flex items-center gap-0.5">
        {TYPING_DELAYS.map((delay) => (
          <span
            key={delay}
            className="size-1 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: delay }}
          />
        ))}
      </span>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  if (message.kind === 'system') {
    return (
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <span className="h-px flex-1 bg-border" />
        <span className="max-w-md text-center text-balance">{message.text}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  const person = PEOPLE[message.from];
  const isAgent = person.kind === 'agent';
  return (
    <div className="flex gap-3">
      <Avatar person={person} className="size-8 text-xs" />
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

      {picking ? (
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-card px-1 py-1 shadow-sm">
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
        </div>
      ) : (
        <button
          type="button"
          aria-label="Add reaction"
          onClick={() => setPicking(true)}
          className="flex items-center rounded-full border border-border bg-muted/40 px-1.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <SmilePlus className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function Replies({ ids }: { ids: PersonId[] }) {
  const people = ids.map((id) => PEOPLE[id]);
  return (
    <button
      type="button"
      className="mt-2 flex items-center gap-2 rounded-md py-0.5 font-medium text-primary text-xs hover:underline"
    >
      <div className="flex -space-x-1.5">
        {people.map((person) => (
          <Avatar
            key={person.id}
            person={person}
            className="size-5 text-[0.5rem] ring-2 ring-card"
          />
        ))}
      </div>
      {people.length} replies
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
