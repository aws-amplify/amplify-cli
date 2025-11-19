/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createTodo = /* GraphQL */ `mutation CreateTodo(
  $input: CreateTodoInput!
  $condition: ModelTodoConditionInput
) {
  createTodo(input: $input, condition: $condition) {
    id
    name
    description
    images
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateTodoMutationVariables, APITypes.CreateTodoMutation>;
export const updateTodo = /* GraphQL */ `mutation UpdateTodo(
  $input: UpdateTodoInput!
  $condition: ModelTodoConditionInput
) {
  updateTodo(input: $input, condition: $condition) {
    id
    name
    description
    images
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateTodoMutationVariables, APITypes.UpdateTodoMutation>;
export const deleteTodo = /* GraphQL */ `mutation DeleteTodo(
  $input: DeleteTodoInput!
  $condition: ModelTodoConditionInput
) {
  deleteTodo(input: $input, condition: $condition) {
    id
    name
    description
    images
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteTodoMutationVariables, APITypes.DeleteTodoMutation>;
