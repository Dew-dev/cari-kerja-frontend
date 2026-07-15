<script setup>
const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <span
    v-if="count > 0"
    class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none"
  >
    {{ count > 99 ? '99+' : count }}
  </span>
</template>
