/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUserProfile = /* GraphQL */ `
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
      id
      username
      email
      displayName
      avatar
      mediaItems {
        nextToken
        __typename
      }
      collections {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listUserProfiles = /* GraphQL */ `
  query ListUserProfiles($filter: ModelUserProfileFilterInput, $limit: Int, $nextToken: String) {
    listUserProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        username
        email
        displayName
        avatar
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getMediaItem = /* GraphQL */ `
  query GetMediaItem($id: ID!) {
    getMediaItem(id: $id) {
      id
      title
      description
      fileUrl
      thumbnailUrl
      fileType
      fileSize
      mimeType
      tags
      isPrivate
      uploadedAt
      userProfileId
      collectionId
      owner {
        id
        username
        email
        displayName
        avatar
        createdAt
        updatedAt
        owner
        __typename
      }
      collection {
        id
        name
        description
        coverImage
        isPrivate
        userProfileId
        createdAt
        updatedAt
        __typename
      }
      sharedItems {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listMediaItems = /* GraphQL */ `
  query ListMediaItems($filter: ModelMediaItemFilterInput, $limit: Int, $nextToken: String) {
    listMediaItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        description
        fileUrl
        thumbnailUrl
        fileType
        fileSize
        mimeType
        tags
        isPrivate
        uploadedAt
        userProfileId
        collectionId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getCollection = /* GraphQL */ `
  query GetCollection($id: ID!) {
    getCollection(id: $id) {
      id
      name
      description
      coverImage
      isPrivate
      userProfileId
      owner {
        id
        username
        email
        displayName
        avatar
        createdAt
        updatedAt
        owner
        __typename
      }
      mediaItems {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listCollections = /* GraphQL */ `
  query ListCollections($filter: ModelCollectionFilterInput, $limit: Int, $nextToken: String) {
    listCollections(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
        coverImage
        isPrivate
        userProfileId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getSharedItem = /* GraphQL */ `
  query GetSharedItem($id: ID!) {
    getSharedItem(id: $id) {
      id
      permissions
      expiresAt
      sharedWithEmail
      sharedAt
      mediaItemId
      mediaItem {
        id
        title
        description
        fileUrl
        thumbnailUrl
        fileType
        fileSize
        mimeType
        tags
        isPrivate
        uploadedAt
        userProfileId
        collectionId
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listSharedItems = /* GraphQL */ `
  query ListSharedItems($filter: ModelSharedItemFilterInput, $limit: Int, $nextToken: String) {
    listSharedItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        permissions
        expiresAt
        sharedWithEmail
        sharedAt
        mediaItemId
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getNote = /* GraphQL */ `
  query GetNote($id: ID!) {
    getNote(id: $id) {
      id
      title
      content
      tags
      isPinned
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listNotes = /* GraphQL */ `
  query ListNotes($filter: ModelNoteFilterInput, $limit: Int, $nextToken: String) {
    listNotes(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        content
        tags
        isPinned
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const mediaItemsByUserProfileId = /* GraphQL */ `
  query MediaItemsByUserProfileId(
    $userProfileId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelMediaItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    mediaItemsByUserProfileId(
      userProfileId: $userProfileId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        description
        fileUrl
        thumbnailUrl
        fileType
        fileSize
        mimeType
        tags
        isPrivate
        uploadedAt
        userProfileId
        collectionId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const mediaItemsByCollectionId = /* GraphQL */ `
  query MediaItemsByCollectionId(
    $collectionId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelMediaItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    mediaItemsByCollectionId(
      collectionId: $collectionId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        description
        fileUrl
        thumbnailUrl
        fileType
        fileSize
        mimeType
        tags
        isPrivate
        uploadedAt
        userProfileId
        collectionId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const collectionsByUserProfileId = /* GraphQL */ `
  query CollectionsByUserProfileId(
    $userProfileId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelCollectionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    collectionsByUserProfileId(
      userProfileId: $userProfileId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        name
        description
        coverImage
        isPrivate
        userProfileId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const sharedItemsByMediaItemId = /* GraphQL */ `
  query SharedItemsByMediaItemId(
    $mediaItemId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSharedItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    sharedItemsByMediaItemId(
      mediaItemId: $mediaItemId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        permissions
        expiresAt
        sharedWithEmail
        sharedAt
        mediaItemId
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
