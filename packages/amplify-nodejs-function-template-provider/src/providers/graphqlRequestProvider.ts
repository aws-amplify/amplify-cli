import { FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import path from 'path';
import fs from 'fs-extra';
import { AmplifySupportedService, exitOnNextTick, $TSContext } from 'amplify-cli-core';

import { printer } from '@aws-amplify/amplify-prompts';
import { getDstMap } from '../utils/destFileMapper';
import { templateRoot } from '../utils/constants';

const pathToTemplateFilesIAM = path.join(templateRoot, 'lambda', 'appsync-request');

/**
 * Graphql request to an AppSync API using Node runtime Lambda function
 */
export async function graphqlRequest(context: $TSContext): Promise<FunctionTemplateParameters> {
  const { allResources } = await context.amplify.getResourceStatus('api');

  const apiResource = allResources.find((resource: { service: string }) => resource.service === AmplifySupportedService.APPSYNC);

  if (!apiResource) {
    printer.error(`${AmplifySupportedService.APPSYNC} API does not exist. To add an api, use "amplify add api".`);
    exitOnNextTick(0);
  }

  const AWS_IAM = 'AWS_IAM';
  function isIAM(authType: string) {
    return authType === AWS_IAM;
  }

  function isAppSyncWithIAM(config: any) {
    const { authConfig } = config.output;
    return [
      authConfig.defaultAuthentication.authenticationType,
      ...authConfig.additionalAuthenticationProviders.map((provider: any) => provider.authenticationType),
    ].some(isIAM);
  }

  const iamCheck = isAppSyncWithIAM(apiResource);

  if (!iamCheck) {
    printer.error(`IAM Auth not enabled for ${AmplifySupportedService.APPSYNC} API. To update an api, use "amplify update api".`);
    exitOnNextTick(0);
  }

  const files = fs.readdirSync(pathToTemplateFilesIAM);
  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFilesIAM,
      sourceFiles: files,
      defaultEditorFile: path.join('src', 'index.js'),
      destMap: getDstMap(files),
    },
  };
}
