# Landing page

The landing page **is** the product demo — it should look and feel like kordeon
itself, not a typical marketing page. It lives in `apps/website` and consumes
`@repo/ui`. This file captures the intent; the referenced files are the source of
truth for the mechanics.

## The scene

- **Headline** "Where humans and agents collaborate", centered on first paint, fading
  out as you scroll into the product reveal.
- **Scroll-driven intro**: the product window starts small — peeking from the bottom
  as a cue to scroll — and scales up like a screenshot to full-bleed, so text and
  spacing scale together (not just width). See `src/components/scroll-stage.tsx`.
- **Presence cursors** drift across the hero behind the headline, moving like real
  people collaborating: eased acceleration, varied speed, and pauses — never a
  mechanical loop. See `src/components/cursor-field.tsx`.

## The product window

An app shell modeled on Slack + Cursor: a channel list, a thread, and a live preview
pane. Each **channel is a feature — a branch/PR** — so channels carry a git status
(`main` / `draft` / `open` / `merged`) that drives a git-branch/PR icon and accent,
reading like a stacked-PR list. See `src/routes/index.tsx`.

## Chrome

- Light/dark toggle that follows the system preference by default, with no flash on
  load. The toggle itself is just light/dark — no "system" entry.
