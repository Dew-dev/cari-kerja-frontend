import { createRouter, createWebHistory } from "vue-router"

import { useAuthStore } from "../stores/authStore";
// router.beforeEach((to) => {
//   const auth = useAuthStore();

//   if (to.meta.auth && !auth.token) {
//     return "/";
//   }

//   if (to.meta.role && auth.user?.role !== to.meta.role) {
//     return "/";
//   }
// });

// router.beforeEach((to) => {
//   const auth = useAuthStore();

//   if (to.path === "/login" && auth.isLoggedIn) {
//     return "/";
//   }
// });

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../pages/Home.vue"),
  },
  {
    path: "/login",
    component: () => import("../pages/auth/Login.vue"),
  },
  {
    path: "/jobs",
    component: () => import("../pages/Jobs.vue"),
  },
  {
    path: "/recruiter",
    meta: { requiresAuth: true, role: "recruiter" },
    component: {
      template: "<div class='p-6'>RECRUITER DASHBOARD</div>",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
})


router.beforeEach((to) => {
  const auth = useAuthStore();

  // ✅ 1. Route PUBLIC (tidak butuh login)
  if (!to.meta.requiresAuth) {
    return true;
  }

  // 🔒 2. Route butuh login tapi user belum login
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return "/login";
  }

  // 🧭 3. Route role-based
  if (to.meta.role && auth.role !== to.meta.role) {
    return "/";
  }

  if (to.path === "/login" && auth.isLoggedIn) {
    return auth.role === "recruiter" ? "/recruiter" : "/jobs";
  }

  return true;
});


export default router

