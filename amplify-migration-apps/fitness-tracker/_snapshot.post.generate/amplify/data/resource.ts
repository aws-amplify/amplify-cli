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
      //The "3f11ed2aac.deploymentTypename" variable needs to be the same as your deployment 3f11ed2aac.deploymentType if you want to reuse your Gen1 app tables
      3f11ed2aac.deploymentTypeName: 'main',
      modelNameToTableNameMapping: {
        WorkoutProgram: 'a519ab46e6.GetAtta519ab46e6.GetAttWorkoutProgramDataSourceNameName',
        Exercise: '59b1ed8bf0.GetAtt59b1ed8bf0.transformerrootstackExerciseExerciseDataSourceE8B787D0NameName',
        Meal: 'c3c677ee62.GetAttc3c677ee62.GetAttMealDataSourceNameName',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 7, description: 'graphql' },
  },
  schema,
});
