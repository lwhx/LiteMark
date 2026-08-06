import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './pages/HomePageV2.vue';
import AdminLayout from './layouts/AdminLayout.vue';
import AdminLogin from './pages/admin/Login.vue';
import AdminOverview from './pages/admin/Overview.vue';
import AdminBookmarks from './pages/admin/Bookmarks.vue';
import AdminCategories from './pages/admin/Categories.vue';
import AdminBackup from './pages/admin/Backup.vue';
import AdminSettings from './pages/admin/Settings.vue';
import AdminAccount from './pages/admin/Account.vue';
import AdminAbout from './pages/admin/About.vue';
import AdminAI from './pages/admin/AI.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    {
      path: '/admin',
      component: AdminLayout,
      redirect: '/admin/overview',
      meta: { requiresAuth: true },
      children: [
        { path: 'overview', name: 'admin-overview', component: AdminOverview },
        { path: 'bookmarks', name: 'admin-bookmarks', component: AdminBookmarks },
        { path: 'categories', name: 'admin-categories', component: AdminCategories },
        { path: 'backup', name: 'admin-backup', component: AdminBackup },
        { path: 'ai', name: 'admin-ai', component: AdminAI },
        { path: 'settings', name: 'admin-settings', component: AdminSettings },
        { path: 'account', name: 'admin-account', component: AdminAccount },
        { path: 'about', name: 'admin-about', component: AdminAbout }
      ]
    },
    { path: '/admin/login', name: 'admin-login', component: AdminLogin }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

function clearStoredSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('bookmark_token');
  window.localStorage.removeItem('bookmark_username');
}

async function hasValidSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const token = window.localStorage.getItem('bookmark_token');
  if (!token) return false;

  const apiBaseRaw =
    (window as { __APP_API_BASE_URL__?: string }).__APP_API_BASE_URL__ ?? '';
  const apiBase = apiBaseRaw.replace(/\/$/, '');

  try {
    const response = await fetch(`${apiBase}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (response.status === 401 || response.status === 403) {
      clearStoredSession();
      return false;
    }

    // 网络或服务端临时异常交给页面内的请求处理，避免误删仍有效的登录状态。
    return response.ok || response.status >= 500;
  } catch {
    return true;
  }
}

// 路由守卫：进入后台及离开登录页前都向服务端校验 token。
router.beforeEach(async (to) => {
  const shouldCheckAuth = Boolean(to.meta.requiresAuth) || to.path === '/admin/login';
  if (!shouldCheckAuth) return true;

  const isAuthenticated = await hasValidSession();
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { path: '/admin/login', query: { redirect: to.fullPath } };
  }
  if (to.path === '/admin/login' && isAuthenticated) {
    return '/admin';
  }
  return true;
});

