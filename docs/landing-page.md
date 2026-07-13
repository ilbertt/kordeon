# Landing page

The landing page **is** the product demo — it should look and behave like kordeon
itself, not a typical marketing page. That's why it reuses `@repo/ui`, and why its
pieces (avatars, presence facepiles, message rows, …) are built as real, self-contained
components rather than throwaway markup: each is a candidate to graduate into `@repo/ui`
and power the actual product, so shared behaviour lives in the component, not at the
call site.

## The reveal is the thesis

The intro isn't a screenshot sliding up — it's the **mark metamorphosing into the
product** (`LogoMorphStage`). The kordeon mark is three bars in the panel order —
explorer · chat · the accented preview — so on scroll (or the CTA) each bar grows and
unfolds, in place, onto the panel it stands for, and the real window fades in over them
and becomes usable. The three-panel thesis is stated by the logo itself before a word of
copy is read. The bar → panel geometry mirrors the real workspace layout, so it lives
next to the maths (`logo-morph-geometry.ts`); keep the two in sync if the window's panel
widths or breakpoints change.

The morph only reads on **desktop**, where the three panels are actually on screen. Below
the sidebar breakpoint (`SIDEBAR_BP`) both side panels collapse to drawers, so there are no
columns for the bars to become — the metamorphosis would land on a single-column window and
say nothing. There, `LogoMorphStage` drops the morph and keeps the pre-#34 reveal: the
window scales up from a peek at the bottom, like a screenshot sliding into view. Both are
scroll-driven off the same track, so the CTA and section deep-links behave identically.

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
