/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUserProfile = /* GraphQL */ `
  subscription OnCreateUserProfile($filter: ModelSubscriptionUserProfileFilterInput, $owner: String) {
    onCreateUserProfile(filter: $filter, owner: $owner) {
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
export const onUpdateUserProfile = /* GraphQL */ `
  subscription OnUpdateUserProfile($filter: ModelSubscriptionUserProfileFilterInput, $owner: String) {
    onUpdateUserProfile(filter: $filter, owner: $owner) {
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
export const onDeleteUserProfile = /* GraphQL */ `
  subscription OnDeleteUserProfile($filter: ModelSubscriptionUserProfileFilterInput, $owner: String) {
    onDeleteUserProfile(filter: $filter, owner: $owner) {
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
export const onCreateMediaItem = /* GraphQL */ `
  subscription OnCreateMediaItem($filter: ModelSubscriptionMediaItemFilterInput, $owner: String) {
    onCreateMediaItem(filter: $filter, owner: $owner) {
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
export const onUpdateMediaItem = /* GraphQL */ `
  subscription OnUpdateMediaItem($filter: ModelSubscriptionMediaItemFilterInput, $owner: String) {
    onUpdateMediaItem(filter: $filter, owner: $owner) {
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
export const onDeleteMediaItem = /* GraphQL */ `
  subscription OnDeleteMediaItem($filter: ModelSubscriptionMediaItemFilterInput, $owner: String) {
    onDeleteMediaItem(filter: $filter, owner: $owner) {
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
export const onCreateCollection = /* GraphQL */ `
  subscription OnCreateCollection($filter: ModelSubscriptionCollectionFilterInput, $owner: String) {
    onCreateCollection(filter: $filter, owner: $owner) {
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
export const onUpdateCollection = /* GraphQL */ `
  subscription OnUpdateCollection($filter: ModelSubscriptionCollectionFilterInput, $owner: String) {
    onUpdateCollection(filter: $filter, owner: $owner) {
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
export const onDeleteCollection = /* GraphQL */ `
  subscription OnDeleteCollection($filter: ModelSubscriptionCollectionFilterInput, $owner: String) {
    onDeleteCollection(filter: $filter, owner: $owner) {
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
export const onCreateSharedItem = /* GraphQL */ `
  subscription OnCreateSharedItem($filter: ModelSubscriptionSharedItemFilterInput, $owner: String) {
    onCreateSharedItem(filter: $filter, owner: $owner) {
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
export const onUpdateSharedItem = /* GraphQL */ `
  subscription OnUpdateSharedItem($filter: ModelSubscriptionSharedItemFilterInput, $owner: String) {
    onUpdateSharedItem(filter: $filter, owner: $owner) {
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
export const onDeleteSharedItem = /* GraphQL */ `
  subscription OnDeleteSharedItem($filter: ModelSubscriptionSharedItemFilterInput, $owner: String) {
    onDeleteSharedItem(filter: $filter, owner: $owner) {
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
export const onCreateNote = /* GraphQL */ `
  subscription OnCreateNote($filter: ModelSubscriptionNoteFilterInput, $owner: String) {
    onCreateNote(filter: $filter, owner: $owner) {
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
export const onUpdateNote = /* GraphQL */ `
  subscription OnUpdateNote($filter: ModelSubscriptionNoteFilterInput, $owner: String) {
    onUpdateNote(filter: $filter, owner: $owner) {
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
export const onDeleteNote = /* GraphQL */ `
  subscription OnDeleteNote($filter: ModelSubscriptionNoteFilterInput, $owner: String) {
    onDeleteNote(filter: $filter, owner: $owner) {
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
