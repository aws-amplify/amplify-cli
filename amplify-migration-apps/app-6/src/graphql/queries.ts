/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getMoodItem = /* GraphQL */ `query GetMoodItem($id: ID!) {
  getMoodItem(id: $id) {
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
` as GeneratedQuery<APITypes.GetMoodItemQueryVariables, APITypes.GetMoodItemQuery>;
export const listMoodItems = /* GraphQL */ `query ListMoodItems(
  $filter: ModelMoodItemFilterInput
  $limit: Int
  $nextToken: String
) {
  listMoodItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      description
      image
      boardID
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListMoodItemsQueryVariables, APITypes.ListMoodItemsQuery>;
export const getBoard = /* GraphQL */ `query GetBoard($id: ID!) {
  getBoard(id: $id) {
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
` as GeneratedQuery<APITypes.GetBoardQueryVariables, APITypes.GetBoardQuery>;
export const listBoards = /* GraphQL */ `query ListBoards(
  $filter: ModelBoardFilterInput
  $limit: Int
  $nextToken: String
) {
  listBoards(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListBoardsQueryVariables, APITypes.ListBoardsQuery>;
export const moodItemsByBoardID = /* GraphQL */ `query MoodItemsByBoardID(
  $boardID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelMoodItemFilterInput
  $limit: Int
  $nextToken: String
) {
  moodItemsByBoardID(
    boardID: $boardID
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      title
      description
      image
      boardID
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.MoodItemsByBoardIDQueryVariables, APITypes.MoodItemsByBoardIDQuery>;
export const getRandomEmoji = /* GraphQL */ `query GetRandomEmoji {
  getRandomEmoji
}
` as GeneratedQuery<APITypes.GetRandomEmojiQueryVariables, APITypes.GetRandomEmojiQuery>;
export const getKinesisEvents = /* GraphQL */ `query GetKinesisEvents {
  getKinesisEvents
}
` as GeneratedQuery<APITypes.GetKinesisEventsQueryVariables, APITypes.GetKinesisEventsQuery>;
