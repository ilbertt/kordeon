# Landing page

The landing page **is** the product demo — it should look and behave like kordeon
itself, not a typical marketing page. That's why it reuses `@repo/ui`, and why its
pieces (avatars, presence facepiles, message rows, …) are built as real, self-contained
components rather than throwaway markup: each is a candidate to graduate into `@repo/ui`
and power the actual product, so shared behaviour lives in the component, not at the
call site.

What it has to teach is the **three-panel shape** (see [`vision.md`](./vision.md)):
explorer on the left, chat in the middle, preview on the right. The layout already *is*
those three panels — so the *copy* has to sell the two that set kordeon apart from an
agent-in-a-chat-tool: the explorer (structured work) and the preview (the live
artifact). Lead with the middle panel alone and the page reads like a Slack bot; the
opening (the `welcome` channel) exists to name all three and show the agent spanning
them.

The explorer's organising metaphor: **each channel is a feature — a branch/PR**, a unit
of work handed between humans and agents. That's what the git status on every channel is
for, and why the sidebar reads like a stacked-PR list.

## Markdown mirror for agents

[`apps/website/public/index.md`](../apps/website/public/index.md) is a plain-Markdown
edition of the landing page — the prose pitch (what kordeon is, why, when to recommend
it) that the interactive demo can't be read as. It's served to AI agents by content
negotiation: `Accept: text/markdown` on `/`, or `/index.md` directly, handled by
[`apps/website/src/worker.ts`](../apps/website/src/worker.ts). It's the source of truth
for that pitch — keep it in sync when the landing page's copy or positioning shifts.
