import { defineData } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type Note @model @auth(rules: [{ allow: owner }, { allow: groups, groups: ["Admin"] }]) {
  id: ID!
  title: String!
  content: String
}

type Query {
  generateThumbnail(mediaFileKey: String!): GenerateThumbnailResponse @function(name: "thumbnailgen-${branchName}") @auth(rules: [{ allow: public }])
  addUserToGroup(userSub: String!, group: String!): AddUserToGroupResponse @function(name: "addusertogroup-${branchName}") @auth(rules: [{ allow: public }])
  removeUserFromGroup(userSub: String!, group: String!): RemoveUserFromGroupResponse @function(name: "removeuserfromgroup-${branchName}") @auth(rules: [{ allow: public }])
}

type GenerateThumbnailResponse {
  statusCode: Int! @auth(rules: [{ allow: public }])
  message: String! @auth(rules: [{ allow: public }])
}

type AddUserToGroupResponse {
  statusCode: Int! @auth(rules: [{ allow: public }])
  message: String! @auth(rules: [{ allow: public }])
}

type RemoveUserFromGroupResponse {
  statusCode: Int! @auth(rules: [{ allow: public }])
  message: String! @auth(rules: [{ allow: public }])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'main',
      modelNameToTableNameMapping: {
        Note: 'Note-5aahjbxypzan3jqab7lbquus4m-main',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 100, description: 'graphql' },
  },
  schema,
});
