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
    component: () => import("../pages/auth/login.vue"),
  },
  {
    path: "/jobposts",
    component: () => import("../pages/Jobposts.vue"),
  },
  {
    path: "/jobposts/:id",
    name: "JobDetail",
    component: () => import("../pages/JobDetailView.vue"), // Sesuaikan path-nya
    props: true, // Mengizinkan ID dari URL masuk sebagai props ke komponen
    meta: { public: true }, // Accessible tanpa login
  },
  {
    path: "/categories",
    name: "categories",
    component: () => import("../pages/Categories.vue"),
    meta: { public: true },
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
    component: () => import("../pages/profile/UserProfile.vue"),
  },
  {
    path: "/recruiters/:id",
    name: "public-recruiter-profile",
    component: () => import("../pages/public/RecruiterProfile.vue"),
  },
  {
    path: "/forgot-password",
    component: () => import("@/pages/auth/ForgotPassword.vue"),
  },
  {
    path: "/reset-password",
    component: () => import("@/pages/auth/ResetPassword.vue"),
  },
  {
    path: "/change-password",
    component: () => import("@/pages/profile/ChangePassword.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/verify-email",
    component: () => import("@/pages/auth/VerifyEmail.vue"),
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
        path: "jobs/:id/edit",
        component: () => import("../pages/recruiter/EditJob.vue"),
      },
      {
        path: "jobs/:id/applicants",
        component: () => import("../pages/recruiter/Applicants.vue"),
      },
      {
        path: "jobs/:jobId/applicants/:applicationId",
        name: "recruiter-applicant-detail",
        component: () => import("../pages/recruiter/ApplicantDetail.vue"),
        meta: { requiresAuth: true, role: "recruiter" },
      },
      {
        path: "profile/edit",
        meta: { requiresAuth: true },
        component: () => import("../pages/recruiter/EditProfile.vue"),
      },
      {
        path: "jobs/archived",
        name: "recruiter-jobs-archived",
        component: () => import("@/pages/recruiter/Jobs.vue"),
        meta: { requiresAuth: true, role: "recruiter" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: 'smooth' };
    }
  },
})


router.beforeEach((to) => {
  const auth = useAuthStore();

  // 🚫 GUEST ONLY (login/register)
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return auth.role === "recruiter" ? "/recruiter/jobs" : "/jobposts";
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