import Vue from 'vue'

import App from './App'
import router from './router'
import global from '../store/Global'
import Unicon from 'vue-unicons/dist/vue-unicons-vue2.umd'
import { uniFolder, uniTagAlt, uniTrash, uniSetting, uniMultiply, uniMinus, uniPlus, uniSearch, uniListOl, uniSortAmountDown, uniSync, uniCornerUpLeft } from 'vue-unicons/dist/icons'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

Unicon.add([uniFolder, uniTagAlt, uniTrash, uniSetting, uniMultiply, uniMinus, uniPlus, uniSearch, uniListOl, uniSync, uniSortAmountDown, uniCornerUpLeft])
Vue.use(Unicon)
/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>'
}).$mount('#app')
Vue.prototype.$CONSUMER_KEY = global.CONSUMER_KEY
Vue.prototype.$CONSUMER_SECRET = global.CONSUMER_SECRET
Vue.prototype.$OAUTH_TOKEN = global.OAUTH_TOKEN
Vue.prototype.$OAUTH_TOKEN_SECRET = global.OAUTH_TOKEN_SECRET
Vue.prototype.$OAUTH_VERIFIER = global.OAUTH_VERIFIER
Vue.prototype.$Store = global.store
