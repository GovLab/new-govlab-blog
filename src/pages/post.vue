<script>
import { ref } from 'vue'
import { Directus } from "@directus/sdk";

export default {
  name: "SubMenu",
  props: {
    blogslug: String,
    name: String,
  },

    data() {
      return {
        directus: new Directus("https://directus9-dev.thegovlab.com/"),
        blogslug: this.$route.params.name,
        blogPost:[]
      }
    },
     mounted() {
    this.d9blogpost = this.directus.items("blog");
    this.loadPost();
  },
    methods: 
  {
    loadPost()
    {
       this.d9blogpost
      .readByQuery({
        filter: { slug: { _eq: this.blogslug } }
      })
      .then((bpost) => {
        this.blogPost = bpost.data[0];
       
      });
    }
  }
}


const count = ref(0)
</script>

<template>

  <h1>{{ blogPost.title }}</h1>

  <div class="card">
    <div v-html="blogPost.content">
      </div>

  </div>

  
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
