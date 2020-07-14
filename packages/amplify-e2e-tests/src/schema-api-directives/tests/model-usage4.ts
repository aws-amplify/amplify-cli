//schema
export const schema = `
type Post @model {
  id: ID!
  title: String!
  tags: [String!]!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

##model/usage4`;
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
    createdAt: '2020-05-27T01:05:49.129Z',
    updatedAt: '2020-05-28T01:05:49.129Z',
  },
};
export const expected_result_mutation1 = {
  data: {
    createPost: {
      id: '1',
      title: 'title1',
      tags: ['tag1'],
      createdAt: '2020-05-27T01:05:49.129Z',
      updatedAt: '2020-05-28T01:05:49.129Z',
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
    title: 'title1-updated',
    tags: ['tag1-updated'],
    createdAt: '2020-05-27T01:05:49.129Z',
    updatedAt: '2020-05-29T01:05:49.129Z',
  },
};
export const expected_result_mutation2 = {
  data: {
    updatePost: {
      id: '1',
      title: 'title1-updated',
      tags: ['tag1-updated'],
      createdAt: '2020-05-27T01:05:49.129Z',
      updatedAt: '2020-05-29T01:05:49.129Z',
    },
  },
};

//queries
export const query = `
 query GetPost {
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
      title: 'title1-updated',
      tags: ['tag1-updated'],
      createdAt: '2020-05-27T01:05:49.129Z',
      updatedAt: '2020-05-29T01:05:49.129Z',
    },
  },
};
