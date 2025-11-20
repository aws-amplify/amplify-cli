/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createProject = /* GraphQL */ `mutation CreateProject(
  $input: CreateProjectInput!
  $condition: ModelProjectConditionInput
) {
  createProject(input: $input, condition: $condition) {
    id
    title
    description
    status
    deadline
    color
    todos {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.CreateProjectMutationVariables, APITypes.CreateProjectMutation>;
export const updateProject = /* GraphQL */ `mutation UpdateProject(
  $input: UpdateProjectInput!
  $condition: ModelProjectConditionInput
) {
  updateProject(input: $input, condition: $condition) {
    id
    title
    description
    status
    deadline
    color
    todos {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.UpdateProjectMutationVariables, APITypes.UpdateProjectMutation>;
export const deleteProject = /* GraphQL */ `mutation DeleteProject(
  $input: DeleteProjectInput!
  $condition: ModelProjectConditionInput
) {
  deleteProject(input: $input, condition: $condition) {
    id
    title
    description
    status
    deadline
    color
    todos {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteProjectMutationVariables, APITypes.DeleteProjectMutation>;
export const createTodo = /* GraphQL */ `mutation CreateTodo(
  $input: CreateTodoInput!
  $condition: ModelTodoConditionInput
) {
  createTodo(input: $input, condition: $condition) {
    id
    name
    description
    images
    projectID
    project {
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
    createdAt
    updatedAt
    projectTodosId
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
    projectID
    project {
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
    createdAt
    updatedAt
    projectTodosId
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
    projectID
    project {
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
    createdAt
    updatedAt
    projectTodosId
    owner
    __typename
  }
}
` as GeneratedMutation<APITypes.DeleteTodoMutationVariables, APITypes.DeleteTodoMutation>;
