/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getNote = /* GraphQL */ `query GetNote($id: ID!) {
  getNote(id: $id) {
    id
    title
    content
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedQuery<APITypes.GetNoteQueryVariables, APITypes.GetNoteQuery>;
export const listNotes = /* GraphQL */ `query ListNotes(
  $filter: ModelNoteFilterInput
  $limit: Int
  $nextToken: String
) {
  listNotes(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      content
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListNotesQueryVariables, APITypes.ListNotesQuery>;
export const generateThumbnail = /* GraphQL */ `query GenerateThumbnail($mediaFileKey: String!) {
  generateThumbnail(mediaFileKey: $mediaFileKey) {
    statusCode
    message
    __typename
  }
}
` as GeneratedQuery<APITypes.GenerateThumbnailQueryVariables, APITypes.GenerateThumbnailQuery>;
export const addUserToGroup = /* GraphQL */ `query AddUserToGroup($userSub: String!, $group: String!) {
  addUserToGroup(userSub: $userSub, group: $group) {
    statusCode
    message
    __typename
  }
}
` as GeneratedQuery<APITypes.AddUserToGroupQueryVariables, APITypes.AddUserToGroupQuery>;
export const removeUserFromGroup = /* GraphQL */ `query RemoveUserFromGroup($userSub: String!, $group: String!) {
  removeUserFromGroup(userSub: $userSub, group: $group) {
    statusCode
    message
    __typename
  }
}
` as GeneratedQuery<APITypes.RemoveUserFromGroupQueryVariables, APITypes.RemoveUserFromGroupQuery>;
