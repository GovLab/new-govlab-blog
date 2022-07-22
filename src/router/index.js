import { createRouter, createWebHistory } from "vue-router";
// import routes from '~pages';
import List from '../pages/index.vue';
import Post from '../pages/post.vue';
const routes = [
  { path:"/", component: List },
  { path:"/:name", component: Post, props:true },

]

const router = createRouter({
  
  history: createWebHistory(),
  base: './',
  
  routes
})

export default router