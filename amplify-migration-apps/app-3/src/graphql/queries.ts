export const listNotes = `
  query ListNotes {
    listNotes {
      items {
        id
        title
        content
        tags
        isPinned
        createdAt
        updatedAt
      }
    }
  }
`;

export const listMediaItems = `
  query ListMediaItems {
    listMediaItems {
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
        createdAt
        updatedAt
      }
    }
  }
`;

export const listCollections = `
  query ListCollections {
    listCollections {
      items {
        id
        name
        description
        coverImage
        isPrivate
        createdAt
        updatedAt
      }
    }
  }
`;

export const getUserProfile = `
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
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
