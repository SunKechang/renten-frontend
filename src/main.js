import Vue from 'vue'
import App from './App.vue'
import router from './router'
import global from '../utils/global'

import { defineCustomElements as defineIonPhaser } from '@ion-phaser/core/loader';

Vue.config.productionTip = false

Vue.prototype.$global = global

Vue.config.ignoredElements = [/^ion-/];
defineIonPhaser(window);

router.beforeEach((to, from, next) => {
  if(from.name &&(to.path === '/room/add' || to.path === '/room/join')) {
    localStorage.setItem('last-pong', new Date().getTime())
  }
  // 允许导航继续
  next()
})
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
