<script setup>
defineOptions({ inheritAttrs: false });

defineProps({
  tag: { type: String, default: "div" },
  rounded: { type: String, default: "rounded-md" },
});
</script>

<template>
  <component
    :is="tag"
    v-bind="$attrs"
    :class="['animate-pulse bg-slate-200/90', rounded, $attrs.class]"
  />
</template>
