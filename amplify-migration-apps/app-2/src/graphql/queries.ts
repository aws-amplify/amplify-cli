/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getUserActivity = /* GraphQL */ `query GetUserActivity($userId: ID!) {
  getUserActivity(userId: $userId) {
    userId
    timestamp
    activityType
    metadata
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserActivityQueryVariables, APITypes.GetUserActivityQuery>;
export const getBlog = /* GraphQL */ `query GetBlog($id: ID!) {
  getBlog(id: $id) {
    id
    name
    posts {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetBlogQueryVariables, APITypes.GetBlogQuery>;
export const listBlogs = /* GraphQL */ `query ListBlogs(
  $filter: ModelBlogFilterInput
  $limit: Int
  $nextToken: String
) {
  listBlogs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListBlogsQueryVariables, APITypes.ListBlogsQuery>;
export const getPost = /* GraphQL */ `query GetPost($id: ID!) {
  getPost(id: $id) {
    id
    title
    content
    blog {
      id
      name
      createdAt
      updatedAt
      __typename
    }
    comments {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    blogPostsId
    __typename
  }
}
` as GeneratedQuery<APITypes.GetPostQueryVariables, APITypes.GetPostQuery>;
export const listPosts = /* GraphQL */ `query ListPosts(
  $filter: ModelPostFilterInput
  $limit: Int
  $nextToken: String
) {
  listPosts(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      content
      createdAt
      updatedAt
      blogPostsId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListPostsQueryVariables, APITypes.ListPostsQuery>;
export const getComment = /* GraphQL */ `query GetComment($id: ID!) {
  getComment(id: $id) {
    id
    post {
      id
      title
      content
      createdAt
      updatedAt
      blogPostsId
      __typename
    }
    content
    createdAt
    updatedAt
    postCommentsId
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
` as GeneratedQuery<APITypes.ListCommentsQueryVariables, APITypes.ListCommentsQuery>;
