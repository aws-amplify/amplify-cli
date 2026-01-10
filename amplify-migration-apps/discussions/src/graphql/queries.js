/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const fetchUserActivity = /* GraphQL */ `
  query FetchUserActivity($userId: ID!) {
    fetchUserActivity(userId: $userId) {
      id
      userId
      activityType
      timestamp
      __typename
    }
  }
`;
export const getTopic = /* GraphQL */ `
  query GetTopic($id: ID!) {
    getTopic(id: $id) {
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
export const listTopics = /* GraphQL */ `
  query ListTopics($filter: ModelTopicFilterInput, $limit: Int, $nextToken: String) {
    listTopics(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        createdByUserId
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
export const getPost = /* GraphQL */ `
  query GetPost($id: ID!) {
    getPost(id: $id) {
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
export const listPosts = /* GraphQL */ `
  query ListPosts($filter: ModelPostFilterInput, $limit: Int, $nextToken: String) {
    listPosts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        createdByUserId
        content
        createdAt
        updatedAt
        topicPostsId
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
export const listComments = /* GraphQL */ `
  query ListComments($filter: ModelCommentFilterInput, $limit: Int, $nextToken: String) {
    listComments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        createdByUserId
        content
        createdAt
        updatedAt
        postCommentsId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
