module.exports = `
type Query {
  getPost(id: Int!): Post
  posts: [Post]
},
type Mutation {
  addPost(id: Int!, title: String, author: String, description: String, topic: String): Post
},
type Post {
  id: Int
  title: String
  author: String
  description: String
  topic: String
}
`