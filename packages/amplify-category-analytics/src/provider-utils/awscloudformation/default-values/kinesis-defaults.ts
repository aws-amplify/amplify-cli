/* eslint-disable spellcheck/spell-checker */
import { $TSMeta, $TSAny } from 'amplify-cli-core';
import * as uuid from 'uuid';
/**
 * Get all default parameter values for Kinesis walkthrough
 * @param project amplify project related data
 * @param project.amplifyMeta Project metadata from amplify-meta.json
 * @param project.projectConfig Project backend configuration data
 * @param project.projectConfig.projectName Amplify project name
 * @returns default parameter values for Kinesis
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

  const defaults = {
    kinesisStreamName: `${appName}Kinesis`,
    kinesisStreamShardCount: 1,
    authRoleName,
    unauthRoleName,
    authPolicyName: `kinesis_amplify_${shortId}`,
    unauthPolicyName: `kinesis_amplify_${shortId}`,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
