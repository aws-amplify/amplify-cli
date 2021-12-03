const aws = require('aws-sdk');
const { printer } = require('amplify-prompts');
const { resolveAppId } = require('amplify-provider-awscloudformation');
const { createUiBuilderComponent, createUiBuilderTheme } = require('./createUiBuilderComponent');
const { getUiBuilderComponentsPath } = require('./getUiBuilderComponentsPath');
const { extractArgs } = require('./extractArgs');
const getEnvName = (context, envName) => {
  const args = extractArgs(context);
  return envName ? envName : args.environmentName ? args.environmentName : context.exeInfo.localEnvInfo.envName;
};

const getAppId = (context, environmentName) => {
  const appId = extractArgs(context).appId || resolveAppId(context);
  if (!appId) {
    throw new Error(
      'Unable to sync Studio components since appId could not be determined. This can happen when you hit the soft limit of number of apps that you can have in Amplify console.',
    );
  }
  return appId;
};

async function listUiBuilderComponents(context, envName) {
  const environmentName = getEnvName(context, envName);
  const appId = getAppId(context, environmentName);

  try {
    const amplifyUIBuilder = await getAmplifyUIBuilderService(context, environmentName, appId);
    const uiBuilderComponents = await amplifyUIBuilder
      .exportComponents({
        appId,
        environmentName,
      })
      .promise();
    printer.debug(JSON.stringify(uiBuilderComponents, null, 2));
    return uiBuilderComponents;
  } catch (e) {
    printer.debug(e);
    throw e;
  }
}

async function listUiBuilderThemes(context, envName) {
  const environmentName = getEnvName(context, envName);
  const appId = getAppId(context, environmentName);

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

function generateUiBuilderComponents(context, componentSchemas) {
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

function generateUiBuilderThemes(context, themeSchemas) {
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

const getAmplifyUIBuilderService = async (context, environmentName, appId) => {
  const awsConfigInfo = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'loadConfigurationForEnv', [
    context,
    environmentName,
    appId,
  ]);

  if (process.env.UI_BUILDER_ENDPOINT) {
    awsConfigInfo.endpoint = process.env.UI_BUILDER_ENDPOINT;
  }

  if (process.env.UI_BUILDER_REGION) {
    awsConfigInfo.region = process.env.UI_BUILDER_REGION;
  }

  return new aws.AmplifyUIBuilder(awsConfigInfo);
};

module.exports = {
  getAmplifyUIBuilderService,
  generateUiBuilderComponents,
  generateUiBuilderThemes,
  listUiBuilderComponents,
  listUiBuilderThemes,
};
