<script setup>
import { onBeforeUnmount, watch } from "vue";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  minHeight: {
    type: String,
    default: "160px",
  },
});

const emit = defineEmits(["update:modelValue"]);

const editor = useEditor({
  content: props.modelValue || "",
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-blue-600 underline",
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class:
        "prose prose-sm max-w-none focus:outline-none px-3 py-2 text-sm text-gray-800",
    },
  },
  onUpdate: ({ editor: current }) => {
    emit("update:modelValue", current.getHTML());
  },
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return;
    const next = value || "";
    if (editor.value.getHTML() === next) return;
    editor.value.commands.setContent(next, { emitUpdate: false });
  },
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

function setLink() {
  if (!editor.value) return;
  const previous = editor.value.getAttributes("link").href || "";
  const url = window.prompt("URL", previous);
  if (url === null) return;
  if (url === "") {
    editor.value.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.value
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url })
    .run();
}
</script>

<template>
  <div
    class="rich-text-editor overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500"
  >
    <div
      v-if="editor"
      class="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5"
    >
      <button
        type="button"
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('bold') }"
        title="Bold"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        class="toolbar-btn italic"
        :class="{ 'is-active': editor.isActive('italic') }"
        title="Italic"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        I
      </button>
      <button
        type="button"
        class="toolbar-btn underline"
        :class="{ 'is-active': editor.isActive('underline') }"
        title="Underline"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        U
      </button>
      <button
        type="button"
        class="toolbar-btn line-through"
        :class="{ 'is-active': editor.isActive('strike') }"
        title="Strikethrough"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        S
      </button>

      <span class="mx-1 h-4 w-px bg-gray-300" />

      <button
        type="button"
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        title="Heading"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        H
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        title="Bullet list"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        • List
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        title="Numbered list"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        1. List
      </button>

      <span class="mx-1 h-4 w-px bg-gray-300" />

      <button
        type="button"
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('link') }"
        title="Link"
        @click="setLink"
      >
        Link
      </button>
      <button
        type="button"
        class="toolbar-btn"
        title="Clear formatting"
        @click="editor.chain().focus().unsetAllMarks().clearNodes().run()"
      >
        Clear
      </button>
    </div>

    <div class="rich-text-editor__body" :style="{ minHeight }">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<style scoped>
.toolbar-btn {
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #4b5563;
  transition: background-color 0.15s ease;
}

.toolbar-btn:hover {
  background-color: #e5e7eb;
}

.toolbar-btn.is-active {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.rich-text-editor__body :deep(.tiptap),
.rich-text-editor__body :deep(.ProseMirror) {
  min-height: inherit;
}

.rich-text-editor__body :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.rich-text-editor__body :deep(.ProseMirror ul) {
  list-style: disc;
  padding-left: 1.25rem;
}

.rich-text-editor__body :deep(.ProseMirror ol) {
  list-style: decimal;
  padding-left: 1.25rem;
}

.rich-text-editor__body :deep(.ProseMirror h2) {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0.5rem 0;
}

.rich-text-editor__body :deep(.ProseMirror a) {
  color: #2563eb;
  text-decoration: underline;
}
</style>
