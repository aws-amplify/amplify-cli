import { TestEntry } from './test-case-types';

/*
  REGISTER TEST CASES HERE
*/
export const getTestCaseRegistry = (): TestEntry[] => [
  ['bi-di connection', biDiConnectionSchema],
  ['many to many', manyToManySchema],
  ['recursive', recursiveSchema],
  ['compound sort key', compoundSortKey],
  ['custom primary key', customPrimaryKey],
  ['connection on custom primary key', connectionOnCustomPrimaryKey],
  ['support renaming timestamps', renameTimestampFields],
  /*
  [
    'add additional tests with a descriptive name',
    schemaObject // define the schema below and reference it here. If the schema is exceptionally large, consider importing it from another file
    {
      v1TransformerConfigObject // if the tests needs custom v1 transformer config, include it here (the framework currently has limited support for additional config so you may need to make updates)
    },
    {
      v2TransformerConfig: // same for v2 transformer
    }
  ]
  */
];

/*
  DEFINE TEST SCHEMAS BELOW
*/

const biDiConnectionSchema = /* GraphQL */ `
  type Blog @model {
    id: ID!
    name: String!
    postID: ID
    post: Post @connection(fields: ["postID"])
  }

  type Post @model {
    id: ID!
    title: String!
    blogID: ID!
    blog: Blog @connection(fields: ["blogID"])
    comments: [Comment] @connection(keyName: "byPost", fields: ["id"])
  }

  type Comment @model @key(name: "byPost", fields: ["postID"]) {
    id: ID!
    postID: ID!
    post: Post @connection(fields: ["postID"])
  }
`;

const manyToManySchema = /* GraphQL */ `
  type Post @model {
    id: ID!
    title: String!
    editors: [PostEditor] @connection(keyName: "byPost", fields: ["id"])
  }

  type PostEditor
    @model(queries: null)
    @key(name: "byPost", fields: ["postId", "editorId"])
    @key(name: "byEditor", fields: ["editorId", "postId"]) {
    id: ID!
    postId: ID!
    editorId: ID!
    post: Post! @connection(fields: ["postId"])
    editor: User! @connection(fields: ["editorId"])
  }

  type User @model {
    id: ID!
    username: String!
    posts: [PostEditor] @connection(keyName: "byEditor", fields: ["id"])
  }
`;

const recursiveSchema = /* GraphQL */ `
  type Directory @model @key(name: "byParent", fields: ["parentId"]) {
    id: ID!
    parentId: ID!
    parent: Directory @connection(fields: ["parentId"])
    children: [Directory] @connection(keyName: "byParent", fields: ["id"])
  }
`;

const compoundSortKey = /* GraphQL */ `
  type Book @model @key(name: "byGenreAuthorPublishDate", fields: ["genre", "author", "publishDate"]) {
    id: ID!
    genre: String!
    author: String!
    publishDate: AWSDateTime!
  }
`;

const customPrimaryKey = /* GraphQL */ `
  type Book @model @key(fields: ["title", "author"]) {
    title: String!
    author: String!
    genre: String
  }
`;

const connectionOnCustomPrimaryKey = /* GraphQL */ `
  type Member @model @key(fields: ["name", "signupTime"]) {
    name: String!
    signupTime: AWSDateTime!
    activities: [Activity] @connection(keyName: "byMember", fields: ["name", "signupTime"])
  }

  type Activity @model @key(fields: ["type", "location", "duration"]) @key(name: "byMember", fields: ["memberName", "memberSignupTime"]) {
    type: String!
    location: String!
    duration: Int!
    memberName: String
    memberSignupTime: AWSDateTime
    member: Member @connection(fields: ["memberName", "memberSignupTime"])
  }
`;

const namedHasManyBelongsToConnection = /* GraphQL */ `
  type PostConnection @model @auth(rules: [{ allow: public }]) {
    id: ID!
    title: String!
    comments: [CommentConnection] @connection(name: "PostComments")
  }

  type CommentConnection @model {
    id: ID!
    content: String!
    post: PostConnection @connection(name: "PostComments")
  }
`;

const renameTimestampFields = /* GraphQL */ `
  type Post @model(timestamps: { createdAt: "made", updatedAt: "updated"}) {
    id: ID!
    title: String!
    contents: String
  }
`;
