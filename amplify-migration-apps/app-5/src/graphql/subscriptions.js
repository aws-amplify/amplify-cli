/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateProject = /* GraphQL */ `
  subscription OnCreateProject($filter: ModelSubscriptionProjectFilterInput, $owner: String) {
    onCreateProject(filter: $filter, owner: $owner) {
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
export const onUpdateProject = /* GraphQL */ `
  subscription OnUpdateProject($filter: ModelSubscriptionProjectFilterInput, $owner: String) {
    onUpdateProject(filter: $filter, owner: $owner) {
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
export const onDeleteProject = /* GraphQL */ `
  subscription OnDeleteProject($filter: ModelSubscriptionProjectFilterInput, $owner: String) {
    onDeleteProject(filter: $filter, owner: $owner) {
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
export const onCreateTodo = /* GraphQL */ `
  subscription OnCreateTodo($filter: ModelSubscriptionTodoFilterInput, $owner: String) {
    onCreateTodo(filter: $filter, owner: $owner) {
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
export const onUpdateTodo = /* GraphQL */ `
  subscription OnUpdateTodo($filter: ModelSubscriptionTodoFilterInput, $owner: String) {
    onUpdateTodo(filter: $filter, owner: $owner) {
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
export const onDeleteTodo = /* GraphQL */ `
  subscription OnDeleteTodo($filter: ModelSubscriptionTodoFilterInput, $owner: String) {
    onDeleteTodo(filter: $filter, owner: $owner) {
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
