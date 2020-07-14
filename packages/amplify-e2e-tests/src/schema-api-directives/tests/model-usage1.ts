//schema
export const schema = `
type Post @model {
  id: ID! # id: ID! is a required attribute.
  title: String!
  tags: [String!]!
}

##model/usage1`;
//mutations
export const mutation1 = `
mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
      id
      title
      tags
      createdAt
      updatedAt
    }
}`;
export const input_mutation1 = {
  input: {
    id: '1',
    title: 'title1',
    tags: ['tag1'],
  },
};
export const expected_result_mutation1 = {
  data: {
    createPost: {
      id: '1',
      title: 'title1',
      tags: ['tag1'],
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};

export const mutation2 = `
  mutation UpdatePost(
    $input: UpdatePostInput!
    $condition: ModelPostConditionInput
  ) {
    updatePost(input: $input, condition: $condition) {
      id
      title
      tags
      createdAt
      updatedAt
    }
}`;
export const input_mutation2 = {
  input: {
    id: '1',
    title: 'title1 updated',
    tags: ['tag1', 'new-tag'],
  },
};
export const expected_result_mutation2 = {
  data: {
    updatePost: {
      id: '1',
      title: 'title1 updated',
      tags: ['tag1', 'new-tag'],
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};

//queries
export const query = `
query GetPost{
    getPost(id: "1") {
      id
      title
      tags
      createdAt
      updatedAt
    }
}`;
export const expected_result_query = {
  data: {
    getPost: {
      id: '1',
      title: 'title1 updated',
      tags: ['tag1', 'new-tag'],
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};
