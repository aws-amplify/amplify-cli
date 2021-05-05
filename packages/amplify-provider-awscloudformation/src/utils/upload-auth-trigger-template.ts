import { $TSContext, FeatureFlags, JSONUtilities, pathManager } from 'amplify-cli-core';
import path from 'path';
import { uploadTemplateToS3 } from '../push-resources';
import { ProviderName } from '../constants';

export const AUTH_TRIGGER_TEMPLATE = 'auth-trigger-cloudformation-template.json';
export const AUTH_TRIGGER_STACK = 'AuthTriggerCustomLambdaStack';
const S3_UPLOAD_PATH = `auth/${AUTH_TRIGGER_TEMPLATE}`;

export async function uploadAuthTriggerTemplate(context: $TSContext) {
  if (!FeatureFlags.getBoolean('auth.breakCircularDependency')) {
    return {};
  }
  const category = 'auth';
  let { amplifyMeta } = context.amplify.getProjectDetails();
  const authResource = amplifyMeta?.auth ?? {};
  const authResourceParams = Object.keys(authResource);
  if (authResourceParams.length === 0) {
    return {};
  }
  const resourceDir = path.join(pathManager.getBackendDirPath(), category, authResourceParams[0]);
  const authTriggerCfnFilePath = path.join(resourceDir, AUTH_TRIGGER_TEMPLATE);
  const { DeploymentBucketName } = context.amplify.getProjectMeta()?.providers?.[ProviderName] ?? {};
  try {
    JSONUtilities.readJson(authTriggerCfnFilePath);
  } catch (err) {
    return {
      AuthTriggerTemplateURL: '',
    };
  }
  await uploadTemplateToS3(context, path.join(resourceDir, AUTH_TRIGGER_TEMPLATE), category, '', null);
  return {
    AuthTriggerTemplateURL: `https://s3.amazonaws.com/${DeploymentBucketName}/amplify-cfn-templates/${S3_UPLOAD_PATH}`,
  };
}
