<script setup>
import { computed } from "vue";
import { sanitizeHtml, stripHtml } from "@/utils/richText";

const props = defineProps({
  html: {
    type: String,
    default: "",
  },
  /** When true, render plain text only (useful for line-clamp cards). */
  plain: {
    type: Boolean,
    default: false,
  },
  as: {
    type: String,
    default: "div",
  },
});

const sanitized = computed(() => sanitizeHtml(props.html));
const plainText = computed(() => stripHtml(props.html));
</script>

<template>
  <component
    :is="as"
    v-if="plain"
    class="rich-text-plain"
  >
    {{ plainText }}
  </component>
  <component
    :is="as"
    v-else
    class="rich-text-content prose prose-sm max-w-none text-gray-700 leading-relaxed"
    v-html="sanitized"
  />
</template>

<style scoped>
.rich-text-content :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}

.rich-text-content :deep(ol) {
  list-style: decimal;
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}

.rich-text-content :deep(p) {
  margin: 0.5rem 0;
}

.rich-text-content :deep(h1),
.rich-text-content :deep(h2),
.rich-text-content :deep(h3) {
  font-weight: 700;
  color: #111827;
  margin: 0.75rem 0 0.35rem;
  line-height: 1.3;
}

.rich-text-content :deep(h1) {
  font-size: 1.875rem;
}

.rich-text-content :deep(h2) {
  font-size: 1.5rem;
}

.rich-text-content :deep(h3) {
  font-size: 1.25rem;
}

.rich-text-content :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.rich-text-content :deep(blockquote) {
  border-left: 3px solid #d1d5db;
  padding-left: 0.75rem;
  color: #4b5563;
  margin: 0.5rem 0;
}

.rich-text-content :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
  border-radius: 0.5rem;
}

.rich-text-content :deep(hr) {
  border: 0;
  border-top: 1px solid #e5e7eb;
  margin: 1.5rem 0;
}

.rich-text-content :deep(mark) {
  background-color: #fef08a;
  color: inherit;
  padding: 0.05em 0.2em;
  border-radius: 0.15rem;
}

.rich-text-content :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875em;
  background-color: #f3f4f6;
  padding: 0.15em 0.35em;
  border-radius: 0.25rem;
}

.rich-text-content :deep(pre) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875em;
  background-color: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.rich-text-content :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: inherit;
}
</style>
