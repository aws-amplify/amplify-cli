/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createWorkoutProgram = /* GraphQL */ `mutation CreateWorkoutProgram(
  $input: CreateWorkoutProgramInput!
  $condition: ModelWorkoutProgramConditionInput
) {
  createWorkoutProgram(input: $input, condition: $condition) {
    id
    title
    description
    status
    deadline
    color
    exercises {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateWorkoutProgramMutationVariables, APITypes.CreateWorkoutProgramMutation>;
export const updateWorkoutProgram = /* GraphQL */ `mutation UpdateWorkoutProgram(
  $input: UpdateWorkoutProgramInput!
  $condition: ModelWorkoutProgramConditionInput
) {
  updateWorkoutProgram(input: $input, condition: $condition) {
    id
    title
    description
    status
    deadline
    color
    exercises {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateWorkoutProgramMutationVariables, APITypes.UpdateWorkoutProgramMutation>;
export const deleteWorkoutProgram = /* GraphQL */ `mutation DeleteWorkoutProgram(
  $input: DeleteWorkoutProgramInput!
  $condition: ModelWorkoutProgramConditionInput
) {
  deleteWorkoutProgram(input: $input, condition: $condition) {
    id
    title
    description
    status
    deadline
    color
    exercises {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteWorkoutProgramMutationVariables, APITypes.DeleteWorkoutProgramMutation>;
export const createExercise = /* GraphQL */ `mutation CreateExercise(
  $input: CreateExerciseInput!
  $condition: ModelExerciseConditionInput
) {
  createExercise(input: $input, condition: $condition) {
    id
    workoutProgramId
    name
    description
    createdAt
    updatedAt
    workoutProgramExercisesId
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateExerciseMutationVariables, APITypes.CreateExerciseMutation>;
export const updateExercise = /* GraphQL */ `mutation UpdateExercise(
  $input: UpdateExerciseInput!
  $condition: ModelExerciseConditionInput
) {
  updateExercise(input: $input, condition: $condition) {
    id
    workoutProgramId
    name
    description
    createdAt
    updatedAt
    workoutProgramExercisesId
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateExerciseMutationVariables, APITypes.UpdateExerciseMutation>;
export const deleteExercise = /* GraphQL */ `mutation DeleteExercise(
  $input: DeleteExerciseInput!
  $condition: ModelExerciseConditionInput
) {
  deleteExercise(input: $input, condition: $condition) {
    id
    workoutProgramId
    name
    description
    createdAt
    updatedAt
    workoutProgramExercisesId
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteExerciseMutationVariables, APITypes.DeleteExerciseMutation>;
export const createMeal = /* GraphQL */ `mutation CreateMeal(
  $input: CreateMealInput!
  $condition: ModelMealConditionInput
) {
  createMeal(input: $input, condition: $condition) {
    id
    userName
    content
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateMealMutationVariables, APITypes.CreateMealMutation>;
export const updateMeal = /* GraphQL */ `mutation UpdateMeal(
  $input: UpdateMealInput!
  $condition: ModelMealConditionInput
) {
  updateMeal(input: $input, condition: $condition) {
    id
    userName
    content
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateMealMutationVariables, APITypes.UpdateMealMutation>;
export const deleteMeal = /* GraphQL */ `mutation DeleteMeal(
  $input: DeleteMealInput!
  $condition: ModelMealConditionInput
) {
  deleteMeal(input: $input, condition: $condition) {
    id
    userName
    content
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteMealMutationVariables, APITypes.DeleteMealMutation>;
export const createAuthActivity = /* GraphQL */ `mutation CreateAuthActivity(
  $input: CreateAuthActivityInput!
  $condition: ModelAuthActivityConditionInput
) {
  createAuthActivity(input: $input, condition: $condition) {
    id
    userName
    activityType
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateAuthActivityMutationVariables, APITypes.CreateAuthActivityMutation>;
export const updateAuthActivity = /* GraphQL */ `mutation UpdateAuthActivity(
  $input: UpdateAuthActivityInput!
  $condition: ModelAuthActivityConditionInput
) {
  updateAuthActivity(input: $input, condition: $condition) {
    id
    userName
    activityType
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateAuthActivityMutationVariables, APITypes.UpdateAuthActivityMutation>;
export const deleteAuthActivity = /* GraphQL */ `mutation DeleteAuthActivity(
  $input: DeleteAuthActivityInput!
  $condition: ModelAuthActivityConditionInput
) {
  deleteAuthActivity(input: $input, condition: $condition) {
    id
    userName
    activityType
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteAuthActivityMutationVariables, APITypes.DeleteAuthActivityMutation>;
