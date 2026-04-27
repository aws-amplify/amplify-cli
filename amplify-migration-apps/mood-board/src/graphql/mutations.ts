/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createMoodItem = /* GraphQL */ `mutation CreateMoodItem(
  $input: CreateMoodItemInput!
  $condition: ModelMoodItemConditionInput
) {
  createMoodItem(input: $input, condition: $condition) {
    id
    title
    description
    image
    boardID
    board {
      id
      name
      createdAt
      updatedAt
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateMoodItemMutationVariables, APITypes.CreateMoodItemMutation>;
export const updateMoodItem = /* GraphQL */ `mutation UpdateMoodItem(
  $input: UpdateMoodItemInput!
  $condition: ModelMoodItemConditionInput
) {
  updateMoodItem(input: $input, condition: $condition) {
    id
    title
    description
    image
    boardID
    board {
      id
      name
      createdAt
      updatedAt
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateMoodItemMutationVariables, APITypes.UpdateMoodItemMutation>;
export const deleteMoodItem = /* GraphQL */ `mutation DeleteMoodItem(
  $input: DeleteMoodItemInput!
  $condition: ModelMoodItemConditionInput
) {
  deleteMoodItem(input: $input, condition: $condition) {
    id
    title
    description
    image
    boardID
    board {
      id
      name
      createdAt
      updatedAt
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteMoodItemMutationVariables, APITypes.DeleteMoodItemMutation>;
export const createBoard = /* GraphQL */ `mutation CreateBoard(
  $input: CreateBoardInput!
  $condition: ModelBoardConditionInput
) {
  createBoard(input: $input, condition: $condition) {
    id
    name
    moodItems {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateBoardMutationVariables, APITypes.CreateBoardMutation>;
export const updateBoard = /* GraphQL */ `mutation UpdateBoard(
  $input: UpdateBoardInput!
  $condition: ModelBoardConditionInput
) {
  updateBoard(input: $input, condition: $condition) {
    id
    name
    moodItems {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateBoardMutationVariables, APITypes.UpdateBoardMutation>;
export const deleteBoard = /* GraphQL */ `mutation DeleteBoard(
  $input: DeleteBoardInput!
  $condition: ModelBoardConditionInput
) {
  deleteBoard(input: $input, condition: $condition) {
    id
    name
    moodItems {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteBoardMutationVariables, APITypes.DeleteBoardMutation>;
