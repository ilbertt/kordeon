# Landing page

The landing page **is** the product demo — it should look and behave like kordeon
itself, not a typical marketing page. That's why it reuses `@repo/ui`, and why its
pieces (avatars, presence facepiles, message rows, …) are built as real, self-contained
components rather than throwaway markup: each is a candidate to graduate into `@repo/ui`
and power the actual product, so shared behaviour lives in the component, not at the
call site.

## The reveal is a window forming, then growing into the product

Scroll doesn't silently zoom a window in — that read as a hijack to first-time
visitors who couldn't tell what was happening or find their way back. Instead the
reveal (`LogoMorphStage`) is two acts on one scroll track, following the project's
animation standards (transform / opacity / clip-path only, ease-in-out for on-screen
morphing, blur to blend the hand-off — see
[`.agents/skills/review-animations`](../.agents/skills/review-animations)).

**Act 1 — a window forms around Korde's tour.** The headline doesn't clear — it *stays as
the title*. On the first scroll it shrinks and rises into a compact caption at the top
(the mark and CTA fade with it), and a **simple window** — a titled, bordered card —
forms below it: the chrome fades and scales in as Korde starts talking. The rise is
staggered *ahead* of the window forming (`HERO_FORM_END` before `WIN_FORM_START`) so the
headline has cleared the window's top before the card appears, instead of the two crossing
through each other. Inside, the agent's tour plays out like a real chat — **scroll is the
clock**. The typing indicator is *pinned at the bottom the whole time* — it never leaves,
as if Korde is always ready to send the next line (it even previews who's next: "Maya is
typing" before Maya speaks). Each scroll beat (`PER_MSG_VH`, generous so the reader sets
the pace) sends the line it's typing: the message opens up from the typing row — its slot
expands from zero, pushing the history above it up (height and a short lift, no fade) — and
the row starts on the next one. The conversation is bottom-anchored, so the newest message
and the typing row sit at the reading line, like a chat scrolled to its latest. A trailing
beat swaps the typing row for a **"Try it out"** button. The guidance is in-character — the
agent introducing itself and pitching kordeon *is* the pitch, not chrome bolted on. Because
the tour plays before the product is in, the copy takes the **broad angle** and can't point
at panels ("on the left…"): Korde sells the differentiators by concept, not deixis —
work-as-threads, plan-together-first, build-live, agents-as-teammates. Crucially the tour
bubbles **are** the `#welcome` thread (rendered with the real `ChatMessage`), so there's one
source of truth for that copy — reactions included: the pills are live, so a visitor can
react for fun (nothing persists), same as inside the product.

**Act 2 — the window grows into the product.** Click "Try it out" (or keep scrolling) and
the window *grows* to full-screen while the product **resolves in** — the motion the design
review settled on (a shared-element grow, not a slide or a crossfade). Mechanically: the
product is full-bleed at final layout, and a `clip-path` opens it from the window's rect to
full-bleed with an ease-in-out (so it never scales or reflows) while its content resolves in
(opacity, blurred over the hand-off). A **hollow bordered overlay grows on the same rect** —
the *visible* window frame expanding — so the eye reads the window enlarging, not a curtain
dropping; it fades out as its edges reach the viewport. The tour window stays put and fades
(blurred, `REVEAL_WIN_GONE`) as the product resolves in over the same rect, and the hand-off
is seamless only because the product shows `#welcome` **statically** and the landing
**bottom-anchors + width-caps** the chat (scoped `.tour-frame` overrides, `animate={false}`
for that channel in `AppShell`) so the product's messages sit exactly where the tour's did —
same content, same place, no jump. `TOUR_FRACTION` splits the track between the two acts.

Two dead ends we backed out of (both in the git history) name the traps: a **crossfade**
inside the window read as "the window fades out and the product appears from a black
curtain"; and playing the tour *inside* the clipped product window cut the messages off at
its bottom edge (the product's chat anchors to its composer, below the clip) with a dark
empty expanse above. The working version keeps a **dedicated, readable tour window** and
only grows-and-resolves in Act 2.

**Getting back out.** Once inside, the mark in the product's top bar returns you to the
hero (it scrolls the track back up and resets the deep-linked channel), and the landing
relaxes the chat scroller's `overscroll-contain` (via the `.tour-frame` override) so
scrolling up past the top of the messages rewinds the reveal instead of trapping the
wheel — both were dead ends that left early visitors stuck.

What it has to teach is the **three-panel shape** (see [`vision.md`](./vision.md)):
explorer on the left, chat in the middle, preview on the right. Once the window is in,
the layout already *is* those three panels — so the *copy* has to sell the two that set
kordeon apart from an agent-in-a-chat-tool: the explorer (structured work) and the preview
(the live artifact). Lead with the middle panel alone and the page reads like a Slack bot.
But the `welcome` copy sells them by *idea*, not by pointing — work lives as threads, and
the agent builds it live in the open — so the same lines still land during the tour, where
there are no panels on screen yet to point at.

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
