/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateProjectInput = {
  id?: string | null;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  deadline?: string | null;
  color?: string | null;
};

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  ARCHIVED = 'ARCHIVED',
}

export type ModelProjectConditionInput = {
  title?: ModelStringInput | null;
  description?: ModelStringInput | null;
  status?: ModelProjectStatusInput | null;
  deadline?: ModelStringInput | null;
  color?: ModelStringInput | null;
  and?: Array<ModelProjectConditionInput | null> | null;
  or?: Array<ModelProjectConditionInput | null> | null;
  not?: ModelProjectConditionInput | null;
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

export type ModelProjectStatusInput = {
  eq?: ProjectStatus | null;
  ne?: ProjectStatus | null;
};

export type Project = {
  __typename: 'Project';
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  deadline?: string | null;
  color?: string | null;
  todos?: ModelTodoConnection | null;
  createdAt: string;
  updatedAt: string;
  owner?: string | null;
};

export type ModelTodoConnection = {
  __typename: 'ModelTodoConnection';
  items: Array<Todo | null>;
  nextToken?: string | null;
};

export type Todo = {
  __typename: 'Todo';
  id: string;
  name: string;
  description?: string | null;
  images?: Array<string | null> | null;
  projectID?: string | null;
  createdAt: string;
  updatedAt: string;
  projectTodosId?: string | null;
  owner?: string | null;
};

export type UpdateProjectInput = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: ProjectStatus | null;
  deadline?: string | null;
  color?: string | null;
};

export type DeleteProjectInput = {
  id: string;
};

export type CreateTodoInput = {
  id?: string | null;
  name: string;
  description?: string | null;
  images?: Array<string | null> | null;
  projectID?: string | null;
  projectTodosId?: string | null;
};

export type ModelTodoConditionInput = {
  name?: ModelStringInput | null;
  description?: ModelStringInput | null;
  images?: ModelStringInput | null;
  projectID?: ModelIDInput | null;
  and?: Array<ModelTodoConditionInput | null> | null;
  or?: Array<ModelTodoConditionInput | null> | null;
  not?: ModelTodoConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  projectTodosId?: ModelIDInput | null;
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

export type UpdateTodoInput = {
  id: string;
  name?: string | null;
  description?: string | null;
  images?: Array<string | null> | null;
  projectID?: string | null;
  projectTodosId?: string | null;
};

export type DeleteTodoInput = {
  id: string;
};

export type QuoteResponse = {
  __typename: 'QuoteResponse';
  message: string;
  quote: string;
  author: string;
  timestamp: string;
  totalQuotes: number;
};

export type ModelProjectFilterInput = {
  id?: ModelIDInput | null;
  title?: ModelStringInput | null;
  description?: ModelStringInput | null;
  status?: ModelProjectStatusInput | null;
  deadline?: ModelStringInput | null;
  color?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelProjectFilterInput | null> | null;
  or?: Array<ModelProjectFilterInput | null> | null;
  not?: ModelProjectFilterInput | null;
  owner?: ModelStringInput | null;
};

export type ModelProjectConnection = {
  __typename: 'ModelProjectConnection';
  items: Array<Project | null>;
  nextToken?: string | null;
};

export type ModelTodoFilterInput = {
  id?: ModelIDInput | null;
  name?: ModelStringInput | null;
  description?: ModelStringInput | null;
  images?: ModelStringInput | null;
  projectID?: ModelIDInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelTodoFilterInput | null> | null;
  or?: Array<ModelTodoFilterInput | null> | null;
  not?: ModelTodoFilterInput | null;
  projectTodosId?: ModelIDInput | null;
  owner?: ModelStringInput | null;
};

export type ModelSubscriptionProjectFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  title?: ModelSubscriptionStringInput | null;
  description?: ModelSubscriptionStringInput | null;
  status?: ModelSubscriptionStringInput | null;
  deadline?: ModelSubscriptionStringInput | null;
  color?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionProjectFilterInput | null> | null;
  or?: Array<ModelSubscriptionProjectFilterInput | null> | null;
  projectTodosId?: ModelSubscriptionIDInput | null;
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

export type ModelSubscriptionTodoFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  name?: ModelSubscriptionStringInput | null;
  description?: ModelSubscriptionStringInput | null;
  images?: ModelSubscriptionStringInput | null;
  projectID?: ModelSubscriptionIDInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionTodoFilterInput | null> | null;
  or?: Array<ModelSubscriptionTodoFilterInput | null> | null;
  owner?: ModelStringInput | null;
};

export type CreateProjectMutationVariables = {
  input: CreateProjectInput;
  condition?: ModelProjectConditionInput | null;
};

export type CreateProjectMutation = {
  createProject?: {
    __typename: 'Project';
    id: string;
    title: string;
    description?: string | null;
    status: ProjectStatus;
    deadline?: string | null;
    color?: string | null;
    todos?: {
      __typename: 'ModelTodoConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type UpdateProjectMutationVariables = {
  input: UpdateProjectInput;
  condition?: ModelProjectConditionInput | null;
};

export type UpdateProjectMutation = {
  updateProject?: {
    __typename: 'Project';
    id: string;
    title: string;
    description?: string | null;
    status: ProjectStatus;
    deadline?: string | null;
    color?: string | null;
    todos?: {
      __typename: 'ModelTodoConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type DeleteProjectMutationVariables = {
  input: DeleteProjectInput;
  condition?: ModelProjectConditionInput | null;
};

export type DeleteProjectMutation = {
  deleteProject?: {
    __typename: 'Project';
    id: string;
    title: string;
    description?: string | null;
    status: ProjectStatus;
    deadline?: string | null;
    color?: string | null;
    todos?: {
      __typename: 'ModelTodoConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type CreateTodoMutationVariables = {
  input: CreateTodoInput;
  condition?: ModelTodoConditionInput | null;
};

export type CreateTodoMutation = {
  createTodo?: {
    __typename: 'Todo';
    id: string;
    name: string;
    description?: string | null;
    images?: Array<string | null> | null;
    projectID?: string | null;
    createdAt: string;
    updatedAt: string;
    projectTodosId?: string | null;
    owner?: string | null;
  } | null;
};

export type UpdateTodoMutationVariables = {
  input: UpdateTodoInput;
  condition?: ModelTodoConditionInput | null;
};

export type UpdateTodoMutation = {
  updateTodo?: {
    __typename: 'Todo';
    id: string;
    name: string;
    description?: string | null;
    images?: Array<string | null> | null;
    projectID?: string | null;
    createdAt: string;
    updatedAt: string;
    projectTodosId?: string | null;
    owner?: string | null;
  } | null;
};

export type DeleteTodoMutationVariables = {
  input: DeleteTodoInput;
  condition?: ModelTodoConditionInput | null;
};

export type DeleteTodoMutation = {
  deleteTodo?: {
    __typename: 'Todo';
    id: string;
    name: string;
    description?: string | null;
    images?: Array<string | null> | null;
    projectID?: string | null;
    createdAt: string;
    updatedAt: string;
    projectTodosId?: string | null;
    owner?: string | null;
  } | null;
};

export type GetRandomQuoteQueryVariables = {};

export type GetRandomQuoteQuery = {
  getRandomQuote?: {
    __typename: 'QuoteResponse';
    message: string;
    quote: string;
    author: string;
    timestamp: string;
    totalQuotes: number;
  } | null;
};

export type GetProjectQueryVariables = {
  id: string;
};

export type GetProjectQuery = {
  getProject?: {
    __typename: 'Project';
    id: string;
    title: string;
    description?: string | null;
    status: ProjectStatus;
    deadline?: string | null;
    color?: string | null;
    todos?: {
      __typename: 'ModelTodoConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type ListProjectsQueryVariables = {
  filter?: ModelProjectFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListProjectsQuery = {
  listProjects?: {
    __typename: 'ModelProjectConnection';
    items: Array<{
      __typename: 'Project';
      id: string;
      title: string;
      description?: string | null;
      status: ProjectStatus;
      deadline?: string | null;
      color?: string | null;
      createdAt: string;
      updatedAt: string;
      owner?: string | null;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetTodoQueryVariables = {
  id: string;
};

export type GetTodoQuery = {
  getTodo?: {
    __typename: 'Todo';
    id: string;
    name: string;
    description?: string | null;
    images?: Array<string | null> | null;
    projectID?: string | null;
    createdAt: string;
    updatedAt: string;
    projectTodosId?: string | null;
    owner?: string | null;
  } | null;
};

export type ListTodosQueryVariables = {
  filter?: ModelTodoFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListTodosQuery = {
  listTodos?: {
    __typename: 'ModelTodoConnection';
    items: Array<{
      __typename: 'Todo';
      id: string;
      name: string;
      description?: string | null;
      images?: Array<string | null> | null;
      projectID?: string | null;
      createdAt: string;
      updatedAt: string;
      projectTodosId?: string | null;
      owner?: string | null;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type OnCreateProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null;
  owner?: string | null;
};

export type OnCreateProjectSubscription = {
  onCreateProject?: {
    __typename: 'Project';
    id: string;
    title: string;
    description?: string | null;
    status: ProjectStatus;
    deadline?: string | null;
    color?: string | null;
    todos?: {
      __typename: 'ModelTodoConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type OnUpdateProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null;
  owner?: string | null;
};

export type OnUpdateProjectSubscription = {
  onUpdateProject?: {
    __typename: 'Project';
    id: string;
    title: string;
    description?: string | null;
    status: ProjectStatus;
    deadline?: string | null;
    color?: string | null;
    todos?: {
      __typename: 'ModelTodoConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type OnDeleteProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null;
  owner?: string | null;
};

export type OnDeleteProjectSubscription = {
  onDeleteProject?: {
    __typename: 'Project';
    id: string;
    title: string;
    description?: string | null;
    status: ProjectStatus;
    deadline?: string | null;
    color?: string | null;
    todos?: {
      __typename: 'ModelTodoConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type OnCreateTodoSubscriptionVariables = {
  filter?: ModelSubscriptionTodoFilterInput | null;
  owner?: string | null;
};

export type OnCreateTodoSubscription = {
  onCreateTodo?: {
    __typename: 'Todo';
    id: string;
    name: string;
    description?: string | null;
    images?: Array<string | null> | null;
    projectID?: string | null;
    createdAt: string;
    updatedAt: string;
    projectTodosId?: string | null;
    owner?: string | null;
  } | null;
};

export type OnUpdateTodoSubscriptionVariables = {
  filter?: ModelSubscriptionTodoFilterInput | null;
  owner?: string | null;
};

export type OnUpdateTodoSubscription = {
  onUpdateTodo?: {
    __typename: 'Todo';
    id: string;
    name: string;
    description?: string | null;
    images?: Array<string | null> | null;
    projectID?: string | null;
    createdAt: string;
    updatedAt: string;
    projectTodosId?: string | null;
    owner?: string | null;
  } | null;
};

export type OnDeleteTodoSubscriptionVariables = {
  filter?: ModelSubscriptionTodoFilterInput | null;
  owner?: string | null;
};

export type OnDeleteTodoSubscription = {
  onDeleteTodo?: {
    __typename: 'Todo';
    id: string;
    name: string;
    description?: string | null;
    images?: Array<string | null> | null;
    projectID?: string | null;
    createdAt: string;
    updatedAt: string;
    projectTodosId?: string | null;
    owner?: string | null;
  } | null;
};
