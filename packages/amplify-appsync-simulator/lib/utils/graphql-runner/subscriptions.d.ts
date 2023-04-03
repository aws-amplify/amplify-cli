import { GraphQLSchema, DocumentNode } from 'graphql';
import { ExecutionResult } from 'graphql/execution/execute';
import { AppSyncGraphQLExecutionContext } from './index';
export type SubscriptionResult = ExecutionResult & {
    asyncIterator: AsyncIterableIterator<ExecutionResult>;
};
export declare function runSubscription(schema: GraphQLSchema, document: DocumentNode, variables: Record<string, any>, operationName: string | undefined, context: AppSyncGraphQLExecutionContext): Promise<SubscriptionResult | ExecutionResult>;
//# sourceMappingURL=subscriptions.d.ts.map