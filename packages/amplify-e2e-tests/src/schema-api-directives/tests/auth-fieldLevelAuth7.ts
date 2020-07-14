//schema
export const schema = `
#error: missing the closing ) in the model level @auth annotation
#error: missing the owner field, 
#change: added the missign owner field

type Todo
  @model @auth(rules: [{allow: groups, groups: ["Admin"], operations:[update] }])
{
  id: ID! 
  owner: String
  updatedAt: AWSDateTime! 
  content: String! @auth(rules: [{ allow: owner, operations: [update] }])
}

##fieldLevelAuth7`;
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
