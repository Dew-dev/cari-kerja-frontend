import { createRouter, createWebHistory } from "vue-router"
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
];

const router = createRouter({
  history: createWebHistory(),
  routes
})


export default router
