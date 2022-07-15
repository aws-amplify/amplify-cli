import { printer } from 'amplify-prompts';
import { $TSContext } from 'amplify-cli-core';
import { StudioComponent, StudioTheme, GenericDataSchema } from '@aws-amplify/codegen-ui';
import { Component, Theme } from 'aws-sdk/clients/amplifyuibuilder';
import { createUiBuilderComponent, createUiBuilderTheme } from './createUiBuilderComponent';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';
import { AmplifyClientFactory } from '../../clients';
import { getEnvName, getAppId } from './environmentHelpers';

/**
 * Returns all the UI Builder components from the app
 */
export const listUiBuilderComponents = async (context: $TSContext, envName?: string): Promise<{ entities: Component[] }> => {
  const environmentName = getEnvName(context, envName);
  const appId = await getAppId(context);

  try {
    let nextToken: string | undefined;
    const uiBuilderComponents: Component[] = [];
    do {
      const response = await AmplifyClientFactory.amplifyUiBuilder
        .exportComponents({
          appId,
          environmentName,
          nextToken,
        })
        .promise();
      uiBuilderComponents.push(...response.entities);
      nextToken = response.nextToken;
    } while (nextToken);
    printer.debug(JSON.stringify(uiBuilderComponents, null, 2));
    return { entities: uiBuilderComponents };
  } catch (e) {
    printer.debug(e);
    throw e;
  }
};

/**
 * Returns all the UI Builder themes from the app
 */
export const listUiBuilderThemes = async (context: $TSContext, envName?: string): Promise<{ entities: Theme[] }> => {
  const environmentName = getEnvName(context, envName);
  const appId = await getAppId(context);

  try {
    let nextToken: string | undefined;
    const uiBuilderThemes: Theme[] = [];
    do {
      const response = await AmplifyClientFactory.amplifyUiBuilder
        .exportThemes({
          appId,
          environmentName,
        })
        .promise();
      uiBuilderThemes.push(...response.entities);
      nextToken = response.nextToken;
    } while (nextToken);
    printer.debug(JSON.stringify(uiBuilderThemes, null, 2));
    return { entities: uiBuilderThemes };
  } catch (e) {
    printer.debug(e);
    throw e;
  }
};

/**
 * Returns instances of StudioComponent from the component schemas
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateUiBuilderComponents = (context: $TSContext, componentSchemas: any[], dataSchema?: GenericDataSchema): ({
  resultType: string;
  component: StudioComponent;
  schemaName?: undefined;
  error?: undefined;
} | {
  resultType: string;
  schemaName: string;
  error: Error;
  component?: undefined;
})[] => {
  const componentResults = componentSchemas.map(schema => {
    try {
      const component = createUiBuilderComponent(context, schema, dataSchema);
      return { resultType: 'SUCCESS', component };
    } catch (e) {
      printer.debug(`Failure caught processing ${schema.name}`);
      printer.debug(e);
      return { resultType: 'FAILURE', schemaName: schema.name, error: e };
    }
  });

  printer.debug(
    `Generated ${componentResults.filter(result => result.resultType === 'SUCCESS').length} components in ${getUiBuilderComponentsPath(
      context,
    )}`,
  );
  return componentResults;
};

/**
 * Returns instances of StudioTheme from theme schemas
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateUiBuilderThemes = (context: $TSContext, themeSchemas: any[]): ({
  resultType: string;
  theme: StudioTheme;
  schemaName?: undefined;
  error?: undefined;
} | {
  resultType: string;
  schemaName: string;
  error: Error;
  theme?: undefined;
})[] => {
  const themeResults = themeSchemas.map(schema => {
    try {
      const theme = createUiBuilderTheme(context, schema);
      return { resultType: 'SUCCESS', theme };
    } catch (e) {
      printer.debug(`Failure caught processing ${schema.name}`);
      printer.debug(e);
      return { resultType: 'FAILURE', schemaName: schema.name, error: e };
    }
  });

  printer.debug(
    `Generated ${themeResults.filter(result => result.resultType === 'SUCCESS').length} themes in ${getUiBuilderComponentsPath(context)}`,
  );
  return themeResults;
};
