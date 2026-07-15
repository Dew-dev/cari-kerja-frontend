<script setup>
defineProps({
  name: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="flex items-center gap-1.5 px-1 py-0.5">
    <span class="flex gap-0.5">
      <span
        v-for="n in 3"
        :key="n"
        class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
        :style="{ animationDelay: `${(n - 1) * 0.15}s` }"
      />
    </span>
    <span v-if="name" class="text-xs text-gray-500">{{ name }} is typing…</span>
  </div>
</template>
