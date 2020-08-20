import { LambdaFunctionConfig } from '../CFNParser/lambda-resource-processor';
import { keys } from 'lodash';

/**
 * Attempts to match an arn object against the array of lambdas configured in the project
 */
export const lambdaArnToConfig = (arn: any, provisionedLambdas: LambdaFunctionConfig[]): LambdaFunctionConfig => {
  const errorSuffix =
    '\nSee https://docs.amplify.aws/cli/graphql-transformer/directives#function for information on how to configure Lambda resolvers.';
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
  const lambdaConfig = provisionedLambdas.find(funcConfig => searchString.includes(funcConfig.name));
  if (!lambdaConfig) {
    throw new Error(
      `Did not find a Lambda matching ARN [${JSON.stringify(
        arn,
      )}] in the project. Local mocking only supports Lambdas that are configured in the project.${errorSuffix}`,
    );
  }
  return lambdaConfig;
};
