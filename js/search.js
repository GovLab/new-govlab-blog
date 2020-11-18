
////////////////////////////////////////
// reload page after Forward and back
///////////////////////////////////////

const TYPE_BACK_FORWARD = 2;

function isReloadedPage() {
  return performance.navigation.type === TYPE_BACK_FORWARD;
}

function main() {
  if (isReloadedPage()) {
    window.location.reload();
  }
}
main();


////////////////////////////////////////////////////////////
///// SEARCH ALL API REQUEST
////////////////////////////////////////////////////////////


Vue.use(BootstrapVue);
Vue.use(VueMeta);
Vue.use(VueGtag, {
  config: { id: "UA-40012093-4" }
});

new Vue({

  el: '#app',
  data: {

    // baseUrl: 'https://dev.thegovlab.com/wp-json/wp/v2/posts?cat=2&_embed',
    perPage: '?per_page=10',
    wpFetchHeaders: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'x-wp-total'
      }
    },
    meta_title: 'The GovLab | Search',
    meta_content: 'Deepening our understanding of how to govern more effectively and legitimately through technology.',
    totalPages: 100,
    perPage: 1,
    client_blog:'',
    postdata: [],
    posts: [],
    fposts: [],
    more_body: false,
    excerptLength: 75,

    searchTerm:'',
    searchBlob:[],
    currentPage: 0,
    searchactive: false,
    postAmount:3,

    totalpg: "100",

    numPages:3,
    fuse:[],
    options:[],

    list:[],
    listWP:[],
    listWPresults:0,
    listBlog:[],
    listArchive:[],
    listOGRX:[],
    listHP:[],
    client_blog:'',
    ogrxload: false,
    blogload: false,
    ttlload: false,
    archiveload: false,
    featuredPost: true,
    featureAmount: 0
  },
  metaInfo () {
        return {
          title: this.meta_title,
          meta: [
            {title: this.meta_title, property:'og:title'},
      {  name: 'description', content: this.meta_content, property:'og:description'}
    ]
    }
  },
  created()
  {
    self = this;
    // Init Blog API SDK
    this.client_blog = new DirectusSDK({
      url:"https://directus.thegovlab.com/",
      project:"thegovlab",
      storage: window.localStorage
    });

    // Init the load of Blog Posts
    this.fetchPosts();

    // Init the search function with input delay
    self.debounceSearch = window._.debounce(self.searchLibs, 1000);
  },
  mounted ()
  {
    // Get Search PArameter from URL
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    this.searchTerm = urlParams.get('q');
    this.debounceSearch();
  },

  watch: {
    list: function () {
      this.searchBlob.splice(0, this.searchBlob.length)
      this.fuse = new Fuse(this.list, this.options);
      this.searchBlob = this.fuse.search(this.searchTerm);
    },
    ttlload:  function () {
      this.loadFinish()
    },
    blogload:  function () {
      this.loadFinish()
    },
    ogrxload:  function () {
      this.loadFinish()
    }

  },
  methods: {

    /// Get the initial Posts for the page from the Blog

 fetchPosts(p)
   {
     self = this;
     self.currentPage++;
     self.client_blog.getItems(
       'blog', {
         sort:"-created_on",
         meta:"*",
         page:self.currentPage,
         limit:20,
         q: self.searchTerm,
         fields: ['*.*','authors.team_id.*','authors.team_id.picture.*','related_posts.incoming_blog_id.*','related_publications.pub_id.*','related_publications.pub_id.picture.*','related_projects.projects_id.*','related_projects.projects_id.main_picture.*']
       })
       .then(data => {
         Promise.all(data.data.map (function(a,b){ self.posts.push(a); if(a.featured)self.fposts.push(a);}))
     }).catch(err => {
     console.log(err);
   })
   },

    /// Make Search Reqeusts
    searchAll (){
      this.debounceSearch();
      this.searchactive = true;
      this.ogrxload = false;
      this.blogload = false;
      this.ttlload = false;
    },

    /// Trigger Search after conditions are fullfilled (length of Term, empty term etc. )
    searchLibs (){
      self = this;
      if(self.searchTerm.length>=2 && self.searchTerm != '')
      {
        self.searchBlob.splice(0, self.searchBlob.length);
        self.listHP.splice(0, self.listHP.length);
        self.listHP.length = 0;

        self.listWP.length = 0;
        self.listBlog.length = 0;
        self.listOGRX.length = 0;

        self.fuse = new Fuse(self.list, self.options);
        self.list.splice(0, self.list.length)

        self.searchBlob = self.fuse.search(self.searchTerm);

        self.searchBlog()
        self.searchTTL();
        self.searchOGRX();
        self.searchArchive()

      }
      else if (self.searchTerm.length<=3) {
        self.searchactive = false;
      }

    },

    searchTTL(){
      self = this;

      axios.get('https://thelivinglib.org/search_studio/?wpsolr_q='+self.searchTerm).then(resultsolr => {
        var el = document.createElement( 'div' );
        el.innerHTML = resultsolr.data;
        var amountTTL = el.getElementsByClassName( 'infor' )[0].innerText.split(' ');
        self.listWPresults = amountTTL[amountTTL.length-1];
        if(self.listWPresults == self.searchTerm) self.listWPresults = 0;
      })
      .catch(err => {
        console.log(err);
      })

      axios.get('https://thelivinglib.org/wp-json/wp/v2/posts?&per_page=100&_embed&search='+self.searchTerm).then(results => {

        const requeststtle = results.data.map (function(a,b){

          a['api']='ttl';

          a.excerpt.rendered = a.excerpt.rendered.substring( 0, a.excerpt.rendered.indexOf( "\<p class\=\"link-more\"\>" ) );
          a.excerpt.rendered = a.excerpt.rendered.substring( 0, a.excerpt.rendered.indexOf( "\&hellip\; \<\/p\>" ) );

          a['content']=a.content.rendered;
          a['title']=a.title.rendered;
          a['modified'] = a.modified.split('T')[0];
          self.searchactive = true;
          if(b<self.postAmount)self.listHP.push(a);
          self.list.push(a);
        });

        Promise.all(requeststtle).then(() => {
          self.ttlload = true;
        });
        self.listWPresults = results.headers['x-wp-total'];
        self.listWP = results;
        console.log(results);
      })
      .catch(err => {
        console.log(err);
      })

    },
    cutExcerpt(p)
    {
      var s = "";
      if(p != undefined){
      var s = p.split(" ").splice(0,this.excerptLength).join(" ");
      }
      return s += " [...]";
    },

    searchOGRX(){
      self = this;
      axios.get("https://cdn.contentful.com/spaces/ufh1mvj7xl16/entries?access_token=a9ccc057a1e57a9dfe4ea80441cb35ae2f42ea8e5e8d37dfe08a65f7b0ae9254&content_type=paper&limit=100&query="+self.searchTerm).then(response => {
        const requestsogrx =  response.data.items.map (function(a,b){
          a['api'] = 'ogrx';
          self.list.push(a);
          self.searchactive = true;
        if(b<self.postAmount)self.listHP.push(a);
      });
        Promise.all(requestsogrx).then(() => {
          // self.listHP = _.shuffle(self.listHP);
          self.ogrxload = true;
        });
        self.listOGRX = response;
      })
      .catch(err => {
        console.log(err);
      })
    },
    searchBlog(){
      self = this;
      self.client_blog.getItems(
        'blog', {
          limit: 100,
          sort:"-created_on",
          meta:"*",
          q: self.searchTerm
        })
        .then(data => {
          const requestsb =  data.data.map (function(a,b){
            a['api'] = 'blog';
            self.list.push(a);
            self.searchactive = true;
        if(b<self.postAmount)self.listHP.push(a);
      })
          Promise.all(requestsb).then(() => {
            self.blogload = true;
          });

          self.listBlog = data;
        })
        .catch(err => {
          console.log(err);
        })
      },
      searchArchive(){
        self = this;
        self.client_blog.getItems(
          'tg_archive', {
            limit: 100,
            sort:"-created_on",
            meta:"*",
            q: self.searchTerm
          })
          .then(data => {
            const requestsArv =  data.data.map (function(a,b){
              a['api'] = 'archive';
              self.list.push(a);
              self.searchactive = true;
              if(b<self.postAmount)self.listHP.push(a);

        })
            Promise.all(requestsArv).then(() => {
              self.archiveload = true;
            });

            self.listArchive = data.data;

          })
          .catch(err => {
            console.log(err);
          })
        },


      loadFinish()
      {
      if(this.ogrxload && this.blogload && this.ttlload && this.archiveload) {

        this.$gtag.event('search', {
        'event_category':'Search The GovLab',
        'event_label': this.searchTerm,
        'value':  parseInt(this.listBlog.meta.filter_count) + parseInt(this.listWPresults) + parseInt(this.listOGRX.data.total)
      })
        self.searchactive = false;
        self.featuredPost = false;

        self.sortEntries();
      }
    },

    // HELPERS
    sortEntries()
    {
      self = this;
      const datesort = this.listHP.map( function(a,b) {
        if(a.api == 'blog'){if(a.created_on){a['modified'] = a.created_on};console.log(a);};
        if(a.api == 'ogrx'){if(a.fields.publicationDate != undefined) a['modified'] = a.fields.publicationDate.split('T')[0];};
        if(a.api == 'archive'){if(a.created_on){a['modified'] = a.created_on}};
      });

      Promise.all(datesort).then(() => {

        self.listHP.sort((a,b) => (b.modified > a.modified) ? 1 : ((a.modified > b.modified) ? -1 : 0));
        if (self.listHP.length == 0) {
            self.featuredPost = true;
        }

      });
    },
    dateShow(date) {
      return moment(date).format("LL");
    },
currentDateTime() {
var currentTime = moment();
return currentTime.tz('America/New_York').format('YYYY-MM-DD HH:mm:ss');
},
      openURL(link) {
        window.open(link, '_blank');

      }
    }
  })
