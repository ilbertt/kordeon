import type { Channel, Message } from '@repo/domain/workspace';
import { WorkspaceProvider } from '@repo/ui/custom/workspace/context';
import { PreviewPane } from '@repo/ui/custom/workspace/preview-pane';
import { Sidebar } from '@repo/ui/custom/workspace/sidebar';
import { Thread } from '@repo/ui/custom/workspace/thread';
import { WorkspaceLayout } from '@repo/ui/custom/workspace/workspace-layout';
import type { ReactNode } from 'react';
import { CHANNELS, channelBySlug, HERO_SLUG, type SceneChannel } from '#data/channels';
import { MENTION_SUGGESTIONS, PEOPLE } from '#data/people';
import {
  BuildingPreview,
  DashboardPreview,
  PreviewPlaceholder,
} from '#product-window/preview-content';
import { TopBar } from '#product-window/top-bar';

export type PreviewState = 'placeholder' | 'building' | 'dashboard';

// The rail + thread header show what each channel is *for* (purpose icon), the
// same override the landing uses so cold viewers aren't shown the git glyph.
function renderChannelIcon(channel: Channel): ReactNode {
  const Icon = channelBySlug(channel.slug)?.icon;
  return Icon ? <Icon className="size-4 shrink-0" /> : null;
}

// Re-derive a plan message's checkboxes from a running done-count, so the plan
// completes on screen as the agent builds (the caller ramps `planDone`).
function withPlanDone({ message, planDone }: { message: Message; planDone: number }): Message {
  if (message.kind !== 'msg' || !message.plan) {
    return message;
  }
  return {
    ...message,
    plan: [...message.plan.entries()].map(([index, item]) => ({ ...item, done: index < planDone })),
  };
}

// Only the active channel is sliced to the current reveal; the rest are hidden,
// so their message count doesn't matter.
function sliceChannel({
  channel,
  active,
  visibleCount,
  typingId,
  compose,
  planDone,
}: {
  channel: SceneChannel;
  active: boolean;
  visibleCount?: number;
  typingId?: string;
  compose?: SceneChannel['compose'];
  planDone?: number;
}): SceneChannel {
  if (!active) {
    return channel;
  }
  const revealed =
    visibleCount === undefined ? channel.messages : channel.messages.slice(0, visibleCount);
  return {
    ...channel,
    compose: compose ?? channel.compose,
    typing: typingId,
    messages:
      planDone === undefined
        ? revealed
        : revealed.map((message) => withPlanDone({ message, planDone })),
  };
}

function renderPreview({
  channel,
  state,
  reveal,
  prevState,
  stateMix = 1,
}: {
  channel: SceneChannel;
  state: PreviewState;
  reveal: number;
  prevState?: PreviewState;
  stateMix?: number;
}): ReactNode {
  const hasDashboard = channel.slug === HERO_SLUG;
  const node = (shown: PreviewState): ReactNode => {
    if (!hasDashboard || shown === 'placeholder') {
      return <PreviewPlaceholder />;
    }
    if (shown === 'building') {
      return <BuildingPreview />;
    }
    return <DashboardPreview reveal={reveal} />;
  };
  // Mid-scene state changes crossfade instead of hard-swapping the whole pane on a
  // single frame (which read as a flash). Both layers stack in one grid cell so
  // there's no dependence on an absolute-positioned height.
  if (prevState && prevState !== state && stateMix < 1) {
    return (
      <div className="grid h-full w-full">
        <div style={{ gridArea: '1 / 1', opacity: 1 - stateMix }}>{node(prevState)}</div>
        <div style={{ gridArea: '1 / 1', opacity: stateMix }}>{node(state)}</div>
      </div>
    );
  }
  return node(state);
}

// The collaborate composer is an opt-in render prop, same as the product/landing
// pass it: a channel with `compose` set hosts it above the message bar. The film
// supplies a frame-driven plan here (the real one is tiptap + timer-driven).
type RenderComposerPrompt = (args: {
  editable: boolean;
  onText: (text: string) => void;
  label?: string;
}) => ReactNode;

export type ProductWindowProps = {
  activeSlug: string;
  visibleCount?: number;
  typingId?: string;
  compose?: SceneChannel['compose'];
  planDone?: number;
  previewState?: PreviewState;
  previewReveal?: number;
  previewPrevState?: PreviewState;
  previewStateMix?: number;
  renderComposerPrompt?: RenderComposerPrompt;
};

export function ProductWindow({
  activeSlug,
  visibleCount,
  typingId,
  compose,
  planDone,
  previewState = 'dashboard',
  previewReveal = 1,
  previewPrevState,
  previewStateMix,
  renderComposerPrompt,
}: ProductWindowProps) {
  return (
    <WorkspaceProvider people={PEOPLE} currentUserId="you" mentionSuggestions={MENTION_SUGGESTIONS}>
      <WorkspaceLayout
        topBar={<TopBar />}
        sidebar={
          <Sidebar channels={CHANNELS} activeSlug={activeSlug} renderIcon={renderChannelIcon} />
        }
      >
        {CHANNELS.map((channel) => {
          const active = channel.slug === activeSlug;
          return (
            <Thread
              key={channel.slug}
              channel={sliceChannel({ channel, active, visibleCount, typingId, compose, planDone })}
              active={active}
              animate={false}
              renderIcon={renderChannelIcon}
              renderComposerPrompt={renderComposerPrompt}
            />
          );
        })}
        {CHANNELS.map((channel) => (
          <PreviewPane key={channel.slug} active={channel.slug === activeSlug}>
            {renderPreview({
              channel,
              state: previewState,
              reveal: previewReveal,
              prevState: previewPrevState,
              stateMix: previewStateMix,
            })}
          </PreviewPane>
        ))}
      </WorkspaceLayout>
    </WorkspaceProvider>
  );
}
