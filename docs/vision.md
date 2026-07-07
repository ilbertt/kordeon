# Vision

Every serious app is converging on the same three panels: an explorer on the
left, a chat in the middle, a preview on the right. It's the shape of Slack, of
Cursor, of every new tool — because that's how work happens: you talk about the
work, you navigate the work, you look at the result.

Chat tools own the middle panel. But real work spills out of the conversation
into two places a thread can't hold: **context** — the structured work itself,
its units and their state — and **the artifact** — the running product, the UI,
the diff. So you tab away. Bolting an agent into the chat makes the conversation
smarter but leaves the tabbing-away intact: the agent still only lives in the
middle.

kordeon is built as all three panels at once. Humans and an agent shape an idea
in the **chat**; the work lives as structured units in the **explorer** — each
channel is a feature, a branch/PR you can read the state of at a glance; the
result renders live in the **preview**. The agent isn't a guest in the thread —
it spans the panels: pulling context on the left, building the artifact on the
right.

The agent is a teammate, not a tool. It has a name and a face in the roster,
gets @-mentioned, reacts, and picks up work like anyone else — same presence,
same avatar, no separate "bot" treatment. You don't summon an assistant; you
work alongside a colleague who happens to be an agent.

The loop, in one surface: **chat** to shape an idea → **refine a plan** together
→ **hand it off** to the agent → **preview** the result. Nothing tabs away.

We start with teams building software, where the preview is most alive — a
running app, a PR diff — and the loop is tightest. The shape generalizes:
whoever makes it one surface owns where work happens next.
