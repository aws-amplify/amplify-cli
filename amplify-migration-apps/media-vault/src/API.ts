/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateNoteInput = {
  id?: string | null;
  title: string;
  content?: string | null;
};

export type ModelNoteConditionInput = {
  title?: ModelStringInput | null;
  content?: ModelStringInput | null;
  and?: Array<ModelNoteConditionInput | null> | null;
  or?: Array<ModelNoteConditionInput | null> | null;
  not?: ModelNoteConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  owner?: ModelStringInput | null;
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

export type ModelSizeInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
};

export type Note = {
  __typename: 'Note';
  id: string;
  title: string;
  content?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: string | null;
};

export type UpdateNoteInput = {
  id: string;
  title?: string | null;
  content?: string | null;
};

export type DeleteNoteInput = {
  id: string;
};

export type ModelNoteFilterInput = {
  id?: ModelIDInput | null;
  title?: ModelStringInput | null;
  content?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelNoteFilterInput | null> | null;
  or?: Array<ModelNoteFilterInput | null> | null;
  not?: ModelNoteFilterInput | null;
  owner?: ModelStringInput | null;
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

export type ModelNoteConnection = {
  __typename: 'ModelNoteConnection';
  items: Array<Note | null>;
  nextToken?: string | null;
};

export type GenerateThumbnailResponse = {
  __typename: 'GenerateThumbnailResponse';
  statusCode: number;
  message: string;
};

export type AddUserToGroupResponse = {
  __typename: 'AddUserToGroupResponse';
  statusCode: number;
  message: string;
};

export type RemoveUserFromGroupResponse = {
  __typename: 'RemoveUserFromGroupResponse';
  statusCode: number;
  message: string;
};

export type ModelSubscriptionNoteFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  title?: ModelSubscriptionStringInput | null;
  content?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionNoteFilterInput | null> | null;
  or?: Array<ModelSubscriptionNoteFilterInput | null> | null;
  owner?: ModelStringInput | null;
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

export type CreateNoteMutationVariables = {
  input: CreateNoteInput;
  condition?: ModelNoteConditionInput | null;
};

export type CreateNoteMutation = {
  createNote?: {
    __typename: 'Note';
    id: string;
    title: string;
    content?: string | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type UpdateNoteMutationVariables = {
  input: UpdateNoteInput;
  condition?: ModelNoteConditionInput | null;
};

export type UpdateNoteMutation = {
  updateNote?: {
    __typename: 'Note';
    id: string;
    title: string;
    content?: string | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type DeleteNoteMutationVariables = {
  input: DeleteNoteInput;
  condition?: ModelNoteConditionInput | null;
};

export type DeleteNoteMutation = {
  deleteNote?: {
    __typename: 'Note';
    id: string;
    title: string;
    content?: string | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type GetNoteQueryVariables = {
  id: string;
};

export type GetNoteQuery = {
  getNote?: {
    __typename: 'Note';
    id: string;
    title: string;
    content?: string | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type ListNotesQueryVariables = {
  filter?: ModelNoteFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListNotesQuery = {
  listNotes?: {
    __typename: 'ModelNoteConnection';
    items: Array<{
      __typename: 'Note';
      id: string;
      title: string;
      content?: string | null;
      createdAt: string;
      updatedAt: string;
      owner?: string | null;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GenerateThumbnailQueryVariables = {
  mediaFileKey: string;
};

export type GenerateThumbnailQuery = {
  generateThumbnail?: {
    __typename: 'GenerateThumbnailResponse';
    statusCode: number;
    message: string;
  } | null;
};

export type AddUserToGroupQueryVariables = {
  userSub: string;
  group: string;
};

export type AddUserToGroupQuery = {
  addUserToGroup?: {
    __typename: 'AddUserToGroupResponse';
    statusCode: number;
    message: string;
  } | null;
};

export type RemoveUserFromGroupQueryVariables = {
  userSub: string;
  group: string;
};

export type RemoveUserFromGroupQuery = {
  removeUserFromGroup?: {
    __typename: 'RemoveUserFromGroupResponse';
    statusCode: number;
    message: string;
  } | null;
};

export type OnCreateNoteSubscriptionVariables = {
  filter?: ModelSubscriptionNoteFilterInput | null;
  owner?: string | null;
};

export type OnCreateNoteSubscription = {
  onCreateNote?: {
    __typename: 'Note';
    id: string;
    title: string;
    content?: string | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type OnUpdateNoteSubscriptionVariables = {
  filter?: ModelSubscriptionNoteFilterInput | null;
  owner?: string | null;
};

export type OnUpdateNoteSubscription = {
  onUpdateNote?: {
    __typename: 'Note';
    id: string;
    title: string;
    content?: string | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type OnDeleteNoteSubscriptionVariables = {
  filter?: ModelSubscriptionNoteFilterInput | null;
  owner?: string | null;
};

export type OnDeleteNoteSubscription = {
  onDeleteNote?: {
    __typename: 'Note';
    id: string;
    title: string;
    content?: string | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};
