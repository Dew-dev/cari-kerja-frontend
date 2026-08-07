import { ref, computed } from "vue";

const STORAGE_KEY = "preferredJobLocation";

/**
 * Preferred job location (city) persisted in localStorage.
 * Shape: { city: string, province?: string, provinceId?: number|string }
 */
const preferredLocation = ref(readStorage());

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.city) return null;
    return {
      city: String(parsed.city),
      province: parsed.province ? String(parsed.province) : "",
      provinceId: parsed.provinceId ?? null,
    };
  } catch {
    return null;
  }
}

function writeStorage(value) {
  if (!value?.city) {
    localStorage.removeItem(STORAGE_KEY);
    preferredLocation.value = null;
    return;
  }
  const next = {
    city: String(value.city).trim(),
    province: value.province ? String(value.province).trim() : "",
    provinceId: value.provinceId ?? null,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  preferredLocation.value = next;
}

export function usePreferredLocation() {
  const hasPreferredCity = computed(() => !!preferredLocation.value?.city);

  const label = computed(() => {
    const loc = preferredLocation.value;
    if (!loc?.city) return "";
    return loc.province ? `${loc.city}, ${loc.province}` : loc.city;
  });

  function setPreferredLocation(location) {
    if (!location) {
      writeStorage(null);
      return;
    }
    // City object from /locations/search type=cities
    if (location.name && (location.province_name || location.province)) {
      writeStorage({
        city: location.name,
        province: location.province_name || location.province,
        provinceId: location.province_id ?? location.provinceId ?? null,
      });
      return;
    }
    // Explicit { city, province }
    if (location.city) {
      writeStorage(location);
    }
  }

  function clearPreferredLocation() {
    writeStorage(null);
  }

  function jobListQuery() {
    const loc = preferredLocation.value;
    if (!loc?.city) return {};
    return { cities_name: loc.city, page: 1 };
  }

  return {
    preferredLocation,
    hasPreferredCity,
    label,
    setPreferredLocation,
    clearPreferredLocation,
    jobListQuery,
  };
}
