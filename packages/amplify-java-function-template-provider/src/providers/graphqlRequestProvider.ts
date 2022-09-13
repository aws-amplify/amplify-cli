import { FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import {
  AmplifySupportedService, exitOnNextTick,
} from 'amplify-cli-core';
import { templateRoot } from '../utils/constants';
import path from 'path';

const pathToTemplateFiles = path.join(templateRoot, 'lambda');

export async function graphqlRequestProvider(context: any): Promise<FunctionTemplateParameters> {
    
  const { allResources } = await context.amplify.getResourceStatus();
  const apiResource = allResources.filter((resource: { service: string }) => resource.service === AmplifySupportedService.APPSYNC);

  if (apiResource.length === 0) {
    context.print.error(`${AmplifySupportedService.APPSYNC} API does not exist. To add an api, use "amplify add api".`);
    exitOnNextTick(0);
  }

  const authConfigs = allResources[1].output.authConfig;

  const additionalAuth = authConfigs.additionalAuthenticationProviders.filter((obj: { authenticationType: string; }) => obj.authenticationType === 'AWS_IAM');

  if (authConfigs.defaultAuthentication.authenticationType !== 'AWS_IAM' && Object.keys(additionalAuth).length === 0) {
    context.print.error(`IAM Auth not enabled for ${AmplifySupportedService.APPSYNC} API. To update an api, use "amplify update api".`);
    exitOnNextTick(0);
  }
  
  const files = [
    'appsync-request/build.gradle.ejs',
    'appsync-request/LambdaRequestHandler.java.ejs',
    'appsync-request/RequestClass.java.ejs',
    'appsync-request/ResponseClass.java.ejs',
    'appsync-request/event.json',
  ];
  const handlerSource = path.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java');

  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: handlerSource,
      destMap: {
        'appsync-request/build.gradle.ejs': path.join('build.gradle'),
        'appsync-request/event.json': path.join('src', 'event.json'),
        'appsync-request/LambdaRequestHandler.java.ejs': path.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java'),
        'appsync-request/RequestClass.java.ejs': path.join('src', 'main', 'java', 'example', 'RequestClass.java'),
        'appsync-request/ResponseClass.java.ejs': path.join('src', 'main', 'java', 'example', 'ResponseClass.java'),
      },
    },
  };
}
