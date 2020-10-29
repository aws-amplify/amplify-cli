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

    # Each record may specify which groups may read them.
    { allow: groups, groupsField: "groupsCanAccess", operations: [read] }
  ]) {
  id: ID!
  title: String!
  content: String
  owner: String
  editors: [String]!
  groupsCanAccess: [String]!
}

##dynamicGroup3`;
//mutations
export const mutation1 = `
#change: add id: "1" so result can be verified
mutation CreateDraft {
  createDraft(input: {
    id: "1",
    title: "A new draft",
    editors: [],
    groupsCanAccess: ["BizDev"]
  }) {
    id
    groupsCanAccess
  }
}`;
export const expected_result_mutation1 = {
  data: {
    createDraft: {
      id: '1',
      groupsCanAccess: ['BizDev'],
    },
  },
};

export const mutation2 = `
#change: add id: "2" so result can be verified
mutation CreateDraft {
  createDraft(input: {
    id: "2",
    title: "Another draft",
    editors: [],
    groupsCanAccess: ["Marketing"]
  }) {
    id
    groupsCanAccess
  }
}`;
export const expected_result_mutation2 = {
  data: {
    createDraft: {
      id: '2',
      groupsCanAccess: ['Marketing'],
    },
  },
};
