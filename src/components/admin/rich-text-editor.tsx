"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  name,
  defaultValue,
  dir = "rtl",
}: {
  name: string;
  defaultValue?: string;
  dir?: "rtl" | "ltr";
}) {
  const [html, setHtml] = useState(defaultValue || "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      ImageExtension,
    ],
    content: defaultValue || "",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        dir,
        class:
          "prose prose-slate max-w-none min-h-48 rounded-b-lg border border-t-0 border-border bg-background px-4 py-3 text-sm focus:outline-none",
      },
    },
  });

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-border bg-muted-bg px-2 py-1.5">
        <ToolbarButton
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          icon={Bold}
          label="Bold"
        />
        <ToolbarButton
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          icon={Italic}
          label="Italic"
        />
        <ToolbarButton
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={Heading2}
          label="Heading"
        />
        <ToolbarButton
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          icon={List}
          label="Bullet list"
        />
        <ToolbarButton
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          icon={ListOrdered}
          label="Numbered list"
        />
        <ToolbarButton
          active={editor?.isActive("link")}
          onClick={() => {
            const url = window.prompt("آدرس لینک را وارد کنید:");
            if (url) editor?.chain().focus().setLink({ href: url }).run();
          }}
          icon={LinkIcon}
          label="Link"
        />
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} icon={Undo} label="Undo" />
        <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} icon={Redo} label="Redo" />
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}

function ToolbarButton({
  onClick,
  icon: Icon,
  label,
  active,
}: {
  onClick?: () => void;
  icon: typeof Bold;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-white cursor-pointer",
        active && "bg-white text-primary shadow-sm"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
