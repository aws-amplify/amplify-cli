import { defineData } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `enum UserRole {
  ADMIN
  MANAGER
  VIEWER
}

type User @model @auth(rules: [
  { allow: private, provider: iam },
  { allow: owner, ownerField: "id" }
]) {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Product @model @auth(rules: [{ allow: private, provider: iam }]) {
  id: ID!
  serialno: Int!
  engword: String!
  price: Float
  category: String
  description: String
  stock: Int
  brand: String
  imageKey: String
  imageUploadedAt: String
  images: [String]
  createdBy: String
  updatedBy: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  comments: [Comment] @hasMany(indexName: "byProduct", fields: ["id"])
}

type Comment @model @auth(rules: [
  { allow: private, provider: iam },
  { allow: owner, ownerField: "authorId" }
]) {
  id: ID!
  productId: ID! @index(name: "byProduct")
  authorId: String!
  authorName: String!
  content: String!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type LowStockProduct {
  name: String!
  stock: Int!
}

type LowStockResponse {
  message: String!
  lowStockProducts: [LowStockProduct!]!
}

type Query {
  checkLowStock: LowStockResponse @function(name: "lowstockproducts-${branchName}") @auth(rules: [
    { allow: private, provider: iam },
    { allow: public, provider: apiKey }
  ])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'main',
      modelNameToTableNameMapping: {
        User: 'User-3oy6oxkj6ffojmc2upd52ftdsq-main',
        Product: 'Product-3oy6oxkj6ffojmc2upd52ftdsq-main',
        Comment: 'Comment-3oy6oxkj6ffojmc2upd52ftdsq-main',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
    apiKeyAuthorizationMode: { expiresInDays: 7, description: 'graphqlapi' },
  },
  schema,
});
