<script>
import { ref } from 'vue'
import { Directus } from "@directus/sdk";
import dayjs from "dayjs/esm/index.js";
import utc from 'dayjs/esm/plugin/utc/index.js'
import timezone from 'dayjs/esm/plugin/timezone/index.js'
import localizedFormat from 'dayjs/esm/plugin/localizedFormat/index.js'

export default {
  name: "SubMenu",
  props: {
    blogslug: String,
    name: String,
  },

    data() {
      return {
        directus: new Directus("https://directus9.thegovlab.com/"),
        blogslug: this.$route.params.name,
        blogPost:[]
      }
    },
     mounted() {
      dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(localizedFormat)

    this.d9blogpost = this.directus.items("blog");
    this.loadPost();
  },
    methods: 
  {
    loadPost()
    {
       this.d9blogpost
      .readByQuery({
        filter: { slug: { _eq: this.blogslug } },
        fields: ["*.*,authors.team_id.*,related_posts.incoming_blog_id.*,related_projects.projects_id.*,related_publications.pub_id.*"],
      })
      .then((bpost) => {
        console.log(bpost)
        this.blogPost = bpost.data[0];
      });
    },
    formatDate(date) {
  return dayjs(date).format('DD MMMM YYYY');
},
toggleMenu()
{
  
    var x = document.getElementById("myLinks");
    if (x.style.display === "block") {
      x.style.display = "none";
    } else {
      x.style.display = "block";
    }
}
  }
}


const count = ref(0)
</script>

<template>

  <!-- <h1>{{ blogPost.title }}</h1>

  <div class="card">
    <div v-html="blogPost.content">
      </div>

  </div> -->

  <div class="topnav">
    <div class="menu-bars">
      <div class="bar-wrap">
        <a href="javascript:void(0);" class="icon" @click="toggleMenu()">
          <i class="fa fa-bars"></i>
        </a>
      </div>
    </div>
    <a class="top_logo" href="/"><img src="/the-govlab-logo-white@4x.png"
      ></a>
    <!-- Navigation links (hidden by default) -->
    <div class='lang-select'>

    </div>
  </div>
  <div id="myLinks" @click="toggleMenu()">
    <div class="menu-items">
      <div class="menu-sub"><a href="../index.html">Home</a></div>
      <div class="menu-sub"><a href="https://thegovlab.com/about.html">About</a></div>
      <div class="menu-sub"><a href="https://thegovlab.org/projects.html">Projects</a></div>
      <div class="menu-sub"><a href="https://www.thegovlab.org/events.html">Events</a></div>
      <div class="menu-sub"><a href="https://www.thegovlab.org/publications.html">Publications</a></div>
      <div class="menu-sub"><a href="https://www.thegovlab.org/team.html">Team</a></div>
      <div class="menu-sub"><a href="https://www.thegovlab.org/global-advisory-council.html">Global Advisory Council</a></div>
      <div class="menu-sub"><a href="https://thegovlab.org/our-transparency.html">Our Transparency</a></div>
      <div class="menu-sub"><a href="https://www.thegovlab.org/job-board.html">Job Board</a></div>
      <div class="menu-sub"><a href="https://www.thegovlab.org/contact.html">Contact</a></div>
    </div>
  </div>
  <div id="blogpage" v-cloak>

    <div class="row top-section" style="background-image: url(/default.jpg);">
      <h1 v-html="blogPost.title"></h1>
      <h4 v-if="blogPost.subtitle && blogPost.subtitle != 'NULL'" v-html="blogPost.subtitle"></h4>
      <!-- <p>Published on: {{blogPost.original_date}}</p> -->
      <p class="date-format" v-if="blogPost.original_date">{{formatDate(blogPost.original_date)}}</p>
      <p class="date-format" v-if="!blogPost.original_date">{{formatDate(blogPost.created_on)}}</p>

    </div>

  </div>
<div >

<!-- 
    <div class="col-wrap">
      <div class="col-100">
        <div class="row-wrap center">
            

          <div class="row-wrap center authors" v-if="blogPost.authors" v-for="member in blogPost.authors">
            
            <div v-if="!member.team_id.picture" class="author-thumb"
              :style="{ backgroundImage: 'url(' + member.team_id.picture_blog2020+ ')' }"></div>
              <div v-if="member.team_id.picture" class="author-thumb"
                style="background-image: url('/govlab-logo-wp.png')"></div>

            <a class="author-name" :href="'http://www.thegovlab.org/team.html#' + member.team_id.slug"
              target="_blank">{{member.team_id.name}}<br><span v-if="member.team_id.title" class="author-title">{{member.team_id.title}}</span></a>
          </div>
        </div>

        <div class="row-wrap center authors" v-if="blogPost.authors[0] != null" v-for="member in blogPost.authors">   
         <span v-if="member.team_id != null"> {{member.team_id}}</span>>
            <div v-if="member.team_id != null" class="author-thumb"
              :style="{ backgroundImage: 'url(' + member.team_id.picture.data.thumbnails[3].url+ ')' }"></div>
                 <div v-if="member.team_id != null" class="author-thumb"
                style="background-image: url('https://directus.thegovlab.com/uploads/thegovlab/originals/de2f39cc-a1f3-4ff9-b6eb-06b64d18b759.png')"></div> 

            <a v-if="member.team_id != null" class="author-name" :href="'http://www.thegovlab.org/team.html#' + member.team_id.slug"
              target="_blank">{{member.team_id.name}}<br><span  class="author-title">{{member.team_id.title}}</span></a>
          </div>
        </div>
        <div v-if="blogPost.image"  class="featured-image">
          <img v-bind:src="blogPost.image">
        </div>
        <div v-if="!blogPost.image && blogPost.image_blog2020"  class="featured-image">
          <img v-bind:src="blogPost.image_blog2020">
        </div>
        <div class="blog-text" v-html="blogPost.content">
        </div>
        <div class="related-stories column-wrap" v-show="blogPost.related_posts && blogPost.related_posts.length>0" >
          <p>RELATED STORIES</p>
          
          <a class="related-items" v-for="member in blogPost.related_posts"
            :href="'https://blog.thegovlab.org/post/' + member.incoming_blog_id.slug"
            target="_blank"><span id="underline" v-html="member.incoming_blog_id.title"></span></a>
        </div>
      </div>



    </div>
  </div>  -->

  <div v-if="blogPost.related_publications || blogPost.related_projects">
    <div class="row-wrap">
      <div class="col-20">
        <div class="sidebar column-wrap">
          <div v-show="blogPost.related_projects.length>0">
          <p>RELATED PROJECTS</p>
          <div class="sidebar-wrap"  v-for="project in blogPost.related_projects">
            
            <div class="related-project-text">

            <a :href="'http://www.thegovlab.org/' + project.projects_id.slug" target="_blank">{{project.projects_id.name}}</a>
            </div>
          </div>
          </div>
          <br>
          <div v-show="blogPost.related_publications.length >0 ">
          <p>RELATED PUBLICATIONS</p>
          <div class="sidebar-wrap" v-for="member in blogPost.related_publications">

            <div class="related-project-text">
            <a :href="member.pub_id.url" target="_blank"><b>[REPORT]</b> {{member.pub_id.title}}</a>
            </div>
          </div>
        </div>
        </div>

      </div>

      <div class="col-80">
        <div class="row-wrap left-pad">
          <div class="row-wrap center authors" v-if="blogPost.authors.length>0" v-for="member in blogPost.authors">
     
            
            <div v-if="!member.team_id.picture" class="author-thumb"
              :style="{ backgroundImage: 'url(' + member.team_id.picture_blog2020+ ')' }"></div>
              <div v-if="member.team_id.picture" class="author-thumb"
                style="background-image: url('/govlab-logo-wp.png')"></div>

            <a class="author-name" :href="'http://www.thegovlab.org/team.html#' + member.team_id.slug"
              target="_blank">{{member.team_id.name}}<br><span v-if="member.team_id.title && member.team_id.title!= 'NULL'" class="author-title">{{member.team_id.title}}</span></a>
          </div>
        </div>

        <div v-if="blogPost.image"  class="featured-image">
          <img v-bind:src="blogPost.image">
        </div>
        <div v-if="!blogPost.image && blogPost.image_blog2020"  class="featured-image">
          <img v-bind:src="blogPost.image_blog2020">
        </div>
        <div class="blog-text" v-html="blogPost.content">
        </div>
      </div>

    </div> 
    
    <div v-show="blogPost.related_posts.length > 0 " class="related-stories column-wrap">
      <p>RELATED STORIES</p>
      <a class="related-items" v-for="member in blogPost.related_posts"
        :href="'https://blog.thegovlab.org/' + member.incoming_blog_id.slug"
        target="_blank"><span id="underline">{{member.incoming_blog_id.title}}.</span></a>
    </div>
  </div>
  </div>
  <footer class='b-footer'>
    <div class="e-wrap">
        <div class="e-content m-sections">
            <h4>Sections</h4>
            <a href="https://www.thegovlab.org/">Home</a>
            <a href="https://www.thegovlab.org/about.html">About</a>
            <a href="https://www.thegovlab.org/projects.html">Projects</a>
            <!-- <a href="https://www.thegovlab.org/events.html">Events</a> -->
            <a href="https://www.thegovlab.org/events.html" >Events</a>
            <a href="https://www.thegovlab.org/publications.html">Publications</a>
            <a href="https://www.thegovlab.org/team.html">Team</a>
            <a href="https://www.thegovlab.org/global-advisory-council.html">Advisory Council</a>
            <a href="https://www.thegovlab.org/our-transparency.html">Our Transparency</a>
            <a href="https://www.thegovlab.org/job-board.html">Job Board</a>
            <a href="https://www.thegovlab.org/contact.html">Contact</a>
            <a href="https://www.thegovlab.org/brand.html">Brand Assets</a>
        </div>
        <div class="e-content">
            <!-- <h4>Lead Supporters</h4>
            <a class="e-partner-logo" href="https://www.macfound.org/" target="_blank"><img src="static/img/partners/macarthur-logo-white.png" alt="MacArthur Foundation"></a>
            <a class="e-partner-logo m-omidyar" href="https://www.omidyar.com/" tagret="_blank"><img src="static/img/partners/omidyar-logo-white.svg" alt="Omidyar Network"></a> -->
        </div>
        <div class="e-content">
          <h4>Affiliated With</h4>
          <a class="e-partner-logo burnes-logo" href="http://northeastern.edu" target="_blank"><img src="/NU_Wordmark_Wv.png" alt="Northeastern University"></a>
        </div>
    </div>
</footer>

<div class="b-copyright">
    <div class="e-wrap">
        <a class="e-cc-badge" rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a>
        This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a><br><br>
    </div>
</div>

  
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
