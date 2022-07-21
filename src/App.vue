<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { ref } from "vue";
import { Directus } from "@directus/sdk";
import index from './pages/index.vue'
import post from './pages/post.vue'

    let blogslug=window.location.href.split('/');
    blogslug = blogslug[blogslug.length - 1];
    blogslug= blogslug.split('?')[0];
    blogslug= blogslug.split('#')[0];
    console.log(blogslug.length);

</script>

<template>

  <component :is="blogslug=='' ? index : post"  :blogslug="blogslug"/>

</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
