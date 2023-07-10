<script>
import { ref } from "vue";
import { Directus } from "@directus/sdk";
import dayjs from "dayjs/esm/index.js";
import utc from 'dayjs/esm/plugin/utc/index.js'
import timezone from 'dayjs/esm/plugin/timezone/index.js'
import localizedFormat from 'dayjs/esm/plugin/localizedFormat/index.js'


export default {
  data() {
    return {
      listHP: [],
      fposts: [],
      d9Page:1,
      directus: new Directus("https://directus9.thegovlab.com/"),
      d9blog: "",
      slug: "",
      
    };
  },

  mounted() {
   
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(localizedFormat)

    this.d9blog = this.directus.items("blog");
    this.loadBlog();
  },
  methods: {
    loadBlog() {
      this.d9blog
        .readByQuery({
          limit: 10,
          page: this.d9Page,
          sort: "-original_date",
          fields: ["*.*,authors.team_id.*"],
        })
        .then((b) => {
          const tempListHP = b.data
          this.listHP =  this.listHP.concat(tempListHP);
          
          this.fposts = this.fposts.concat(
            tempListHP.filter(
            a =>
                a.featured &&
                a.status === "published" &&
                a.scheduled <= this.currentDateTime()
            )
          );
          console.log(this.fposts);
        });
    },
    currentDateTime() {
      return dayjs().tz("America/Toronto").format("YYYY-MM-DDTHH:mm:ss");

    },
    dateShow(date) {
      
      return dayjs(date).format("LL");
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
  },
};
</script>




<template>
  <div class="homepage" onwheel="scroll_dismiss()">
    <div class="topnav">
      <div class="menu-bars">
        <div class="bar-wrap">
          <a href="javascript:void(0);" class="icon" @click="toggleMenu()">
            <i class="fa fa-bars"></i>
          </a>
        </div>
      </div>
      <a class="top_logo" href="index.html"
        ><img src="/the-govlab-logo-white@4x.png" alt="The GovLab Blog"
      /></a>
      <!-- Navigation links (hidden by default) -->
      <div class="lang-select"></div>
    </div>
    <div id="myLinks">
      <div class="menu-items">
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/index.html">Home</a>
        </div>
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/about.html">About</a>
        </div>
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/projects.html">Projects</a>
        </div>
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/events.html">Events</a>
        </div>
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/publications.html">Publications</a>
        </div>
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/team.html">Team</a>
        </div>
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/global-advisory-council.html"
            >Global Advisory Council</a
          >
        </div>
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/our-transparency.html"
            >Our Transparency</a
          >
        </div>
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/job-board.html">Job Board</a>
        </div>
        <div class="menu-sub">
          <a href="https://www.thegovlab.org/contact.html">Contact</a>
        </div>
      </div>
    </div>
    <div id="app" v-cloak>
      <div class="hero">
        <img
          style="padding-top: 20px"
          v-if="!searchactive"
          src="../assets/govlab-logo-wp.png"
        />
        <div v-if="searchactive" class="pulsating-circle"></div>
        <h2>THE GOVLAB BLOG</h2>
      </div>
      <!-- <div class="search-section">
      <h3>Explore our knowledge base</h3>

      <input class="search-bar" v-model="searchTerm" v-on:input="searchAll" id="credit-limit-input" type="text" placeholder="SEARCH HERE">
      <div style="width:200px; position:absolute; margin-left:40%; margin-bottom:5%">

      </div>


      <p class="search-desc">The GovLab’s resources includes results from this blog, The Living Library and the Open
        Governance Research Exchange</p>



    </div> -->
      <!-- <div v-for="result in listHP">
        <div v-if="result.status == 'published'">
          <div class="text-col full-width">
            <a class="post-title" :href="'/' + result.slug">
              <h3 v-html="result.title"></h3
            ></a>
            <div class="post-date">
              <i>
                <h4
                  v-if="result.scheduled > '2020-08-21T11:33:07'"
                  v-html="'Scheduled: ' + result.scheduled"
                ></h4>
                <h4
                  v-if="result.original_date"
                  v-html="'Original: ' + result.original_date"
                ></h4>
              </i>
            </div>

            <div
              class="row-wrap center authors"
              v-for="member in result.authors"
            >

              <div
                v-if="member.team_id != null"
                class="author-thumb"
                :style="{
                  backgroundImage:
                    'url(' +
                    (member.team_id.picture != null
                      ? member.team_id.picture.data.thumbnails[3].url
                      : member.team_id.picture_blog2020) +
                    ')',
                }"
              ></div>
              <div v-if="member.team_id != null" class="author-thumb"
                style="background-image: url('https://directus.thegovlab.com/uploads/thegovlab/originals/de2f39cc-a1f3-4ff9-b6eb-06b64d18b759.png')"></div>

              <a
                v-if="member.team_id != null"
                class="author-name"
                :href="
                  'http://www.thegovlab.org/team.html#' + member.team_id.slug
                "
                target="_blank"
                >{{ member.team_id.name }}<br /><span class="author-title">{{
                  member.team_id.title
                }}</span></a
              >
            </div>
            <img height="200" :src="result.image_blog2020" />
            <div class="post-content" v-html="result.excerpt"></div>
            <div class="more-button main-color">
              <a class="b-button" :href="'/' + result.slug">
                Continue Reading <i class="material-icons"></i
              ></a>
            </div>
          </div>
          <hr />
        </div>
      </div> -->

      <h2 class="section-title">FEATURED POSTS</h2>
      <div class="b-events">
        <div class="page-wrapper">
          <div class="blog-col">
            <div 
            v-for="(fpost, index) in fposts" class="blog-col-item">
              <div>
                <a :href="'./' + fpost.slug">
                  <div
                    class="img-col"
                    v-if="!fpost.image"
                    :style="{
                      backgroundImage: 'url(' + fpost.image_blog2020 + ')',
                    }"
                  ></div>
                  <div
                    class="img-col"
                    v-if="fpost.image"
                    :style="{
                      backgroundImage: 'url(' + directus._url+'assets/'+ fpost.image.id + ')',
                    }"
                  ></div>
                  <!-- <div
                    v-if="post.image == null"
                    class="img-col default-image"
                  ></div> -->
                </a>
                <div class="text-col">
                  <a class="post-title" :href="'./' + fpost.slug">
                    <h3 v-html="fpost.title"></h3>
                  </a>
                  <div class="post-author">
                    <!-- <p>By <span v-for="(author,index) in fpost.authors">
                     
                      <span v-if="index != fpost.authors.length-1">{{author.team_id.name}},&nbsp</span>
                      <span v-if="index == fpost.authors.length-1">{{author.team_id.name}}</span>
                    </span></p> -->
                  </div>
                  <div class="post-date">
                    <h4>
                      <i
                        v-if="fpost.original_date"
                        v-html="dateShow(fpost.original_date)"
                      ></i>
                      <i
                        v-if="!fpost.original_date"
                        v-html="dateShow(fpost.scheduled)"
                      ></i>
                    </h4>
                  </div>
                  <div class="post-content" v-html="fpost.excerpt"></div>
                  <div class="more-button main-color">
                    <a
                      class="b-button"
                      :href="'./' + fpost.slug"
                      target="_blank"
                    >
                      Continue Reading<i class="material-icons"
                        >keyboard_arrow_down</i
                      ></a
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="b-subscribe">
            <div class="e-wrap">
              <div>
                <h4><strong>Subscribe</strong> To The Digest</h4>
                <p>
                  A weekly curation of new findings and developments on
                  innovation in governance
                </p>
              </div>

              <form
                method="post"
                action="//thegovlab.us6.list-manage.com/subscribe/post?u=1a990feb5c&amp;id=d90a01c7ff"
                target="_blank"
              >
                <div style="position: absolute; left: -5000px">
                  <input
                    type="text"
                    name="b_1a990feb5c_d90a01c7ff"
                    tabindex="-1"
                    value=""
                  />
                </div>

                <input type="email" name="EMAIL" placeholder="Email" />
                <button type="submit">Subscribe</button>
              </form>
            </div>
            <div class="e-wrap">
              <p>
                <a
                  href="https://thelivinglib.org/"
                  target="_blank"
                  class="b-button m-naked"
                  >Go to Digest<i class="material-icons">arrow_forward</i></a
                >
              </p>
            </div>
          </div>
          <h2 class="section-title">LATEST POSTS FROM THE GOVLAB</h2>

          <div class="blog-col">
            
            <div
              v-for="(post, index2) in listHP"
              v-show="post.status =='published' && post.scheduled <= currentDateTime()"
              
              class="blog-col-item"
              
            >
            
              <div>
                
                <div class="text-col">
                  <a class="post-title" :href="'./' + post.slug">
                    <h3>{{ post.title }}</h3>
                  </a>
                  <div class="post-author" v-show="post.authors.length>0">
                    <p>By <span v-for="(author,index) in post.authors"><span v-if="index != post.authors.length-1 && author.team_id != null && author.team_id != 0">{{author.team_id.name}},&nbsp</span><span v-if="index == post.authors.length-1 && author.team_id != null && author.team_id != 0">{{author.team_id.name}}</span></span></p>
                  </div>
                  <div class="post-date">
                    <!-- <p class="material-icons">insert_invitation</p> -->
                    <h4>
                      <i
                        v-if="post.original_date"
                        v-html="dateShow(post.original_date)"
                      ></i>
                      <i
                        v-if="!post.original_date"
                        v-html="dateShow(post.scheduled)"
                      ></i>
                    </h4>
                  </div>
                  <div class="post-content" v-html="post.excerpt"></div>
                  <div class="more-button main-color">
                    <a
                      class="b-button"
                      :href="'./' + post.slug"
                      target="_blank"
                    >
                      Continue Reading<i class="material-icons"
                        >keyboard_arrow_down</i
                      ></a
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="more-results">
            <div class="more-button main-color">
              <a @click="d9Page++; loadBlog()" target="_blank" class="b-button"
                >SEE MORE RESULTS</a
              >
            </div>
          </div>
        </div>
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

          </div>
          <div class="e-content">
            <h4>Affiliated With</h4>
            <a class="e-partner-logo burnes-logo" href="http://northeastern.edu" target="_blank"><img src="/NU_Wordmark_Wv.png" alt="Northeastern University"></a>
  
        </div>
      </div>
  </footer>
</template>

