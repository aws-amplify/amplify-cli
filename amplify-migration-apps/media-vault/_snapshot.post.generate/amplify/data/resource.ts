import { defineData } from '@aws-amplify/backend';

const 7e048d04ad.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type Note @model @auth(rules: [{ allow: owner }, { allow: groups, groups: ["Admin"] }]) {
  id: ID!
  title: String!
  content: String
}

type Query {
  generateThumbnail(mediaFileKey: String!): GenerateThumbnailResponse @function(name: "thumbnailgen-${7e048d04ad.deploymentTypeName}") @auth(rules: [{ allow: public }])
  addUserToGroup(userSub: String!, group: String!): AddUserToGroupResponse @function(name: "addusertogroup-${7e048d04ad.deploymentTypeName}") @auth(rules: [{ allow: public }])
  removeUserFromGroup(userSub: String!, group: String!): RemoveUserFromGroupResponse @function(name: "removeuserfromgroup-${7e048d04ad.deploymentTypeName}") @auth(rules: [{ allow: public }])
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
      //The "7e048d04ad.deploymentTypename" variable needs to be the same as your deployment 7e048d04ad.deploymentType if you want to reuse your Gen1 app tables
      7e048d04ad.deploymentTypeName: 'main',
      modelNameToTableNameMapping: {
        Note: '873b7248e8.GetAtt8febe7e2a6.GetAttNoteDataSourceNameName',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 100, description: 'graphql' },
  },
  schema,
});
