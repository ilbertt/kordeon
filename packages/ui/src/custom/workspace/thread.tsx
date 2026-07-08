'use client';

import type { Channel, Message, MessageSegment, Person } from '@repo/domain/workspace';
import { Button } from '@repo/ui/components/button';
import { MentionInput } from '@repo/ui/custom/mention/mention-input';
import { useTokenCount } from '@repo/ui/hooks/use-token-count';
import { cn } from '@repo/ui/lib/utils';
import { Check, LoaderCircle, Mic, Play, Send } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { ConnectorsButton } from './connectors-menu';
import { useWorkspace } from './context';
import { ChatMessage } from './message';
import { Facepile, PersonAvatar } from './person-avatar';
import { StatusIcon } from './status-icon';

type SendValue = { text: string; segments: MessageSegment[] };

// The prompt slot above the message bar. A collaborative channel composes the
// agent's brief here (a chat activity, not something that belongs in the
// preview); the data source supplies its content via `renderComposerPrompt`.
type RenderComposerPrompt = (args: {
  editable: boolean;
  onText: (text: string) => void;
  label?: string;
}) => ReactNode;

export function Thread({
  channel,
  active,
  onSend,
  renderComposerPrompt,
}: {
  channel: Channel;
  active: boolean;
  onSend?: (value: SendValue) => void;
  renderComposerPrompt?: RenderComposerPrompt;
}) {
  const { currentUserId } = useWorkspace();
  // Messages the visitor sends are kept locally, just for feel — nothing is
  // persisted, so they reset on reload.
  const [sent, setSent] = useState<Message[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const send = (value: SendValue) => {
    setSent((prev) => [
      ...prev,
      {
        id: `${channel.slug}-sent-${prev.length}`,
        kind: 'msg',
        from: currentUserId,
        text: value.text,
        segments: value.segments,
      },
    ]);
    onSend?.(value);
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
      <Composer channel={channel} onSend={send} renderComposerPrompt={renderComposerPrompt} />
    </section>
  );
}

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

// `seq` bumps on send to remount the (uncontrolled) MentionInput, clearing it and
// returning focus (autoFocus once seq > 0). The mic is an inert placeholder.
function MessageBar({ channel, onSend }: { channel: Channel; onSend: (value: SendValue) => void }) {
  const { mentionSuggestions } = useWorkspace();
  const [value, setValue] = useState<SendValue>({ text: '', segments: [] });
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
        suggestions={mentionSuggestions}
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

// A collaborative channel adds a live, co-written prompt above the message bar,
// supplied by the caller via `renderComposerPrompt`; without it, only the
// message bar renders even when the channel declares a compose mode.
function Composer({
  channel,
  onSend,
  renderComposerPrompt,
}: {
  channel: Channel;
  onSend: (value: SendValue) => void;
  renderComposerPrompt?: RenderComposerPrompt;
}) {
  const { people } = useWorkspace();
  // Live token count of the co-written prompt, mirroring what the agent would be billed to build it.
  const [promptText, setPromptText] = useState('');
  const tokens = useTokenCount(promptText);
  // The typing indicator belongs with the message bar (someone drafting a chat
  // message); in the prompt editor, the live cursors convey presence already.
  const typist = channel.typing ? (people[channel.typing] ?? null) : null;

  if (channel.compose && renderComposerPrompt) {
    const editable = channel.compose === 'collab';
    return (
      <div className="shrink-0 space-y-2 px-5 pb-5">
        <div className="overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          {renderComposerPrompt({
            editable,
            onText: setPromptText,
            label: editable ? undefined : 'Prompt',
          })}
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

function ComposerAction({ compose }: { compose: NonNullable<Channel['compose']> }) {
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
      <PersonAvatar person={person} className="size-5" />
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
