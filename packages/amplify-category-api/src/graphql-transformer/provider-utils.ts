import {
  $TSContext,
  AmplifyCategories,
  JSONUtilities,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import fs from 'fs-extra';
import path from 'path';

export const PARAMETERS_FILENAME = 'parameters.json';
export const SCHEMA_FILENAME = 'schema.graphql';
export const SCHEMA_DIR_NAME = 'schema';
export const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
export const PROVIDER_NAME = 'awscloudformation';
export const DESTRUCTIVE_UPDATES_FLAG = 'allow-destructive-graphql-schema-updates';

/**
 * Return the deployment bucket for the project, or an empty string if none is found.
 */
export const getProjectBucket = (context: $TSContext): string => {
  const projectDetails = context.amplify.getProjectDetails();
  return projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[PROVIDER_NAME].DeploymentBucketName : '';
};

/**
 * Get the deployment bucket name, including environment key information.
 */
export const getBucketName = async (context: $TSContext, s3ResourceName: string): Promise<string> => {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  const stackName = amplifyMeta.providers.awscloudformation.StackName;
  const s3ResourcePath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.STORAGE, s3ResourceName);
  const cliInputsPath = path.join(s3ResourcePath, 'cli-inputs.json');
  // get bucketParameters 1st from cli-inputs , if not present, then parameters.json
  const bucketParameters = fs.existsSync(cliInputsPath)
    ? JSONUtilities.readJson(cliInputsPath)
    : stateManager.getResourceParametersJson(undefined, AmplifyCategories.STORAGE, s3ResourceName);

  return stackName.startsWith('amplify-')
    ? `${bucketParameters.bucketName}\${hash}-\${env}`
    : `${bucketParameters.bucketName}${s3ResourceName}-\${env}`;
};

/**
 * Retrieve the root s3 key used for the project deployment.
 */
export const getPreviousDeploymentRootKey = async (previouslyDeployedBackendDir: string): Promise<string | undefined> => {
  try {
    const parametersPath = path.join(previouslyDeployedBackendDir, 'build', PARAMETERS_FILENAME);
    const parametersExists = fs.existsSync(parametersPath);
    if (parametersExists) {
      const parametersString = await fs.readFile(parametersPath);
      const parameters = JSON.parse(parametersString.toString());
      return parameters.S3DeploymentRootKey;
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
};
