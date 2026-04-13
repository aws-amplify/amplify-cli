import { defineData } from '@aws-amplify/backend';

const 40f1c9f949.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';
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
  checkLowStock: LowStockResponse @function(name: "lowstockproducts-${40f1c9f949.deploymentTypeName}") @auth(rules: [
    { allow: private, provider: iam },
    { allow: public, provider: apiKey }
  ])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "40f1c9f949.deploymentTypename" variable needs to be the same as your deployment 40f1c9f949.deploymentType if you want to reuse your Gen1 app tables
      40f1c9f949.deploymentTypeName: 'main',
      modelNameToTableNameMapping: {
        User: 'c29f8ec2f7.GetAttc29f8ec2f7.GetAttUserDataSourceNameName',
        Product: 'b3e773b37b.GetAttb3e773b37b.GetAttProductDataSourceNameName',
        Comment: 'c9925b369b.transformerrootstackCommentc9925b369b.GetAttCommentDataSourceName5427FDE2Ref',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
    apiKeyAuthorizationMode: { expiresInDays: 7, description: 'graphqlapi' },
  },
  schema,
});
