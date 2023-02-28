import Vue from 'vue'
import App from './App.vue'
import router from './router'
import global from '../utils/global'

Vue.config.productionTip = false

Vue.prototype.$global = global
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
