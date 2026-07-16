<script setup>
defineProps({
  title: {
    type: String,
    default: 'No conversations yet',
  },
  subtitle: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'chat', // 'chat' | 'select'
  },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
    <!-- Chat Icon -->
    <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
      <svg
        v-if="icon === 'chat'"
        class="w-8 h-8 text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <svg
        v-else
        class="w-8 h-8 text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
    </div>

    <h3 class="text-base font-semibold text-gray-700 mb-1">{{ title }}</h3>
    <p v-if="subtitle" class="text-sm text-gray-400 max-w-xs">{{ subtitle }}</p>

    <slot />
  </div>
</template>
