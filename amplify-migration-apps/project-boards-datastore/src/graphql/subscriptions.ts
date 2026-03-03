/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateProject = /* GraphQL */ `subscription OnCreateProject($filter: ModelSubscriptionProjectFilterInput) {
  onCreateProject(filter: $filter) {
    id
    title
    description
    status
    deadline
    color
    todos {
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnCreateProjectSubscriptionVariables, APITypes.OnCreateProjectSubscription>;
export const onUpdateProject = /* GraphQL */ `subscription OnUpdateProject($filter: ModelSubscriptionProjectFilterInput) {
  onUpdateProject(filter: $filter) {
    id
    title
    description
    status
    deadline
    color
    todos {
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnUpdateProjectSubscriptionVariables, APITypes.OnUpdateProjectSubscription>;
export const onDeleteProject = /* GraphQL */ `subscription OnDeleteProject($filter: ModelSubscriptionProjectFilterInput) {
  onDeleteProject(filter: $filter) {
    id
    title
    description
    status
    deadline
    color
    todos {
      nextToken
      startedAt
      __typename
    }
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnDeleteProjectSubscriptionVariables, APITypes.OnDeleteProjectSubscription>;
export const onCreateTodo = /* GraphQL */ `subscription OnCreateTodo($filter: ModelSubscriptionTodoFilterInput) {
  onCreateTodo(filter: $filter) {
    id
    name
    description
    images
    projectID
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    projectTodosId
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnCreateTodoSubscriptionVariables, APITypes.OnCreateTodoSubscription>;
export const onUpdateTodo = /* GraphQL */ `subscription OnUpdateTodo($filter: ModelSubscriptionTodoFilterInput) {
  onUpdateTodo(filter: $filter) {
    id
    name
    description
    images
    projectID
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    projectTodosId
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnUpdateTodoSubscriptionVariables, APITypes.OnUpdateTodoSubscription>;
export const onDeleteTodo = /* GraphQL */ `subscription OnDeleteTodo($filter: ModelSubscriptionTodoFilterInput) {
  onDeleteTodo(filter: $filter) {
    id
    name
    description
    images
    projectID
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
    projectTodosId
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnDeleteTodoSubscriptionVariables, APITypes.OnDeleteTodoSubscription>;
