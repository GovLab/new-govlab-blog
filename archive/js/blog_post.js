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



Vue.use(VueMeta);
new Vue({

  el: '#blogpage',

	data: {
     meta_title: '',
      meta_content: '',
      meta_image: '',
      twitter_title:'',
      twitter_image:'',
      twitter_desc:'',
      blogData: []
  },
  metaInfo () {
        return {
          title: this.meta_title,
          meta: [

         {name: 'twitter:card', content: 'summary_large_image'},
          {name: 'twitter:title', content: this.meta_title},
          {name: 'twitter:description', content: this.meta_content},
          // image must be an absolute path
          {name: 'twitter:image', content: this.meta_image},
          // Facebook OpenGraph
          {property: 'og:title', content: this.meta_title},
          {property: 'og:site_name', content: 'The Govlab Blog'},
          {property: 'og:type', content: 'website'},
          {property: 'og:image', content:  this.meta_image},
          {property: 'og:description', content:  this.meta_content},
          { itemprop:'name', content: this.meta_title},
          { itemprop:'image', content: this.meta_image},
          { itemprop:'description', content: this.meta_content}
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
        url: "https://directus.thegovlab.com/",
        project: "thegovlab",
        storage: window.localStorage
      });


      client.getItems(
  'tg_archive',
  {
    filter: {
      slug: self.blogslug
    },
    fields: ['*.*','authors.team_id.*','authors.team_id.picture.*']
  }
  ).then(data => {

    self.meta_title = data.data[0].title;
    self.meta_content = data.data[0].excerpt;
    self.meta_url = "https://blog.thegovlab.org/post/"+data.data[0].slug;
    if(data.data[0].image){ self.meta_image = data.data[0].image.data.full_url;
	} else {
	    self.meta_image = "https://govlab.github.io/new-govlab-blog/img/govlab-sm.png";}

    if(data.data[0].status == 'published' &&  data.data[0].scheduled <= self.currentDateTime())self.blogData = data.data;


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

