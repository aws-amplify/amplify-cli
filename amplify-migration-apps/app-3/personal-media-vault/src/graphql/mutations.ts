export const createNote = `
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      id
      title
      content
      tags
      isPinned
      createdAt
      updatedAt
    }
  }
`;

export const deleteNote = `
  mutation DeleteNote($input: DeleteNoteInput!) {
    deleteNote(input: $input) {
      id
    }
  }
`;

export const createMediaItem = `
  mutation CreateMediaItem($input: CreateMediaItemInput!) {
    createMediaItem(input: $input) {
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
    }
  }
`;

export const deleteMediaItem = `
  mutation DeleteMediaItem($input: DeleteMediaItemInput!) {
    deleteMediaItem(input: $input) {
      id
    }
  }
`;

export const createUserProfile = `
  mutation CreateUserProfile($input: CreateUserProfileInput!) {
    createUserProfile(input: $input) {
      id
      username
      email
      displayName
      avatar
      createdAt
      updatedAt
    }
  }
`;

export const createCollection = `
  mutation CreateCollection($input: CreateCollectionInput!) {
    createCollection(input: $input) {
      id
      name
      description
      coverImage
      isPrivate
      userProfileId
      createdAt
      updatedAt
    }
  }
`;
