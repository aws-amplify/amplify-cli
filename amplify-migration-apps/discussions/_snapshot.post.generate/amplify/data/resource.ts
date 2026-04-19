import { defineData } from '@aws-amplify/backend';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import type { Backend } from '../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type Topic @model @auth(rules: [{ allow: public }]){
  id: ID!
  createdByUserId: String!
  content: String!
  posts: [Post] @hasMany
}

type Post @model @auth(rules: [{ allow: public }]){
  id: ID!
  createdByUserId: String!
  content: String!
  comments: [Comment] @hasMany
  topic: Topic @belongsTo
}

type Comment @model @auth(rules: [{ allow: public }]){
  id: ID!
  createdByUserId: String!
  content: String!
  post: Post @belongsTo
}

type Query {
  fetchUserActivity(userId: ID!): [Activity] @function(name: "fetchuseractivity-${branchName}") @auth(rules: [{ allow: public }])
}

type Activity {
  id: ID! @auth(rules: [{ allow: public }])
  userId: ID! @auth(rules: [{ allow: public }])
  activityType: String! @auth(rules: [{ allow: public }])
  timestamp: String! @auth(rules: [{ allow: public }])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'x',
      modelNameToTableNameMapping: {
        Topic: 'Topic-xw3yrfq7mngltcua43nucy7fg4-x',
        Post: 'Post-xw3yrfq7mngltcua43nucy7fg4-x',
        Comment: 'Comment-xw3yrfq7mngltcua43nucy7fg4-x',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});

export function applyEscapeHatches(backend: Backend) {
  for (const model of ['Topic', 'Post', 'Comment']) {
    const table = backend.data.resources.tables[model];
    backend.recorduseractivity.resources.lambda.addEventSource(
      new DynamoEventSource(table, { startingPosition: StartingPosition.LATEST })
    );
    table.grantStreamRead(backend.recorduseractivity.resources.lambda.role!);
    table.grantTableListStreams(
      backend.recorduseractivity.resources.lambda.role!
    );
  }
}
