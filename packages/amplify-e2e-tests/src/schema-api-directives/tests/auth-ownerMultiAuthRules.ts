//schema
export const schema = `
#error: need to add "create" in the editors' operations in order for the mutation #5 to succeed
type Draft
  @model
  @auth(
    rules: [
      # Defaults to use the "owner" field.
      { allow: owner }
      # Authorize the update mutation and both queries. Use "queries: null" to disable auth for queries.
      { allow: owner, ownerField: "editors", operations: [create, update, read] }
    ]
  ) {
  id: ID!
  title: String!
  content: String
  owner: String
  editors: [String]
}

##auth/multiAuthRules
`;
//mutations
export const mutation1 = `
#1
mutation CreateDraft {
  createDraft(input: { title: "A new draft" }) {
    id
    title
    owner
    editors
  }
}
`;
//#change: for the id field, changed "..." to "<check-defined>"
//so the test bench will check it is defined instead of checking for a particular id
//the same change is applied to the following mutation results
//#change: change the owner from "someone@my-domain.com" to "user1" as it is the user setup by the test bench
//the same change is applied to the following mutaiton results
export const expected_result_mutation1 = {
  data: {
    createDraft: {
      id: '<check-defined>',
      title: 'A new draft',
      owner: 'user1',
      editors: ['user1'],
    },
  },
};

export const mutation2 = `
#2
mutation CreateDraft {
  createDraft(
    input: {
      title: "A new draft",
      editors: []
    }
  ) {
    id
    title
    owner
    editors
  }
}
`;

export const expected_result_mutation2 = {
  data: {
    createDraft: {
      id: '<check-defined>',
      title: 'A new draft',
      owner: 'user1',
      editors: [],
    },
  },
};

export const mutation3 = `
#3
mutation CreateDraft {
  createDraft(
    input: {
      title: "A new draft",
      editors: ["editor1@my-domain.com", "editor2@my-domain.com"]
    }
  ) {
    id
    title
    owner
    editors
  }
}
`;
export const expected_result_mutation3 = {
  data: {
    createDraft: {
      id: '<check-defined>',
      title: 'A new draft',
      owner: 'user1',
      editors: ['editor1@my-domain.com', 'editor2@my-domain.com'],
    },
  },
};

export const mutation4 = `
#4
mutation CreateDraft {
  createDraft(
    input: {
      title: "A new draft",
      editors: [],
      owner: null
    }
  ) {
    id
    title
    owner
    editors
  }
}
`;
export const expected_result_mutation4 = {
  graphQLErrors: [
    {
      errorType: 'Unauthorized',
    },
  ],
};

export const mutation5 = `
#5
mutation CreateDraft {
  createDraft(
    input: {
      title: "A new draft",
      editors: ["user1"],
      owner: null
    }
  ) {
    id
    title
    owner
    editors
  }
}
`;
export const expected_result_mutation5 = {
  data: {
    createDraft: {
      id: '<check-defined>',
      title: 'A new draft',
      owner: null,
      editors: ['user1'],
    },
  },
};
