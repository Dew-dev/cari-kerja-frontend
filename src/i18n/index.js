import { createI18n } from "vue-i18n";
import en from "./en.json";
import id from "./id.json";
import uz from "./uz.json";
import ru from "./ru.json";

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("lang") || "en",
  messages: { en, id, uz, ru },
});
export default i18n;
