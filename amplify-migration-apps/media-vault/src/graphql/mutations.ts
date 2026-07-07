/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createNote = /* GraphQL */ `mutation CreateNote(
  $input: CreateNoteInput!
  $condition: ModelNoteConditionInput
) {
  createNote(input: $input, condition: $condition) {
    id
    title
    content
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateNoteMutationVariables, APITypes.CreateNoteMutation>;
export const updateNote = /* GraphQL */ `mutation UpdateNote(
  $input: UpdateNoteInput!
  $condition: ModelNoteConditionInput
) {
  updateNote(input: $input, condition: $condition) {
    id
    title
    content
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateNoteMutationVariables, APITypes.UpdateNoteMutation>;
export const deleteNote = /* GraphQL */ `mutation DeleteNote(
  $input: DeleteNoteInput!
  $condition: ModelNoteConditionInput
) {
  deleteNote(input: $input, condition: $condition) {
    id
    title
    content
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteNoteMutationVariables, APITypes.DeleteNoteMutation>;
