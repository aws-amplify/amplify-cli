/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateTopic = /* GraphQL */ `
  subscription OnCreateTopic($filter: ModelSubscriptionTopicFilterInput) {
    onCreateTopic(filter: $filter) {
      id
      createdByUserId
      content
      posts {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateTopic = /* GraphQL */ `
  subscription OnUpdateTopic($filter: ModelSubscriptionTopicFilterInput) {
    onUpdateTopic(filter: $filter) {
      id
      createdByUserId
      content
      posts {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteTopic = /* GraphQL */ `
  subscription OnDeleteTopic($filter: ModelSubscriptionTopicFilterInput) {
    onDeleteTopic(filter: $filter) {
      id
      createdByUserId
      content
      posts {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreatePost = /* GraphQL */ `
  subscription OnCreatePost($filter: ModelSubscriptionPostFilterInput) {
    onCreatePost(filter: $filter) {
      id
      createdByUserId
      content
      comments {
        nextToken
        __typename
      }
      topic {
        id
        createdByUserId
        content
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      topicPostsId
      __typename
    }
  }
`;
export const onUpdatePost = /* GraphQL */ `
  subscription OnUpdatePost($filter: ModelSubscriptionPostFilterInput) {
    onUpdatePost(filter: $filter) {
      id
      createdByUserId
      content
      comments {
        nextToken
        __typename
      }
      topic {
        id
        createdByUserId
        content
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      topicPostsId
      __typename
    }
  }
`;
export const onDeletePost = /* GraphQL */ `
  subscription OnDeletePost($filter: ModelSubscriptionPostFilterInput) {
    onDeletePost(filter: $filter) {
      id
      createdByUserId
      content
      comments {
        nextToken
        __typename
      }
      topic {
        id
        createdByUserId
        content
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      topicPostsId
      __typename
    }
  }
`;
export const onCreateComment = /* GraphQL */ `
  subscription OnCreateComment($filter: ModelSubscriptionCommentFilterInput) {
    onCreateComment(filter: $filter) {
      id
      createdByUserId
      content
      post {
        id
        createdByUserId
        content
        createdAt
        updatedAt
        topicPostsId
        __typename
      }
      createdAt
      updatedAt
      postCommentsId
      __typename
    }
  }
`;
export const onUpdateComment = /* GraphQL */ `
  subscription OnUpdateComment($filter: ModelSubscriptionCommentFilterInput) {
    onUpdateComment(filter: $filter) {
      id
      createdByUserId
      content
      post {
        id
        createdByUserId
        content
        createdAt
        updatedAt
        topicPostsId
        __typename
      }
      createdAt
      updatedAt
      postCommentsId
      __typename
    }
  }
`;
export const onDeleteComment = /* GraphQL */ `
  subscription OnDeleteComment($filter: ModelSubscriptionCommentFilterInput) {
    onDeleteComment(filter: $filter) {
      id
      createdByUserId
      content
      post {
        id
        createdByUserId
        content
        createdAt
        updatedAt
        topicPostsId
        __typename
      }
      createdAt
      updatedAt
      postCommentsId
      __typename
    }
  }
`;
