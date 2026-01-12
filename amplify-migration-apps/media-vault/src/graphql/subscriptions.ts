/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateNote = /* GraphQL */ `subscription OnCreateNote(
  $filter: ModelSubscriptionNoteFilterInput
  $owner: String
) {
  onCreateNote(filter: $filter, owner: $owner) {
    id
    title
    content
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnCreateNoteSubscriptionVariables, APITypes.OnCreateNoteSubscription>;
export const onUpdateNote = /* GraphQL */ `subscription OnUpdateNote(
  $filter: ModelSubscriptionNoteFilterInput
  $owner: String
) {
  onUpdateNote(filter: $filter, owner: $owner) {
    id
    title
    content
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnUpdateNoteSubscriptionVariables, APITypes.OnUpdateNoteSubscription>;
export const onDeleteNote = /* GraphQL */ `subscription OnDeleteNote(
  $filter: ModelSubscriptionNoteFilterInput
  $owner: String
) {
  onDeleteNote(filter: $filter, owner: $owner) {
    id
    title
    content
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnDeleteNoteSubscriptionVariables, APITypes.OnDeleteNoteSubscription>;
