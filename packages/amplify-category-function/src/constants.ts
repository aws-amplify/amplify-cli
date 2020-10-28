export const category = 'function';

export const envVarPrintoutPrefix =
  '\nYou can access the following resource attributes as environment variables from your Lambda function\n\t';
const topLevelCommentBlockTitle = 'Amplify Params - DO NOT EDIT';
export const topLevelCommentPrefix = `/* ${topLevelCommentBlockTitle}\n\t`;
export const topLevelCommentSuffix = `\n${topLevelCommentBlockTitle} */`;

export enum CRUDOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}
