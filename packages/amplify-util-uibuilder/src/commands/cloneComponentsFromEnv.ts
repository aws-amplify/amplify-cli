import { printer } from 'amplify-prompts';
import { $TSContext } from 'amplify-cli-core';
import { extractArgs } from './utils';
import { AmplifyStudioClient } from '../clients';

/**
 * Clones the components from the source to new environment
 */
export const run = async (context: $TSContext): Promise<void> => {
  printer.debug('Running create components command in amplify-util-uibuilder');
  const args = extractArgs(context);
  const sourceEnvName = args.sourceEnvName ? args.sourceEnvName : context.exeInfo.sourceEnvName;
  const newEnvName = args.newEnvName ? args.newEnvName : context.exeInfo.localEnvInfo.envName;
  const appId = args.appId ?? context.exeInfo?.teamProviderInfo?.[sourceEnvName]?.awscloudformation?.AmplifyAppId;
  const studioClient = await AmplifyStudioClient.setClientInfo(context, sourceEnvName, appId);

  const [existingComponents, existingComponentsNewEnv] = await Promise.all([
    studioClient.listComponents(sourceEnvName), studioClient.listComponents(newEnvName)]);
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
  for (let i = 0; i < components.length; i++) {
    const {
      appId: _appId, // eslint-disable-line @typescript-eslint/no-unused-vars
      environmentName, // eslint-disable-line @typescript-eslint/no-unused-vars
      id, // eslint-disable-line @typescript-eslint/no-unused-vars
      createdAt, // eslint-disable-line @typescript-eslint/no-unused-vars
      modifiedAt, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...componentCreateData
    } = components[i];
    await studioClient.createComponent(
      componentCreateData,
      newEnvName,
      appId,
    );
  }

  printer.info(
    `Successfully cloned ${components.length} UIBuilder components in app ${appId} from env ${sourceEnvName} to env ${newEnvName}.`,
  );
};
