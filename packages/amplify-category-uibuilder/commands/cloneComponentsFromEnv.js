const aws = require('aws-sdk');
const logger = require('./utils/logger');
const { extractArgs } = require('./utils/extractArgs');
const { listUiBuilderComponents } = require('./utils/syncAmplifyUiBuilderComponents');

async function run(context) {
  logger.info('Running create components command in amplify-category-uibuilder');
  const args = extractArgs(context);
  const sourceEnvName = args.sourceEnvName ? args.sourceEnvName : context.exeInfo.sourceEnvName;
  const newEnvName = args.newEnvName ? args.newEnvName : context.exeInfo.localEnvInfo.envName;

  const existingComponents = await listUiBuilderComponents(context, sourceEnvName);
  if (existingComponents.entities.length === 0) {
    `${existingComponents.entities.length} components exist in source env. Skipping creation of local components.`;
  }
  const existingComponentsNewEnv = await listUiBuilderComponents(context, newEnvName);
  if (existingComponentsNewEnv.entities.length > 0) {
    logger.info(`${existingComponentsNewEnv.entities.length} components already exist in new env. Skipping creation of local components.`);
    return;
  }

  try {
    const environmentName = args.environmentName ? args.environmentName : context.exeInfo.localEnvInfo.envName;

    const appId = args.appId ? args.appId : context.exeInfo.teamProviderInfo[environmentName].awscloudformation.AmplifyAppId;

    const awsConfigInfo = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'loadConfigurationForEnv', [
      context,
      newEnvName,
      appId,
    ]);

    if (process.env.UI_BUILDER_ENDPOINT) {
      awsConfigInfo.endpoint = process.env.UI_BUILDER_ENDPOINT;
    }

    if (process.env.UI_BUILDER_REGION) {
      awsConfigInfo.region = process.env.UI_BUILDER_REGION;
    }

    const amplifyUIBuilder = new aws.AmplifyUIBuilder(awsConfigInfo);

    const components = existingComponents.entities;
    if (!components.length) {
      logger.info(`No UIBuilder components found in app ${appId} from env ${sourceEnvName}. Skipping component clone process.`);
      return;
    }
    const promises = components.map(async component => {
      return await amplifyUIBuilder
        .createComponent({
          appId,
          environmentName,
          componentToCreate: {
            bindingProperties: component.bindingProperties,
            children: component.children,
            componentType: component.componentType,
            name: component.name,
            overrides: component.overrides,
            properties: component.properties,
            sourceId: component.sourceId,
            variants: component.variants,
          },
        })
        .promise();
    });
    await Promise.all(promises);

    console.log(
      `Successfully cloned ${components.length} UIBuilder components in app ${appId} from env ${sourceEnvName} to env ${newEnvName}.`,
    );
  } catch (e) {
    logger.warn('This endpoint is broken for now:');
    logger.error(e);
  }
}

module.exports = {
  run,
};
