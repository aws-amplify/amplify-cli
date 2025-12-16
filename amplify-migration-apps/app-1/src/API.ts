/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type LowStockResult = {
  __typename: 'LowStockResult';
  message: string;
  lowStockProducts: Array<LowStockProduct>;
};

export type LowStockProduct = {
  __typename: 'LowStockProduct';
  name: string;
  stock: number;
};

export type CreateProductInput = {
  id?: string | null;
  serialno: number;
  engword: string;
  price?: number | null;
  category?: string | null;
  description?: string | null;
  stock?: number | null;
  brand?: string | null;
  imageKey?: string | null;
  images?: Array<string | null> | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ModelProductConditionInput = {
  serialno?: ModelIntInput | null;
  engword?: ModelStringInput | null;
  price?: ModelFloatInput | null;
  category?: ModelStringInput | null;
  description?: ModelStringInput | null;
  stock?: ModelIntInput | null;
  brand?: ModelStringInput | null;
  imageKey?: ModelStringInput | null;
  images?: ModelStringInput | null;
  createdBy?: ModelStringInput | null;
  updatedBy?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelProductConditionInput | null> | null;
  or?: Array<ModelProductConditionInput | null> | null;
  not?: ModelProductConditionInput | null;
};

export type ModelIntInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export const ModelAttributeTypes = {
  binary: 'binary',
  binarySet: 'binarySet',
  bool: 'bool',
  list: 'list',
  map: 'map',
  number: 'number',
  numberSet: 'numberSet',
  string: 'string',
  stringSet: 'stringSet',
  _null: '_null',
} as const;

export type ModelAttributeTypes = (typeof ModelAttributeTypes)[keyof typeof ModelAttributeTypes];

export type ModelStringInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export type ModelSizeInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
};

export type ModelFloatInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export type Product = {
  __typename: 'Product';
  id: string;
  serialno: number;
  engword: string;
  price?: number | null;
  category?: string | null;
  description?: string | null;
  stock?: number | null;
  brand?: string | null;
  imageKey?: string | null;
  images?: Array<string | null> | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: ModelCommentConnection | null;
};

export type ModelCommentConnection = {
  __typename: 'ModelCommentConnection';
  items: Array<Comment | null>;
  nextToken?: string | null;
};

export type Comment = {
  __typename: 'Comment';
  id: string;
  productId: string;
  product?: Product | null;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProductInput = {
  id: string;
  serialno?: number | null;
  engword?: string | null;
  price?: number | null;
  category?: string | null;
  description?: string | null;
  stock?: number | null;
  brand?: string | null;
  imageKey?: string | null;
  images?: Array<string | null> | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type DeleteProductInput = {
  id: string;
};

export type CreateUserInput = {
  id?: string | null;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type ModelUserConditionInput = {
  email?: ModelStringInput | null;
  name?: ModelStringInput | null;
  role?: ModelUserRoleInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelUserConditionInput | null> | null;
  or?: Array<ModelUserConditionInput | null> | null;
  not?: ModelUserConditionInput | null;
  id?: ModelStringInput | null;
};

export type ModelUserRoleInput = {
  eq?: UserRole | null;
  ne?: UserRole | null;
};

export type User = {
  __typename: 'User';
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserInput = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type DeleteUserInput = {
  id: string;
};

export type CreateCommentInput = {
  id?: string | null;
  productId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ModelCommentConditionInput = {
  productId?: ModelIDInput | null;
  authorId?: ModelStringInput | null;
  authorName?: ModelStringInput | null;
  content?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelCommentConditionInput | null> | null;
  or?: Array<ModelCommentConditionInput | null> | null;
  not?: ModelCommentConditionInput | null;
};

export type ModelIDInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export type UpdateCommentInput = {
  id: string;
  productId?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  content?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type DeleteCommentInput = {
  id: string;
};

export type ModelProductFilterInput = {
  id?: ModelIDInput | null;
  serialno?: ModelIntInput | null;
  engword?: ModelStringInput | null;
  price?: ModelFloatInput | null;
  category?: ModelStringInput | null;
  description?: ModelStringInput | null;
  stock?: ModelIntInput | null;
  brand?: ModelStringInput | null;
  imageKey?: ModelStringInput | null;
  images?: ModelStringInput | null;
  createdBy?: ModelStringInput | null;
  updatedBy?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelProductFilterInput | null> | null;
  or?: Array<ModelProductFilterInput | null> | null;
  not?: ModelProductFilterInput | null;
};

export type ModelProductConnection = {
  __typename: 'ModelProductConnection';
  items: Array<Product | null>;
  nextToken?: string | null;
};

export type ModelUserFilterInput = {
  id?: ModelIDInput | null;
  email?: ModelStringInput | null;
  name?: ModelStringInput | null;
  role?: ModelUserRoleInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelUserFilterInput | null> | null;
  or?: Array<ModelUserFilterInput | null> | null;
  not?: ModelUserFilterInput | null;
};

export type ModelUserConnection = {
  __typename: 'ModelUserConnection';
  items: Array<User | null>;
  nextToken?: string | null;
};

export type ModelCommentFilterInput = {
  id?: ModelIDInput | null;
  productId?: ModelIDInput | null;
  authorId?: ModelStringInput | null;
  authorName?: ModelStringInput | null;
  content?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelCommentFilterInput | null> | null;
  or?: Array<ModelCommentFilterInput | null> | null;
  not?: ModelCommentFilterInput | null;
};

export const ModelSortDirection = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const;

export type ModelSortDirection = (typeof ModelSortDirection)[keyof typeof ModelSortDirection];

export type ModelSubscriptionProductFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  serialno?: ModelSubscriptionIntInput | null;
  engword?: ModelSubscriptionStringInput | null;
  price?: ModelSubscriptionFloatInput | null;
  category?: ModelSubscriptionStringInput | null;
  description?: ModelSubscriptionStringInput | null;
  stock?: ModelSubscriptionIntInput | null;
  brand?: ModelSubscriptionStringInput | null;
  imageKey?: ModelSubscriptionStringInput | null;
  images?: ModelSubscriptionStringInput | null;
  createdBy?: ModelSubscriptionStringInput | null;
  updatedBy?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionProductFilterInput | null> | null;
  or?: Array<ModelSubscriptionProductFilterInput | null> | null;
};

export type ModelSubscriptionIDInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  in?: Array<string | null> | null;
  notIn?: Array<string | null> | null;
};

export type ModelSubscriptionIntInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  in?: Array<number | null> | null;
  notIn?: Array<number | null> | null;
};

export type ModelSubscriptionStringInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  in?: Array<string | null> | null;
  notIn?: Array<string | null> | null;
};

export type ModelSubscriptionFloatInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  in?: Array<number | null> | null;
  notIn?: Array<number | null> | null;
};

export type ModelSubscriptionUserFilterInput = {
  email?: ModelSubscriptionStringInput | null;
  name?: ModelSubscriptionStringInput | null;
  role?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionUserFilterInput | null> | null;
  or?: Array<ModelSubscriptionUserFilterInput | null> | null;
  id?: ModelStringInput | null;
};

export type ModelSubscriptionCommentFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  productId?: ModelSubscriptionIDInput | null;
  authorName?: ModelSubscriptionStringInput | null;
  content?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionCommentFilterInput | null> | null;
  or?: Array<ModelSubscriptionCommentFilterInput | null> | null;
  authorId?: ModelStringInput | null;
};

export type CheckLowStockQueryVariables = {};

export type CheckLowStockQuery = {
  checkLowStock?: {
    __typename: 'LowStockResult';
    message: string;
    lowStockProducts: Array<{
      __typename: 'LowStockProduct';
      name: string;
      stock: number;
    }>;
  } | null;
};

export type CheckLowStockMutationVariables = {};

export type CheckLowStockMutation = {
  checkLowStock?: {
    __typename: 'LowStockResult';
    message: string;
    lowStockProducts: Array<{
      __typename: 'LowStockProduct';
      name: string;
      stock: number;
    }>;
  } | null;
};

export type CreateProductMutationVariables = {
  input: CreateProductInput;
  condition?: ModelProductConditionInput | null;
};

export type CreateProductMutation = {
  createProduct?: {
    __typename: 'Product';
    id: string;
    serialno: number;
    engword: string;
    price?: number | null;
    category?: string | null;
    description?: string | null;
    stock?: number | null;
    brand?: string | null;
    imageKey?: string | null;
    images?: Array<string | null> | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    comments?: {
      __typename: 'ModelCommentConnection';
      nextToken?: string | null;
    } | null;
  } | null;
};

export type UpdateProductMutationVariables = {
  input: UpdateProductInput;
  condition?: ModelProductConditionInput | null;
};

export type UpdateProductMutation = {
  updateProduct?: {
    __typename: 'Product';
    id: string;
    serialno: number;
    engword: string;
    price?: number | null;
    category?: string | null;
    description?: string | null;
    stock?: number | null;
    brand?: string | null;
    imageKey?: string | null;
    images?: Array<string | null> | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    comments?: {
      __typename: 'ModelCommentConnection';
      nextToken?: string | null;
    } | null;
  } | null;
};

export type DeleteProductMutationVariables = {
  input: DeleteProductInput;
  condition?: ModelProductConditionInput | null;
};

export type DeleteProductMutation = {
  deleteProduct?: {
    __typename: 'Product';
    id: string;
    serialno: number;
    engword: string;
    price?: number | null;
    category?: string | null;
    description?: string | null;
    stock?: number | null;
    brand?: string | null;
    imageKey?: string | null;
    images?: Array<string | null> | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    comments?: {
      __typename: 'ModelCommentConnection';
      nextToken?: string | null;
    } | null;
  } | null;
};

export type CreateUserMutationVariables = {
  input: CreateUserInput;
  condition?: ModelUserConditionInput | null;
};

export type CreateUserMutation = {
  createUser?: {
    __typename: 'User';
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput;
  condition?: ModelUserConditionInput | null;
};

export type UpdateUserMutation = {
  updateUser?: {
    __typename: 'User';
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteUserMutationVariables = {
  input: DeleteUserInput;
  condition?: ModelUserConditionInput | null;
};

export type DeleteUserMutation = {
  deleteUser?: {
    __typename: 'User';
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateCommentMutationVariables = {
  input: CreateCommentInput;
  condition?: ModelCommentConditionInput | null;
};

export type CreateCommentMutation = {
  createComment?: {
    __typename: 'Comment';
    id: string;
    productId: string;
    product?: {
      __typename: 'Product';
      id: string;
      serialno: number;
      engword: string;
      price?: number | null;
      category?: string | null;
      description?: string | null;
      stock?: number | null;
      brand?: string | null;
      imageKey?: string | null;
      images?: Array<string | null> | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateCommentMutationVariables = {
  input: UpdateCommentInput;
  condition?: ModelCommentConditionInput | null;
};

export type UpdateCommentMutation = {
  updateComment?: {
    __typename: 'Comment';
    id: string;
    productId: string;
    product?: {
      __typename: 'Product';
      id: string;
      serialno: number;
      engword: string;
      price?: number | null;
      category?: string | null;
      description?: string | null;
      stock?: number | null;
      brand?: string | null;
      imageKey?: string | null;
      images?: Array<string | null> | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteCommentMutationVariables = {
  input: DeleteCommentInput;
  condition?: ModelCommentConditionInput | null;
};

export type DeleteCommentMutation = {
  deleteComment?: {
    __typename: 'Comment';
    id: string;
    productId: string;
    product?: {
      __typename: 'Product';
      id: string;
      serialno: number;
      engword: string;
      price?: number | null;
      category?: string | null;
      description?: string | null;
      stock?: number | null;
      brand?: string | null;
      imageKey?: string | null;
      images?: Array<string | null> | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type GetProductQueryVariables = {
  id: string;
};

export type GetProductQuery = {
  getProduct?: {
    __typename: 'Product';
    id: string;
    serialno: number;
    engword: string;
    price?: number | null;
    category?: string | null;
    description?: string | null;
    stock?: number | null;
    brand?: string | null;
    imageKey?: string | null;
    images?: Array<string | null> | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    comments?: {
      __typename: 'ModelCommentConnection';
      nextToken?: string | null;
    } | null;
  } | null;
};

export type ListProductsQueryVariables = {
  filter?: ModelProductFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListProductsQuery = {
  listProducts?: {
    __typename: 'ModelProductConnection';
    items: Array<{
      __typename: 'Product';
      id: string;
      serialno: number;
      engword: string;
      price?: number | null;
      category?: string | null;
      description?: string | null;
      stock?: number | null;
      brand?: string | null;
      imageKey?: string | null;
      images?: Array<string | null> | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetUserQueryVariables = {
  id: string;
};

export type GetUserQuery = {
  getUser?: {
    __typename: 'User';
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListUsersQuery = {
  listUsers?: {
    __typename: 'ModelUserConnection';
    items: Array<{
      __typename: 'User';
      id: string;
      email: string;
      name: string;
      role: UserRole;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetCommentQueryVariables = {
  id: string;
};

export type GetCommentQuery = {
  getComment?: {
    __typename: 'Comment';
    id: string;
    productId: string;
    product?: {
      __typename: 'Product';
      id: string;
      serialno: number;
      engword: string;
      price?: number | null;
      category?: string | null;
      description?: string | null;
      stock?: number | null;
      brand?: string | null;
      imageKey?: string | null;
      images?: Array<string | null> | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListCommentsQueryVariables = {
  filter?: ModelCommentFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListCommentsQuery = {
  listComments?: {
    __typename: 'ModelCommentConnection';
    items: Array<{
      __typename: 'Comment';
      id: string;
      productId: string;
      authorId: string;
      authorName: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type CommentsByProductIdQueryVariables = {
  productId: string;
  sortDirection?: ModelSortDirection | null;
  filter?: ModelCommentFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type CommentsByProductIdQuery = {
  commentsByProductId?: {
    __typename: 'ModelCommentConnection';
    items: Array<{
      __typename: 'Comment';
      id: string;
      productId: string;
      authorId: string;
      authorName: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type OnCreateProductSubscriptionVariables = {
  filter?: ModelSubscriptionProductFilterInput | null;
};

export type OnCreateProductSubscription = {
  onCreateProduct?: {
    __typename: 'Product';
    id: string;
    serialno: number;
    engword: string;
    price?: number | null;
    category?: string | null;
    description?: string | null;
    stock?: number | null;
    brand?: string | null;
    imageKey?: string | null;
    images?: Array<string | null> | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    comments?: {
      __typename: 'ModelCommentConnection';
      nextToken?: string | null;
    } | null;
  } | null;
};

export type OnUpdateProductSubscriptionVariables = {
  filter?: ModelSubscriptionProductFilterInput | null;
};

export type OnUpdateProductSubscription = {
  onUpdateProduct?: {
    __typename: 'Product';
    id: string;
    serialno: number;
    engword: string;
    price?: number | null;
    category?: string | null;
    description?: string | null;
    stock?: number | null;
    brand?: string | null;
    imageKey?: string | null;
    images?: Array<string | null> | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    comments?: {
      __typename: 'ModelCommentConnection';
      nextToken?: string | null;
    } | null;
  } | null;
};

export type OnDeleteProductSubscriptionVariables = {
  filter?: ModelSubscriptionProductFilterInput | null;
};

export type OnDeleteProductSubscription = {
  onDeleteProduct?: {
    __typename: 'Product';
    id: string;
    serialno: number;
    engword: string;
    price?: number | null;
    category?: string | null;
    description?: string | null;
    stock?: number | null;
    brand?: string | null;
    imageKey?: string | null;
    images?: Array<string | null> | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    comments?: {
      __typename: 'ModelCommentConnection';
      nextToken?: string | null;
    } | null;
  } | null;
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null;
  id?: string | null;
};

export type OnCreateUserSubscription = {
  onCreateUser?: {
    __typename: 'User';
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null;
  id?: string | null;
};

export type OnUpdateUserSubscription = {
  onUpdateUser?: {
    __typename: 'User';
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null;
  id?: string | null;
};

export type OnDeleteUserSubscription = {
  onDeleteUser?: {
    __typename: 'User';
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateCommentSubscriptionVariables = {
  filter?: ModelSubscriptionCommentFilterInput | null;
  authorId?: string | null;
};

export type OnCreateCommentSubscription = {
  onCreateComment?: {
    __typename: 'Comment';
    id: string;
    productId: string;
    product?: {
      __typename: 'Product';
      id: string;
      serialno: number;
      engword: string;
      price?: number | null;
      category?: string | null;
      description?: string | null;
      stock?: number | null;
      brand?: string | null;
      imageKey?: string | null;
      images?: Array<string | null> | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateCommentSubscriptionVariables = {
  filter?: ModelSubscriptionCommentFilterInput | null;
  authorId?: string | null;
};

export type OnUpdateCommentSubscription = {
  onUpdateComment?: {
    __typename: 'Comment';
    id: string;
    productId: string;
    product?: {
      __typename: 'Product';
      id: string;
      serialno: number;
      engword: string;
      price?: number | null;
      category?: string | null;
      description?: string | null;
      stock?: number | null;
      brand?: string | null;
      imageKey?: string | null;
      images?: Array<string | null> | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteCommentSubscriptionVariables = {
  filter?: ModelSubscriptionCommentFilterInput | null;
  authorId?: string | null;
};

export type OnDeleteCommentSubscription = {
  onDeleteComment?: {
    __typename: 'Comment';
    id: string;
    productId: string;
    product?: {
      __typename: 'Product';
      id: string;
      serialno: number;
      engword: string;
      price?: number | null;
      category?: string | null;
      description?: string | null;
      stock?: number | null;
      brand?: string | null;
      imageKey?: string | null;
      images?: Array<string | null> | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};
