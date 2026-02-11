import { createRouter, createWebHistory } from "vue-router";

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
    path: "/about",
    name: "about",
    component: () => import("../pages/About.vue"),
  },
  {
    path: "/contact",
    name: "contact",
    component: () => import("../pages/Contact.vue"),
  },
  {
    path: "/faq",
    name: "faq",
    component: () => import("../pages/FAQ.vue"),
  },
  {
    path: "/terms-of-service",
    name: "terms-of-service",
    component: () => import("../pages/TermsOfService.vue"),
  },
  {
    path: "/privacy-policy",
    name: "privacy-policy",
    component: () => import("../pages/PrivacyPolicy.vue"),
  },
  {
    path: "/help/apply",
    name: "help-apply",
    component: () => import("../pages/help/ApplyJob.vue"),
  },
  {
    path: "/help/post-job",
    name: "help-post-job",
    component: () => import("../pages/help/PostJob.vue"),
  },
  {
    path: "/help/cv",
    name: "help-cv",
    component: () => import("../pages/help/HelpCv.vue"),
  },
  {
    path: "/help/applications",
    name: "help-applications",
    component: () => import("../pages/help/HelpApplications.vue"),
  },
  {
    path: "/help/search-resumes",
    name: "help-search-resumes",
    component: () => import("../pages/help/HelpSearchResumes.vue"),
  },
  {
    path: "/help/pricing",
    name: "help-pricing",
    component: () => import("../pages/help/HelpPricing.vue"),
  },
  {
    path: "/help/register",
    name: "help-register",
    component: () => import("../pages/help/HelpRegister.vue"),
  },
  {
    path: "/help/reset-password",
    name: "help-reset-password",
    component: () => import("../pages/help/HelpResetPassword.vue"),
  },
  {
    path: "/help/report-issue",
    name: "help-report-issue",
    component: () => import("../pages/help/HelpReportIssue.vue"),
  },
  {
    path: "/workers/:id",
    name: "worker-profile",
    component: () => import("../pages/public/WorkerProfile.vue"),
  },
  {
    path: "/help/supported-browsers",
    name: "help-supported-browsers",
    component: () => import("../pages/help/HelpSupportedBrowsers.vue"),
  },
  {
    path: "/login",
    name: "login",
    meta: { guestOnly: true },
    component: () => import("../pages/auth/login.vue"),
  },
  {
    path: "/recruiter-login",
    name: "recruiter-login",
    meta: { blockRole: "recruiter" },
    component: () => import("../pages/auth/RecruiterLogin.vue"),
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
    path: "/register-recruiter",
    meta: { blockRole: "recruiter" },
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
    path: "/search-workers",
    name: "search-workers",
    component: () => import("../pages/recruiter/SearchWorkers.vue"),
    // meta: { requiresAuth: true, role: "recruiter" },
  },
  {
    path: "/cv-reader-demo",
    name: "cv-reader-demo",
    component: () => import("../pages/CvReaderDemo.vue"),
    meta: { public: true },
  },
  {
    path: "/recruiter",
    meta: { requiresAuth: true, role: "recruiter", blockRole: "user" },
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
      return { top: 0, behavior: "smooth" };
    }
  },
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  // 🚫 GUEST ONLY (login/register)
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return auth.role === "recruiter" ? "/recruiter/jobs" : "/jobposts";
  }

  // 🚫 BLOCK SPECIFIC ROLE - Logout and redirect
  if (to.meta.blockRole && auth.role === to.meta.blockRole) {
    auth.logout();
    return "/login";
  }

  // �� PROTECTED ROUTE
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return "/login";
  }

  // 🧭 ROLE CHECK
  if (to.meta.role && auth.role !== to.meta.role) {
    return "/";
  }

  return true;
});

export default router;
