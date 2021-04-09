import { $TSContext, $TSObject, FeatureFlags, JSONUtilities, pathManager } from 'amplify-cli-core';
import path from 'path';
import { uploadTemplateToS3 } from '../push-resources';

export const AUTH_TRIGGER_TEMPLATE = 'auth-trigger-cloudformation-template.json';
export const AUTH_TRIGGER_STACK = 'AuthTriggerCustomLambdaStack';

export async function uploadAuthTriggerTemplate(context: $TSContext) {
  if (!FeatureFlags.getBoolean('auth.breakCircularDependency')) {
    return {};
  }
  const category = 'auth';
  let { amplifyMeta } = context.amplify.getProjectDetails();
  const authResource = amplifyMeta?.auth ?? {};
  const resourceDir = path.join(pathManager.getBackendDirPath(), category, Object.keys(authResource)[0]);
  const authTriggerCfnFilePath = path.join(resourceDir, AUTH_TRIGGER_TEMPLATE);
  let cfnObject: $TSObject;
  try {
    cfnObject = JSONUtilities.readJson(authTriggerCfnFilePath);
  } catch (err) {
    return {
      AuthTriggerTemplateURL: '',
    };
  }
  return {
    AuthTriggerTemplateURL: await uploadTemplateToS3(context, path.join(resourceDir, AUTH_TRIGGER_TEMPLATE), category, '', null),
  };
}
