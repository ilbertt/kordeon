import type { Channel, Message, MessageSegment } from '@repo/domain/workspace';
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
import { type ReactNode, useMemo, useRef, useState } from 'react';
import { ConnectorsButton } from './connectors-menu';
import { useWorkspace } from './context';
import { type AnchoredMessage, interleaveMessages } from './interleave-messages';
import { ChatMessage, ThreadTypingRow } from './message';
import { Facepile } from './person-avatar';
import { StatusIcon } from './status-icon';
import { type TypingState, useThreadPlayback } from './use-thread-playback';
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

// What a visitor's message resolves to: the reply(s) to append. The data source
// (the landing) owns when the composer's "ask" is fulfilled — e.g. it stops passing
// a custom placeholder once the visitor has joined.
export type VisitorReply = { replies: Message[] };

export function Thread({
  channel,
  active,
  animate = false,
  onSend,
  onVisitorReply,
  responderId,
  renderComposerPrompt,
  renderIcon,
  renderMessageExtra,
  placeholder,
}: {
  channel: Channel;
  active: boolean;
  // Plays the seeded thread back like a live conversation (typing beats, messages
  // arriving one by one) once it scrolls into view. Off by default so the thread
  // renders statically unless a consumer opts in.
  animate?: boolean;
  onSend?: (value: SendValue) => void;
  // Lets the data source answer a visitor message in character: it returns the
  // reply message(s) to append (e.g. the agent confirming a waitlist email).
  // While it's pending, `responderId` shows as typing.
  onVisitorReply?: (value: SendValue) => Promise<VisitorReply>;
  responderId?: string;
  // Overrides the message-bar placeholder — the landing passes a waitlist prompt
  // while the visitor hasn't joined yet, and drops it (reverting to the default
  // `Message #slug…`) once they have.
  placeholder?: string;
  renderComposerPrompt?: RenderComposerPrompt;
  // Overrides the channel glyph in the header, matching the sidebar (the landing
  // shows purpose icons in place of the git-status default).
  renderIcon?: (channel: Channel) => ReactNode;
  // Appends caller-owned content under a message (see ChatMessage.renderExtra).
  renderMessageExtra?: (message: Message) => ReactNode;
}) {
  const { currentUserId } = useWorkspace();
  const { open } = useWorkspacePanels();
  // Messages the visitor sends (and any replies) are kept locally, just for feel —
  // nothing is persisted, so they reset on reload. `revealCountRef` mirrors the
  // playback's revealed count so `send` (defined before the hook) can stamp each
  // message with where it belongs in the stream.
  const revealCountRef = useRef(0);
  const [sent, setSent] = useState<AnchoredMessage[]>([]);
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
        anchor: revealCountRef.current,
      },
    ]);
    onSend?.(value);
    if (!onVisitorReply) {
      return;
    }
    setResponding(true);
    try {
      const { replies } = await onVisitorReply(value);
      // Re-read the count when the reply lands: more seeded messages may have
      // revealed during the response delay, and the reply belongs after them.
      const anchor = revealCountRef.current;
      setSent((prev) => [...prev, ...replies.map((reply) => ({ ...reply, anchor }))]);
    } finally {
      setResponding(false);
    }
  };

  const rootRef = useRef<HTMLElement>(null);
  const { revealCount, typing, playing } = useThreadPlayback({
    messages: channel.messages,
    active,
    animate,
    rootRef,
  });
  revealCountRef.current = revealCount;

  // Typing is only ever shown in one place — the row trailing the last message.
  // Whoever's composing right now: the responder answering a visitor mid-exchange,
  // the playback's live author(s), or the channel's resting typist once it settles.
  const typingIds = resolveTypingIds({
    responding,
    responderId,
    playing,
    typing,
    resting: channel.typing,
  });
  const composerPlaceholder = placeholder ?? `Message #${channel.slug}…`;

  // Visitor-sent messages slot into the playback stream where they landed (by
  // reveal count), so later-revealing seeded ones render below them, not above.
  const ordered = useMemo(
    () => interleaveMessages({ seeded: channel.messages, sent, revealCount }),
    [channel.messages, revealCount, sent],
  );
  return (
    <section ref={rootRef} className={cn('min-w-0 flex-1 flex-col', active ? 'flex' : 'hidden')}>
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
        {renderIcon ? renderIcon(channel) : <StatusIcon status={channel.status} />}
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
              {ordered.map(({ message, isSent }) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  className={cn(
                    playing && !isSent && 'duration-300 animate-in fade-in slide-in-from-bottom-2',
                  )}
                >
                  <ChatMessage message={message} renderExtra={renderMessageExtra} />
                </MessageScrollerItem>
              ))}
              {typingIds.length > 0 ? <ThreadTypingRow ids={typingIds} /> : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="end" />
        </MessageScroller>
      </MessageScrollerProvider>
      <Composer
        channel={channel}
        onSend={send}
        placeholder={composerPlaceholder}
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
function MessageBar({
  channel,
  onSend,
  placeholder,
}: {
  channel: Channel;
  onSend: (value: SendValue) => void;
  placeholder: string;
}) {
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
        placeholder={placeholder}
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
  placeholder,
  renderComposerPrompt,
}: {
  channel: Channel;
  onSend: (value: SendValue) => void;
  placeholder: string;
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
            label: editable ? undefined : 'Plan',
          })}
          <div className="flex items-center gap-2 border-border border-t px-3 py-2">
            <span className="flex-1 text-muted-foreground text-xs tabular-nums">
              {tokens.toLocaleString()} tokens
            </span>
            <ComposerAction compose={channel.compose} />
          </div>
        </Card>
        <MessageBar channel={channel} onSend={onSend} placeholder={placeholder} />
      </div>
    );
  }
  return (
    <div className="shrink-0 px-5 pb-5">
      <MessageBar channel={channel} onSend={onSend} placeholder={placeholder} />
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

// Resolves who the trailing typing row shows, in priority order: the responder
// mid-exchange, then the playback's live author(s), then the channel's resting
// typist. Empty means no one's composing, so the row is hidden.
function resolveTypingIds({
  responding,
  responderId,
  playing,
  typing,
  resting,
}: {
  responding: boolean;
  responderId?: string;
  playing: boolean;
  typing: TypingState | null;
  resting?: string;
}): string[] {
  if (responding) {
    return responderId ? [responderId] : [];
  }
  if (playing) {
    return typing?.ids ?? [];
  }
  return resting ? [resting] : [];
}
