import { FunctionTemplateContributorFactory, FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import fs from 'fs-extra';
import { $TSContext, AmplifySupportedService, exitOnNextTick } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

const pathToTemplateFiles = `${__dirname}/../resources/hello-world`;
const pathToGraphqlTemplateFiles = `${__dirname}/../resources/appsync-request`;

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => ({
  contribute: request => {
    switch (request.selection) {
      case 'hello-world': {
        return helloWorld();
      }
      case 'appsync-request': {
        return graphqlRequest(context);
      }
      default: {
        throw new Error(`Unknown python template selection [${request.selection}]`);
      }
    }
  },
});

export function helloWorld(): Promise<FunctionTemplateParameters> {
  const files = fs.readdirSync(pathToTemplateFiles);
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      destMap: {
        'index.py': 'src/index.py',
        'event.json': 'src/event.json',
        'setup.py': 'src/setup.py',
      },
      defaultEditorFile: 'src/index.py',
    },
  });
}

/**
 * Graphql request to an AppSync API using Python runtime Lambda function
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

  function isAppSyncWithIAM(config : any) {
    const { authConfig } = config.output;
    return [authConfig.defaultAuthentication.authenticationType, ...authConfig.additionalAuthenticationProviders.map((provider : any) => provider.authenticationType)].some(isIAM);
  }

  const iamCheck = isAppSyncWithIAM(apiResource);

  if (!iamCheck) {
    printer.error(`IAM Auth not enabled for ${AmplifySupportedService.APPSYNC} API. To update an api, use "amplify update api".`);
    exitOnNextTick(0);
  }

  const files = fs.readdirSync(pathToGraphqlTemplateFiles);
  return {
    functionTemplate: {
      sourceRoot: pathToGraphqlTemplateFiles,
      sourceFiles: files,
      destMap: {
        'index.py': 'src/index.py',
        'event.json': 'src/event.json',
        'setup.py': 'src/setup.py',
      },
      defaultEditorFile: 'src/index.py',
    },
  };
}
