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
  const directiveArguments: ModelDirectiveArgs = getDirectiveArguments(directive);
  const timestamp = directiveArguments.timestamps;
  if (timestamp === null) return null;
  if (timestamp) {
    return timestamp.createdAt;
  }

  return 'createdAt';
}

export function getUpdatedAtFieldName(directive: DirectiveNode): string | undefined {
  const directiveArguments: ModelDirectiveArgs = getDirectiveArguments(directive);
  const timestamp = directiveArguments.timestamps;
  if (timestamp === null) return null;
  if (timestamp) {
    return timestamp.updatedAt;
  }
  return 'updatedAt';
}
