import { defineData } from '@aws-amplify/backend';

const schema = `type MoodItem {
  id: ID!
  title: String!
  description: String
  image: String!
  boardID: ID!
  board: Board
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Board {
  id: ID!
  name: String!
  moodItems(filter: ModelMoodItemFilterInput, sortDirection: ModelSortDirection, limit: Int, nextToken: String): ModelMoodItemConnection
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Query {
  getMoodItem(id: ID!): MoodItem
  listMoodItems(filter: ModelMoodItemFilterInput, limit: Int, nextToken: String): ModelMoodItemConnection
  getBoard(id: ID!): Board
  listBoards(filter: ModelBoardFilterInput, limit: Int, nextToken: String): ModelBoardConnection
  moodItemsByBoardID(boardID: ID!, sortDirection: ModelSortDirection, filter: ModelMoodItemFilterInput, limit: Int, nextToken: String): ModelMoodItemConnection
  getRandomEmoji: String @aws_cognito_user_pools
  getKinesisEvents: AWSJSON @aws_cognito_user_pools
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

type ModelMoodItemConnection {
  items: [MoodItem]!
  nextToken: String
}

input ModelMoodItemFilterInput {
  id: ModelIDInput
  title: ModelStringInput
  description: ModelStringInput
  image: ModelStringInput
  boardID: ModelIDInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  and: [ModelMoodItemFilterInput]
  or: [ModelMoodItemFilterInput]
  not: ModelMoodItemFilterInput
}

input ModelMoodItemConditionInput {
  title: ModelStringInput
  description: ModelStringInput
  image: ModelStringInput
  boardID: ModelIDInput
  and: [ModelMoodItemConditionInput]
  or: [ModelMoodItemConditionInput]
  not: ModelMoodItemConditionInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
}

input CreateMoodItemInput {
  id: ID
  title: String!
  description: String
  image: String!
  boardID: ID!
}

input UpdateMoodItemInput {
  id: ID!
  title: String
  description: String
  image: String
  boardID: ID
}

input DeleteMoodItemInput {
  id: ID!
}

type Mutation {
  createMoodItem(input: CreateMoodItemInput!, condition: ModelMoodItemConditionInput): MoodItem
  updateMoodItem(input: UpdateMoodItemInput!, condition: ModelMoodItemConditionInput): MoodItem
  deleteMoodItem(input: DeleteMoodItemInput!, condition: ModelMoodItemConditionInput): MoodItem
  createBoard(input: CreateBoardInput!, condition: ModelBoardConditionInput): Board
  updateBoard(input: UpdateBoardInput!, condition: ModelBoardConditionInput): Board
  deleteBoard(input: DeleteBoardInput!, condition: ModelBoardConditionInput): Board
}

input ModelSubscriptionMoodItemFilterInput {
  id: ModelSubscriptionIDInput
  title: ModelSubscriptionStringInput
  description: ModelSubscriptionStringInput
  image: ModelSubscriptionStringInput
  boardID: ModelSubscriptionIDInput
  createdAt: ModelSubscriptionStringInput
  updatedAt: ModelSubscriptionStringInput
  and: [ModelSubscriptionMoodItemFilterInput]
  or: [ModelSubscriptionMoodItemFilterInput]
}

type Subscription {
  onCreateMoodItem(filter: ModelSubscriptionMoodItemFilterInput): MoodItem @aws_subscribe(mutations: ["createMoodItem"])
  onUpdateMoodItem(filter: ModelSubscriptionMoodItemFilterInput): MoodItem @aws_subscribe(mutations: ["updateMoodItem"])
  onDeleteMoodItem(filter: ModelSubscriptionMoodItemFilterInput): MoodItem @aws_subscribe(mutations: ["deleteMoodItem"])
  onCreateBoard(filter: ModelSubscriptionBoardFilterInput): Board @aws_subscribe(mutations: ["createBoard"])
  onUpdateBoard(filter: ModelSubscriptionBoardFilterInput): Board @aws_subscribe(mutations: ["updateBoard"])
  onDeleteBoard(filter: ModelSubscriptionBoardFilterInput): Board @aws_subscribe(mutations: ["deleteBoard"])
}

type ModelBoardConnection {
  items: [Board]!
  nextToken: String
}

input ModelBoardFilterInput {
  id: ModelIDInput
  name: ModelStringInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  and: [ModelBoardFilterInput]
  or: [ModelBoardFilterInput]
  not: ModelBoardFilterInput
}

input ModelBoardConditionInput {
  name: ModelStringInput
  and: [ModelBoardConditionInput]
  or: [ModelBoardConditionInput]
  not: ModelBoardConditionInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
}

input CreateBoardInput {
  id: ID
  name: String!
}

input UpdateBoardInput {
  id: ID!
  name: String
}

input DeleteBoardInput {
  id: ID!
}

input ModelSubscriptionBoardFilterInput {
  id: ModelSubscriptionIDInput
  name: ModelSubscriptionStringInput
  createdAt: ModelSubscriptionStringInput
  updatedAt: ModelSubscriptionStringInput
  and: [ModelSubscriptionBoardFilterInput]
  or: [ModelSubscriptionBoardFilterInput]
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
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
      description: 'moodBoard API Key',
    },
  },
  schema,
});
