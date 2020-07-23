
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

new Vue({
  el: '#app',
  data: {

    baseUrl: 'https://dev.thegovlab.com/wp-json/wp/v2/posts?cat=2&_embed',
    perPage: '?per_page=10',
    wpFetchHeaders: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'x-wp-total'
      }
    },
    totalPages: 100,
    perPage: 1,
    client_blog:'',
    postdata: [],
    posts: [],
    more_body: false,
    excerptLength: 75,



    searchTerm:'',
    searchBlob:[],
    currentPage: 1,
    searchactive: false,
    postAmount:3,

    totalpg: "100",

    numPages:3,
    fuse:[],
    options:[],

    list:[],
    listWP:[],
    listBlog:[],
    listOGRX:[],
    listHP:[],
    client_blog:'',
    ogrxload: false,
    blogload: false,
    ttlload: false,
    featuredPost: true
  },

  created()
  {
    this.slug=window.location.href.split('/');

    this.slug = this.slug[this.slug.length - 1];



    self = this;

    self.options = {
      // isCaseSensitive: false,
      // includeScore: false,
      // shouldSort: true,
      // includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      // threshold: 0.6,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      keys: [
        "title",
        "content",
        "fields.abstract",
        "fields.publicationName",
        {
            name: 'modified',
            weight: 2
          },
      {
          name: 'original_date',
          weight: 2
        },
        {
            name: 'fields.publicationDate',
            weight: 2
          }
      ]
    };

    // Init Blog
    this.client_blog = new DirectusSDK({
      url:"https://directusdev.thegovlab.com/",
      project:"thegovlab",
      storage: window.localStorage
    });

    this.fetchPosts();

    self.debounceSearch = window._.debounce(self.searchLibs, 1000);
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
  updated: function () {


  },
  methods: {

    dateShow(date) {
      return moment(date).format("LL");
    },
    searchTTL(){
      self = this;

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
          // self.listHP = _.shuffle(self.listHP);
          self.ttlload = true;
        });

        self.listWP = results;


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
      console.log(s);
      return s += " [...]";
    },

    searchOGRX(){
      self = this;
      axios.get("https://cdn.contentful.com/spaces/ufh1mvj7xl16/entries?access_token=a9ccc057a1e57a9dfe4ea80441cb35ae2f42ea8e5e8d37dfe08a65f7b0ae9254&content_type=paper&limit=100&query="+self.searchTerm).then(response => {
        // console.log('ogrx ', response, response.data.total);
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
        console.log(response);
        self.listOGRX = response;

      })
      .catch(err => {
        console.log(err);
      })


    },

    fetchPosts()
    {


      self = this;



      self.client_blog.getItems(
        'blog',
        {
          fields: ['*.*']})
        .then(data => {

          self.posts = data.data;

          // Promise.all(data.data.map (function(a,b){ self.list.push(a)}))
      }).catch(err => {
      console.log(err);
    })

      // axios.get(`${self.baseUrl}${self.perPage}&page=${self.currentPage}`, self.wpFetchHeaders).then(data => {
      //   console.log(data);
      //   self.posts = data.data;
      //     window.scrollTo(0,0);
      // });
    },

    searchBlog(){
      self = this;
      self.client_blog.getItems(
        'blog', {
          limit: 100,
          sort:"-original_date",
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

            // self.listHP = _.shuffle(self.listHP);
            self.blogload = true;
          });

          self.listBlog = data;

        })
        .catch(err => {
          console.log(err);
        })


      },

      searchAll (){
        this.debounceSearch();
        this.searchactive = true;
        this.ogrxload = false;
        this.blogload = false;
        this.ttlload = false;
      },
      searchLibs (){

        self = this;
        self.searchBlob.splice(0, self.searchBlob.length);
        self.listHP.splice(0, self.listHP.length);
        self.fuse = new Fuse(self.list, self.options);
        self.list.splice(0, self.list.length)

        if(self.searchTerm.length>=3 && self.searchTerm != '')
        {

          self.searchBlob = self.fuse.search(self.searchTerm);

          self.searchBlog()
          self.searchTTL();
          self.searchOGRX();

        }
        else if (self.searchTerm.length<=3) {
          self.searchactive = false;

        }

      },
      loadnextp: function ()
      {
        console.log('yep');
      },
      loadFinish()
      {
      if(this.ogrxload && this.blogload && this.ttlload) {
        self.searchactive = false;
        self.featuredPost = false;

        self.sortEntries();
      }
    },
    sortEntries()
    {

      const datesort = this.listHP.map( function(a,b) {
        if(a.api == 'blog'){if(a.original_date != undefined)a['modified'] = a.original_date};
        if(a.api == 'ogrx'){if(a.fields.publicationDate != undefined) a['modified'] = a.fields.publicationDate.split('T')[0];};
      });
      console.log(this.listHP);

      Promise.all(datesort).then(() => {
        this.listHP.sort((a,b) => (b.modified > a.modified) ? 1 : ((a.modified > b.modified) ? -1 : 0));

      });

      // this.listHP.map (function(a,b)
      // {
      //
      //   // if(a.api == 'blog' && iblog<self.postAmount){console.log(iblog); iblog++; self.listHP.push(a);}
      //   // if(a.api == 'ttl' && ittl<self.postAmount){ console.log(ittl);ittl++; self.listHP.push(a);}
      //   // if(a.api == 'ogrx' && iogrx<self.postAmount){console.log(iogrx); iogrx++; self.listHP.push(a);}
      //   //
      //   // if(ittl==self.postAmount && iogrx==self.postAmount && iblog==self.postAmount)
      //   // {
      //   //   self.listHP = _.shuffle(self.listHP);
      //   // }
      // })





      //////////////////////////////////
      ///// Sort and shuffled by network
      //////////////////////////////////

      // self = this;
      //
      // var ittl = 0;
      // var iogrx = 0;
      // var iblog = 0;
      //
      // this.listHP.splice(0, this.listHP.length);
      //
      // this.list.map (function(a,b)
      // {
      //
      //   if(a.api == 'blog' && iblog<self.postAmount){console.log(iblog); iblog++; self.listHP.push(a);}
      //   if(a.api == 'ttl' && ittl<self.postAmount){ console.log(ittl);ittl++; self.listHP.push(a);}
      //   if(a.api == 'ogrx' && iogrx<self.postAmount){console.log(iogrx); iogrx++; self.listHP.push(a);}
      //
      //   if(ittl==self.postAmount && iogrx==self.postAmount && iblog==self.postAmount)
      //   {
      //     self.listHP = _.shuffle(self.listHP);
      //   }
      // })

      // this.searchBlob.map (function(a,b)
      // {
      //
      //   if(a.item.api == 'blog' && iblog<3){console.log(iblog); iblog++; self.listHP.push(a);}
      //   if(a.item.api == 'ttl' && ittl<3){ console.log(ittl);ittl++; self.listHP.push(a);}
      //   if(a.item.api == 'ogrx' && iogrx<3){console.log(iogrx); iogrx++; self.listHP.push(a);}
      //
      //   console.log(ittl,iogrx,iblog);
      //   if(ittl==3 && iogrx==3 && iblog==3)
      //   {
      //     self.listHP = _.shuffle(self.listHP);
      //   }
      // })
    },
      showDesc(eventO) {
        eventO['extended'] = true;
      },
      showExc(eventO) {
        eventO['extended'] = false;
      },
      dateShow(date) {
        return moment(date).format("LL");
      },
      eventMore(link) {
        window.open(link, '_blank');

      }
    }

  })



  /// Anis part

  ////////////////////////////////////////////////////////////
  ///// TEAM  API REQUEST ` `
  ////////////////////////////////////////////////////////////


  // Vue.use(BootstrapVue);
  // Vue.use(VueMeta);



  //
  // new Vue({
  //
  //   el: '#blog',
  //   data () {
  //     return {
  //       baseUrl: 'https://dev.thegovlab.com/wp-json/wp/v2/posts?cat=2&_embed',
  //       perPage: '?per_page=10',
  //       wpFetchHeaders: {
  //         headers: {
  //           'Access-Control-Allow-Origin': '*',
  //           'Access-Control-Expose-Headers': 'x-wp-total'
  //         }
  //       },
  //       totalPages: 100,
  //       currentPage: 1,
  //       postdata: [],
  //       posts: [],
  //       currentDate: '',
  //       slug:'',
  //       more_body: false,
  //
  //     }
  //   },
  //   created: function created() {
  //     this.slug=window.location.href.split('/');
  //
  //     this.slug = this.slug[this.slug.length - 1];
  //
  //     this.client_blog = new DirectusSDK({
  //       url:"https://directusdev.thegovlab.com/",
  //       project:"thegovlab",
  //       storage: window.localStorage
  //     });
  //
  //     this.fetchPosts();
  //   },
  //   methods: {
  // //     fetchHeader() {
  // //
  // //       self = this;
  // //
  // //       axios(`${self.baseUrl}${self.perPage}`, self.wpFetchHeaders).then(data => {
  // //         self.totalPages  = data.headers['x-wp-totalpages'];
  // //         self.fetchPosts();
  // //       })
  // //
  // // },
  //
  //   }
  // });



