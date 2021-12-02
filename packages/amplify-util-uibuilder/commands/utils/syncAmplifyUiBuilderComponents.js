const aws = require('aws-sdk');
const { createUiBuilderComponent, createUiBuilderTheme } = require('./createUiBuilderComponent');
const { getUiBuilderComponentsPath } = require('./getUiBuilderComponentsPath');
const logger = require('./logger');
const { extractArgs } = require('./extractArgs');
const { mockUiBuilderComponents, mockUiBuilderThemes } = require('./mockUiBuilderData');

const getEnvName = (context, envName) => {
  const args = extractArgs(context);
  return envName ? envName : args.environmentName ? args.environmentName : context.exeInfo.localEnvInfo.envName;
};

const getAppId = (context, environmentName) => {
  return extractArgs(context).appId || context.exeInfo.teamProviderInfo[environmentName].awscloudformation.AmplifyAppId;
};

async function listUiBuilderComponents(context, envName) {
  if (process.env.MOCK_UI_BUILDER_BACKEND) {
    return mockUiBuilderComponents;
  }

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
    logger.info(JSON.stringify(uiBuilderComponents, null, 2));
    return uiBuilderComponents;
  } catch (e) {
    logger.error(e);
    throw e;
  }
}

async function listUiBuilderThemes(context, envName) {
  if (process.env.MOCK_UI_BUILDER_BACKEND) {
    return mockUiBuilderThemes;
  }

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
    logger.info(JSON.stringify(uiBuilderThemes, null, 2));
    return uiBuilderThemes;
  } catch (e) {
    logger.error(e);
    throw e;
  }
}

function generateUiBuilderComponents(context, componentSchemas) {
  const componentResults = componentSchemas.map(schema => {
    try {
      const component = createUiBuilderComponent(context, schema);
      return { resultType: 'SUCCESS', component };
    } catch (e) {
      logger.error(`Failure caught processing ${schema.name}`);
      logger.error(e);
      return { resultType: 'FAILURE', schemaName: schema.name, error: e };
    }
  });

  logger.info(
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
      logger.error(`Failure caught processing ${schema.name}`);
      logger.error(e);
      return { resultType: 'FAILURE', schemaName: schema.name, error: e };
    }
  });

  logger.info(
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
