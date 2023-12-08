<script>
import { ref } from "vue";
import { Directus } from "@directus/sdk";
import dayjs from "dayjs/esm/index.js";
import utc from "dayjs/esm/plugin/utc/index.js";
import timezone from "dayjs/esm/plugin/timezone/index.js";
import localizedFormat from "dayjs/esm/plugin/localizedFormat/index.js";
import { useHead } from "@vueuse/head";

export default {
  data() {
    return {
      listHP: [],
      fposts: [],
      searchObj: [],
      d9Page: 1,
      filterCount: 0,
      directus: new Directus("https://content.thegovlab.com/"),
      d9blog: "",
      d9RdBlog: "",
      slug: "",
      searchTerm: "",
      searchactive: false,
      loadAPI: false,
    };
  },

  mounted() {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.extend(localizedFormat);

    this.d9blog = this.directus.items("blog");
    this.d9RdBlog = this.directus.items("reboot_democracy_blog");
    this.d9archive = this.directus.items("tg_archive");
    this.loadBlog();
    this.fillMeta();
  },
  methods: {
    fillMeta() {
      useHead({
        title: "The GovLab Blog",
        meta: [
          { property: "og:title", content: "The GovLab Blog" },
          {
            property: "og:description",
            content:
              "Deepening Our Understanding of How to Govern More Effectively and Legitimately Through Technology.",
          },
          {
            property: "og:image",
            content:
              "https://raw.githubusercontent.com/GovLab/new-govlab-blog/master/img/govlab-sm.png",
          },
          { property: "og:url", content: "https://blog.thegovlab.org/" },
          { property: "twitter:title", content: "THE GOVLAB BLOG" },
          {
            property: "twitter:description",
            content:
              "Deepening Our Understanding of How to Govern More Effectively and Legitimately Through Technology.",
          },
          {
            property: "twitter:image",
            content:
              "https://raw.githubusercontent.com/GovLab/new-govlab-blog/master/img/govlab-sm.png",
          },
          { property: "twitter:card", content: "summary_large_image" },
        ],
      });
    },
    removeHtml(myHTML) {
      if (myHTML) return myHTML.replace(/<[^>]+>/g, "");
    },
    async serachObjectFunc(collection) {
      // let searchTArray = this.searchTerm.split(" ");
      let searchTArray = [this.searchTerm]
      searchTArray = searchTArray.filter((item) => item); // filter out empty entries
      this.searchObj = [];

      searchTArray.map((a) => {
        this.searchObj.push({ excerpt: { _contains: a } });
        this.searchObj.push({ title: { _contains: a } });
        this.searchObj.push({ content: { _contains: a } });
        this.searchObj.push({ slug: { _contains: a } });

        // additional search fields for Thegovlab Blog
        if (collection == "blog") {
          this.searchObj.push({
            authors: { team_id: { name: { _contains: a } } },
          });
          this.searchObj.push({
            authors: { team_id: { title: { _contains: a } } },
          });
        } else if (collection == "reboot_democracy_blog") {
          // additional search fields for RebootDemocracy Blog
          this.searchObj.push({
            authors: { team_id: { Last_Name: { _contains: a } } },
          });
          this.searchObj.push({
            authors: { team_id: { First_Name: { _contains: a } } },
          });
          this.searchObj.push({
            authors: { team_id: { Title: { _contains: a } } },
          });
        }
      });
    },
    async loadBlog() {
      // init the API load
      this.loadAPI = true;
      this.filterCount = 0;
      this.searchTerm != ""
        ? (this.searchactive = true)
        : (this.searchactive = false);

      await this.serachObjectFunc(this.d9blog.collection);
      console.log("Searchobj: ", this.searchObj);
      var dataTheGovlabBlog = await this.d9blog.readByQuery({
        filter: {
          _and: [
            {
              status: {
                _eq: "published",
              },
            },
          ],
          _or: this.searchObj,
        },
        limit: this.searchactive ? -1 : 12,
        page: this.searchactive ? 1 : this.d9Page,
        sort: "-publication_date",
        fields: ["*.*,authors.team_id.*"],
        meta: "*",
      });

      await this.serachObjectFunc(this.d9RdBlog.collection);
      console.log("Searchobj: ", this.searchObj);
      var dataRebootDemocracyBlog = await this.d9RdBlog.readByQuery({
        filter: {
          _and: [
            {
              status: {
                _eq: "published",
              },
            },
          ],
          _or: this.searchObj,
        },
        limit: this.searchactive ? -1 : 12,
        page: this.searchactive ? 1 : this.d9Page,
        sort: "-date",
        fields: ["*.*,authors.team_id.*"],
        meta: "*",
      });
      this.filterCount =
        dataTheGovlabBlog.meta.filter_count +
        dataRebootDemocracyBlog.meta.filter_count;

      let tempListHP = dataTheGovlabBlog.data.concat(
        dataRebootDemocracyBlog.data
      );
      this.listHP = this.listHP.concat(tempListHP);

      this.listHP = this.listHP.map((item) => {
        let normalizedDate = item.date || item.publication_date;
        if (item.date) {
          item.src = "rdblog";
        }
        return { ...item, normalizedDate };
      });

      // Sort the array by the normalized date in descending order
      this.listHP.sort(
        (a, b) => new Date(b.normalizedDate) - new Date(a.normalizedDate)
      );

      const seenSlugs = new Set();
      this.listHP = this.listHP.filter(item => {
    if (seenSlugs.has(item.slug)) {
        // If it's a duplicate, only add if it's an 'rdblog' item and the duplicate wasn't
        return item.src === 'rdblog' && !this.listHP.find(x => x.slug === item.slug && x.src === 'rdblog');
    } else {
        // If it's not a duplicate, add it and mark the slug as seen
        seenSlugs.add(item.slug);
        return true;
    }
});

      

      this.fposts = this.fposts.concat(
        this.listHP.filter(
          (a) =>
            (a.featured || a.src=="rdblog") &&
            // (a.featured) &&
            (a.publication_date <= this.currentDateTime() ||
              a.date <= this.currentDateTime())
        )
      );
      this.fillMeta();
      this.searchactive ? this.searchArchive() : (this.loadAPI = false);
    },
    searchArchive() {
      let searchObjArchive = this.searchObj.filter((obj) => {
        let keys = Object.keys(obj);
        if (keys[0] !== "excerpt" && keys[0] !== "authors") {
          console.log(keys[0]);
          return obj;
        }
      });

      this.d9archive
        .readByQuery({
          filter: {
            _and: [
              {
                status: {
                  _eq: "published",
                },
              },
            ],
            _or: searchObjArchive,
          },
          limit: -1,
          sort: "-created_on",
          fields: ["*.*"],
          meta: "*",
        })
        .then((data) => {
          this.listHP = this.listHP.concat(data.data);
          this.filterCount += data.meta.filter_count;
          this.loadAPI = false;
        });
    },
    resetSearch() {
      (this.listHP = []), (this.d9Page = 1);
      this.searchactive = false;
      this.loadBlog();
    },
    currentDateTime() {
      return dayjs().tz("America/Toronto").format("YYYY-MM-DDTHH:mm:ss");
    },
    dateShow(date) {
      return dayjs(date).format("LL");
    },
    toggleMenu() {
      var x = document.getElementById("myLinks");
      if (x.style.display === "block") {
        x.style.display = "none";
      } else {
        x.style.display = "block";
      }
    },
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
      <a class="top_logo" href="#"
        ><img src="/the-govlab-logo-white@4x.png" alt="The GovLab Blog"
      /></a>
      <!-- Navigation links (hidden by default) -->
      <div class="lang-select">
        <div class="search-bar-section">
          <input
            class="search-bar"
            v-model="searchTerm"
            @keyup.enter="resetSearch()"
            type="text"
            placeholder="SEARCH"
          />
          <span
            type="submit"
            class="search-bar-btn material-icons"
            @click="
              searchTerm = '';
              resetSearch();
            "
            >close</span
          >
        </div>
      </div>
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
    <div id="app" v-cloak class="main-body">
      <div class="hero">
        <img
          style="padding-top: 20px"
          src="../assets/the-govlab-logo-white-wp.png"
        />
        <!-- <img
          style="padding-top: 20px"
          v-if="!searchactive"
          src="../assets/govlab-logo-wp.png"
        />  -->
        <div v-if="loadAPI" class="pulsating-circle"></div>
        <h2>THE GOVLAB BLOG</h2>
      </div>
      <!-- <div class="search-section" >
      <h3>Explore our knowledge base</h3>

  
    </div> -->

      <div class="b-events">
        <div class="page-wrapper">
          <div v-show="!searchactive">
            <!-- <h2 class="section-title">FEATURED POSTS</h2> -->
            <div class="blog-col">
              <div
                v-for="(fpost, index) in fposts"
                class="blog-col-item"
                v-show="index < 3"
              >
                <div>
                  
                  <a
                  :href="
                    fpost.src && fpost.src == 'rdblog'
                      ? 'https://rebootdemocracy.ai/blog/' + fpost.slug
                      : './' + fpost.slug
                  "
                >
                    <div
                      class="img-col"
                      v-if="fpost.image"
                      :style="{
                        backgroundImage:
                          'url(' +
                          directus._url +
                          'assets/' +
                          fpost.image.id +
                          ')',
                      }"
                    ></div>

                    <div class="text-col">
                      <a class="post-title" :href="'./' + fpost.slug">
                        <h2 v-html="fpost.title"></h2>
                      </a>
                      <div class="post-author">
                        <!-- <p>By <span v-for="(author,index) in fpost.authors">
                     
                      <span v-if="index != fpost.authors.length-1">{{author.team_id.name}},&nbsp</span>
                      <span v-if="index == fpost.authors.length-1">{{author.team_id.name}}</span>
                    </span></p> -->
                      </div>
                      <div class="post-date">
                        <h4>
                          <i v-html="dateShow(fpost.publication_date)"></i>
                          <!-- <i
                        v-if="!fpost.scheduled"
                        v-html="dateShow(fpost.original_date)"
                      ></i> -->
                        </h4>
                      </div>
                      <div class="post-content" v-html="fpost.excerpt"></div>
                      <div class="more-button main-color">
                        <a
                    v-if="!fpost.src"
                    class="b-button"
                    :href="'./' + fpost.slug"
                    target="_blank"
                  >
                    Read Full Article</a
                  >
                  <a
                    v-if="fpost.src == 'rdblog'"
                    class="b-button"
                    :href="'https://rebootdemocracy.ai/blog/' + fpost.slug"
                    target="_blank"
                  >
                    Read Full Article on RebootDemocracy.AI</a
                  >
                      </div>
                    </div>
                  </a>
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
          </div>
          <h2 v-show="searchactive" class="section-title">
            {{ !loadAPI ? filterCount : "" }} Search Results
          </h2>
          <h2 v-show="!searchactive" class="section-title">LATEST POSTS</h2>

          <div class="blog-col">
            <h4 style="margin: auto" v-show="listHP.length <= 0 && !loadAPI">
              NO RESULT FOUND
            </h4>
            <!-- <div
              v-for="(post, index2) in listHP"
              v-show="post.status =='published' && post.scheduled <= currentDateTime()"
              
              class="blog-col-item"
              
            > -->
            <div
              v-for="(post, index2) in listHP"
              v-show="
                post.status == 'published' &&
                (post.publication_date <= currentDateTime() ||
                  post.date <= currentDateTime())
              "
              class="blog-col-item all-posts"
            >
              <div
                class="img-col"
                v-if="post.image"
                :style="{
                  backgroundImage:
                    'url(' + directus._url + 'assets/' + post.image.id + ')',
                }"
              ></div>
              <div class="img-col default-img" v-if="!post.image"></div>

              <div class="text-col">
                <a
                  class="post-title"
                  :href="
                    post.src && post.src == 'rdblog'
                      ? 'https://rebootdemocracy.ai/blog/' + post.slug
                      : './' + post.slug
                  "
                >
                  <h3 v-html="post.title"></h3>
                </a>
                <!-- <div class="post-author" v-show="post.authors && post.authors.length>0">
                    <p>By <span v-for="(author,index) in post.authors"><span v-if="index != post.authors.length-1 && author.team_id != null && author.team_id != 0">{{author.team_id.name}},&nbsp</span><span v-if="index == post.authors.length-1 && author.team_id != null && author.team_id != 0">{{author.team_id.name}}</span></span></p>
                  </div> -->
                <div class="post-date">
                  <!-- <p class="material-icons">insert_invitation</p> -->
                  <h4>
                    <i
                      v-if="
                        post.publication_date &&
                        post.publication_date != '2020-08-21T11:33:07'
                      "
                      v-html="post.date?dateShow(post.date):dateShow(post.publication_date)"
                    ></i>
                    <i
                      v-if="
                        !post.publication_date ||
                        post.publication_date == '2020-08-21T11:33:07'
                      "
                      v-html="post.date?dateShow(post.date):dateShow(post.original_date)"
                      
                    ></i>
                  </h4>
                </div>
                <div class="post-content">
                  <p v-html="post.excerpt"></p>
                </div>
                <div class="more-button main-color">
                  <a
                    v-if="!post.src"
                    class="b-button"
                    :href="'./' + post.slug"
                    target="_blank"
                  >
                    Read Full Article</a
                  >
                  <a
                    v-if="post.src == 'rdblog'"
                    class="b-button"
                    :href="'https://rebootdemocracy.ai/blog/' + post.slug"
                    target="_blank"
                  >
                    Read Full Article on RebootDemocracy.AI</a
                  >
                </div>
              </div>
            </div>
          </div>
          <div
            class="more-results"
            v-show="
              filterCount > 10 && filterCount > d9Page * 10 && !searchactive
            "
          >
            <div v-if="loadAPI" class="pulsating-circle"></div>
            <div class="more-button main-color">
              <a
                @click="
                  d9Page++;
                  loadBlog();
                "
                target="_blank"
                class="b-button"
                >SEE MORE RESULTS</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <footer class="b-footer">
    <div class="e-wrap">
      <div class="e-content m-sections">
        <h4>Sections</h4>
        <a href="https://www.thegovlab.org/">Home</a>
        <a href="https://www.thegovlab.org/about.html">About</a>
        <a href="https://www.thegovlab.org/projects.html">Projects</a>
        <!-- <a href="https://www.thegovlab.org/events.html">Events</a> -->
        <a href="https://www.thegovlab.org/events.html">Events</a>
        <a href="https://www.thegovlab.org/publications.html">Publications</a>
        <a href="https://www.thegovlab.org/team.html">Team</a>
        <a href="https://www.thegovlab.org/global-advisory-council.html"
          >Advisory Council</a
        >
        <a href="https://www.thegovlab.org/our-transparency.html"
          >Our Transparency</a
        >
        <a href="https://www.thegovlab.org/job-board.html">Job Board</a>
        <a href="https://www.thegovlab.org/contact.html">Contact</a>
        <a href="https://www.thegovlab.org/brand.html">Brand Assets</a>
      </div>
      <div class="e-content"></div>
      <div class="e-content">
        <h4>Affiliated With</h4>
        <a
          class="e-partner-logo burnes-logo"
          href="http://northeastern.edu"
          target="_blank"
          ><img src="/NU_Wordmark_Wv.png" alt="Northeastern University"
        /></a>
      </div>
    </div>
  </footer>
</template>

