import { cn } from '@repo/ui/lib/utils';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useRef } from 'react';

// A Notion-like WYSIWYG for the prompt draft: no toolbar — markdown input rules
// (`# ` heading, `- ` bullet, tickable checkboxes) do the work.
const INITIAL_CONTENT = `
<h1>Activation dashboard</h1>
<p>Give the team one view of how new signups are converting — signups by week and activation rate by channel, pulled live from the warehouse.</p>
<h2>Requirements</h2>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="true">Signups by week, with the quarter-over-quarter trend</li>
<li data-type="taskItem" data-checked="true">Activation rate broken out by acquisition channel</li>
<li data-type="taskItem" data-checked="false">Flag any channel converting under 30%</li>
<li data-type="taskItem" data-checked="false">Compare against last quarter as a delta</li>
<li data-type="taskItem" data-checked="false">Refresh from the warehouse on a schedule</li>
</ul>
<h2>Constraints</h2>
<ul>
<li>Read from the existing warehouse connection — no new pipelines</li>
<li>Numbers must reconcile with the finance export to the dollar</li>
<li>Load the full dashboard in under a second</li>
</ul>
<h2>Done when</h2>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="false">The team sees weekly signups and per-channel activation at a glance</li>
<li data-type="taskItem" data-checked="false">Every number traces back to a warehouse query</li>
</ul>
`;

// The `cursor-none` that hides the native caret in favour of the collab prompt's
// custom "You" cursor is applied per-instance below, only when the editor is editable.
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

export function PromptEditor({
  onText,
  editable = true,
}: {
  onText?: (text: string) => void;
  editable?: boolean;
}) {
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
