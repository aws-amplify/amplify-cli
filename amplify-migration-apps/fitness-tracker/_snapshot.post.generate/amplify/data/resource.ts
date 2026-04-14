import { defineData } from '@aws-amplify/backend';

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
      branchName: 'x',
      modelNameToTableNameMapping: {
        WorkoutProgram: 'WorkoutProgram-4u7y7wfisvavppu3diznx2j6mm-x',
        Exercise: 'Exercise-4u7y7wfisvavppu3diznx2j6mm-x',
        Meal: 'Meal-4u7y7wfisvavppu3diznx2j6mm-x',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 7, description: 'graphql' },
  },
  schema,
});
