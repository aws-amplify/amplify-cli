import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from '@aws-amplify/datastore';
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection } from '@aws-amplify/datastore';

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  ARCHIVED = 'ARCHIVED',
}

type EagerQuoteResponse = {
  readonly message: string;
  readonly quote: string;
  readonly author: string;
  readonly timestamp: string;
  readonly totalQuotes: number;
};

type LazyQuoteResponse = {
  readonly message: string;
  readonly quote: string;
  readonly author: string;
  readonly timestamp: string;
  readonly totalQuotes: number;
};

export declare type QuoteResponse = LazyLoading extends LazyLoadingDisabled ? EagerQuoteResponse : LazyQuoteResponse;

export declare const QuoteResponse: new (init: ModelInit<QuoteResponse>) => QuoteResponse;

type EagerProject = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Project, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly status: ProjectStatus | keyof typeof ProjectStatus;
  readonly deadline?: string | null;
  readonly color?: string | null;
  readonly todos?: (Todo | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

type LazyProject = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Project, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly status: ProjectStatus | keyof typeof ProjectStatus;
  readonly deadline?: string | null;
  readonly color?: string | null;
  readonly todos: AsyncCollection<Todo>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export declare type Project = LazyLoading extends LazyLoadingDisabled ? EagerProject : LazyProject;

export declare const Project: (new (init: ModelInit<Project>) => Project) & {
  copyOf(source: Project, mutator: (draft: MutableModel<Project>) => MutableModel<Project> | void): Project;
};

type EagerTodo = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Todo, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly images?: (string | null)[] | null;
  readonly projectID?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly projectTodosId?: string | null;
};

type LazyTodo = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Todo, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly images?: (string | null)[] | null;
  readonly projectID?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly projectTodosId?: string | null;
};

export declare type Todo = LazyLoading extends LazyLoadingDisabled ? EagerTodo : LazyTodo;

export declare const Todo: (new (init: ModelInit<Todo>) => Todo) & {
  copyOf(source: Todo, mutator: (draft: MutableModel<Todo>) => MutableModel<Todo> | void): Todo;
};
