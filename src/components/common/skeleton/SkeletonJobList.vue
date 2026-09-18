<script setup>
import SkeletonJobCard from "./SkeletonJobCard.vue";

defineProps({
  count: { type: Number, default: 5 },
  compact: { type: Boolean, default: false },
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <SkeletonJobCard v-for="n in count" :key="n" :compact="compact" />
  </div>
</template>
