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
    name: "login",
    meta: { guestOnly: true },
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
  {
    path: "/register",
    meta: { guestOnly: true },
    component: () => import("../pages/auth/Register.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
})


router.beforeEach((to) => {
  const auth = useAuthStore();

  // 🚫 GUEST ONLY (login/register)
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return auth.role === "recruiter" ? "/recruiter" : "/jobs";
  }

  // 🔒 PROTECTED ROUTE
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return "/login";
  }

  // 🧭 ROLE CHECK
  if (to.meta.role && auth.role !== to.meta.role) {
    return "/";
  }

  return true;
});


export default router

