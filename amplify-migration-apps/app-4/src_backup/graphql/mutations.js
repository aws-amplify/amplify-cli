/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createProject = /* GraphQL */ `
  mutation CreateProject($input: CreateProjectInput!, $condition: ModelProjectConditionInput) {
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
`;
export const updateProject = /* GraphQL */ `
  mutation UpdateProject($input: UpdateProjectInput!, $condition: ModelProjectConditionInput) {
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
`;
export const deleteProject = /* GraphQL */ `
  mutation DeleteProject($input: DeleteProjectInput!, $condition: ModelProjectConditionInput) {
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
`;
export const createTodo = /* GraphQL */ `
  mutation CreateTodo($input: CreateTodoInput!, $condition: ModelTodoConditionInput) {
    createTodo(input: $input, condition: $condition) {
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
export const updateTodo = /* GraphQL */ `
  mutation UpdateTodo($input: UpdateTodoInput!, $condition: ModelTodoConditionInput) {
    updateTodo(input: $input, condition: $condition) {
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
export const deleteTodo = /* GraphQL */ `
  mutation DeleteTodo($input: DeleteTodoInput!, $condition: ModelTodoConditionInput) {
    deleteTodo(input: $input, condition: $condition) {
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
