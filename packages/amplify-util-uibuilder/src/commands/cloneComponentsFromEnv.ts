import { printer } from 'amplify-prompts';
import { $TSContext } from 'amplify-cli-core';
import { AmplifyUIBuilder } from 'aws-sdk';
import { extractArgs } from './utils/extractArgs';
import { listUiBuilderComponents } from './utils/syncAmplifyUiBuilderComponents';
import { AmplifyClientFactory } from '../clients';

/**
 * Clones the components from the source to new environment
 */
export const run = async (context: $TSContext): Promise<void> => {
  printer.debug('Running create components command in amplify-util-uibuilder');
  const args = extractArgs(context);
  const sourceEnvName = args.sourceEnvName ? args.sourceEnvName : context.exeInfo.sourceEnvName;
  const newEnvName = args.newEnvName ? args.newEnvName : context.exeInfo.localEnvInfo.envName;
  const appId = args.appId ?? context.exeInfo.teamProviderInfo[sourceEnvName].awscloudformation.AmplifyAppId;
  await AmplifyClientFactory.setClientInfo(context, sourceEnvName, appId);

  const [existingComponents, existingComponentsNewEnv] = await Promise.all([
    listUiBuilderComponents(context, sourceEnvName), listUiBuilderComponents(context, newEnvName)]);
  if (existingComponents.entities.length === 0) {
    printer.debug(`${existingComponents.entities.length} components exist in source env. Skipping creation of local components.`);
    return;
  }

  if (existingComponentsNewEnv.entities.length > 0) {
    printer.debug(
      `${existingComponentsNewEnv.entities.length} components already exist in new env. Skipping creation of local components.`,
    );
    return;
  }

  const components = existingComponents.entities;
  if (!components.length) {
    printer.debug(`No UIBuilder components found in app ${appId} from env ${sourceEnvName}. Skipping component clone process.`);
    return;
  }
  const promises = components.map((component: AmplifyUIBuilder.Component) => AmplifyClientFactory.amplifyUiBuilder
    .createComponent({
      appId,
      environmentName: newEnvName,
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
    .promise());
  await Promise.all(promises);

  printer.info(
    `Successfully cloned ${components.length} UIBuilder components in app ${appId} from env ${sourceEnvName} to env ${newEnvName}.`,
  );
};
