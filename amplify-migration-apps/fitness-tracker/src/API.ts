/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateWorkoutProgramInput = {
  id?: string | null;
  title: string;
  description?: string | null;
  status: WorkoutProgramStatus;
  deadline?: string | null;
  color?: string | null;
};

export enum WorkoutProgramStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  ARCHIVED = 'ARCHIVED',
}

export type ModelWorkoutProgramConditionInput = {
  title?: ModelStringInput | null;
  description?: ModelStringInput | null;
  status?: ModelWorkoutProgramStatusInput | null;
  deadline?: ModelStringInput | null;
  color?: ModelStringInput | null;
  and?: Array<ModelWorkoutProgramConditionInput | null> | null;
  or?: Array<ModelWorkoutProgramConditionInput | null> | null;
  not?: ModelWorkoutProgramConditionInput | null;
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

export type ModelWorkoutProgramStatusInput = {
  eq?: WorkoutProgramStatus | null;
  ne?: WorkoutProgramStatus | null;
};

export type WorkoutProgram = {
  __typename: 'WorkoutProgram';
  id: string;
  title: string;
  description?: string | null;
  status: WorkoutProgramStatus;
  deadline?: string | null;
  color?: string | null;
  exercises?: ModelExerciseConnection | null;
  createdAt: string;
  updatedAt: string;
  owner?: string | null;
};

export type ModelExerciseConnection = {
  __typename: 'ModelExerciseConnection';
  items: Array<Exercise | null>;
  nextToken?: string | null;
};

export type Exercise = {
  __typename: 'Exercise';
  id: string;
  workoutProgramId?: string | null;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  workoutProgramExercisesId?: string | null;
  owner?: string | null;
};

export type UpdateWorkoutProgramInput = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: WorkoutProgramStatus | null;
  deadline?: string | null;
  color?: string | null;
};

export type DeleteWorkoutProgramInput = {
  id: string;
};

export type CreateExerciseInput = {
  id?: string | null;
  workoutProgramId?: string | null;
  name: string;
  description?: string | null;
  workoutProgramExercisesId?: string | null;
};

export type ModelExerciseConditionInput = {
  workoutProgramId?: ModelIDInput | null;
  name?: ModelStringInput | null;
  description?: ModelStringInput | null;
  and?: Array<ModelExerciseConditionInput | null> | null;
  or?: Array<ModelExerciseConditionInput | null> | null;
  not?: ModelExerciseConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  workoutProgramExercisesId?: ModelIDInput | null;
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

export type UpdateExerciseInput = {
  id: string;
  workoutProgramId?: string | null;
  name?: string | null;
  description?: string | null;
  workoutProgramExercisesId?: string | null;
};

export type DeleteExerciseInput = {
  id: string;
};

export type CreateMealInput = {
  id?: string | null;
  userName: string;
  content: string;
  timestamp: string;
};

export type ModelMealConditionInput = {
  userName?: ModelStringInput | null;
  content?: ModelStringInput | null;
  timestamp?: ModelStringInput | null;
  and?: Array<ModelMealConditionInput | null> | null;
  or?: Array<ModelMealConditionInput | null> | null;
  not?: ModelMealConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type Meal = {
  __typename: 'Meal';
  id: string;
  userName: string;
  content: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateMealInput = {
  id: string;
  userName?: string | null;
  content?: string | null;
  timestamp?: string | null;
};

export type DeleteMealInput = {
  id: string;
};

export type CreateAuthActivityInput = {
  id?: string | null;
  userName: string;
  activityType: string;
  timestamp: string;
};

export type ModelAuthActivityConditionInput = {
  userName?: ModelStringInput | null;
  activityType?: ModelStringInput | null;
  timestamp?: ModelStringInput | null;
  and?: Array<ModelAuthActivityConditionInput | null> | null;
  or?: Array<ModelAuthActivityConditionInput | null> | null;
  not?: ModelAuthActivityConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type AuthActivity = {
  __typename: 'AuthActivity';
  id: string;
  userName: string;
  activityType: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAuthActivityInput = {
  id: string;
  userName?: string | null;
  activityType?: string | null;
  timestamp?: string | null;
};

export type DeleteAuthActivityInput = {
  id: string;
};

export type ModelWorkoutProgramFilterInput = {
  id?: ModelIDInput | null;
  title?: ModelStringInput | null;
  description?: ModelStringInput | null;
  status?: ModelWorkoutProgramStatusInput | null;
  deadline?: ModelStringInput | null;
  color?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelWorkoutProgramFilterInput | null> | null;
  or?: Array<ModelWorkoutProgramFilterInput | null> | null;
  not?: ModelWorkoutProgramFilterInput | null;
  owner?: ModelStringInput | null;
};

export type ModelWorkoutProgramConnection = {
  __typename: 'ModelWorkoutProgramConnection';
  items: Array<WorkoutProgram | null>;
  nextToken?: string | null;
};

export type ModelExerciseFilterInput = {
  id?: ModelIDInput | null;
  workoutProgramId?: ModelIDInput | null;
  name?: ModelStringInput | null;
  description?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelExerciseFilterInput | null> | null;
  or?: Array<ModelExerciseFilterInput | null> | null;
  not?: ModelExerciseFilterInput | null;
  workoutProgramExercisesId?: ModelIDInput | null;
  owner?: ModelStringInput | null;
};

export type ModelMealFilterInput = {
  id?: ModelIDInput | null;
  userName?: ModelStringInput | null;
  content?: ModelStringInput | null;
  timestamp?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelMealFilterInput | null> | null;
  or?: Array<ModelMealFilterInput | null> | null;
  not?: ModelMealFilterInput | null;
};

export type ModelMealConnection = {
  __typename: 'ModelMealConnection';
  items: Array<Meal | null>;
  nextToken?: string | null;
};

export type ModelAuthActivityFilterInput = {
  id?: ModelIDInput | null;
  userName?: ModelStringInput | null;
  activityType?: ModelStringInput | null;
  timestamp?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelAuthActivityFilterInput | null> | null;
  or?: Array<ModelAuthActivityFilterInput | null> | null;
  not?: ModelAuthActivityFilterInput | null;
};

export type ModelAuthActivityConnection = {
  __typename: 'ModelAuthActivityConnection';
  items: Array<AuthActivity | null>;
  nextToken?: string | null;
};

export type ModelSubscriptionWorkoutProgramFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  title?: ModelSubscriptionStringInput | null;
  description?: ModelSubscriptionStringInput | null;
  status?: ModelSubscriptionStringInput | null;
  deadline?: ModelSubscriptionStringInput | null;
  color?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionWorkoutProgramFilterInput | null> | null;
  or?: Array<ModelSubscriptionWorkoutProgramFilterInput | null> | null;
  workoutProgramExercisesId?: ModelSubscriptionIDInput | null;
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

export type ModelSubscriptionExerciseFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  workoutProgramId?: ModelSubscriptionIDInput | null;
  name?: ModelSubscriptionStringInput | null;
  description?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionExerciseFilterInput | null> | null;
  or?: Array<ModelSubscriptionExerciseFilterInput | null> | null;
  owner?: ModelStringInput | null;
};

export type ModelSubscriptionMealFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  userName?: ModelSubscriptionStringInput | null;
  content?: ModelSubscriptionStringInput | null;
  timestamp?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionMealFilterInput | null> | null;
  or?: Array<ModelSubscriptionMealFilterInput | null> | null;
};

export type ModelSubscriptionAuthActivityFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  userName?: ModelSubscriptionStringInput | null;
  activityType?: ModelSubscriptionStringInput | null;
  timestamp?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionAuthActivityFilterInput | null> | null;
  or?: Array<ModelSubscriptionAuthActivityFilterInput | null> | null;
};

export type CreateWorkoutProgramMutationVariables = {
  input: CreateWorkoutProgramInput;
  condition?: ModelWorkoutProgramConditionInput | null;
};

export type CreateWorkoutProgramMutation = {
  createWorkoutProgram?: {
    __typename: 'WorkoutProgram';
    id: string;
    title: string;
    description?: string | null;
    status: WorkoutProgramStatus;
    deadline?: string | null;
    color?: string | null;
    exercises?: {
      __typename: 'ModelExerciseConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type UpdateWorkoutProgramMutationVariables = {
  input: UpdateWorkoutProgramInput;
  condition?: ModelWorkoutProgramConditionInput | null;
};

export type UpdateWorkoutProgramMutation = {
  updateWorkoutProgram?: {
    __typename: 'WorkoutProgram';
    id: string;
    title: string;
    description?: string | null;
    status: WorkoutProgramStatus;
    deadline?: string | null;
    color?: string | null;
    exercises?: {
      __typename: 'ModelExerciseConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type DeleteWorkoutProgramMutationVariables = {
  input: DeleteWorkoutProgramInput;
  condition?: ModelWorkoutProgramConditionInput | null;
};

export type DeleteWorkoutProgramMutation = {
  deleteWorkoutProgram?: {
    __typename: 'WorkoutProgram';
    id: string;
    title: string;
    description?: string | null;
    status: WorkoutProgramStatus;
    deadline?: string | null;
    color?: string | null;
    exercises?: {
      __typename: 'ModelExerciseConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type CreateExerciseMutationVariables = {
  input: CreateExerciseInput;
  condition?: ModelExerciseConditionInput | null;
};

export type CreateExerciseMutation = {
  createExercise?: {
    __typename: 'Exercise';
    id: string;
    workoutProgramId?: string | null;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    workoutProgramExercisesId?: string | null;
    owner?: string | null;
  } | null;
};

export type UpdateExerciseMutationVariables = {
  input: UpdateExerciseInput;
  condition?: ModelExerciseConditionInput | null;
};

export type UpdateExerciseMutation = {
  updateExercise?: {
    __typename: 'Exercise';
    id: string;
    workoutProgramId?: string | null;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    workoutProgramExercisesId?: string | null;
    owner?: string | null;
  } | null;
};

export type DeleteExerciseMutationVariables = {
  input: DeleteExerciseInput;
  condition?: ModelExerciseConditionInput | null;
};

export type DeleteExerciseMutation = {
  deleteExercise?: {
    __typename: 'Exercise';
    id: string;
    workoutProgramId?: string | null;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    workoutProgramExercisesId?: string | null;
    owner?: string | null;
  } | null;
};

export type CreateMealMutationVariables = {
  input: CreateMealInput;
  condition?: ModelMealConditionInput | null;
};

export type CreateMealMutation = {
  createMeal?: {
    __typename: 'Meal';
    id: string;
    userName: string;
    content: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateMealMutationVariables = {
  input: UpdateMealInput;
  condition?: ModelMealConditionInput | null;
};

export type UpdateMealMutation = {
  updateMeal?: {
    __typename: 'Meal';
    id: string;
    userName: string;
    content: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteMealMutationVariables = {
  input: DeleteMealInput;
  condition?: ModelMealConditionInput | null;
};

export type DeleteMealMutation = {
  deleteMeal?: {
    __typename: 'Meal';
    id: string;
    userName: string;
    content: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateAuthActivityMutationVariables = {
  input: CreateAuthActivityInput;
  condition?: ModelAuthActivityConditionInput | null;
};

export type CreateAuthActivityMutation = {
  createAuthActivity?: {
    __typename: 'AuthActivity';
    id: string;
    userName: string;
    activityType: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateAuthActivityMutationVariables = {
  input: UpdateAuthActivityInput;
  condition?: ModelAuthActivityConditionInput | null;
};

export type UpdateAuthActivityMutation = {
  updateAuthActivity?: {
    __typename: 'AuthActivity';
    id: string;
    userName: string;
    activityType: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteAuthActivityMutationVariables = {
  input: DeleteAuthActivityInput;
  condition?: ModelAuthActivityConditionInput | null;
};

export type DeleteAuthActivityMutation = {
  deleteAuthActivity?: {
    __typename: 'AuthActivity';
    id: string;
    userName: string;
    activityType: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type GetWorkoutProgramQueryVariables = {
  id: string;
};

export type GetWorkoutProgramQuery = {
  getWorkoutProgram?: {
    __typename: 'WorkoutProgram';
    id: string;
    title: string;
    description?: string | null;
    status: WorkoutProgramStatus;
    deadline?: string | null;
    color?: string | null;
    exercises?: {
      __typename: 'ModelExerciseConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type ListWorkoutProgramsQueryVariables = {
  filter?: ModelWorkoutProgramFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListWorkoutProgramsQuery = {
  listWorkoutPrograms?: {
    __typename: 'ModelWorkoutProgramConnection';
    items: Array<{
      __typename: 'WorkoutProgram';
      id: string;
      title: string;
      description?: string | null;
      status: WorkoutProgramStatus;
      deadline?: string | null;
      color?: string | null;
      createdAt: string;
      updatedAt: string;
      owner?: string | null;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetExerciseQueryVariables = {
  id: string;
};

export type GetExerciseQuery = {
  getExercise?: {
    __typename: 'Exercise';
    id: string;
    workoutProgramId?: string | null;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    workoutProgramExercisesId?: string | null;
    owner?: string | null;
  } | null;
};

export type ListExercisesQueryVariables = {
  filter?: ModelExerciseFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListExercisesQuery = {
  listExercises?: {
    __typename: 'ModelExerciseConnection';
    items: Array<{
      __typename: 'Exercise';
      id: string;
      workoutProgramId?: string | null;
      name: string;
      description?: string | null;
      createdAt: string;
      updatedAt: string;
      workoutProgramExercisesId?: string | null;
      owner?: string | null;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetMealQueryVariables = {
  id: string;
};

export type GetMealQuery = {
  getMeal?: {
    __typename: 'Meal';
    id: string;
    userName: string;
    content: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListMealsQueryVariables = {
  filter?: ModelMealFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListMealsQuery = {
  listMeals?: {
    __typename: 'ModelMealConnection';
    items: Array<{
      __typename: 'Meal';
      id: string;
      userName: string;
      content: string;
      timestamp: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetAuthActivityQueryVariables = {
  id: string;
};

export type GetAuthActivityQuery = {
  getAuthActivity?: {
    __typename: 'AuthActivity';
    id: string;
    userName: string;
    activityType: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListAuthActivitiesQueryVariables = {
  filter?: ModelAuthActivityFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListAuthActivitiesQuery = {
  listAuthActivities?: {
    __typename: 'ModelAuthActivityConnection';
    items: Array<{
      __typename: 'AuthActivity';
      id: string;
      userName: string;
      activityType: string;
      timestamp: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type OnCreateWorkoutProgramSubscriptionVariables = {
  filter?: ModelSubscriptionWorkoutProgramFilterInput | null;
  owner?: string | null;
};

export type OnCreateWorkoutProgramSubscription = {
  onCreateWorkoutProgram?: {
    __typename: 'WorkoutProgram';
    id: string;
    title: string;
    description?: string | null;
    status: WorkoutProgramStatus;
    deadline?: string | null;
    color?: string | null;
    exercises?: {
      __typename: 'ModelExerciseConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type OnUpdateWorkoutProgramSubscriptionVariables = {
  filter?: ModelSubscriptionWorkoutProgramFilterInput | null;
  owner?: string | null;
};

export type OnUpdateWorkoutProgramSubscription = {
  onUpdateWorkoutProgram?: {
    __typename: 'WorkoutProgram';
    id: string;
    title: string;
    description?: string | null;
    status: WorkoutProgramStatus;
    deadline?: string | null;
    color?: string | null;
    exercises?: {
      __typename: 'ModelExerciseConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type OnDeleteWorkoutProgramSubscriptionVariables = {
  filter?: ModelSubscriptionWorkoutProgramFilterInput | null;
  owner?: string | null;
};

export type OnDeleteWorkoutProgramSubscription = {
  onDeleteWorkoutProgram?: {
    __typename: 'WorkoutProgram';
    id: string;
    title: string;
    description?: string | null;
    status: WorkoutProgramStatus;
    deadline?: string | null;
    color?: string | null;
    exercises?: {
      __typename: 'ModelExerciseConnection';
      nextToken?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    owner?: string | null;
  } | null;
};

export type OnCreateExerciseSubscriptionVariables = {
  filter?: ModelSubscriptionExerciseFilterInput | null;
  owner?: string | null;
};

export type OnCreateExerciseSubscription = {
  onCreateExercise?: {
    __typename: 'Exercise';
    id: string;
    workoutProgramId?: string | null;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    workoutProgramExercisesId?: string | null;
    owner?: string | null;
  } | null;
};

export type OnUpdateExerciseSubscriptionVariables = {
  filter?: ModelSubscriptionExerciseFilterInput | null;
  owner?: string | null;
};

export type OnUpdateExerciseSubscription = {
  onUpdateExercise?: {
    __typename: 'Exercise';
    id: string;
    workoutProgramId?: string | null;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    workoutProgramExercisesId?: string | null;
    owner?: string | null;
  } | null;
};

export type OnDeleteExerciseSubscriptionVariables = {
  filter?: ModelSubscriptionExerciseFilterInput | null;
  owner?: string | null;
};

export type OnDeleteExerciseSubscription = {
  onDeleteExercise?: {
    __typename: 'Exercise';
    id: string;
    workoutProgramId?: string | null;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    workoutProgramExercisesId?: string | null;
    owner?: string | null;
  } | null;
};

export type OnCreateMealSubscriptionVariables = {
  filter?: ModelSubscriptionMealFilterInput | null;
};

export type OnCreateMealSubscription = {
  onCreateMeal?: {
    __typename: 'Meal';
    id: string;
    userName: string;
    content: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateMealSubscriptionVariables = {
  filter?: ModelSubscriptionMealFilterInput | null;
};

export type OnUpdateMealSubscription = {
  onUpdateMeal?: {
    __typename: 'Meal';
    id: string;
    userName: string;
    content: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteMealSubscriptionVariables = {
  filter?: ModelSubscriptionMealFilterInput | null;
};

export type OnDeleteMealSubscription = {
  onDeleteMeal?: {
    __typename: 'Meal';
    id: string;
    userName: string;
    content: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateAuthActivitySubscriptionVariables = {
  filter?: ModelSubscriptionAuthActivityFilterInput | null;
};

export type OnCreateAuthActivitySubscription = {
  onCreateAuthActivity?: {
    __typename: 'AuthActivity';
    id: string;
    userName: string;
    activityType: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateAuthActivitySubscriptionVariables = {
  filter?: ModelSubscriptionAuthActivityFilterInput | null;
};

export type OnUpdateAuthActivitySubscription = {
  onUpdateAuthActivity?: {
    __typename: 'AuthActivity';
    id: string;
    userName: string;
    activityType: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteAuthActivitySubscriptionVariables = {
  filter?: ModelSubscriptionAuthActivityFilterInput | null;
};

export type OnDeleteAuthActivitySubscription = {
  onDeleteAuthActivity?: {
    __typename: 'AuthActivity';
    id: string;
    userName: string;
    activityType: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};
