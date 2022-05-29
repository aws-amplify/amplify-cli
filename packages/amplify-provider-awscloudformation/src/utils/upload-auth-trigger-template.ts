import { $TSContext, FeatureFlags, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import * as path from 'path';
import _ from 'lodash';
import { uploadTemplateToS3 } from '../push-resources';
import { ProviderName } from '../constants';

export const AUTH_TRIGGER_TEMPLATE = 'auth-trigger-cloudformation-template.json';
export const AUTH_TRIGGER_STACK = 'AuthTriggerCustomLambdaStack';
const S3_UPLOAD_PATH = `auth/${AUTH_TRIGGER_TEMPLATE}`;

export async function uploadAuthTriggerTemplate(context: $TSContext): Promise<{ AuthTriggerTemplateURL: string | undefined }> {
  const defaultResult = {
    AuthTriggerTemplateURL: undefined,
  };

  if (!FeatureFlags.getBoolean('auth.breakCircularDependency')) {
    return defaultResult;
  }

  const categoryName = 'auth';
  const serviceName = 'Cognito';
  const { amplifyMeta } = context.amplify.getProjectDetails();
  const cognitoResource = stateManager.getResourceFromMeta(amplifyMeta, categoryName, serviceName, undefined, false);

  if (cognitoResource === null) {
    return defaultResult;
  }

  const resourceDir = path.join(pathManager.getBackendDirPath(), categoryName, cognitoResource.resourceName);
  const authTriggerCfnFilePath = path.join(resourceDir, 'build', AUTH_TRIGGER_TEMPLATE);
  const deploymentBucketName = _.get(amplifyMeta, ['providers', ProviderName, 'DeploymentBucketName']);

  // This should not happen, so throw
  if (!deploymentBucketName) {
    throw new Error('DeploymentBucket was not found in amplify-meta.json');
  }

  const triggerCfnContent = JSONUtilities.readJson(authTriggerCfnFilePath, {
    throwIfNotExist: false,
  });

  if (!triggerCfnContent) {
    return defaultResult;
  }

  await uploadTemplateToS3(context, authTriggerCfnFilePath, categoryName, '', null);

  return {
    AuthTriggerTemplateURL: `https://s3.amazonaws.com/${deploymentBucketName}/amplify-cfn-templates/${S3_UPLOAD_PATH}`,
  };
}
