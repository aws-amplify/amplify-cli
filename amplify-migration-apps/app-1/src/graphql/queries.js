/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      email
      name
      role
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listUsers = /* GraphQL */ `
  query ListUsers($filter: ModelUserFilterInput, $limit: Int, $nextToken: String) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        email
        name
        role
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getProduct = /* GraphQL */ `
  query GetProduct($id: ID!) {
    getProduct(id: $id) {
      id
      serialno
      engword
      price
      category
      description
      stock
      brand
      imageKey
      images
      createdBy
      updatedBy
      createdAt
      updatedAt
      comments {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const listProducts = /* GraphQL */ `
  query ListProducts($filter: ModelProductFilterInput, $limit: Int, $nextToken: String) {
    listProducts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        serialno
        engword
        price
        category
        description
        stock
        brand
        imageKey
        images
        createdBy
        updatedBy
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getComment = /* GraphQL */ `
  query GetComment($id: ID!) {
    getComment(id: $id) {
      id
      productId
      product {
        id
        serialno
        engword
        price
        category
        description
        stock
        brand
        imageKey
        images
        createdBy
        updatedBy
        createdAt
        updatedAt
        __typename
      }
      authorId
      authorName
      content
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listComments = /* GraphQL */ `
  query ListComments($filter: ModelCommentFilterInput, $limit: Int, $nextToken: String) {
    listComments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        productId
        authorId
        authorName
        content
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const commentsByProductId = /* GraphQL */ `
  query CommentsByProductId(
    $productId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelCommentFilterInput
    $limit: Int
    $nextToken: String
  ) {
    commentsByProductId(productId: $productId, sortDirection: $sortDirection, filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        productId
        authorId
        authorName
        content
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
