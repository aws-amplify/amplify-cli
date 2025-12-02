/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getUser = /* GraphQL */ `query GetUser($id: ID!) {
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
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
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
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const getProduct = /* GraphQL */ `query GetProduct($id: ID!) {
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
` as GeneratedQuery<APITypes.GetProductQueryVariables, APITypes.GetProductQuery>;
export const listProducts = /* GraphQL */ `query ListProducts(
  $filter: ModelProductFilterInput
  $limit: Int
  $nextToken: String
) {
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
` as GeneratedQuery<APITypes.ListProductsQueryVariables, APITypes.ListProductsQuery>;
export const getComment = /* GraphQL */ `query GetComment($id: ID!) {
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
` as GeneratedQuery<APITypes.GetCommentQueryVariables, APITypes.GetCommentQuery>;
export const listComments = /* GraphQL */ `query ListComments(
  $filter: ModelCommentFilterInput
  $limit: Int
  $nextToken: String
) {
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
` as GeneratedQuery<APITypes.ListCommentsQueryVariables, APITypes.ListCommentsQuery>;
export const commentsByProductId = /* GraphQL */ `query CommentsByProductId(
  $productId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelCommentFilterInput
  $limit: Int
  $nextToken: String
) {
  commentsByProductId(
    productId: $productId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
` as GeneratedQuery<APITypes.CommentsByProductIdQueryVariables, APITypes.CommentsByProductIdQuery>;
export const checkLowStock = /* GraphQL */ `query CheckLowStock {
  checkLowStock {
    message
    lowStockProducts {
      name
      stock
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<APITypes.CheckLowStockQueryVariables, APITypes.CheckLowStockQuery>;
