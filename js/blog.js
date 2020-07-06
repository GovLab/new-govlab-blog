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
      apiURL: 'https://directusdev.thegovlab.com/thegovlab'
  },

  created: function created() {
    this.blogslug=window.location.pathname.split('/');
    this.blogslug = this.blogslug[this.blogslug.length - 1].split('.')[0];

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
    self.blogData = data.data;

}).catch(error => console.error(error));
    }
  }

});

