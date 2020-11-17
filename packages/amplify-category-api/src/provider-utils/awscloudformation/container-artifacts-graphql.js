export const containerFiles = {
    Dockerfile: `FROM node:alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
    `,
    'index.js': `'use strict';

const PORT = 3000;

var express = require('express');
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');
var Query = require('./schema.js');
var root = require('./resolvers.js');

var app = express();

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

app.use('/graphql', graphqlHTTP({
  schema: buildSchema(Query),
  rootValue: root,
  graphiql: true
}));

app.listen(PORT, () => console.log('Listening on localhost:' + PORT + '/graphql'));`,
    'package.json': `{
  "name": "graphql",
  "version": "1.0.0",
  "description": "Sample GraphQL server for Fargate",
  "main": "index.js",
  "scripts": {},
  "author": "",
  "license": "ISC",
  "dependencies": {
    "aws-sdk": "^2.790.0",
    "express": "^4.17.1",
    "express-graphql": "^0.11.0",
    "graphql": "^15.4.0"
  }
}
      `
      'resolvers.js': `
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.STORAGE_POSTS_NAME;

const addPostToDDB = async ({id, title, author, description, topic}) => {
  var params = {
    Item : {
      id: id,
      title: title,
      author: author,
      description: description,
      topic: topic
    },
    TableName: TableName
  }
  try {
    const data = await docClient.put(params).promise()
    return params.Item;
  } catch (err) {
    return err
  }
}

const scanPostsFromDDB = async () =>{
  var params = {
    TableName: TableName,
  }

  try {
    const data = await docClient.scan(params).promise();
    return data.Items;
  } catch (err){
    console.log(err);
    return err;
  }
}

const getPostFromDDB = async (id) => {
  var params = {
    TableName: TableName,
    Key: id,
  }
  try {
    const data = await docClient.get(params).promise()
    return data.Item;
  } catch (err) {
    return err
  }
}

var root = {
  getPost:getPostFromDDB,
  posts:scanPostsFromDDB,
  addPost:addPostToDDB
};

module.exports = root;`,
      'schema.js': `module.exports = \`
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
      \`
      `

}