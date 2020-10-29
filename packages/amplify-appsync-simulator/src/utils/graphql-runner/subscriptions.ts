import { subscribe, GraphQLSchema, DocumentNode } from 'graphql';
import { ExecutionResult } from 'graphql/execution/execute';
import { AppSyncGraphQLExecutionContext } from './index';
import { runQueryOrMutation } from './query-and-mutation';
import { getOperationType } from './helpers';

export type SubscriptionResult = ExecutionResult & {
  asyncIterator: AsyncIterableIterator<ExecutionResult>;
};

export async function runSubscription(
  schema: GraphQLSchema,
  document: DocumentNode,
  variables: Record<string, any>,
  operationName: string | undefined,
  context: AppSyncGraphQLExecutionContext,
): Promise<SubscriptionResult | ExecutionResult> {
  const operationType = getOperationType(document);
  if (operationType !== 'subscription') {
    const error = new Error(`Expected operation type subscription, received ${operationType}`);
    error.name = 'GraphQL operation error';
    throw error;
  }

  const result = await runQueryOrMutation(schema, document, variables, operationName, context);
  if (result.errors && result.errors.length) {
    return result;
  }

  const subscriptionResult = await subscribe({
    schema: schema,
    document,
    variableValues: variables,
    contextValue: context,
    operationName,
  });
  if ((subscriptionResult as ExecutionResult).errors) {
    return {
      data: result.data,
      errors: (subscriptionResult as ExecutionResult).errors,
    };
  }

  return { asyncIterator: subscriptionResult as AsyncIterableIterator<ExecutionResult>, ...result };
}
