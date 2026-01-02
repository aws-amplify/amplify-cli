/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateUser = /* GraphQL */ `subscription OnCreateUser(
  $filter: ModelSubscriptionUserFilterInput
  $id: String
) {
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
` as GeneratedSubscription<APITypes.OnCreateUserSubscriptionVariables, APITypes.OnCreateUserSubscription>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser(
  $filter: ModelSubscriptionUserFilterInput
  $id: String
) {
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
` as GeneratedSubscription<APITypes.OnUpdateUserSubscriptionVariables, APITypes.OnUpdateUserSubscription>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser(
  $filter: ModelSubscriptionUserFilterInput
  $id: String
) {
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
` as GeneratedSubscription<APITypes.OnDeleteUserSubscriptionVariables, APITypes.OnDeleteUserSubscription>;
export const onCreateProduct = /* GraphQL */ `subscription OnCreateProduct($filter: ModelSubscriptionProductFilterInput) {
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
` as GeneratedSubscription<APITypes.OnCreateProductSubscriptionVariables, APITypes.OnCreateProductSubscription>;
export const onUpdateProduct = /* GraphQL */ `subscription OnUpdateProduct($filter: ModelSubscriptionProductFilterInput) {
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
` as GeneratedSubscription<APITypes.OnUpdateProductSubscriptionVariables, APITypes.OnUpdateProductSubscription>;
export const onDeleteProduct = /* GraphQL */ `subscription OnDeleteProduct($filter: ModelSubscriptionProductFilterInput) {
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
` as GeneratedSubscription<APITypes.OnDeleteProductSubscriptionVariables, APITypes.OnDeleteProductSubscription>;
export const onCreateComment = /* GraphQL */ `subscription OnCreateComment(
  $filter: ModelSubscriptionCommentFilterInput
  $authorId: String
) {
  onCreateComment(filter: $filter, authorId: $authorId) {
    id
    productId
    authorId
    authorName
    content
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnCreateCommentSubscriptionVariables, APITypes.OnCreateCommentSubscription>;
export const onUpdateComment = /* GraphQL */ `subscription OnUpdateComment(
  $filter: ModelSubscriptionCommentFilterInput
  $authorId: String
) {
  onUpdateComment(filter: $filter, authorId: $authorId) {
    id
    productId
    authorId
    authorName
    content
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnUpdateCommentSubscriptionVariables, APITypes.OnUpdateCommentSubscription>;
export const onDeleteComment = /* GraphQL */ `subscription OnDeleteComment(
  $filter: ModelSubscriptionCommentFilterInput
  $authorId: String
) {
  onDeleteComment(filter: $filter, authorId: $authorId) {
    id
    productId
    authorId
    authorName
    content
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<APITypes.OnDeleteCommentSubscriptionVariables, APITypes.OnDeleteCommentSubscription>;
