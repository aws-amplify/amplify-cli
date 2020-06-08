import { GraphQLSchema, DocumentNode, execute, specifiedRules, validate } from 'graphql';
import { exposeGraphQLErrors } from '../expose-graphql-errors';
import { AppSyncGraphQLExecutionContext } from './index';
import { ExecutionResultDataDefault } from 'graphql/execution/execute';
export async function runQueryOrMutation(
  schema: GraphQLSchema,
  doc: DocumentNode,
  variables: Record<string, any>,
  operationName: string,
  context: AppSyncGraphQLExecutionContext,
): Promise<{ data: any; errors?: any }> {
  const validationErrors = validate(schema, doc, specifiedRules);
  if (validationErrors.length === 0) {
    const results: ExecutionResultDataDefault = await execute(schema, doc, null, context, variables, operationName);
    const errors = [...(results.errors || []), ...(context.appsyncErrors || [])];
    if (errors.length > 0) {
      results.errors = exposeGraphQLErrors(errors);
    }
    return { data: null, ...results };
  }
  return { errors: validationErrors, data: null };
}
