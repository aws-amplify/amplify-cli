/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateMoodItemInput = {
  id?: string | null;
  title: string;
  description?: string | null;
  image: string;
  boardID: string;
};

export type ModelMoodItemConditionInput = {
  title?: ModelStringInput | null;
  description?: ModelStringInput | null;
  image?: ModelStringInput | null;
  boardID?: ModelIDInput | null;
  and?: Array<ModelMoodItemConditionInput | null> | null;
  or?: Array<ModelMoodItemConditionInput | null> | null;
  not?: ModelMoodItemConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

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

export enum ModelAttributeTypes {
  binary = 'binary',
  binarySet = 'binarySet',
  bool = 'bool',
  list = 'list',
  map = 'map',
  number = 'number',
  numberSet = 'numberSet',
  string = 'string',
  stringSet = 'stringSet',
  _null = '_null',
}

export type ModelSizeInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
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

export type MoodItem = {
  __typename: 'MoodItem';
  id: string;
  title: string;
  description?: string | null;
  image: string;
  boardID: string;
  board?: Board | null;
  createdAt: string;
  updatedAt: string;
};

export type Board = {
  __typename: 'Board';
  id: string;
  name: string;
  moodItems?: ModelMoodItemConnection | null;
  createdAt: string;
  updatedAt: string;
};

export type ModelMoodItemConnection = {
  __typename: 'ModelMoodItemConnection';
  items: Array<MoodItem | null>;
  nextToken?: string | null;
};

export type UpdateMoodItemInput = {
  id: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  boardID?: string | null;
};

export type DeleteMoodItemInput = {
  id: string;
};

export type CreateBoardInput = {
  id?: string | null;
  name: string;
};

export type ModelBoardConditionInput = {
  name?: ModelStringInput | null;
  and?: Array<ModelBoardConditionInput | null> | null;
  or?: Array<ModelBoardConditionInput | null> | null;
  not?: ModelBoardConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type UpdateBoardInput = {
  id: string;
  name?: string | null;
};

export type DeleteBoardInput = {
  id: string;
};

export type ModelMoodItemFilterInput = {
  id?: ModelIDInput | null;
  title?: ModelStringInput | null;
  description?: ModelStringInput | null;
  image?: ModelStringInput | null;
  boardID?: ModelIDInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelMoodItemFilterInput | null> | null;
  or?: Array<ModelMoodItemFilterInput | null> | null;
  not?: ModelMoodItemFilterInput | null;
};

export type ModelBoardFilterInput = {
  id?: ModelIDInput | null;
  name?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelBoardFilterInput | null> | null;
  or?: Array<ModelBoardFilterInput | null> | null;
  not?: ModelBoardFilterInput | null;
};

export type ModelBoardConnection = {
  __typename: 'ModelBoardConnection';
  items: Array<Board | null>;
  nextToken?: string | null;
};

export enum ModelSortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type ModelSubscriptionMoodItemFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  title?: ModelSubscriptionStringInput | null;
  description?: ModelSubscriptionStringInput | null;
  image?: ModelSubscriptionStringInput | null;
  boardID?: ModelSubscriptionIDInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionMoodItemFilterInput | null> | null;
  or?: Array<ModelSubscriptionMoodItemFilterInput | null> | null;
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

export type ModelSubscriptionBoardFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  name?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionBoardFilterInput | null> | null;
  or?: Array<ModelSubscriptionBoardFilterInput | null> | null;
};

export type CreateMoodItemMutationVariables = {
  input: CreateMoodItemInput;
  condition?: ModelMoodItemConditionInput | null;
};

export type CreateMoodItemMutation = {
  createMoodItem?: {
    __typename: 'MoodItem';
    id: string;
    title: string;
    description?: string | null;
    image: string;
    boardID: string;
    board?: {
      __typename: 'Board';
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateMoodItemMutationVariables = {
  input: UpdateMoodItemInput;
  condition?: ModelMoodItemConditionInput | null;
};

export type UpdateMoodItemMutation = {
  updateMoodItem?: {
    __typename: 'MoodItem';
    id: string;
    title: string;
    description?: string | null;
    image: string;
    boardID: string;
    board?: {
      __typename: 'Board';
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteMoodItemMutationVariables = {
  input: DeleteMoodItemInput;
  condition?: ModelMoodItemConditionInput | null;
};

export type DeleteMoodItemMutation = {
  deleteMoodItem?: {
    __typename: 'MoodItem';
    id: string;
    title: string;
    description?: string | null;
    image: string;
    boardID: string;
    board?: {
      __typename: 'Board';
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateBoardMutationVariables = {
  input: CreateBoardInput;
  condition?: ModelBoardConditionInput | null;
};

export type CreateBoardMutation = {
  createBoard?: {
    __typename: 'Board';
    id: string;
    name: string;
    moodItems?: {
      __typename: 'ModelMoodItemConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateBoardMutationVariables = {
  input: UpdateBoardInput;
  condition?: ModelBoardConditionInput | null;
};

export type UpdateBoardMutation = {
  updateBoard?: {
    __typename: 'Board';
    id: string;
    name: string;
    moodItems?: {
      __typename: 'ModelMoodItemConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteBoardMutationVariables = {
  input: DeleteBoardInput;
  condition?: ModelBoardConditionInput | null;
};

export type DeleteBoardMutation = {
  deleteBoard?: {
    __typename: 'Board';
    id: string;
    name: string;
    moodItems?: {
      __typename: 'ModelMoodItemConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type GetMoodItemQueryVariables = {
  id: string;
};

export type GetMoodItemQuery = {
  getMoodItem?: {
    __typename: 'MoodItem';
    id: string;
    title: string;
    description?: string | null;
    image: string;
    boardID: string;
    board?: {
      __typename: 'Board';
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListMoodItemsQueryVariables = {
  filter?: ModelMoodItemFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListMoodItemsQuery = {
  listMoodItems?: {
    __typename: 'ModelMoodItemConnection';
    items: Array<{
      __typename: 'MoodItem';
      id: string;
      title: string;
      description?: string | null;
      image: string;
      boardID: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetBoardQueryVariables = {
  id: string;
};

export type GetBoardQuery = {
  getBoard?: {
    __typename: 'Board';
    id: string;
    name: string;
    moodItems?: {
      __typename: 'ModelMoodItemConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListBoardsQueryVariables = {
  filter?: ModelBoardFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListBoardsQuery = {
  listBoards?: {
    __typename: 'ModelBoardConnection';
    items: Array<{
      __typename: 'Board';
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type MoodItemsByBoardIDQueryVariables = {
  boardID: string;
  sortDirection?: ModelSortDirection | null;
  filter?: ModelMoodItemFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type MoodItemsByBoardIDQuery = {
  moodItemsByBoardID?: {
    __typename: 'ModelMoodItemConnection';
    items: Array<{
      __typename: 'MoodItem';
      id: string;
      title: string;
      description?: string | null;
      image: string;
      boardID: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetRandomEmojiQueryVariables = {};

export type GetRandomEmojiQuery = {
  getRandomEmoji?: string | null;
};

export type GetKinesisEventsQueryVariables = {};

export type GetKinesisEventsQuery = {
  getKinesisEvents?: string | null;
};

export type OnCreateMoodItemSubscriptionVariables = {
  filter?: ModelSubscriptionMoodItemFilterInput | null;
};

export type OnCreateMoodItemSubscription = {
  onCreateMoodItem?: {
    __typename: 'MoodItem';
    id: string;
    title: string;
    description?: string | null;
    image: string;
    boardID: string;
    board?: {
      __typename: 'Board';
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateMoodItemSubscriptionVariables = {
  filter?: ModelSubscriptionMoodItemFilterInput | null;
};

export type OnUpdateMoodItemSubscription = {
  onUpdateMoodItem?: {
    __typename: 'MoodItem';
    id: string;
    title: string;
    description?: string | null;
    image: string;
    boardID: string;
    board?: {
      __typename: 'Board';
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteMoodItemSubscriptionVariables = {
  filter?: ModelSubscriptionMoodItemFilterInput | null;
};

export type OnDeleteMoodItemSubscription = {
  onDeleteMoodItem?: {
    __typename: 'MoodItem';
    id: string;
    title: string;
    description?: string | null;
    image: string;
    boardID: string;
    board?: {
      __typename: 'Board';
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateBoardSubscriptionVariables = {
  filter?: ModelSubscriptionBoardFilterInput | null;
};

export type OnCreateBoardSubscription = {
  onCreateBoard?: {
    __typename: 'Board';
    id: string;
    name: string;
    moodItems?: {
      __typename: 'ModelMoodItemConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateBoardSubscriptionVariables = {
  filter?: ModelSubscriptionBoardFilterInput | null;
};

export type OnUpdateBoardSubscription = {
  onUpdateBoard?: {
    __typename: 'Board';
    id: string;
    name: string;
    moodItems?: {
      __typename: 'ModelMoodItemConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteBoardSubscriptionVariables = {
  filter?: ModelSubscriptionBoardFilterInput | null;
};

export type OnDeleteBoardSubscription = {
  onDeleteBoard?: {
    __typename: 'Board';
    id: string;
    name: string;
    moodItems?: {
      __typename: 'ModelMoodItemConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};
