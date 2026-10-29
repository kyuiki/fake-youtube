import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

const Watch = () => import('./views/Watch.vue')

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
