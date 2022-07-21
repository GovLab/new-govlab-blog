<script>
import { ref } from "vue";
import { Directus } from "@directus/sdk";


export default {
  
  data() {
    return {
      listHP: [],
      directus: new Directus("https://directus9-dev.thegovlab.com/"),
      d9blog: '',
      slug: ''
    };
  },

  mounted() {
    this.d9blog = this.directus.items("blog");
    this.searchD9();
    // this.d9blog
    //   .readByQuery({
    //     limit: 10,
    //     sort:"-created_on",
    //   })
    //   .then((b) => {
    //     this.listHP = b.data;
    //   });
  },
  methods: 
  {
    searchD9()
    {
       this.d9blog
      .readByQuery({
        limit: -1,
        search:"spirit",
        sort:"-created_on",
      })
      .then((b) => {
       this.listHP = b.data;
      });
    }
  }
};
</script>

<template>
  

{{listHP.length}}
  <div v-for="result in listHP">
        <div class="text-col full-width">
   
        <a class="post-title" :href="'post/'+result.slug" target='_blank'>
          <h3 v-html="result.title"></h3></a>
          <div class="post-date">
            
            <i>
              <h4 v-if="result.original_date" v-html="result.original_date"></h4>
              <h4 v-if="!result.original_date" v-html="result.created_on"></h4>

            </i>
          </div>

          <div class="post-content" v-html="result.excerpt"></div>
          <div class="more-button main-color">
            <a class="b-button" :href="'post/'+result.slug" target="_blank"> Continue Reading <i
                class="material-icons"></i></a>
          </div>

          </div>
      
    <hr />
  </div>

</template>

