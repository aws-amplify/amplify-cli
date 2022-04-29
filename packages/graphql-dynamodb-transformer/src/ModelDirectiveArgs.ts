import { getDirectiveArguments } from 'graphql-transformer-core';
import { DirectiveNode } from 'graphql';

export interface QueryNameMap {
  get?: string;
  list?: string;
  query?: string;
}

export interface MutationNameMap {
  create?: string;
  update?: string;
  delete?: string;
}

export type ModelSubscriptionLevel = 'off' | 'public' | 'on';

export interface SubscriptionNameMap {
  onCreate?: string[];
  onUpdate?: string[];
  onDelete?: string[];
  level?: ModelSubscriptionLevel;
}

export interface ModelDirectiveTimestampConfiguration {
  createdAt?: string;
  updatedAt?: string;
}

export interface ModelDirectiveArgs {
  queries?: QueryNameMap;
  mutations?: MutationNameMap;
  subscriptions?: SubscriptionNameMap;
  timestamps?: ModelDirectiveTimestampConfiguration;
}

export function getCreatedAtFieldName(directive: DirectiveNode): string | undefined {
  return getTimestampFieldName(directive, 'createdAt', 'createdAt');
}

export function getUpdatedAtFieldName(directive: DirectiveNode): string | undefined {
  return getTimestampFieldName(directive, 'updatedAt', 'updatedAt');
}

export function getTimestampFieldName(directive: DirectiveNode, fieldName: string, defaultFiledValue: string): string | undefined {
  const directiveArguments: ModelDirectiveArgs = getDirectiveArguments(directive);
  const timestamp = directiveArguments.timestamps;

  /* When explicitly set to null, note that the check here is strict equality to null and not undefined
   * type Post @model(timestamps:null) {
        id: ID!
   }
   */
  if (timestamp === null) return null;
  if (timestamp && timestamp[fieldName] !== undefined) {
    return timestamp[fieldName];
  }
  return defaultFiledValue;
}
