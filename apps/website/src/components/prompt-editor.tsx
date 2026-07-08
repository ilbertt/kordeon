import { cn } from '@repo/ui/lib/utils';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useRef } from 'react';

// A real WYSIWYG for the prompt draft — Notion-like: type `# ` for a heading,
// `- ` for a bullet, and tick the checkboxes directly. No toolbar; markdown
// input rules do the work. Nothing is persisted (there's no onUpdate).
const INITIAL_CONTENT = `
<h1>Realtime presence in the editor</h1>
<p>Let a team edit the same document together and see each other live — presence, cursors, and selections, synced on every keystroke.</p>
<h2>Requirements</h2>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="true">Show who’s online, with avatars and a per-person color</li>
<li data-type="taskItem" data-checked="true">Live cursors with name labels, updated as they move</li>
<li data-type="taskItem" data-checked="false">Shared text selections, highlighted per collaborator</li>
<li data-type="taskItem" data-checked="false">Broadcast edits on every keystroke; merge with a CRDT</li>
<li data-type="taskItem" data-checked="false">Reconnect and resync cleanly after a dropped connection</li>
</ul>
<h2>Constraints</h2>
<ul>
<li>p95 cursor latency under 80ms on the presence channel</li>
<li>Degrade to a plain “N online” count if a client can’t sync</li>
<li>Reuse the existing realtime layer — no new dependencies</li>
</ul>
<h2>Done when</h2>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="false">Two browsers show each other’s cursors and selections</li>
<li data-type="taskItem" data-checked="false">Presence clears within 2s of a tab closing</li>
</ul>
`;

// Bare-node styling (Tiptap ships headless). The `cursor-none` that hides the
// native caret in favour of the collab prompt's custom "You" cursor is applied
// per-instance below, only when the editor is editable.
const EDITOR_CLASS = cn(
  'h-full text-foreground',
  '[&_.tiptap]:min-h-full [&_.tiptap]:p-1 [&_.tiptap]:outline-none',
  '[&_.tiptap>*+*]:mt-2',
  '[&_h1]:font-semibold [&_h1]:text-sm',
  '[&_h2]:mt-3 [&_h2]:font-medium [&_h2]:text-[0.7rem] [&_h2]:text-muted-foreground [&_h2]:uppercase [&_h2]:tracking-wide',
  '[&_h3]:font-medium [&_h3]:text-xs',
  '[&_p]:text-foreground/80 [&_p]:text-xs [&_p]:leading-relaxed',
  '[&_ul:not(.task-list)]:list-disc [&_ul:not(.task-list)]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
  '[&_li]:text-foreground/80 [&_li]:text-xs [&_li]:leading-relaxed [&_li>p]:m-0',
  '[&_.task-list]:m-0 [&_.task-list]:list-none [&_.task-list]:space-y-1 [&_.task-list]:p-0',
  '[&_.task-item]:flex [&_.task-item]:items-start [&_.task-item]:gap-2',
  '[&_.task-item>label]:mt-0.5 [&_.task-item>label]:shrink-0',
  '[&_.task-item>div]:min-w-0 [&_.task-item>div]:flex-1',
  '[&_.task-item_input]:size-3.5 [&_.task-item_input]:accent-primary',
);

// `editable` off renders the same brief as a locked, read-only prompt — what the
// build channel shows once the plan is handed off to the agent.
export function PromptEditor({
  onText,
  editable = true,
}: {
  onText?: (text: string) => void;
  editable?: boolean;
}) {
  // Ref so the editor's create/update callbacks always see the latest handler
  // without re-creating the editor (useEditor is instantiated once).
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const editor = useEditor({
    // Don't render on the server — TanStack Start prerenders this page, and the
    // editor is client-only (avoids a hydration mismatch).
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit,
      TaskList.configure({ HTMLAttributes: { class: 'task-list' } }),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: 'task-item' } }),
    ],
    content: INITIAL_CONTENT,
    onCreate: ({ editor: instance }) => onTextRef.current?.(instance.getText()),
    onUpdate: ({ editor: instance }) => onTextRef.current?.(instance.getText()),
  });

  return (
    <EditorContent
      className={cn(EDITOR_CLASS, editable && '[&_.tiptap]:cursor-none')}
      editor={editor}
    />
  );
}
