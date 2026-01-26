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
    path: "/jobposts",
    component: () => import("../pages/Jobposts.vue"),
  },
  {
  path: '/jobposts/viewJobDetail',
  name: 'JobDetail',
  component: () => import('../pages/JobDetailView.vue'), // Sesuaikan path-nya
  props: true // Mengizinkan ID dari URL masuk sebagai props ke komponen
  },
  {
    path: "/register",
    meta: { guestOnly: true },
    component: () => import("../pages/auth/Register.vue"),
  },
  {
    path: "/regcruiter",
    meta: { guestOnly: true },
    component: () => import("../pages/auth/RegisterRecruiter.vue"),
  },
  {
    path: "/profile/edit",
    meta: { requiresAuth: true },
    component: {
      template: "<div class='p-6'>EDIT PROFILE (COMING SOON)</div>",
    },
  },

  {
    path: "/recruiter",
    meta: { requiresAuth: true, role: "recruiter" },
    children: [
      {
        path: "",
        component: () => import("../pages/recruiter/Dashboard.vue"),
      },
      {
        path: "jobs",
        component: () => import("../pages/recruiter/Jobs.vue"),
      },
      {
        path: "jobs/create",
        component: () => import("../pages/recruiter/CreateJob.vue"),
      },
      {
        path: "/recruiter/jobs/:id/edit",
        component: () => import("../pages/recruiter/EditJob.vue"),
      },
      {
        path: "/recruiter/jobs/:id/applicants",
        component: () => import("../pages/recruiter/Applicants.vue"),
      },
      {
        path: "/recruiter/jobs/:jobId/applicants/:applicationId",
        name: "recruiter-applicant-detail",
        component: () => import("../pages/recruiter/ApplicantDetail.vue"),
        meta: { requiresAuth: true, role: "recruiter" },
      },
    ],
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
    return auth.role === "recruiter" ? "/recruiter" : "/jobposts";
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