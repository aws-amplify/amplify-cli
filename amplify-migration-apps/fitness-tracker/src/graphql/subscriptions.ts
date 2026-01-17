/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateWorkoutProgram = /* GraphQL */ `subscription OnCreateWorkoutProgram(
  $filter: ModelSubscriptionWorkoutProgramFilterInput
  $owner: String
) {
  onCreateWorkoutProgram(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<APITypes.OnCreateWorkoutProgramSubscriptionVariables, APITypes.OnCreateWorkoutProgramSubscription>;
export const onUpdateWorkoutProgram = /* GraphQL */ `subscription OnUpdateWorkoutProgram(
  $filter: ModelSubscriptionWorkoutProgramFilterInput
  $owner: String
) {
  onUpdateWorkoutProgram(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<APITypes.OnUpdateWorkoutProgramSubscriptionVariables, APITypes.OnUpdateWorkoutProgramSubscription>;
export const onDeleteWorkoutProgram = /* GraphQL */ `subscription OnDeleteWorkoutProgram(
  $filter: ModelSubscriptionWorkoutProgramFilterInput
  $owner: String
) {
  onDeleteWorkoutProgram(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<APITypes.OnDeleteWorkoutProgramSubscriptionVariables, APITypes.OnDeleteWorkoutProgramSubscription>;
export const onCreateExercise = /* GraphQL */ `subscription OnCreateExercise(
  $filter: ModelSubscriptionExerciseFilterInput
  $owner: String
) {
  onCreateExercise(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<APITypes.OnCreateExerciseSubscriptionVariables, APITypes.OnCreateExerciseSubscription>;
export const onUpdateExercise = /* GraphQL */ `subscription OnUpdateExercise(
  $filter: ModelSubscriptionExerciseFilterInput
  $owner: String
) {
  onUpdateExercise(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<APITypes.OnUpdateExerciseSubscriptionVariables, APITypes.OnUpdateExerciseSubscription>;
export const onDeleteExercise = /* GraphQL */ `subscription OnDeleteExercise(
  $filter: ModelSubscriptionExerciseFilterInput
  $owner: String
) {
  onDeleteExercise(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<APITypes.OnDeleteExerciseSubscriptionVariables, APITypes.OnDeleteExerciseSubscription>;
export const onCreateMeal = /* GraphQL */ `subscription OnCreateMeal($filter: ModelSubscriptionMealFilterInput) {
  onCreateMeal(filter: $filter) {
    id
    userName
    content
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnCreateMealSubscriptionVariables, APITypes.OnCreateMealSubscription>;
export const onUpdateMeal = /* GraphQL */ `subscription OnUpdateMeal($filter: ModelSubscriptionMealFilterInput) {
  onUpdateMeal(filter: $filter) {
    id
    userName
    content
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnUpdateMealSubscriptionVariables, APITypes.OnUpdateMealSubscription>;
export const onDeleteMeal = /* GraphQL */ `subscription OnDeleteMeal($filter: ModelSubscriptionMealFilterInput) {
  onDeleteMeal(filter: $filter) {
    id
    userName
    content
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnDeleteMealSubscriptionVariables, APITypes.OnDeleteMealSubscription>;
export const onCreateAuthActivity = /* GraphQL */ `subscription OnCreateAuthActivity(
  $filter: ModelSubscriptionAuthActivityFilterInput
) {
  onCreateAuthActivity(filter: $filter) {
    id
    userName
    activityType
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnCreateAuthActivitySubscriptionVariables, APITypes.OnCreateAuthActivitySubscription>;
export const onUpdateAuthActivity = /* GraphQL */ `subscription OnUpdateAuthActivity(
  $filter: ModelSubscriptionAuthActivityFilterInput
) {
  onUpdateAuthActivity(filter: $filter) {
    id
    userName
    activityType
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnUpdateAuthActivitySubscriptionVariables, APITypes.OnUpdateAuthActivitySubscription>;
export const onDeleteAuthActivity = /* GraphQL */ `subscription OnDeleteAuthActivity(
  $filter: ModelSubscriptionAuthActivityFilterInput
) {
  onDeleteAuthActivity(filter: $filter) {
    id
    userName
    activityType
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnDeleteAuthActivitySubscriptionVariables, APITypes.OnDeleteAuthActivitySubscription>;
