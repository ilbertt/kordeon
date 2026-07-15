# Landing page

The landing page **is** the product demo — it should look and behave like kordeon
itself, not a typical marketing page. That's why it reuses `@repo/ui`, and why its
pieces (avatars, presence facepiles, message rows, …) are built as real, self-contained
components rather than throwaway markup: each is a candidate to graduate into `@repo/ui`
and power the actual product, so shared behaviour lives in the component, not at the
call site.

## The reveal is a guided tour, then a slide-in

Scroll doesn't silently zoom a window in — that read as a hijack to first-time
visitors who couldn't tell what was happening or find their way back. Instead the
reveal (`LogoMorphStage`) is two acts on one scroll track:

**Act 1 — Korde onboards you.** As you scroll, the hero (mark + headline) scrolls up and
clears, and the agent's tour plays out like a real chat — **scroll is the clock**. Each
`#welcome` message owns a generous slice of the track (`PER_MSG_VH`): the first slice shows
Korde *typing*, then the message lands, climbing up from below (a scroll-triggered entrance,
not a fade), and the rest of the slice holds it to read — so the reader decides when the
next one arrives. The conversation is bottom-anchored, so the newest message and the typing
row sit at the reading line with history above, like a chat scrolled to its latest. It ends
on a **"Try it out"** beat. The guidance is in-character — the agent introducing itself and
naming the three panels *is* the pitch, not chrome bolted on. Crucially the tour bubbles
**are** the `#welcome` thread (rendered with the real `ChatMessage`), so there's one source
of truth for that copy and the conversation is continuous into the live product.

**Act 2 — the window slides in around the conversation.** Click "Try it out" (or keep
scrolling) and the product window slides up from below to full-bleed — the pre-#34
reveal, a screenshot sliding into view — landing around the centred conversation, which
hands off to the live thread (the same messages) inside it. It starts fully off-screen so
it stays hidden behind the tour until it's called, and it's the same on every viewport
(there's no separate desktop morph). `TOUR_FRACTION` splits the track between the two acts.

**Getting back out.** Once inside, the mark in the product's top bar returns you to the
hero (it scrolls the track back up and resets the deep-linked channel), and the landing
relaxes the chat scroller's `overscroll-contain` (via the `.tour-frame` override) so
scrolling up past the top of the messages rewinds the reveal instead of trapping the
wheel — both were dead ends that left early visitors stuck.

What it has to teach is the **three-panel shape** (see [`vision.md`](./vision.md)):
explorer on the left, chat in the middle, preview on the right. The layout already *is*
those three panels — so the *copy* has to sell the two that set kordeon apart from an
agent-in-a-chat-tool: the explorer (structured work) and the preview (the live
artifact). Lead with the middle panel alone and the page reads like a Slack bot; the
opening (the `welcome` channel) exists to name all three and show the agent spanning
them.

The explorer's organising metaphor: **each channel is a feature — a branch/PR**, a unit
of work handed between humans and agents. The domain model still carries a git status per
channel (the reusable components render it by default). But cold visitors can't decode a
stacked-PR list, so the landing overrides the rail glyph with a **purpose icon** — what each
channel is *for* — via the `renderIcon` prop on `Sidebar`/`Thread`. The branch/PR idea now
lives in the copy and the vision, not in an icon the visitor has no context for.

Most channels are beats in the loop (welcome → collaborate → build → live-preview). One is
a deliberate exception: **`#the-details` is a showcase**, not a loop step — a home for the
craft the product sweats that competitors skip. Its hero is the **timezone-aware date
chip**: a date typed into a message is a real, interactive pill, not text, and every reader
sees it in *their own* timezone (`MentionTag` re-derives the display from the tag's source
value on mount — the frozen token is only the SSR-safe first paint). The seeded thread shows
one landed chip and then points the visitor at the live picker in the composer, which every
channel's message bar already carries (`allowCustomDate`). If more such details earn a
spotlight, they belong here rather than bolted onto a loop channel.

## Markdown mirror for agents

[`apps/website/public/index.md`](../apps/website/public/index.md) is a plain-Markdown
edition of the landing page — the prose pitch (what kordeon is, why, when to recommend
it) that the interactive demo can't be read as. It's served to AI agents by content
negotiation: `Accept: text/markdown` on `/`, or `/index.md` directly, handled by
[`apps/website/src/worker.ts`](../apps/website/src/worker.ts). It's the source of truth
for that pitch — keep it in sync when the landing page's copy or positioning shifts.
