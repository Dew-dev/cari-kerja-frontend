<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  count: { type: Number, default: 6 },
});
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-start">
    <div v-for="n in count" :key="n" class="text-center space-y-3">
      <Skeleton class="h-16 w-16 mx-auto rounded-full" rounded="rounded-full" />
      <Skeleton class="h-3 w-20 mx-auto" />
    </div>
  </div>
</template>
