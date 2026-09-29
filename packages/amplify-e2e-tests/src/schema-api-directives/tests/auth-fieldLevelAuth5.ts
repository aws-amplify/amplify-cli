//schema
export const schema = `
##error: missing the owner field, 
##change: added the missign owner field
##change: removed the  on the updateAt field // or @auth(rules: [{ allow: groups, groups: ["Admins"] }])

type Todo 
  @model
{
  id: ID! 
  owner: String
  updatedAt: AWSDateTime! @auth(rules: [{ allow: owner, operations: [update] }])
  content: String! @auth(rules: [{ allow: owner, operations: [update] }])
}

##fieldLevelAuth5`;
//mutations
export const mutation1 = `
mutation CreateTodo {
    createTodo(input: {
      id: "1",
      owner: "user1",
      updatedAt: "2020-01-01T01:05:49.129Z"
      content: "todo1 content"
    }) {
      id
      owner
      updatedAt
      content
    }
}`;
export const expected_result_mutation1 = {
  data: {
    createTodo: {
      id: '1',
      owner: 'user1',
      updatedAt: '2020-01-01T01:05:49.129Z',
      content: 'todo1 content',
    },
  },
};

export const mutation2 = `
mutation UpdateTodo {
    updateTodo(input: {
      id: "1",
      owner: "user1",
      updatedAt: "2020-05-20T01:05:49.129Z"
      content: "todo1 content updated"
    }) {
      id
      owner
      updatedAt
      content
    }
}`;
export const expected_result_mutation2 = {
  data: {
    updateTodo: {
      id: '1',
      owner: 'user1',
      updatedAt: '2020-05-20T01:05:49.129Z',
      content: 'todo1 content updated',
    },
  },
};
