import { defineData } from '@aws-amplify/backend';

const schema = `type Topic {
  id: ID!
  createdByUserId: String!
  content: String!
  posts(filter: ModelPostFilterInput, sortDirection: ModelSortDirection, limit: Int, nextToken: String): ModelPostConnection
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Post {
  id: ID!
  createdByUserId: String!
  content: String!
  comments(filter: ModelCommentFilterInput, sortDirection: ModelSortDirection, limit: Int, nextToken: String): ModelCommentConnection
  topic: Topic
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  topicPostsId: ID
}

type Comment {
  id: ID!
  createdByUserId: String!
  content: String!
  post: Post
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  postCommentsId: ID
}

type Query {
  fetchUserActivity(userId: ID!): [Activity]
  getTopic(id: ID!): Topic
  listTopics(filter: ModelTopicFilterInput, limit: Int, nextToken: String): ModelTopicConnection
  getPost(id: ID!): Post
  listPosts(filter: ModelPostFilterInput, limit: Int, nextToken: String): ModelPostConnection
  getComment(id: ID!): Comment
  listComments(filter: ModelCommentFilterInput, limit: Int, nextToken: String): ModelCommentConnection
}

type Activity {
  id: ID!
  userId: ID!
  activityType: String!
  timestamp: String!
}

input ModelStringInput {
  ne: String
  eq: String
  le: String
  lt: String
  ge: String
  gt: String
  contains: String
  notContains: String
  between: [String]
  beginsWith: String
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
  size: ModelSizeInput
}

input ModelIntInput {
  ne: Int
  eq: Int
  le: Int
  lt: Int
  ge: Int
  gt: Int
  between: [Int]
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
}

input ModelFloatInput {
  ne: Float
  eq: Float
  le: Float
  lt: Float
  ge: Float
  gt: Float
  between: [Float]
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
}

input ModelBooleanInput {
  ne: Boolean
  eq: Boolean
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
}

input ModelIDInput {
  ne: ID
  eq: ID
  le: ID
  lt: ID
  ge: ID
  gt: ID
  contains: ID
  notContains: ID
  between: [ID]
  beginsWith: ID
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
  size: ModelSizeInput
}

input ModelSubscriptionStringInput {
  ne: String
  eq: String
  le: String
  lt: String
  ge: String
  gt: String
  contains: String
  notContains: String
  between: [String]
  beginsWith: String
  in: [String]
  notIn: [String]
}

input ModelSubscriptionIntInput {
  ne: Int
  eq: Int
  le: Int
  lt: Int
  ge: Int
  gt: Int
  between: [Int]
  in: [Int]
  notIn: [Int]
}

input ModelSubscriptionFloatInput {
  ne: Float
  eq: Float
  le: Float
  lt: Float
  ge: Float
  gt: Float
  between: [Float]
  in: [Float]
  notIn: [Float]
}

input ModelSubscriptionBooleanInput {
  ne: Boolean
  eq: Boolean
}

input ModelSubscriptionIDInput {
  ne: ID
  eq: ID
  le: ID
  lt: ID
  ge: ID
  gt: ID
  contains: ID
  notContains: ID
  between: [ID]
  beginsWith: ID
  in: [ID]
  notIn: [ID]
}

enum ModelAttributeTypes {
  binary
  binarySet
  bool
  list
  map
  number
  numberSet
  string
  stringSet
  _null
}

input ModelSizeInput {
  ne: Int
  eq: Int
  le: Int
  lt: Int
  ge: Int
  gt: Int
  between: [Int]
}

enum ModelSortDirection {
  ASC
  DESC
}

type ModelTopicConnection {
  items: [Topic]!
  nextToken: String
}

input ModelTopicFilterInput {
  id: ModelIDInput
  createdByUserId: ModelStringInput
  content: ModelStringInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  and: [ModelTopicFilterInput]
  or: [ModelTopicFilterInput]
  not: ModelTopicFilterInput
}

input ModelTopicConditionInput {
  createdByUserId: ModelStringInput
  content: ModelStringInput
  and: [ModelTopicConditionInput]
  or: [ModelTopicConditionInput]
  not: ModelTopicConditionInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
}

input CreateTopicInput {
  id: ID
  createdByUserId: String!
  content: String!
}

input UpdateTopicInput {
  id: ID!
  createdByUserId: String
  content: String
}

input DeleteTopicInput {
  id: ID!
}

type Mutation {
  createTopic(input: CreateTopicInput!, condition: ModelTopicConditionInput): Topic
  updateTopic(input: UpdateTopicInput!, condition: ModelTopicConditionInput): Topic
  deleteTopic(input: DeleteTopicInput!, condition: ModelTopicConditionInput): Topic
  createPost(input: CreatePostInput!, condition: ModelPostConditionInput): Post
  updatePost(input: UpdatePostInput!, condition: ModelPostConditionInput): Post
  deletePost(input: DeletePostInput!, condition: ModelPostConditionInput): Post
  createComment(input: CreateCommentInput!, condition: ModelCommentConditionInput): Comment
  updateComment(input: UpdateCommentInput!, condition: ModelCommentConditionInput): Comment
  deleteComment(input: DeleteCommentInput!, condition: ModelCommentConditionInput): Comment
}

input ModelSubscriptionTopicFilterInput {
  id: ModelSubscriptionIDInput
  createdByUserId: ModelSubscriptionStringInput
  content: ModelSubscriptionStringInput
  createdAt: ModelSubscriptionStringInput
  updatedAt: ModelSubscriptionStringInput
  and: [ModelSubscriptionTopicFilterInput]
  or: [ModelSubscriptionTopicFilterInput]
  topicPostsId: ModelSubscriptionIDInput
}

type Subscription {
  onCreateTopic(filter: ModelSubscriptionTopicFilterInput): Topic @aws_subscribe(mutations: ["createTopic"])
  onUpdateTopic(filter: ModelSubscriptionTopicFilterInput): Topic @aws_subscribe(mutations: ["updateTopic"])
  onDeleteTopic(filter: ModelSubscriptionTopicFilterInput): Topic @aws_subscribe(mutations: ["deleteTopic"])
  onCreatePost(filter: ModelSubscriptionPostFilterInput): Post @aws_subscribe(mutations: ["createPost"])
  onUpdatePost(filter: ModelSubscriptionPostFilterInput): Post @aws_subscribe(mutations: ["updatePost"])
  onDeletePost(filter: ModelSubscriptionPostFilterInput): Post @aws_subscribe(mutations: ["deletePost"])
  onCreateComment(filter: ModelSubscriptionCommentFilterInput): Comment @aws_subscribe(mutations: ["createComment"])
  onUpdateComment(filter: ModelSubscriptionCommentFilterInput): Comment @aws_subscribe(mutations: ["updateComment"])
  onDeleteComment(filter: ModelSubscriptionCommentFilterInput): Comment @aws_subscribe(mutations: ["deleteComment"])
}

type ModelPostConnection {
  items: [Post]!
  nextToken: String
}

input ModelPostFilterInput {
  id: ModelIDInput
  createdByUserId: ModelStringInput
  content: ModelStringInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  and: [ModelPostFilterInput]
  or: [ModelPostFilterInput]
  not: ModelPostFilterInput
  topicPostsId: ModelIDInput
}

input ModelPostConditionInput {
  createdByUserId: ModelStringInput
  content: ModelStringInput
  and: [ModelPostConditionInput]
  or: [ModelPostConditionInput]
  not: ModelPostConditionInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  topicPostsId: ModelIDInput
}

input CreatePostInput {
  id: ID
  createdByUserId: String!
  content: String!
  topicPostsId: ID
}

input UpdatePostInput {
  id: ID!
  createdByUserId: String
  content: String
  topicPostsId: ID
}

input DeletePostInput {
  id: ID!
}

input ModelSubscriptionPostFilterInput {
  id: ModelSubscriptionIDInput
  createdByUserId: ModelSubscriptionStringInput
  content: ModelSubscriptionStringInput
  createdAt: ModelSubscriptionStringInput
  updatedAt: ModelSubscriptionStringInput
  and: [ModelSubscriptionPostFilterInput]
  or: [ModelSubscriptionPostFilterInput]
  postCommentsId: ModelSubscriptionIDInput
}

type ModelCommentConnection {
  items: [Comment]!
  nextToken: String
}

input ModelCommentFilterInput {
  id: ModelIDInput
  createdByUserId: ModelStringInput
  content: ModelStringInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  and: [ModelCommentFilterInput]
  or: [ModelCommentFilterInput]
  not: ModelCommentFilterInput
  postCommentsId: ModelIDInput
}

input ModelCommentConditionInput {
  createdByUserId: ModelStringInput
  content: ModelStringInput
  and: [ModelCommentConditionInput]
  or: [ModelCommentConditionInput]
  not: ModelCommentConditionInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  postCommentsId: ModelIDInput
}

input CreateCommentInput {
  id: ID
  createdByUserId: String!
  content: String!
  postCommentsId: ID
}

input UpdateCommentInput {
  id: ID!
  createdByUserId: String
  content: String
  postCommentsId: ID
}

input DeleteCommentInput {
  id: ID!
}

input ModelSubscriptionCommentFilterInput {
  id: ModelSubscriptionIDInput
  createdByUserId: ModelSubscriptionStringInput
  content: ModelSubscriptionStringInput
  createdAt: ModelSubscriptionStringInput
  updatedAt: ModelSubscriptionStringInput
  and: [ModelSubscriptionCommentFilterInput]
  or: [ModelSubscriptionCommentFilterInput]
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'main',
      modelNameToTableNameMapping: {},
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
