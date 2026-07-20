<template>
  <div class="flex flex-col gap-3 p-4">
    <!-- Received messages -->
    <div class="flex gap-2 animate-pulse">
      <div class="w-8 h-8 rounded-full bg-gray-200 shrink-0 mt-1" />
      <div class="space-y-1">
        <div class="h-10 w-40 bg-gray-200 rounded-2xl rounded-tl-sm" />
        <div class="h-10 w-56 bg-gray-200 rounded-2xl" />
      </div>
    </div>

    <!-- Sent messages -->
    <div class="flex flex-col items-end gap-1 animate-pulse">
      <div class="h-10 w-48 bg-blue-100 rounded-2xl rounded-tr-sm" />
      <div class="h-10 w-32 bg-blue-100 rounded-2xl" />
    </div>

    <div class="flex gap-2 animate-pulse">
      <div class="w-8 h-8 rounded-full bg-gray-200 shrink-0 mt-1" />
      <div class="h-10 w-52 bg-gray-200 rounded-2xl rounded-tl-sm" />
    </div>

    <div class="flex flex-col items-end animate-pulse">
      <div class="h-10 w-44 bg-blue-100 rounded-2xl rounded-tr-sm" />
    </div>
  </div>
</template>
