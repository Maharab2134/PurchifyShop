import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
} from 'lucide-react'

interface RichTextEditorProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  placeholder?: string
  className?: string
  /** Pass to remount editor when form context changes (e.g. add vs edit). */
  editorKey?: string
}

export default function RichTextEditor<T extends FieldValues>({
  name,
  control,
  placeholder = 'Enter description...',
  className = '',
  editorKey = 'default',
}: RichTextEditorProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TiptapEditor
          key={editorKey}
          value={field.value || ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          className={className}
        />
      )}
    />
  )
}

interface TiptapEditorProps {
  value: string
  onChange: (html: string) => void
  onBlur: () => void
  placeholder: string
  className: string
}

function TiptapEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'min-h-[200px] px-4 py-3 focus:outline-none text-gray-900 dark:text-gray-100 text-sm leading-relaxed',
      },
    },
    onBlur: () => onBlur(),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || ''
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  return (
    <div
      className={`rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white dark:bg-gray-800 ${className}`}
    >
      {/* Toolbar */}
      {editor && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>
          <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Ordered list"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const url = window.prompt('URL:', editor.getAttributes('link').href || 'https://')
              if (url) editor.chain().focus().setLink({ href: url }).run()
            }}
            active={editor.isActive('link')}
            title="Link"
          >
            <LinkIcon size={16} />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .dark .tiptap p.is-editor-empty:first-child::before {
          color: #6b7280;
        }
      `}</style>
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
