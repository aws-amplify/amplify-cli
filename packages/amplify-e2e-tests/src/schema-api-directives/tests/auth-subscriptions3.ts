//schema
export const schema = `
#change: added actual type definition for public subscription levl
type Post @model (subscriptions: { level: public })
@auth(rules: [{allow: owner}])
{
  id: ID!
  owner: String
  postname: String
  content: String
}`;

//subscriptions
export const subscription = `
#extra
subscription OnCreatePost {
  onCreatePost {
    postname
    content
  }
}`;
export const mutations_subscription = [
  `#extra
mutation CreatePost {
    createPost(input: { 
        postname: "post1",
        content: "post1 content"
    }) {
        id
        owner 
        postname
        content
    }
}`,
  `#extra
mutation CreatePost {
    createPost(input: { 
        postname: "post2",
        content: "post2 content"
    }) {
        id
        owner 
        postname
        content
    }
}`,
];
export const expected_result_subscription = [
  {
    onCreatePost: {
      postname: 'post1',
      content: 'post1 content',
    },
  },
  {
    onCreatePost: {
      postname: 'post2',
      content: 'post2 content',
    },
  },
];
