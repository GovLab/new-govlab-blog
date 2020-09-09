////////////////////////////////////////
// reload page after Forward and back
///////////////////////////////////////


const TYPE_BACK_FORWARD = 2;

function isReloadedPage() {
  return performance.navigation.type === TYPE_BACK_FORWARD;
}


////////////////////////////////////////////////////////////
///// TEAM  API REQUEST ` `
////////////////////////////////////////////////////////////


const client=  new DirectusSDK({
  url: "https://directus.thegovlab.com/",
  project: "thegovlab",
  storage: window.localStorage
})


Vue.use(VueMeta);
new Vue({

  el: '#blogpage',

	data: {

      blogData: [],
      apiURLDirectus: 'https://directusdev.thegovlab.com/',
      apiURLWP: 'https://dev.thegovlab.com/',
      customWPID: null,
      customDirectusID: null
  },

  created: function created() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    this.customWPID = urlParams.get('wp_preview_id');
    this.customDirectusID = urlParams.get('directus_preview_id');

    // this.blogslug=window.location.pathname.split('/');

    // this.blogslug = this.blogslug[this.blogslug.length - 1];
    // this.blogslug = this.blogslug[this.blogslug.length - 1].split('.')[0];

    this.fetchBlog();

  },
  methods: {


    fetchBlog() {
      self = this;


      const client = new DirectusSDK({
        url: "https://directusdev.thegovlab.com/",
        project: "thegovlab",
        storage: window.localStorage
      });

      if(self.customDirectusID != null)
      {
      client.getItems(
  'blog',
  {
    filter: {
      slug: self.blogslug
    },
    fields: ['*.*','authors.team_id.*','authors.team_id.picture.*','related_posts.incoming_blog_id.*','related_publications.pub_id.*','related_publications.pub_id.picture.*','related_projects.projects_id.*','related_projects.projects_id.main_picture.*']
  }
  ).then(data => {
    console.log(data);
    data.data['api'] = 'directus';
    self.blogData = data.data;

}).catch(error => console.error(error));
}

if(self.customWPID != null)
{

  axios.get("https://dev.thegovlab.com/wp-json/wp/v2/posts?id="+self.customWPID+"&_embed").then(data => {
    console.log(data);
    data.data['api'] = 'wp';
    self.blogData = data.data;
    console.log(self.blogData);
      window.scrollTo(0,0);
  });
}
    }

  ,
  formatDate(date) {
  return moment(date).format('DD MMMM YYYY');
  }
  }
});

