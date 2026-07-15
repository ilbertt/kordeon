# Landing page

The landing page **is** the product demo — it should look and behave like kordeon
itself, not a typical marketing page. That's why it reuses `@repo/ui`, and why its
pieces (avatars, presence facepiles, message rows, …) are built as real, self-contained
components rather than throwaway markup: each is a candidate to graduate into `@repo/ui`
and power the actual product, so shared behaviour lives in the component, not at the
call site.

## The reveal is a window forming, then metamorphosing into the product

Scroll doesn't silently zoom a window in — that read as a hijack to first-time
visitors who couldn't tell what was happening or find their way back. Instead the
reveal (`LogoMorphStage`) is two acts on one scroll track, following the project's
animation standards (transform / opacity / clip-path only, strong ease-in-out for
on-screen morphing, blur to mask an imperfect crossfade — see
[`.agents/skills/review-animations`](../.agents/skills/review-animations)).

The through-line: **there is only ever one window, and it is the product window.** In the
tour it's the product clipped down to a small centred card so only the chat shows — the
tour plays *inside the real `#welcome` thread*, not a stand-in. The reveal just opens the
clip, so the same window grows into the full app. No second element, no crossfade of two
chats — the thing the earlier "simple window fades out, product fades in" version got wrong.

**Act 1 — a window forms around Korde's tour.** The headline doesn't clear — it *stays as
the title*. On the first scroll it shrinks and rises into a compact caption at the top
(the mark and CTA fade with it), and the **window** forms below it: the product, held to a
small rect by a `clip-path`, fading and rising in as Korde starts. A lightweight overlay
gives it a window's chrome — a `#welcome` title bar and, at the end, the CTA. The rise is
staggered *ahead* of the window forming (`HERO_FORM_END` before `WIN_FORM_START`) so the
headline clears the window's top before it appears. Inside, the tour plays like a real chat
— **scroll is the clock**. Each scroll beat (`PER_MSG_VH`, generous so the reader sets the
pace) reveals the next message; the typing indicator trails the last one, always naming
who's next ("Maya is typing" before Maya speaks). It's driven by a tiny store
(`use-tour-reveal`): `LogoMorphStage`'s scroll loop writes the revealed count + typist, and
the product's welcome `Thread` reads it as a playback `override` (`useThreadPlayback`),
bypassing its own timer. So the messages, reactions (live — react for fun, nothing
persists) and typing row are all the *real product's*, just clocked by scroll. The hero CTA
is **"Tell me more"**, which plays the whole tour by easing the scroll to the "Try it out"
beat. Because the panels aren't on screen yet, the copy takes the **broad angle** and can't
point at them ("on the left…"): Korde sells the differentiators by concept, not deixis —
work-as-threads, plan-together-first, build-live, agents-as-teammates.

**Act 2 — the window grows into the product.** Click "Try it out" (or keep scrolling) and
the `clip-path` inset opens from the window's rect to full-bleed with an ease-in-out,
corners squaring off — the **same window growing**, its panels (sidebar, header, composer,
preview) resolving in with their real content from the centre out. Because `clip-path`
doesn't reflow or distort, nothing scales or crossfades: it's one continuous element, so
there's no ghost and no "black curtain" — just the product arriving. The window's rect is
measured on resize so the clip opens from exactly its edges; the landing caps the chat width
and **bottom-anchors** it (scoped `.tour-frame` overrides) so the messages sit cleanly
inside the small window and don't reflow as it grows. `TOUR_FRACTION` splits the track
between the two acts.

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
