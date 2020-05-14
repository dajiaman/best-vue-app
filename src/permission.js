import router from './router'
import { getToken } from '@/utils/auth' // get token from cookie

import { pendingRequest }  from '@/utils/http';

// 路由守卫
router.beforeEach(async (to, from, next) => {


  // 把上个页面还没结束的请求结束掉
  pendingRequest.forEach(item => {
    item.routeChangeCancel && item.cancel()
  });


  if (to.matched.some((record) => record.meta.requiresAuth)) {

    const hasToken = getToken()

    // this route requires auth, check if logged in
    // if not, redirect to login page.
    if (hasToken) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  } else {
    next() // 确保一定要调用 next()
  }
})
