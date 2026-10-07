export const categoryName = 'function';

export const envVarPrintoutPrefix =
  '\nYou can access the following resource attributes as environment variables from your Lambda function\n\t';
const topLevelCommentBlockTitle = 'Amplify Params - DO NOT EDIT';
export const topLevelCommentPrefix = `/* ${topLevelCommentBlockTitle}\n`;
export const topLevelCommentSuffix = `\n${topLevelCommentBlockTitle} */`;

export enum CRUDOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum GraphQLOperation {
  QUERY = 'Query',
  MUTATION = 'Mutation',
  SUBSCRIPTION = 'Subscription',
}
