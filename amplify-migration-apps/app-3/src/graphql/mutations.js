/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUserProfile = /* GraphQL */ `
  mutation CreateUserProfile($input: CreateUserProfileInput!, $condition: ModelUserProfileConditionInput) {
    createUserProfile(input: $input, condition: $condition) {
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
export const updateUserProfile = /* GraphQL */ `
  mutation UpdateUserProfile($input: UpdateUserProfileInput!, $condition: ModelUserProfileConditionInput) {
    updateUserProfile(input: $input, condition: $condition) {
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
export const deleteUserProfile = /* GraphQL */ `
  mutation DeleteUserProfile($input: DeleteUserProfileInput!, $condition: ModelUserProfileConditionInput) {
    deleteUserProfile(input: $input, condition: $condition) {
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
export const createMediaItem = /* GraphQL */ `
  mutation CreateMediaItem($input: CreateMediaItemInput!, $condition: ModelMediaItemConditionInput) {
    createMediaItem(input: $input, condition: $condition) {
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
export const updateMediaItem = /* GraphQL */ `
  mutation UpdateMediaItem($input: UpdateMediaItemInput!, $condition: ModelMediaItemConditionInput) {
    updateMediaItem(input: $input, condition: $condition) {
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
export const deleteMediaItem = /* GraphQL */ `
  mutation DeleteMediaItem($input: DeleteMediaItemInput!, $condition: ModelMediaItemConditionInput) {
    deleteMediaItem(input: $input, condition: $condition) {
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
export const createCollection = /* GraphQL */ `
  mutation CreateCollection($input: CreateCollectionInput!, $condition: ModelCollectionConditionInput) {
    createCollection(input: $input, condition: $condition) {
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
export const updateCollection = /* GraphQL */ `
  mutation UpdateCollection($input: UpdateCollectionInput!, $condition: ModelCollectionConditionInput) {
    updateCollection(input: $input, condition: $condition) {
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
export const deleteCollection = /* GraphQL */ `
  mutation DeleteCollection($input: DeleteCollectionInput!, $condition: ModelCollectionConditionInput) {
    deleteCollection(input: $input, condition: $condition) {
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
export const createSharedItem = /* GraphQL */ `
  mutation CreateSharedItem($input: CreateSharedItemInput!, $condition: ModelSharedItemConditionInput) {
    createSharedItem(input: $input, condition: $condition) {
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
export const updateSharedItem = /* GraphQL */ `
  mutation UpdateSharedItem($input: UpdateSharedItemInput!, $condition: ModelSharedItemConditionInput) {
    updateSharedItem(input: $input, condition: $condition) {
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
export const deleteSharedItem = /* GraphQL */ `
  mutation DeleteSharedItem($input: DeleteSharedItemInput!, $condition: ModelSharedItemConditionInput) {
    deleteSharedItem(input: $input, condition: $condition) {
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
export const createNote = /* GraphQL */ `
  mutation CreateNote($input: CreateNoteInput!, $condition: ModelNoteConditionInput) {
    createNote(input: $input, condition: $condition) {
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
export const updateNote = /* GraphQL */ `
  mutation UpdateNote($input: UpdateNoteInput!, $condition: ModelNoteConditionInput) {
    updateNote(input: $input, condition: $condition) {
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
export const deleteNote = /* GraphQL */ `
  mutation DeleteNote($input: DeleteNoteInput!, $condition: ModelNoteConditionInput) {
    deleteNote(input: $input, condition: $condition) {
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
