import Vue from 'vue'
import App from './App.vue'
import router from './router'
import global from '../utils/global'

import { defineCustomElements as defineIonPhaser } from '@ion-phaser/core/loader';

Vue.config.productionTip = false

Vue.prototype.$global = global

Vue.config.ignoredElements = [/^ion-/];
defineIonPhaser(window);
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
