import { printer } from '@aws-amplify/amplify-prompts';
import { AmplifyStudioClient } from '../../clients';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';
import { getCodegenConfig } from 'amplify-codegen';
import { ApiConfiguration } from 'aws-sdk/clients/amplifyuibuilder';
import path from 'path';

//a posix formatted relative path must always be returned as the return values are used directly in jsx files as import paths
export function relativeToComponentsPath(importPath: string, context: $TSContext): string {
  const componentsPath = getUiBuilderComponentsPath(context);
  const segments = path.relative(componentsPath, importPath).split(path.sep);
  return path.posix.join(...segments);
}

export function getApiConfiguration(studioClient: AmplifyStudioClient, context: $TSContext): ApiConfiguration {
  if (studioClient.isDataStoreEnabled) {
    return {
      dataStoreConfig: {},
    };
  }

  if (studioClient.metadata.isGraphQLEnabled) {
    printer.debug('building graphql config');
    // attempt to get api codegen info
    const projectPath = context.exeInfo.localEnvInfo.projectPath;
    let promptForUpdateCodegen = false;

    try {
      const codegenConfig = getCodegenConfig(projectPath);
      const typesPath = codegenConfig.getGeneratedTypesPath();
      const apiConfiguration = {
        graphQLConfig: {
          typesFilePath: (typesPath && relativeToComponentsPath(typesPath, context)) || '',
          queriesFilePath: relativeToComponentsPath(codegenConfig.getGeneratedQueriesPath(), context),
          mutationsFilePath: relativeToComponentsPath(codegenConfig.getGeneratedMutationsPath(), context),
          subscriptionsFilePath: relativeToComponentsPath(codegenConfig.getGeneratedSubscriptionsPath(), context),
          fragmentsFilePath: relativeToComponentsPath(codegenConfig.getGeneratedFragmentsPath(), context),
        },
      };

      const minQueryDepth = 3;
      const isQueryingTooShallow = (codegenConfig.getQueryMaxDepth() || 0) < minQueryDepth;

      if (studioClient.metadata.formFeatureFlags.isRelationshipSupported && isQueryingTooShallow) {
        promptForUpdateCodegen = true;
        printer.warn(`Forms with relationships require a maximum query depth of at least ${minQueryDepth}.`);
      }
      return apiConfiguration;
    } catch {
      promptForUpdateCodegen = true;
      printer.warn(
        'Unable to successfully configure component generation for GraphQL. This will impact generating forms and components bound to your data models.',
      );
    } finally {
      if (promptForUpdateCodegen) {
        printer.warn(`Run 'amplify update codegen' to ensure GraphQL configurations for your project are correct.`);
      }
    }
  }

  return {
    noApiConfig: {},
  };
}

export function hasDataStoreConfiguration(apiConfiguration: ApiConfiguration): boolean {
  return apiConfiguration.dataStoreConfig !== undefined;
}

export function hasGraphQLConfiguration(apiConfiguration: ApiConfiguration): boolean {
  return apiConfiguration.graphQLConfig !== undefined;
}
