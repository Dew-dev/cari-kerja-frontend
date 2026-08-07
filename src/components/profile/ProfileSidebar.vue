<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const icons = {
  profile: "pi-user",
  resumes: "pi-file",
  work: "pi-briefcase",
  education: "pi-book",
  certifications: "pi-verified",
  cvparser: "pi-bolt",
  applied: "pi-send",
  saved: "pi-bookmark",
};

function select(id) {
  emit("update:modelValue", id);
}
</script>

<template>
  <nav
    class="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 sticky top-6"
    aria-label="Profile sections"
  >
    <p class="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {{ $t("profile.myProfile") }}
    </p>
    <ul class="flex flex-col gap-0.5">
      <li v-for="tab in tabs" :key="tab.id">
        <button
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition duration-200 min-h-11"
          :class="
            modelValue === tab.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          "
          @click="select(tab.id)"
        >
          <i
            :class="[
              'pi text-sm w-4 text-center',
              icons[tab.id] || 'pi-circle',
              modelValue === tab.id ? 'text-white' : 'text-slate-400',
            ]"
          />
          <span class="truncate">{{ tab.label }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>
