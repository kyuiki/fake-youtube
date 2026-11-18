import { createApp, defineAsyncComponent, h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// ?q=v2 renders youtube's newer layout, cloned from the classic one; ?q=v3 is the same with comments open
const views = {
  classic: defineAsyncComponent(() => import('./views/Watch.vue')),
  v2: defineAsyncComponent(() => import('./views/WatchV2.vue')),
}
const Watch = p => {
  const q = router.currentRoute.value.query.q
  return q === 'v2' || q === 'v3' ? h(views.v2, { ...p, open: q === 'v3' }) : h(views.classic, p)
}
Watch.props = ['id', 'preview']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/Youitu.vue') },
    { path: '/actual', component: () => import('./views/Home.vue') },
    { path: '/builder', component: () => import('./views/Builder.vue') },
    { path: '/watch', component: Watch, props: r => ({ id: r.query.v }) },
    { path: '/preview', component: Watch, props: { preview: true } },
    { path: '/:id', component: Watch, props: true },
  ],
})

createApp(App).use(router).mount('#app')
