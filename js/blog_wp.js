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
///// TEAM  API REQUEST ` `
////////////////////////////////////////////////////////////


// Vue.use(BootstrapVue);
Vue.use(VueMeta);




new Vue({

  el: '#blog',
  data () {
    return {
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
      currentPage: 1,
      postdata: [],
      posts: [],
      currentDate: '',
      slug:'',
      more_body: false,
    
    }
  },
  created: function created() {
    this.slug=window.location.href.split('/');

    this.slug = this.slug[this.slug.length - 1];

    this.client_blog = new DirectusSDK({
      url:"https://directusdev.thegovlab.com/",
      project:"thegovlab",
      storage: window.localStorage
    });

    this.fetchPosts();
  },
  methods: {
//     fetchHeader() {
//
//       self = this;
//
//       axios(`${self.baseUrl}${self.perPage}`, self.wpFetchHeaders).then(data => {
//         self.totalPages  = data.headers['x-wp-totalpages'];
//         self.fetchPosts();
//       })
//
// },
  fetchPosts()
  {


    self = this;



    self.client_blog.getItems(
      'blog',
      {
        fields: ['*.*']})
      .then(data => {
      
        self.posts = data.data;
        console.log(self.posts);
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
});
