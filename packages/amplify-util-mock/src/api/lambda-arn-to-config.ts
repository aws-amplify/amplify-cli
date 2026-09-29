import { keys } from 'lodash';
import {
  $TSAny,
  $TSContext,
  stateManager,
  ApiCategoryFacade,
  getGraphQLTransformerFunctionDocLink,
  AmplifyError,
} from '@aws-amplify/amplify-cli-core';
import _ = require('lodash');
import { ServiceName } from '@aws-amplify/amplify-category-function';
import { loadLambdaConfig } from '../utils/lambda/load-lambda-config';
import { ProcessedLambdaFunction } from '../CFNParser/stack/types';
/**
 * Attempts to match an arn object against the array of lambdas configured in the project
 */
export const lambdaArnToConfig = async (context: $TSContext, arn: $TSAny): Promise<ProcessedLambdaFunction> => {
  const version = await ApiCategoryFacade.getTransformerVersion(context);
  const documentLink = getGraphQLTransformerFunctionDocLink(version);
  const errorSuffix = `\nSee ${documentLink} for information on how to configure Lambda resolvers.`;
  let searchString = '';
  if (typeof arn === 'string') {
    searchString = arn;
  } else if (typeof arn === 'object' && keys(arn).length === 1) {
    const value = arn['Fn::GetAtt'] || arn['Fn::Sub'];
    if (Array.isArray(value) && value.length > 0) {
      searchString = value[0];
    } else if (typeof value === 'string') {
      searchString = value;
    } else {
      throw new Error(`Malformed Lambda ARN [${JSON.stringify(arn)}]${errorSuffix}`);
    }
  } else {
    throw new Error(`Cannot interpret Lambda ARN [${JSON.stringify(arn)}]${errorSuffix}`);
  }
  const lambdaNames = _.entries<{ service: string }>(_.get(stateManager.getMeta(), ['function']))
    .filter(([, funcMeta]) => funcMeta.service === ServiceName.LambdaFunction)
    .map(([key]) => key);
  const foundLambdaName = lambdaNames.find((name) => searchString.includes(name));
  if (!foundLambdaName) {
    throw new AmplifyError('MockProcessError', {
      message: `Did not find a Lambda matching ARN [${JSON.stringify(
        arn,
      )}] in the project. Local mocking only supports Lambdas that are configured in the project.`,
      resolution: `Use 'amplify add function' in the root of your app directory to create a new Lambda Function. To connect an AWS Lambda resolver to the GraphQL API, add the @function directive to a field in your schema.`,
      link: `${errorSuffix}`,
    });
  }
  // lambdaArnToConfig is only called in the context of initializing a mock API, so setting overrideApiToLocal to true here
  return loadLambdaConfig(context, foundLambdaName, true);
};
