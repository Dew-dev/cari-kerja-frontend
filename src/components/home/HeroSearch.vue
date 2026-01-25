<template>
  <!-- FULL WIDTH BACKGROUND -->
  <section class="bg-[#0a9cf5] text-white">
    
    <!-- CENTERED CONTENT -->
    <div class="max-w-290 w-full mx-auto py-12 px-4">

      <h1 class="text-4xl font-bold mb-3">
        {{ t("home.title") }}
      </h1>

      <p class="text-white/90 mb-8">
        {{ t("home.subtitle") }}
      </p>

      <!-- SEARCH BAR -->
      <div class="flex items-center gap-3">
        <input
          type="text"
          v-model="keyword"
          class=" bg-white flex-1 px-4 py-3 rounded text-black hover:scale-101 transition duration-200 ease-in-out"
          :placeholder="t('home.keywordPlaceholder')"
        />

        <select class="bg-white px-5 py-3 rounded text-black">
          <option>{{ t("home.allUkraine") }}</option>
        </select>

        <button 
        @click="emit('search', keyword)"
        class="bg-pink-600 px-6 py-3 rounded font-semibold hover:scale-105 transition duration-200 ease-in-out"
        >
          {{ t("home.findJobs") }}
        </button>

        <button class="bg-white text-blue-600 px-6 py-3 rounded font-semibold hover:scale-105 transition duration-200 ease-in-out">
          {{ t("home.pickUpJobs") }}
        </button>
      </div>

    </div>
  </section>
</template>

<script setup>
import { useI18n } from "vue-i18n"
import { ref } from "vue";

const { t } = useI18n();
const keyword = ref('');
const emit = defineEmits(['search']);


</script>