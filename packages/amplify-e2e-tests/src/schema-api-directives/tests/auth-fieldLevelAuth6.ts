//schema
export const schema = `
#error: missing the owner field, 
#change: added the missign owner field
#error: Per-field auth on the required field updatedAt is not supported with subscriptions.
#Either make the field optional, set auth on the object and not the field, 
#or disable subscriptions for the object (setting level to off or public)
#change: made the updatedAt field optional
#error: updatedAt field caused Unauthorized error in CreateTodo due a recent change in @auth 
#change: changed updatedAt to updatedOn


type Todo @model
{
  id: ID! 
  owner: String
  updatedOn: AWSDateTime @auth(rules: [{ allow: groups, groups: ["ForbiddenGroup"] }])
  content: String! @auth(rules: [{ allow: owner, operations: [update] }])
}

##fieldLevelAuth6`;
//mutations
export const mutation1 = `
mutation CreateTodo {
    createTodo(input: {
      id: "1",
      owner: "user1",
      content: "todo1 content"
    }) {
      id
      owner
      content
    }
}`;
export const expected_result_mutation1 = {
  data: {
    createTodo: {
      id: '1',
      owner: 'user1',
      content: 'todo1 content',
    },
  },
};

export const mutation2 = `
mutation UpdateTodo {
    updateTodo(input: {
      id: "1",
      owner: "user1",
      content: "todo1 content updated"
    }) {
      id
      owner
      content
    }
}`;
export const expected_result_mutation2 = {
  data: {
    updateTodo: {
      id: '1',
      owner: 'user1',
      content: 'todo1 content updated',
    },
  },
};
