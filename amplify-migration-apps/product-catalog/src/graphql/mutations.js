/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const checkLowStock = /* GraphQL */ `
  mutation CheckLowStock {
    checkLowStock {
      message
      lowStockProducts {
        name
        stock
        __typename
      }
      __typename
    }
  }
`;
export const createProduct = /* GraphQL */ `
  mutation CreateProduct($input: CreateProductInput!, $condition: ModelProductConditionInput) {
    createProduct(input: $input, condition: $condition) {
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
`;
export const updateProduct = /* GraphQL */ `
  mutation UpdateProduct($input: UpdateProductInput!, $condition: ModelProductConditionInput) {
    updateProduct(input: $input, condition: $condition) {
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
`;
export const deleteProduct = /* GraphQL */ `
  mutation DeleteProduct($input: DeleteProductInput!, $condition: ModelProductConditionInput) {
    deleteProduct(input: $input, condition: $condition) {
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
`;
export const createUser = /* GraphQL */ `
  mutation CreateUser($input: CreateUserInput!, $condition: ModelUserConditionInput) {
    createUser(input: $input, condition: $condition) {
      id
      email
      name
      role
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateUser = /* GraphQL */ `
  mutation UpdateUser($input: UpdateUserInput!, $condition: ModelUserConditionInput) {
    updateUser(input: $input, condition: $condition) {
      id
      email
      name
      role
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser($input: DeleteUserInput!, $condition: ModelUserConditionInput) {
    deleteUser(input: $input, condition: $condition) {
      id
      email
      name
      role
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createComment = /* GraphQL */ `
  mutation CreateComment($input: CreateCommentInput!, $condition: ModelCommentConditionInput) {
    createComment(input: $input, condition: $condition) {
      id
      productId
      product {
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
        __typename
      }
      authorId
      authorName
      content
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateComment = /* GraphQL */ `
  mutation UpdateComment($input: UpdateCommentInput!, $condition: ModelCommentConditionInput) {
    updateComment(input: $input, condition: $condition) {
      id
      productId
      product {
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
        __typename
      }
      authorId
      authorName
      content
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteComment = /* GraphQL */ `
  mutation DeleteComment($input: DeleteCommentInput!, $condition: ModelCommentConditionInput) {
    deleteComment(input: $input, condition: $condition) {
      id
      productId
      product {
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
        __typename
      }
      authorId
      authorName
      content
      createdAt
      updatedAt
      __typename
    }
  }
`;
