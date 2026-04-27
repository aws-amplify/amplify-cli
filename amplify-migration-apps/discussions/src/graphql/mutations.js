/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createTopic = /* GraphQL */ `
  mutation CreateTopic($input: CreateTopicInput!, $condition: ModelTopicConditionInput) {
    createTopic(input: $input, condition: $condition) {
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
export const updateTopic = /* GraphQL */ `
  mutation UpdateTopic($input: UpdateTopicInput!, $condition: ModelTopicConditionInput) {
    updateTopic(input: $input, condition: $condition) {
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
export const deleteTopic = /* GraphQL */ `
  mutation DeleteTopic($input: DeleteTopicInput!, $condition: ModelTopicConditionInput) {
    deleteTopic(input: $input, condition: $condition) {
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
export const createPost = /* GraphQL */ `
  mutation CreatePost($input: CreatePostInput!, $condition: ModelPostConditionInput) {
    createPost(input: $input, condition: $condition) {
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
export const updatePost = /* GraphQL */ `
  mutation UpdatePost($input: UpdatePostInput!, $condition: ModelPostConditionInput) {
    updatePost(input: $input, condition: $condition) {
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
export const deletePost = /* GraphQL */ `
  mutation DeletePost($input: DeletePostInput!, $condition: ModelPostConditionInput) {
    deletePost(input: $input, condition: $condition) {
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
export const createComment = /* GraphQL */ `
  mutation CreateComment($input: CreateCommentInput!, $condition: ModelCommentConditionInput) {
    createComment(input: $input, condition: $condition) {
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
export const updateComment = /* GraphQL */ `
  mutation UpdateComment($input: UpdateCommentInput!, $condition: ModelCommentConditionInput) {
    updateComment(input: $input, condition: $condition) {
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
export const deleteComment = /* GraphQL */ `
  mutation DeleteComment($input: DeleteCommentInput!, $condition: ModelCommentConditionInput) {
    deleteComment(input: $input, condition: $condition) {
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
