import { $TSContext, $TSObject, FeatureFlags, JSONUtilities, pathManager } from 'amplify-cli-core';
import { S3 } from '../aws-utils/aws-s3';
import path from 'path';

export const AUTH_TRIGGER_TEMPLATE = 'auth-trigger-cloudformation-template.json';
export const AUTH_TRIGGER_STACK = 'AuthTriggerCustomLambdaStack';

export async function uploadAuthTriggerTemplate(context: $TSContext) {
  if (!FeatureFlags.getBoolean('auth.breakCircularDependency')) {
    return {};
  }
  const category = 'auth';
  let { amplifyMeta } = context.amplify.getProjectDetails();
  const authResource = amplifyMeta?.auth ?? {};
  const authTriggerCfnFilePath = path.join(pathManager.getBackendDirPath(), category, Object.keys(authResource)[0], AUTH_TRIGGER_TEMPLATE);
  try {
    const cfnObject: $TSObject = JSONUtilities.readJson(authTriggerCfnFilePath);
    const S3_UPLOAD_PATH = path.join(category, AUTH_TRIGGER_TEMPLATE);

    return {
      AuthTriggerTemplateURL: await uploadCfnToS3(context, S3_UPLOAD_PATH, cfnObject),
    };
  } catch {
    return {
      AuthTriggerTemplateURL: '',
    };
  }
}

async function uploadCfnToS3(context: any, cfnFile: string, cfnData: object): Promise<string> {
  const s3 = await S3.getInstance(context);
  const s3Params = {
    Body: JSON.stringify(cfnData, null, 2),
    Key: `amplify-cfn-templates/${cfnFile}`,
  };
  const projectBucket = await s3.uploadFile(s3Params);

  return `https://s3.amazonaws.com/${projectBucket}/amplify-cfn-templates/${cfnFile}`;
}
