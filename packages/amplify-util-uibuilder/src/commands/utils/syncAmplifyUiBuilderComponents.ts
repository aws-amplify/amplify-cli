import aws from 'aws-sdk';
import { printer } from 'amplify-prompts';
import { createUiBuilderComponent, createUiBuilderTheme } from './createUiBuilderComponent';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';
import { extractArgs } from './extractArgs';
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { Component, ListComponentsResponse } from 'aws-sdk/clients/amplifyuibuilder';
import pLimit from 'p-limit'
const limit = pLimit(5);

export const getEnvName = (context: $TSContext, envName?: string) => {
  const args = extractArgs(context);
  return envName ? envName : args.environmentName ? args.environmentName : context.exeInfo.localEnvInfo.envName;
};

export const resolveAppId = async (context: $TSContext) => {
  return await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'resolveAppId', [context]);
};

export const getAppId = async (context: $TSContext) => {
  const appId = extractArgs(context).appId || (await resolveAppId(context));

  if (!appId) {
    throw new Error(
      'Unable to sync Studio components since appId could not be determined. This can happen when you hit the soft limit of number of apps that you can have in Amplify console.',
    );
  }
  return appId;
};

export async function listUiBuilderComponents(context: $TSContext, envName?: string) {
  const environmentName = getEnvName(context, envName);
  const appId = await getAppId(context);

  try {
    const amplifyUIBuilder = await getAmplifyUIBuilderService(context, environmentName, appId);
    const uiBuilderComponents: Component[] = [];
    let nextToken = undefined;
    do {
      const componentsBatch: ListComponentsResponse = await amplifyUIBuilder
        .listComponents({
          appId,
          environmentName,
          nextToken,
        })
        .promise();
      const hydratedComponentPromises = componentsBatch.entities.map(async component => {
        return limit(async () => await amplifyUIBuilder
          .getComponent({
            appId,
            environmentName,
            id: component.id,
          })
          .promise());
      });
      const components = await Promise.all(hydratedComponentPromises);
      components.forEach(component => {
        uiBuilderComponents.push(component.component!);
      })
      nextToken = componentsBatch.nextToken;
    } while (nextToken);

    printer.debug(JSON.stringify(uiBuilderComponents, null, 2));
    return { entities: uiBuilderComponents};
  } catch (e) {
    printer.debug(e);
    throw e;
  }
}

export async function listUiBuilderThemes(context: $TSContext, envName?: string) {
  const environmentName = getEnvName(context, envName);
  const appId = await getAppId(context);

  try {
    const amplifyUIBuilder = await getAmplifyUIBuilderService(context, environmentName, appId);
    const uiBuilderThemes = await amplifyUIBuilder
      .exportThemes({
        appId,
        environmentName,
      })
      .promise();
    printer.debug(JSON.stringify(uiBuilderThemes, null, 2));
    return uiBuilderThemes;
  } catch (e) {
    printer.debug(e);
    throw e;
  }
}

export function generateUiBuilderComponents(context: $TSContext, componentSchemas: any[]) {
  const componentResults = componentSchemas.map(schema => {
    try {
      const component = createUiBuilderComponent(context, schema);
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
}

export function generateUiBuilderThemes(context: $TSContext, themeSchemas: any[]) {
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
}

export const getAmplifyUIBuilderService = async (context: $TSContext, environmentName: string, appId: string) => {
  const awsConfigInfo = (await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'loadConfigurationForEnv', [
    context,
    environmentName,
    appId,
  ])) as $TSAny;

  if (process.env.UI_BUILDER_ENDPOINT) {
    awsConfigInfo.endpoint = process.env.UI_BUILDER_ENDPOINT;
  }

  if (process.env.UI_BUILDER_REGION) {
    awsConfigInfo.region = process.env.UI_BUILDER_REGION;
  }

  return new aws.AmplifyUIBuilder(awsConfigInfo);
};
