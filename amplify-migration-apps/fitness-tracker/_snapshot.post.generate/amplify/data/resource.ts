import { defineData } from '@aws-amplify/backend';
import type { Backend } from '../backend';

const schema = `enum WorkoutProgramStatus {
  ACTIVE
  COMPLETED
  ON_HOLD
  ARCHIVED
}

type WorkoutProgram @model @auth(rules: [{ allow: owner, operations: [create, read, update, delete] }]) {
  id: ID!
  title: String!
  description: String
  status: WorkoutProgramStatus!
  deadline: AWSDateTime
  color: String
  exercises: [Exercise] @hasMany
}

type Exercise @model @auth(rules: [{ allow: owner, operations: [create, read, update, delete] }]) {
  id: ID!
  workoutProgramId: ID
  name: String!
  description: String
}

type Meal @model @auth(rules: [{ allow: public }]) {
  id: ID!
  userName: String!
  content: String!
  timestamp: String!
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'x',
      modelNameToTableNameMapping: {
        WorkoutProgram: 'WorkoutProgram-bdrql4nrffefnbpcrkkc27shn4-x',
        Exercise: 'Exercise-bdrql4nrffefnbpcrkkc27shn4-x',
        Meal: 'Meal-bdrql4nrffefnbpcrkkc27shn4-x',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 7, description: 'graphql' },
  },
  schema,
});

export function applyEscapeHatches(backend: Backend) {
  const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
  cfnGraphqlApi.additionalAuthenticationProviders = [
    {
      authenticationType: 'API_KEY',
    },
  ];
}
