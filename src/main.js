import { createApp } from 'vue'
import { createPinia } from "pinia";
import './style.css'
import App from './App.vue'
import router from "./router";
import "./assets/main.css";
import { i18n } from "./i18n";
import { createNotivue } from "notivue";

import "notivue/notification.css"; // Only needed if using built-in notifications
import "notivue/animations.css"; // Only needed if using built-in animations

const notivue = createNotivue(/* options */);
createApp(App)
.use(createPinia())
.use(router)
.use(i18n)
.use(notivue)
.mount('#app')  