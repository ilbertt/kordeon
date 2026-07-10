import type { Channel, Message, MessageSegment, Person } from '@repo/domain/workspace';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@repo/ui/components/input-group';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@repo/ui/components/message-scroller';
import { Spinner } from '@repo/ui/components/spinner';
import { MentionInput } from '@repo/ui/custom/mention/mention-input';
import { useTokenCount } from '@repo/ui/hooks/use-token-count';
import { cn } from '@repo/ui/lib/utils';
import { Check, Eye, Hash, Mic, Play, Send } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { ConnectorsButton } from './connectors-menu';
import { useWorkspace } from './context';
import { ChatMessage } from './message';
import { Facepile, PersonAvatar } from './person-avatar';
import { StatusIcon } from './status-icon';
import { useWorkspacePanels } from './workspace-ui';

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
  onVisitorReply,
  responderId,
  renderComposerPrompt,
}: {
  channel: Channel;
  active: boolean;
  onSend?: (value: SendValue) => void;
  // Lets the data source answer a visitor message in character: it returns the
  // reply message(s) to append (e.g. the pricing agent confirming a waitlist
  // email). While it's pending, `responderId` shows as typing.
  onVisitorReply?: (value: SendValue) => Promise<Message[]>;
  responderId?: string;
  renderComposerPrompt?: RenderComposerPrompt;
}) {
  const { currentUserId, people } = useWorkspace();
  const { open } = useWorkspacePanels();
  // Messages the visitor sends (and any replies) are kept locally, just for feel —
  // nothing is persisted, so they reset on reload.
  const [sent, setSent] = useState<Message[]>([]);
  const [responding, setResponding] = useState(false);

  const send = async (value: SendValue) => {
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
    if (!onVisitorReply) {
      return;
    }
    setResponding(true);
    try {
      const replies = await onVisitorReply(value);
      setSent((prev) => [...prev, ...replies]);
    } finally {
      setResponding(false);
    }
  };

  const typistId = responding ? responderId : channel.typing;
  const typist = typistId ? (people[typistId] ?? null) : null;

  const messages = [...channel.messages, ...sent];
  return (
    <section className={cn('min-w-0 flex-1 flex-col', active ? 'flex' : 'hidden')}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-border border-b px-3 sm:px-5">
        {/* Opens the features rail as a drawer where it isn't a fixed rail (below md).
            Rendered as the channels' own # glyph, standing in for a hamburger. */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground md:hidden"
          aria-label="Open features"
          onClick={() => open('sidebar')}
        >
          <Hash />
        </Button>
        <StatusIcon status={channel.status} />
        <span className="font-medium">#{channel.slug}</span>
        <span className="mx-2 hidden text-border sm:inline">|</span>
        <span className="hidden truncate text-muted-foreground text-sm lg:inline">
          {channel.topic}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <Facepile ids={channel.members} online />
          </div>
          {/* Surfaces the preview where it isn't in flow (below xl). */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground xl:hidden"
            aria-label="Open preview"
            onClick={() => open('preview')}
          >
            <Eye />
          </Button>
        </div>
      </div>
      {/* autoScroll keeps the thread pinned to the newest message: sending
          scrolls to the latest only when the messages overflow the viewport
          (scrollToEnd is a no-op otherwise), which is the behavior we want.
          No scrollAnchor — that would pin the sent message to the top of the
          viewport and push the earlier ones out of view. */}
      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller className="flex-1">
          <MessageScrollerViewport className="px-5 py-6">
            <MessageScrollerContent className="gap-5">
              {messages.map((message) => (
                <MessageScrollerItem key={message.id} messageId={message.id}>
                  <ChatMessage message={message} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="end" />
        </MessageScroller>
      </MessageScrollerProvider>
      <Composer
        channel={channel}
        onSend={send}
        typist={typist}
        renderComposerPrompt={renderComposerPrompt}
      />
    </section>
  );
}

function MicButton() {
  return (
    <InputGroupButton
      size="icon-sm"
      variant="ghost"
      className="text-muted-foreground"
      aria-label="Dictate message"
    >
      <Mic />
    </InputGroupButton>
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
    <InputGroup className="h-auto items-center rounded-lg border-border bg-background px-1 shadow-sm">
      <InputGroupAddon align="inline-start">
        <ConnectorsButton />
      </InputGroupAddon>
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
      <InputGroupAddon align="inline-end">
        <MicButton />
        <InputGroupButton
          size="icon-sm"
          variant="default"
          aria-label="Send message"
          disabled={!value.text.trim()}
          onClick={submit}
        >
          <Send />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

// A collaborative channel adds a live, co-written prompt above the message bar,
// supplied by the caller via `renderComposerPrompt`; without it, only the
// message bar renders even when the channel declares a compose mode.
function Composer({
  channel,
  onSend,
  typist,
  renderComposerPrompt,
}: {
  channel: Channel;
  onSend: (value: SendValue) => void;
  // The person shown as typing above the message bar — a channel's seeded typist
  // or, mid-exchange, whoever is drafting a reply (resolved by Thread).
  typist: Person | null;
  renderComposerPrompt?: RenderComposerPrompt;
}) {
  // Live token count of the co-written prompt, mirroring what the agent would be billed to build it.
  const [promptText, setPromptText] = useState('');
  const tokens = useTokenCount(promptText);

  if (channel.compose && renderComposerPrompt) {
    const editable = channel.compose === 'collab';
    return (
      <div className="shrink-0 space-y-2 px-5 pb-5">
        <Card className="gap-0 border border-border bg-background py-0 shadow-lg ring-0">
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
        </Card>
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
        <Spinner />
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
