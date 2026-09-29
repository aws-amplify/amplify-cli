/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateMoodItem = /* GraphQL */ `subscription OnCreateMoodItem($filter: ModelSubscriptionMoodItemFilterInput) {
  onCreateMoodItem(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnCreateMoodItemSubscriptionVariables, APITypes.OnCreateMoodItemSubscription>;
export const onUpdateMoodItem = /* GraphQL */ `subscription OnUpdateMoodItem($filter: ModelSubscriptionMoodItemFilterInput) {
  onUpdateMoodItem(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnUpdateMoodItemSubscriptionVariables, APITypes.OnUpdateMoodItemSubscription>;
export const onDeleteMoodItem = /* GraphQL */ `subscription OnDeleteMoodItem($filter: ModelSubscriptionMoodItemFilterInput) {
  onDeleteMoodItem(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnDeleteMoodItemSubscriptionVariables, APITypes.OnDeleteMoodItemSubscription>;
export const onCreateBoard = /* GraphQL */ `subscription OnCreateBoard($filter: ModelSubscriptionBoardFilterInput) {
  onCreateBoard(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnCreateBoardSubscriptionVariables, APITypes.OnCreateBoardSubscription>;
export const onUpdateBoard = /* GraphQL */ `subscription OnUpdateBoard($filter: ModelSubscriptionBoardFilterInput) {
  onUpdateBoard(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnUpdateBoardSubscriptionVariables, APITypes.OnUpdateBoardSubscription>;
export const onDeleteBoard = /* GraphQL */ `subscription OnDeleteBoard($filter: ModelSubscriptionBoardFilterInput) {
  onDeleteBoard(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnDeleteBoardSubscriptionVariables, APITypes.OnDeleteBoardSubscription>;
