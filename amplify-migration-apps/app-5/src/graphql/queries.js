/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getRandomQuote = /* GraphQL */ `
  query GetRandomQuote {
    getRandomQuote {
      message
      quote
      author
      timestamp
      totalQuotes
      __typename
    }
  }
`;
export const getProject = /* GraphQL */ `
  query GetProject($id: ID!) {
    getProject(id: $id) {
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
`;
export const listProjects = /* GraphQL */ `
  query ListProjects($filter: ModelProjectFilterInput, $limit: Int, $nextToken: String) {
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
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getTodo = /* GraphQL */ `
  query GetTodo($id: ID!) {
    getTodo(id: $id) {
      id
      name
      description
      images
      projectID
      createdAt
      updatedAt
      projectTodosId
      owner
      __typename
    }
  }
`;
export const listTodos = /* GraphQL */ `
  query ListTodos($filter: ModelTodoFilterInput, $limit: Int, $nextToken: String) {
    listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
        images
        projectID
        createdAt
        updatedAt
        projectTodosId
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
