import { GraphQLSchema, DocumentNode } from 'graphql';
import { AppSyncGraphQLExecutionContext } from './index';
export declare function runQueryOrMutation(schema: GraphQLSchema, doc: DocumentNode, variables: Record<string, any>, operationName: string, context: AppSyncGraphQLExecutionContext): Promise<{
    data: any;
    errors?: any;
}>;
//# sourceMappingURL=query-and-mutation.d.ts.map