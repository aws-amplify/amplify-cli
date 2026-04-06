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
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'main',
      modelNameToTableNameMapping: {
        WorkoutProgram: 'WorkoutProgram-jzwb5p2vcbd2ldlnlxokgjcjby-main',
        Exercise: 'Exercise-jzwb5p2vcbd2ldlnlxokgjcjby-main',
        Meal: 'Meal-jzwb5p2vcbd2ldlnlxokgjcjby-main',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 7, description: 'graphql' },
  },
  schema,
});

export const escape = (backend: Backend) => {
  const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
  cfnGraphqlApi.additionalAuthenticationProviders = [
    {
      authenticationType: 'API_KEY',
    },
  ];
  backend.data.resources.tables['Meal'].grant(
    backend.lognutrition.resources.lambda,
    'dynamodb:Put*',
    'dynamodb:Create*',
    'dynamodb:BatchWriteItem',
    'dynamodb:PartiQLInsert',
    'dynamodb:Get*',
    'dynamodb:BatchGetItem',
    'dynamodb:List*',
    'dynamodb:Describe*',
    'dynamodb:Scan',
    'dynamodb:Query',
    'dynamodb:PartiQLSelect',
    'dynamodb:Update*',
    'dynamodb:RestoreTable*',
    'dynamodb:PartiQLUpdate',
    'dynamodb:Delete*',
    'dynamodb:PartiQLDelete'
  );
};
