<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  lines: { type: Number, default: 3 },
});
</script>

<template>
  <div class="space-y-2 py-2" aria-hidden="true">
    <Skeleton v-for="n in lines" :key="n" class="h-4" :class="n === 1 ? 'w-2/3' : n === lines ? 'w-1/2' : 'w-full'" />
  </div>
</template>
