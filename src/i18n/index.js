import { createI18n } from "vue-i18n";
import en from "./en.json";
import uz  from "./uz.json";
import ru from "./ru.json";

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("lang") || "en",
  messages: { en, uz, ru },
});
