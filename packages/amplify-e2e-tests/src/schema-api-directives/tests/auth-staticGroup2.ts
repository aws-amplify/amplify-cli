//schema
export const schema = `
type Draft @model
  @auth(rules: [

    # Defaults to use the "owner" field.
    { allow: owner },

    # Authorize the update mutation and both queries. Use 'queries: null' to disable auth for queries.
    { allow: owner, ownerField: "editors", operations: [update] },

    # Admin users can access any operation.
    { allow: groups, groups: ["Admin"] }
  ]) {
  id: ID!
  title: String!
  content: String
  owner: String
  editors: [String]!
}

#staticGroup2`;
//mutations
export const mutation1 = `
mutation CreateDraft(
    $input: CreateDraftInput!
    $condition: ModelDraftConditionInput
  ) {
    createDraft(input: $input, condition: $condition) {
      id
      title
      content
      owner
      editors
      createdAt
      updatedAt
    }
}`;
export const input_mutation1 = {
  input: {
    id: '1',
    title: 'title1',
    content: 'content1',
    owner: 'user1',
    editors: ['user1'],
  },
};
export const expected_result_mutation1 = {
  data: {
    createDraft: {
      id: '1',
      title: 'title1',
      content: 'content1',
      owner: 'user1',
      editors: ['user1'],
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};

export const mutation2 = `
 mutation UpdateDraft(
    $input: UpdateDraftInput!
    $condition: ModelDraftConditionInput
  ) {
    updateDraft(input: $input, condition: $condition) {
      id
      title
      content
      owner
      editors
      createdAt
      updatedAt
    }
  }`;
export const input_mutation2 = {
  input: {
    id: '1',
    title: 'title1-updated',
    content: 'content1-updated',
    owner: 'user1',
    editors: ['user1'],
  },
};
export const expected_result_mutation2 = {
  data: {
    updateDraft: {
      id: '1',
      title: 'title1-updated',
      content: 'content1-updated',
      owner: 'user1',
      editors: ['user1'],
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};
