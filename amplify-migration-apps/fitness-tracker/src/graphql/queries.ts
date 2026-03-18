/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getWorkoutProgram = /* GraphQL */ `query GetWorkoutProgram($id: ID!) {
  getWorkoutProgram(id: $id) {
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
` as GeneratedQuery<APITypes.GetWorkoutProgramQueryVariables, APITypes.GetWorkoutProgramQuery>;
export const listWorkoutPrograms = /* GraphQL */ `query ListWorkoutPrograms(
  $filter: ModelWorkoutProgramFilterInput
  $limit: Int
  $nextToken: String
) {
  listWorkoutPrograms(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      description
      status
      deadline
      color
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListWorkoutProgramsQueryVariables, APITypes.ListWorkoutProgramsQuery>;
export const getExercise = /* GraphQL */ `query GetExercise($id: ID!) {
  getExercise(id: $id) {
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
` as GeneratedQuery<APITypes.GetExerciseQueryVariables, APITypes.GetExerciseQuery>;
export const listExercises = /* GraphQL */ `query ListExercises(
  $filter: ModelExerciseFilterInput
  $limit: Int
  $nextToken: String
) {
  listExercises(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListExercisesQueryVariables, APITypes.ListExercisesQuery>;
export const getMeal = /* GraphQL */ `query GetMeal($id: ID!) {
  getMeal(id: $id) {
    id
    userName
    content
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetMealQueryVariables, APITypes.GetMealQuery>;
export const listMeals = /* GraphQL */ `query ListMeals(
  $filter: ModelMealFilterInput
  $limit: Int
  $nextToken: String
) {
  listMeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userName
      content
      timestamp
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListMealsQueryVariables, APITypes.ListMealsQuery>;
export const getAuthActivity = /* GraphQL */ `query GetAuthActivity($id: ID!) {
  getAuthActivity(id: $id) {
    id
    userName
    activityType
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetAuthActivityQueryVariables, APITypes.GetAuthActivityQuery>;
export const listAuthActivities = /* GraphQL */ `query ListAuthActivities(
  $filter: ModelAuthActivityFilterInput
  $limit: Int
  $nextToken: String
) {
  listAuthActivities(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userName
      activityType
      timestamp
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListAuthActivitiesQueryVariables, APITypes.ListAuthActivitiesQuery>;
