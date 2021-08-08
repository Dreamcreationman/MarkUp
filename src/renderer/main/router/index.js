import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/file',
      name: 'File',
      component: require('../views/File').default
    },
    {
      path: '/tag',
      name: 'Tag',
      component: require('../views/Tag').default
    },
    {
      path: '/bin',
      name: 'Bin',
      component: require('../views/Bin').default
    },
    {
      path: '/setting',
      name: 'Setting',
      component: require('../views/Setting').default
    },
    {
      path: '/',
      redirect: '/file'
    }
  ]
})
