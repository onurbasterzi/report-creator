import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projects'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/HomeView.vue')
      },
      {
        path: 'project',
        name: 'ProjectDashboard',
        component: () => import('../views/ProjectDashboard.vue')
      },
      {
        path: 'timeline',
        name: 'Timeline',
        component: () => import('../views/TimelineView.vue')
      },
      {
        path: 'entries',
        name: 'Tasks',
        component: () => import('../views/EntriesView.vue')
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('../views/ReportsView.vue')
      },
      {
        path: 'reports/:id',
        name: 'ReportDetail',
        component: () => import('../views/ReportDetailView.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/SettingsView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.token) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router