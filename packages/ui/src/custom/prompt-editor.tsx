import { cn } from '@repo/ui/lib/utils';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useRef } from 'react';

// A Notion-like WYSIWYG for the prompt draft: no toolbar — markdown input rules
// (`# ` heading, `- ` bullet, tickable checkboxes) do the work.
const INITIAL_CONTENT = `
<h1>Activation dashboard</h1>
<p>One view of how new signups are converting — signups by week and activation rate by channel, pulled live from the warehouse.</p>
<h2>Requirements</h2>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="true">Signups by week, with the quarter-over-quarter trend</li>
<li data-type="taskItem" data-checked="true">Activation rate broken out by acquisition channel</li>
<li data-type="taskItem" data-checked="false">Keep it fresh from the warehouse on a schedule</li>
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
  // A ticked requirement reads as resolved — muted and struck through — so a
  // presence cursor checking one off is a visible change, not a silent toggle.
  '[&_.task-item[data-checked=true]>div]:text-muted-foreground [&_.task-item[data-checked=true]>div]:line-through',
);

export type EditorRect = { left: number; top: number; width: number; height: number };

// A small imperative surface over the editor, so a caller can drive it without
// depending on tiptap directly: locate a line's on-screen box, toggle a task, or
// swap a phrase — each mutating op returns its own undo. The landing's collab
// choreography uses this to make presence cursors actually work the draft.
export type PromptEditorHandle = {
  locateLine: (query: string) => { rect: EditorRect; point: { x: number; y: number } } | null;
  toggleTask: (label: string) => (() => void) | null;
  replaceText: (args: { find: string; replace: string }) => (() => void) | null;
  isFocused: () => boolean;
};

function findTextRange({
  editor,
  query,
}: {
  editor: Editor;
  query: string;
}): { from: number; to: number } | null {
  let range: { from: number; to: number } | null = null;
  // biome-ignore lint/complexity/useMaxParams: ProseMirror descendants callback signature
  editor.state.doc.descendants((node, pos) => {
    if (range) {
      return false;
    }
    if (node.isText && node.text) {
      const index = node.text.indexOf(query);
      if (index >= 0) {
        range = { from: pos + index, to: pos + index + query.length };
        return false;
      }
    }
    return true;
  });
  return range;
}

function findTaskItem({
  editor,
  label,
}: {
  editor: Editor;
  label: string;
}): { pos: number; checked: boolean } | null {
  let found: { pos: number; checked: boolean } | null = null;
  // biome-ignore lint/complexity/useMaxParams: ProseMirror descendants callback signature
  editor.state.doc.descendants((node, pos) => {
    if (found) {
      return false;
    }
    if (node.type.name === 'taskItem' && node.textContent.includes(label)) {
      found = { pos, checked: Boolean(node.attrs.checked) };
      return false;
    }
    return true;
  });
  return found;
}

function createEditorHandle(editor: Editor): PromptEditorHandle {
  const locateLine: PromptEditorHandle['locateLine'] = (query) => {
    const root = editor.view.dom as HTMLElement;
    const blocks = Array.from(root.querySelectorAll<HTMLElement>('li, p, h1, h2, h3'));
    const element = blocks.find((node) => node.textContent?.includes(query));
    if (!element) {
      return null;
    }
    const box = element.getBoundingClientRect();
    return {
      rect: { left: box.left, top: box.top, width: box.width, height: box.height },
      point: { x: box.left, y: box.top },
    };
  };

  const toggleTask: PromptEditorHandle['toggleTask'] = (label) => {
    const item = findTaskItem({ editor, label });
    if (!item) {
      return null;
    }
    const setChecked = (checked: boolean) => {
      editor
        .chain()
        .command(({ tr }) => {
          const node = tr.doc.nodeAt(item.pos);
          if (!node) {
            return false;
          }
          tr.setNodeMarkup(item.pos, undefined, { ...node.attrs, checked });
          return true;
        })
        .run();
    };
    setChecked(!item.checked);
    return () => setChecked(item.checked);
  };

  const replaceText: PromptEditorHandle['replaceText'] = ({ find, replace }) => {
    const range = findTextRange({ editor, query: find });
    if (!range) {
      return null;
    }
    editor.chain().insertContentAt(range, replace).run();
    return () => {
      const back = findTextRange({ editor, query: replace });
      if (back) {
        editor.chain().insertContentAt(back, find).run();
      }
    };
  };

  return { locateLine, toggleTask, replaceText, isFocused: () => editor.isFocused };
}

export function PromptEditor({
  onText,
  editable = true,
  onReady,
}: {
  onText?: (text: string) => void;
  editable?: boolean;
  // Hands the imperative handle up once the editor exists (client-only).
  onReady?: (handle: PromptEditorHandle) => void;
}) {
  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

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
    onCreate: ({ editor: instance }) => {
      onTextRef.current?.(instance.getText());
      onReadyRef.current?.(createEditorHandle(instance));
    },
    onUpdate: ({ editor: instance }) => onTextRef.current?.(instance.getText()),
  });

  return (
    <EditorContent
      className={cn(EDITOR_CLASS, editable && '[&_.tiptap]:cursor-none')}
      editor={editor}
    />
  );
}
