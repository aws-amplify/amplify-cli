//schema
export const schema = `
type Post @model @searchable {
  id: ID!
  title: String!
  createdAt: String!
  updatedAt: String!
  upvotes: Int
}`;

//mutations
export const mutation = `
mutation CreatePost {
  createPost(input: { title: "Stream me to Elasticsearch!" }) {
    id
    title
    createdAt
    updatedAt
    upvotes
  }
}`;

export const expected_result_mutation = {
  data: {
    createPost: {
      id: '<check-defined>',
      title: 'Stream me to Elasticsearch!',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
      upvotes: null,
    },
  },
};

//queries
//#error: add "s" for searchPosts
export const query1 = `
#error: add "s" for searchPosts
query SearchPosts {
  searchPosts(filter: { title: { match: "Stream" }}) {
    items {
      id
      title
    }
  }
}`;
export const expected_result_query1 = {
  data: {
    searchPosts: {
      items: [
        {
          id: '<check-defined>',
          title: 'Stream me to Elasticsearch!',
        },
      ],
    },
  },
};

export const query2 = `
#error: add "s" for searchPosts
query SearchPosts {
  searchPosts(filter: { title: { wildcard: "S*Elasticsearch!" }}) {
    items {
      id
      title
    }
  }
}`;
//#error: wildcard is not working properly, the query does not contain the expected items
export const expected_result_query2 = {
  data: {
    searchPosts: {
      items: [],
    },
  },
};
