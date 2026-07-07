//schema
export const schema = `
type Post @model @versioned {
  id: ID!
  title: String!
  version: Int! # <- If not provided, it is added for you.
}

##versioned/usage`;
//mutations
export const mutation1 = `
#change: add id: "1" in the input, so update mutation can be carried out
mutation Create {
  createPost(input: { 
    id: "1"
    title: "Conflict detection in the cloud!" 
  }) {
    id
    title
    version # will be 1
  }
}
`;
export const expected_result_mutation1 = {
  data: {
    createPost: {
      id: '1',
      title: 'Conflict detection in the cloud!',
      version: 1,
    },
  },
};

export const mutation2 = `
mutation Update($postId: ID!) {
  updatePost(input: { id: $postId, title: "Conflict detection in the cloud is great!", expectedVersion: 1 }) {
    id
    title
    version # will be 2
  }
}
`;
export const input_mutation2 = {
  postId: '1',
};
export const expected_result_mutation2 = {
  data: {
    updatePost: {
      id: '1',
      title: 'Conflict detection in the cloud is great!',
      version: 2,
    },
  },
};

export const mutation3 = `
mutation Delete($postId: ID!) {
  deletePost(input: { id: $postId, expectedVersion: 2 }) {
    id
    title
    version
  }
}
`;
export const input_mutation3 = {
  postId: '1',
};
export const expected_result_mutation3 = {
  data: {
    deletePost: {
      id: '1',
      title: 'Conflict detection in the cloud is great!',
      version: 2,
    },
  },
};
