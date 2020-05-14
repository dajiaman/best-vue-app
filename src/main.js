import Vue from 'vue'

import App from './App.vue'

import router from './router'
import store from './store'

import Element from 'element-ui'
import "@scss/base.scss"
import 'element-ui/lib/theme-chalk/index.css';

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App),
  // mounted: () => document.dispatchEvent(new Event("x-app-rendered")),
  // 预渲染开启
  // mounted() {
  //   document.dispatchEvent(new Event("render-event"));
  // }
}).$mount('#app')



Vue.use(Element);

import { createAxiosInstance } from '@/utils/http';

Vue.prototype.$http = createAxiosInstance();

// 路由守卫
import './permission.js'

// mock
// WARNING: `mockjs` NOT SUPPORT `IE` PLEASE DO NOT USE IN `production` ENV.
if(process.env.NODE_ENV === 'development'){
  require('./mock');
}
