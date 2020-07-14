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


Vue.use(BootstrapVue);
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
      currentPage: 1,
      postdata: [],
      posts: [],
      currentDate: '',
      slug:'',
      more_body: false,
      meta_title: 'The GovLab | Blog',
      meta_content: 'Deepening our understanding of how to govern more effectively and legitimately through technology.'
    }
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
  created: function created() {
    this.slug=window.location.href.split('/');

    this.slug = this.slug[this.slug.length - 1];

    this.fetchHeader();
  },
  methods: {
    fetchHeader() {

      self = this;

      axios(`${self.baseUrl}${self.perPage}`, self.wpFetchHeaders).then(data => {
        self.totalPages  = data.headers['x-wp-totalpages'];
        self.fetchPosts();
      })

},
  fetchPosts()
  {

    self = this;
    axios.get(`${self.baseUrl}${self.perPage}&page=${self.currentPage}`, self.wpFetchHeaders).then(data => {
      self.posts = data.data;
        window.scrollTo(0,0);
    });
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
