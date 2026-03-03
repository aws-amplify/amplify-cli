/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getRandomQuote = /* GraphQL */ `query GetRandomQuote {
  getRandomQuote {
    message
    quote
    author
    timestamp
    totalQuotes
    __typename
  }
}
` as GeneratedQuery<APITypes.GetRandomQuoteQueryVariables, APITypes.GetRandomQuoteQuery>;
export const getProject = /* GraphQL */ `query GetProject($id: ID!) {
  getProject(id: $id) {
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
` as GeneratedQuery<APITypes.GetProjectQueryVariables, APITypes.GetProjectQuery>;
export const listProjects = /* GraphQL */ `query ListProjects(
  $filter: ModelProjectFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      description
      status
      deadline
      color
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.ListProjectsQueryVariables, APITypes.ListProjectsQuery>;
export const syncProjects = /* GraphQL */ `query SyncProjects(
  $filter: ModelProjectFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncProjects(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
      id
      title
      description
      status
      deadline
      color
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.SyncProjectsQueryVariables, APITypes.SyncProjectsQuery>;
export const getTodo = /* GraphQL */ `query GetTodo($id: ID!) {
  getTodo(id: $id) {
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
` as GeneratedQuery<APITypes.GetTodoQueryVariables, APITypes.GetTodoQuery>;
export const listTodos = /* GraphQL */ `query ListTodos(
  $filter: ModelTodoFilterInput
  $limit: Int
  $nextToken: String
) {
  listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.ListTodosQueryVariables, APITypes.ListTodosQuery>;
export const syncTodos = /* GraphQL */ `query SyncTodos(
  $filter: ModelTodoFilterInput
  $limit: Int
  $nextToken: String
  $lastSync: AWSTimestamp
) {
  syncTodos(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    lastSync: $lastSync
  ) {
    items {
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
    nextToken
    startedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.SyncTodosQueryVariables, APITypes.SyncTodosQuery>;
