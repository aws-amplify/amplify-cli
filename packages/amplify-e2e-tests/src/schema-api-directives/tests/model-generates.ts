//schema
export const schema = `
type Post @model {
  id: ID!
  title: String
  metadata: MetaData
}
type MetaData {
  category: Category
}
enum Category {
  comedy
  news
}

##model/genreates
`;
//mutations
export const mutation1 = `
mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
      id
      title
      metadata {
        category
      }
      createdAt
      updatedAt
    }
}`;
export const input_mutation1 = {
  input: {
    id: '1',
    title: 'title1',
    metadata: {
      category: 'comedy',
    },
  },
};
export const expected_result_mutation1 = {
  data: {
    createPost: {
      id: '1',
      title: 'title1',
      metadata: {
        category: 'comedy',
      },
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
      metadata {
        category
      }
      createdAt
      updatedAt
    }
}`;

export const input_mutation2 = {
  input: {
    id: '1',
    title: 'title1-updated',
    metadata: {
      category: 'news',
    },
  },
};
export const expected_result_mutation2 = {
  data: {
    updatePost: {
      id: '1',
      title: 'title1-updated',
      metadata: {
        category: 'news',
      },
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
      metadata {
        category
      }
      createdAt
      updatedAt
    }
}`;
export const expected_result_query = {
  data: {
    getPost: {
      id: '1',
      title: 'title1-updated',
      metadata: {
        category: 'news',
      },
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};
