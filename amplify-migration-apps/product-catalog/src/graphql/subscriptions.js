/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput, $id: String) {
    onCreateUser(filter: $filter, id: $id) {
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
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput, $id: String) {
    onUpdateUser(filter: $filter, id: $id) {
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
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput, $id: String) {
    onDeleteUser(filter: $filter, id: $id) {
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
export const onCreateProduct = /* GraphQL */ `
  subscription OnCreateProduct($filter: ModelSubscriptionProductFilterInput) {
    onCreateProduct(filter: $filter) {
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
export const onUpdateProduct = /* GraphQL */ `
  subscription OnUpdateProduct($filter: ModelSubscriptionProductFilterInput) {
    onUpdateProduct(filter: $filter) {
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
export const onDeleteProduct = /* GraphQL */ `
  subscription OnDeleteProduct($filter: ModelSubscriptionProductFilterInput) {
    onDeleteProduct(filter: $filter) {
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
export const onCreateComment = /* GraphQL */ `
  subscription OnCreateComment($filter: ModelSubscriptionCommentFilterInput, $authorId: String) {
    onCreateComment(filter: $filter, authorId: $authorId) {
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
export const onUpdateComment = /* GraphQL */ `
  subscription OnUpdateComment($filter: ModelSubscriptionCommentFilterInput, $authorId: String) {
    onUpdateComment(filter: $filter, authorId: $authorId) {
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
export const onDeleteComment = /* GraphQL */ `
  subscription OnDeleteComment($filter: ModelSubscriptionCommentFilterInput, $authorId: String) {
    onDeleteComment(filter: $filter, authorId: $authorId) {
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
