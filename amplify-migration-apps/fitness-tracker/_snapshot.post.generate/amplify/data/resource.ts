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
        WorkoutProgram: '16892071e0.GetAtta519ab46e6.GetAttWorkoutProgramDataSourceNameName',
        Exercise: '5b75fea289.GetAtt5b75fea289.amplifyfitnesstrackergen2main3f11ed2aac.deploymentType400746baebdataamplifyDataExerciseExerciseDataSourceA366FC05NameName',
        Meal: '36aeb2a522.GetAttc3c677ee62.GetAttMealDataSourceNameName',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 7, description: 'graphql' },
  },
  schema,
});
