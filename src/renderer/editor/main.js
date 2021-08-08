import Vue from 'vue'

import App from './App'
import Unicon from 'vue-unicons/dist/vue-unicons-vue2.umd'
import { uniMultiply, uniMinus, uniPlus } from 'vue-unicons/dist/icons'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

Unicon.add([uniMultiply, uniMinus, uniPlus])
Vue.use(Unicon, {
  height: 17,
  width: 17
})
/* eslint-disable no-new */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')
