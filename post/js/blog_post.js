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
      meta_title: '',
      meta_content: '',
      meta_image: '',
      meta_url: '',	
      blogData: [],
      apiURL: 'https://directusdev.thegovlab.com/thegovlab'
  },
  metaInfo () {
        return {
          title: this.meta_title,
          meta: [
            {content: this.meta_title, property:'og:title'},
            {content: this.meta_image, property:'og:image'},
            { content: this.meta_content, property:'og:description'},
            { content: this.meta_url, property:'og:url'}

    ]
    }
  },

  created: function created() {
    this.blogslug=window.location.href.split('/');
    // this.blogslug=window.location.pathname.split('/');
    this.blogslug = this.blogslug[this.blogslug.length - 1];
    
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

    self.meta_title = data.data[0].title;
    self.meta_content = data.data[0].excerpt;

    if(data.data[0].status == 'published' &&  data.data[0].scheduled <= self.currentDateTime())self.blogData = data.data;

    console.log(self.meta_title, self.meta_content);

}).catch(error => console.error(error));
    }
  ,
  formatDate(date) {
  return moment(date).format('DD MMMM YYYY');
},
currentDateTime() {
var currentTime = moment();
return currentTime.tz('America/New_York').format('YYYY-MM-DD h:mm:ss');
},
  }
});

