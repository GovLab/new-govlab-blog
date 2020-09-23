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
      meta_image: 'http://www.thegovlab.org/static/img/govlab-og.png',
      twitter_title:'',
      twitter_image:'',
      twitter_desc:'',	
      blogData: [],
      apiURL: 'https://directusdev.thegovlab.com/thegovlab'
  },
  metaInfo () {
        return {
          title: this.meta_title,
          meta: [
		  
		  {name: 'twitter:card', content: 'summary_large_image'},
          {name: 'twitter:title', content: 'Vue Social Cards Example'},
          {name: 'twitter:description', content: 'Vue sample site showing off Twitter and Facebook Cards.'},
          // image must be an absolute path
          {name: 'twitter:image', content: this.meta_image},
          // Facebook OpenGraph
          {property: 'og:title', content: 'Vue Social Cards Example'},
          {property: 'og:site_name', content: 'Vue Example'},
          {property: 'og:type', content: 'website'},
          {property: 'og:image', content:  this.meta_image},
          {property: 'og:description', content: 'Vue sample site showing off Twitter and Facebook Cards.'}
//             { property:'og:title', content: this.meta_title},
//             { property:'og:image', content: this.meta_image},
//             { property:'og:description', content: this.meta_content},
//             { property:'og:url', content: this.meta_url},
//             { name:"twitter:title", content: this.meta_title },
//             { name:"twitter:image", content: this.meta_image},
//             { name:"twitter:description", content: this.meta_content},
//             { name:"twitter:site", content: '@thegovlab'}
		  
// 	      {content: 'Title', property:'og:title'},
//             { content: 'http://www.thegovlab.org/static/img/govlab-og.png', property:'og:image'},
//             { content: 'test content', property:'og:description'},
//             { name:"url", content: 'http://www.thegovlab.org/', property:'og:url'},
//             { name:"twitter:title", content: 'Tiwtter Title', property:'twitter:title'},
//             { name:"twitter:image", content:'http://www.thegovlab.org/static/img/govlab-og.png', property:'twitter:image'},
//             { name:"twitter:description", content: 'Twitter desc', property:'twitter:description'},
//             { name:"twitter:site", content: '@thegovlab', property:'twitter:site'}
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

//     self.meta_title = data.data[0].title; self.twitter_title = data.data[0].title;
//     self.meta_content = data.data[0].excerpt; self.twitter_desc = data.data[0].excerpt;
//     self.meta_url = "https://blog.thegovlab.com/post/"+data.data[0].slug;
//     if(data.data[0].image){ self.meta_image = data.data[0].image.data.full_url; self.twitter_image = data.data[0].image.data.full_url;}
//     else { self.twitter_image = "http://www.thegovlab.org/static/img/govlab-og.png"; self.meta_image = "http://www.thegovlab.org/static/img/govlab-og.png";}

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

