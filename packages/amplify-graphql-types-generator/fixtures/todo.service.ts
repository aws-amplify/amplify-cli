/* tslint:disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from '@angular/core';
import { graphqlOperation } from 'aws-amplify';
import { AmplifyService } from 'aws-amplify-angular';
import * as Observable from 'zen-observable';

export type ModelTodoFilterInput = {
  id?: ModelIDFilterInput | null;
  name?: ModelStringFilterInput | null;
  description?: ModelStringFilterInput | null;
  and?: Array<ModelTodoFilterInput | null> | null;
  or?: Array<ModelTodoFilterInput | null> | null;
  not?: ModelTodoFilterInput | null;
};

export type ModelIDFilterInput = {
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
};

export type ModelStringFilterInput = {
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
};

export type CreateTodoInput = {
  name: string;
  description?: string | null;
};

export type UpdateTodoInput = {
  id: string;
  name?: string | null;
  description?: string | null;
};

export type DeleteTodoInput = {
  id?: string | null;
};

export type GetTodoQueryVariables = {
  id: string;
};

export type GetTodoQuery = {
  getTodo: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

export type ListTodosQueryVariables = {
  filter?: ModelTodoFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListTodosQuery = {
  listTodos: {
    items: Array<{
      id: string;
      name: string;
      description: string | null;
    } | null> | null;
    nextToken: string | null;
  } | null;
};

export type CreateTodoMutationVariables = {
  input: CreateTodoInput;
};

export type CreateTodoMutation = {
  createTodo: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

export type UpdateTodoMutationVariables = {
  input: UpdateTodoInput;
};

export type UpdateTodoMutation = {
  updateTodo: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

export type DeleteTodoMutationVariables = {
  input: DeleteTodoInput;
};

export type DeleteTodoMutation = {
  deleteTodo: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

export type OnCreateTodoSubscription = {
  onCreateTodo: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

export type OnUpdateTodoSubscription = {
  onUpdateTodo: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

export type OnDeleteTodoSubscription = {
  onDeleteTodo: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

@Injectable({
  providedIn: 'root',
})
export class AppSyncService {
  constructor(private amplifyService: AmplifyService) {}
  async GetTodo(input: GetTodoQueryVariables): Promise<GetTodoQuery> {
    const statement = `query GetTodo($id: ID!) {
        getTodo(id: $id) {
          id
          name
          description
        }
      }`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <GetTodoQuery>response.data;
  }
  async ListTodos(input: ListTodosQueryVariables): Promise<ListTodosQuery> {
    const statement = `query ListTodos($filter: ModelTodoFilterInput, $limit: Int, $nextToken: String) {
        listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            name
            description
          }
          nextToken
        }
      }`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <ListTodosQuery>response.data;
  }
  async CreateTodo(input: CreateTodoMutationVariables): Promise<CreateTodoMutation> {
    const statement = `mutation CreateTodo($input: CreateTodoInput!) {
        createTodo(input: $input) {
          id
          name
          description
        }
      }`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <CreateTodoMutation>response.data;
  }
  async UpdateTodo(input: UpdateTodoMutationVariables): Promise<UpdateTodoMutation> {
    const statement = `mutation UpdateTodo($input: UpdateTodoInput!) {
        updateTodo(input: $input) {
          id
          name
          description
        }
      }`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <UpdateTodoMutation>response.data;
  }
  async DeleteTodo(input: DeleteTodoMutationVariables): Promise<DeleteTodoMutation> {
    const statement = `mutation DeleteTodo($input: DeleteTodoInput!) {
        deleteTodo(input: $input) {
          id
          name
          description
        }
      }`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <DeleteTodoMutation>response.data;
  }
  OnCreateTodoListener: Observable<OnCreateTodoSubscription> = this.amplifyService.api().graphql(
    graphqlOperation(
      `subscription OnCreateTodo {
        onCreateTodo {
          id
          name
          description
        }
      }`
    )
  ) as Observable<OnCreateTodoSubscription>;

  OnUpdateTodoListener: Observable<OnUpdateTodoSubscription> = this.amplifyService.api().graphql(
    graphqlOperation(
      `subscription OnUpdateTodo {
        onUpdateTodo {
          id
          name
          description
        }
      }`
    )
  ) as Observable<OnUpdateTodoSubscription>;

  OnDeleteTodoListener: Observable<OnDeleteTodoSubscription> = this.amplifyService.api().graphql(
    graphqlOperation(
      `subscription OnDeleteTodo {
        onDeleteTodo {
          id
          name
          description
        }
      }`
    )
  ) as Observable<OnDeleteTodoSubscription>;
}
