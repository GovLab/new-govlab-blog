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
      directus: new Directus("https://directus.theburnescenter.org/"),
      cms: new Directus("https://cms.thegovlab.com/"),
      d9blog: "",
      d9RdBlog: "",
      odpl: "",
      dsblog: "",
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
    this.odpl = this.cms.items("odpl_items");
    this.dsblog = this.cms.items("ds_blogposts");
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
    // Replicates the slug logic the live ODPL / Data Stewards sites use to
    // build their article URLs from a title: lowercase, drop apostrophes /
    // periods / commas, then collapse any other run of non-alphanumerics to a
    // single hyphen.
    slugify(s) {
      return (s || "")
        .toLowerCase()
        .replace(/[.'’,]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    },
    // Normalizes a post from any source into the shape the template expects:
    // adds `src`, `normalizedDate`, `_imageUrl`, `_link`, `_linkLabel` and
    // `_external`. CMS collections (cms.thegovlab.com) also get title/excerpt/
    // slug mapped from their native field names.
    normalizeItem(item, src) {
      const CMS = "https://cms.thegovlab.com/";
      item.normalizedDate = item.date || item.publication_date;
      if (src === "odpl") {
        item.src = "odpl";
        item.title = item.heading;
        item.excerpt = item.tagline || "";
        item.slug =
          item.custom_url ||
          this.slugify((item.brow || "") + " " + (item.heading || ""));
        item._imageUrl = item.cover_image
          ? CMS + "assets/" + item.cover_image
          : null;
        item._link =
          "https://opendatapolicylab.org/articles/" + item.slug + "/";
        item._linkLabel = "Read Full Article on Open Data Policy Lab";
        item._external = true;
      } else if (src === "datastewards") {
        item.src = "datastewards";
        item.title = item.heading;
        item.excerpt = item.description || "";
        item.slug = this.slugify(item.heading || "");
        item._imageUrl = item.image ? CMS + "assets/" + item.image : null;
        item._link = "https://datastewards.net/news/" + item.slug;
        item._linkLabel = "Read Full Article on Data Stewards";
        item._external = true;
      } else if (src === "rdblog") {
        item.src = "rdblog";
        item._imageUrl = item.image
          ? this.directus._url + "assets/" + item.image.id
          : null;
        item._link = "https://rebootdemocracy.ai/blog/" + item.slug;
        item._linkLabel = "Read Full Article on RebootDemocracy.AI";
        item._external = true;
      } else {
        // The GovLab blog itself — rendered in-app via post.vue.
        item._imageUrl = item.image
          ? this.directus._url + "assets/" + item.image.id
          : null;
        item._link = "./" + item.slug;
        item._linkLabel = "Read Full Article";
        item._external = false;
      }
      return item;
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
      this.fposts = []; // Reset featured posts array
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
        limit: this.searchactive ? -1 : 50,
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
        limit: this.searchactive ? -1 : 50,
        page: this.searchactive ? 1 : this.d9Page,
        sort: "-date",
        fields: ["*.*,authors.team_id.*"],
        meta: "*",
      });
      // --- New CMS collections on cms.thegovlab.com: ODPL + Data Stewards ---
      // These are aggregated into the same "latest posts" feed and link out to
      // their own live sites (like the Reboot posts link to rebootdemocracy.ai).
      // Require a non-null date: a handful of these records have date=null,
      // which can't be sorted or displayed (the template hides them), and
      // would otherwise occupy page-1 slots.
      let odplFilter = {
        _and: [{ status: { _eq: "published" } }, { date: { _nnull: true } }],
      };
      let dsFilter = {
        _and: [{ status: { _eq: "published" } }, { date: { _nnull: true } }],
      };
      if (this.searchTerm) {
        odplFilter._or = [
          { heading: { _contains: this.searchTerm } },
          { tagline: { _contains: this.searchTerm } },
          { brow: { _contains: this.searchTerm } },
        ];
        dsFilter._or = [
          { heading: { _contains: this.searchTerm } },
          { description: { _contains: this.searchTerm } },
          { author: { _contains: this.searchTerm } },
        ];
      }

      var dataOdpl = await this.odpl.readByQuery({
        filter: odplFilter,
        limit: this.searchactive ? -1 : 50,
        page: this.searchactive ? 1 : this.d9Page,
        sort: "-date",
        fields: [
          "id",
          "status",
          "heading",
          "brow",
          "tagline",
          "date",
          "slug",
          "custom_url",
          "cover_image",
        ],
        meta: "*",
      });

      var dataDs = await this.dsblog.readByQuery({
        filter: dsFilter,
        limit: this.searchactive ? -1 : 50,
        page: this.searchactive ? 1 : this.d9Page,
        sort: "-date",
        fields: [
          "id",
          "status",
          "heading",
          "description",
          "author",
          "date",
          "slug",
          "image",
        ],
        meta: "*",
      });

      this.filterCount =
        dataTheGovlabBlog.meta.filter_count +
        dataRebootDemocracyBlog.meta.filter_count +
        dataOdpl.meta.filter_count +
        dataDs.meta.filter_count;

      let tempListHP = dataTheGovlabBlog.data
        .map((item) => this.normalizeItem(item, null))
        .concat(
          dataRebootDemocracyBlog.data.map((item) =>
            this.normalizeItem(item, "rdblog")
          )
        )
        .concat(dataOdpl.data.map((item) => this.normalizeItem(item, "odpl")))
        .concat(
          dataDs.data.map((item) => this.normalizeItem(item, "datastewards"))
        );
      this.listHP = this.listHP.concat(tempListHP);

      // Sort the array by the normalized date in descending order.
      // Use Date.parse()||0 so posts with a missing/invalid date (e.g. some
      // Data Stewards records have date=null) yield 0 instead of NaN — a NaN
      // return from the comparator corrupts the whole sort order.
      this.listHP.sort(
        (a, b) =>
          (Date.parse(b.normalizedDate) || 0) -
          (Date.parse(a.normalizedDate) || 0)
      );

      const seenSlugs = new Set();
      this.listHP = this.listHP.filter(item => {
    if (seenSlugs.has(item.slug)) {
        // If it's a duplicate, only add if it's an 'rdblog' item and the duplicate wasn't
        return item.src === 'rdblog' && !this.listHP.find(x => x.slug === item.slug && x.src === 'rdblog' && x.slug == "sam-altman-one-true-leader-and-the-missed-opportunity-for-innovation");
    } else {
        // If it's not a duplicate, add it and mark the slug as seen
        seenSlugs.add(item.slug);
        return true;
    }
});

      

      // Filter and set featured posts (removed date filtering to test)
      console.log("Total posts in listHP:", this.listHP.length);
      console.log("Posts with featured=true:", this.listHP.filter(a => a.featured).length);
      
      this.fposts = this.listHP.filter(a => a.featured);
      
      console.log("Featured posts after filtering:", this.fposts.length);
      console.log("Featured posts data:", this.fposts);
      if (this.fposts.length > 0) {
        console.log("Currently featured post:", this.fposts[0].title);
      }
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
      this.listHP = [];
      this.fposts = [];
      this.d9Page = 1;
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
                  
                  <a :href="fpost._link">
                    <div
                      class="img-col"
                      v-if="fpost._imageUrl"
                      :style="{
                        backgroundImage: 'url(' + fpost._imageUrl + ')',
                      }"
                    ></div>

                    <div class="text-col">
                      <a class="post-title" :href="fpost._link">
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
                          class="b-button"
                          :href="fpost._link"
                          :target="fpost._external ? '_blank' : '_self'"
                          >{{ fpost._linkLabel }}</a
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
            <a
              v-for="(post, index2) in listHP"
              v-show="
                post.status == 'published' &&
                (post.publication_date <= currentDateTime() ||
                  post.date <= currentDateTime())
              "
              class="blog-col-item all-posts"
              :href="post._link"
            >
              <div
                class="img-col"
                v-if="post._imageUrl"
                :style="{
                  backgroundImage: 'url(' + post._imageUrl + ')',
                }"
              ></div>
              <div class="img-col default-img" v-if="!post._imageUrl"></div>

              <div class="text-col">
                <a class="post-title" :href="post._link">
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
                    class="b-button"
                    :href="post._link"
                    :target="post._external ? '_blank' : '_self'"
                    >{{ post._linkLabel }}</a
                  >
                </div>
              </div>
            </a>
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

