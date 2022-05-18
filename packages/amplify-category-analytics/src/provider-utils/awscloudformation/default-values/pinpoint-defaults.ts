import { $TSAny, $TSMeta } from 'amplify-cli-core';
import * as uuid from 'uuid';
/**
 * Get all default parameter values for Pinpoint walkthrough
 * @param project amplify project related data
 * @param project.amplifyMeta Project metadata from amplify-meta.json
 * @param project.projectConfig Project backend configuration data
 * @param project.projectConfig.projectName Amplify project name
 * @returns default parameter values for Pinpoint
 */
export const getAllDefaults = (project: { amplifyMeta: $TSMeta; projectConfig: { projectName: string } }):Record<string, $TSAny> => {
  const appName = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid.v4().split('-');

  const authRoleName = {
    Ref: 'AuthRoleName',
  };

  const unauthRoleName = {
    Ref: 'UnauthRoleName',
  };

  const authRoleArn = {
    'Fn::GetAtt': ['AuthRole', 'Arn'],
  };

  const defaults = {
    appName,
    resourceName: appName,
    roleName: `pinpointLambdaRole${shortId}`,
    cloudformationPolicyName: `cloudformationPolicy${shortId}`,
    cloudWatchPolicyName: `cloudWatchPolicy${shortId}`,
    pinpointPolicyName: `pinpointPolicy${shortId}`,
    authPolicyName: `pinpoint_amplify_${shortId}`,
    unauthPolicyName: `pinpoint_amplify_${shortId}`,
    authRoleName,
    unauthRoleName,
    authRoleArn,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
