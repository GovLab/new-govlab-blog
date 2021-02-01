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
      searchTerm:'',
      totalResults:0,
      totalPages: 100,
      perPage: 10,
      client_blog:'',
      currentPage: 1,
      postdata: [],
      posts: [],
      excerptLength: 75,
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

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    this.searchTerm = urlParams.get('q');


    this.client_blog = new DirectusSDK({
      url:"https://directus.thegovlab.com/",
      project:"thegovlab",
      storage: window.localStorage
    });


    this.fetchPosts(this.currentPage);
  },

  methods: {

  fetchPosts(p)
  {
    self.currentPage = p;
    self = this;

    self.client_blog.getItems(
      'tg_archive', {
        sort:"-created_on",
        meta:"*",
        page:self.currentPage,
        limit:10,
        q: self.searchTerm
      })
      .then(data => {
        self.totalResults = data.meta.filter_count;
        self.totalPages = data.meta.page_count;
          console.log(data);
        Promise.all(data.data.map (function(a,b){ self.posts.push(a)}))
    }).catch(err => {
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
    showDesc(eventO) {
      eventO['extended'] = true;
    },
    showExc(eventO) {
      eventO['extended'] = false;
    },
    dateShow(date) {
      return moment(date).format("LL");
    },
    currentDateTime() {
    var currentTime = moment();
    return currentTime.tz('America/New_York').format('YYYY-MM-DD HH:mm:ss');
  },
    eventMore(link) {
      window.open(link, '_blank');

    }
  }
});
