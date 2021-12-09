import { GraphQLSchema, DocumentNode } from 'graphql';
import { getAuthDirectiveTransformer, getAuthDirectives } from './auth';
import { getAwsSubscribeDirectiveTransformer, getAwsSubscribeDirective } from './aws-subscribe';
import { AmplifyAppSyncSimulator } from '../..';
export const getDirectiveTypeDefs = (): string => {
  return [getAuthDirectives(), getAwsSubscribeDirective()].join('\n');
};

export const transformSchemaWithDirectives = (schema: GraphQLSchema, context: AmplifyAppSyncSimulator) => {
  const authDirectiveTransformer = getAuthDirectiveTransformer(context);
  const awsSubscribeDirectiveTransformer = getAwsSubscribeDirectiveTransformer(context);
  return authDirectiveTransformer(awsSubscribeDirectiveTransformer(schema));
};
