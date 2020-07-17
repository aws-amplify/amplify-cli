//schema
export const schema = `
type Todo @model
  @auth(rules: [{ allow: owner }]) {
  id: ID!
  updatedAt: AWSDateTime!
  content: String!
}

##auth/owner5`;
//mutations
export const mutation1 = `
mutation CreateTodo(
    $input: CreateTodoInput!
    $condition: ModelTodoConditionInput
  ) {
    createTodo(input: $input, condition: $condition) {
      id
      updatedAt
      content
      createdAt
      owner
    }
}`;
export const input_mutation1 = {
  input: {
    id: '1',
    updatedAt: '2020-05-20T01:05:49.129Z',
    content: 'todo1',
  },
};
export const expected_result_mutation1 = {
  data: {
    createTodo: {
      id: '1',
      updatedAt: '2020-05-20T01:05:49.129Z',
      content: 'todo1',
      createdAt: '<check-defined>',
      owner: 'user1',
    },
  },
};

export const mutation2 = `
 mutation UpdateTodo(
    $input: UpdateTodoInput!
    $condition: ModelTodoConditionInput
  ) {
    updateTodo(input: $input, condition: $condition) {
      id
      updatedAt
      content
      createdAt
      owner
    }
}`;
export const input_mutation2 = {
  input: {
    id: '1',
    updatedAt: '2020-05-20T01:05:49.129Z',
    content: 'todo1-updated',
  },
};
export const expected_result_mutation2 = {
  data: {
    updateTodo: {
      id: '1',
      updatedAt: '2020-05-20T01:05:49.129Z',
      content: 'todo1-updated',
      createdAt: '<check-defined>',
      owner: 'user1',
    },
  },
};
