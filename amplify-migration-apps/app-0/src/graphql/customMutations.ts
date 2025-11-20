/* Custom mutations to avoid relationship issues */

export const createTodoCustom = /* GraphQL */ `
  mutation CreateTodo($input: CreateTodoInput!) {
    createTodo(input: $input) {
      id
      name
      description
      images
      projectID
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;

export const updateTodoCustom = /* GraphQL */ `
  mutation UpdateTodo($input: UpdateTodoInput!) {
    updateTodo(input: $input) {
      id
      name
      description
      images
      projectID
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;

export const createProjectCustom = /* GraphQL */ `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
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
  }
`;

export const updateProjectCustom = /* GraphQL */ `
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
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
  }
`;

export const deleteTodoCustom = /* GraphQL */ `
  mutation DeleteTodo($input: DeleteTodoInput!) {
    deleteTodo(input: $input) {
      id
      name
      description
      images
      projectID
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
