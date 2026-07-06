# Landing page

The landing page **is** the product demo — it should look and behave like kordeon
itself, not a typical marketing page. That's why it reuses `@repo/ui`, and why its
pieces (avatars, presence facepiles, message rows, …) are built as real, self-contained
components rather than throwaway markup: each is a candidate to graduate into `@repo/ui`
and power the actual product, so shared behaviour lives in the component, not at the
call site.

Its organising metaphor: **each channel is a feature — a branch/PR**, a unit of work
handed between humans and agents. That's what the git status on every channel is for,
and why the sidebar reads like a stacked-PR list.
