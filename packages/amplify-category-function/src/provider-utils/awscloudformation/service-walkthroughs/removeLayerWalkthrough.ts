import { $TSContext, promptConfirmationRemove, stateManager } from 'amplify-cli-core';
import { LayerCloudState } from '../utils/layerCloudState';
import { getLayerName } from '../utils/layerHelpers';
import { LayerVersionMetadata } from '../utils/layerParams';
import inquirer, { QuestionCollection } from 'inquirer';
import ora from 'ora';
import _ from 'lodash';
import chalk from 'chalk';
import { saveLayerVersionToBeRemovedByCfn } from '../utils/layerConfiguration';

const removeLayerQuestion = 'Choose the Layer versions you want to remove.';
export async function removeWalkthrough(context: $TSContext, layerName: string) {
  const layerCloudState = LayerCloudState.getInstance();
  const layerVersionList = await layerCloudState.getLayerVersionsFromCloud(context, layerName);
  // if the layer hasn't been pushed return and remove it
  if (layerVersionList.length === 0) {
    return layerName;
  }
  const { versions } = await inquirer.prompt(question(layerVersionList));
  const selectedLayerVersion = versions as LayerVersionMetadata[];

  //if nothing is selected return;
  if (selectedLayerVersion.length === 0) {
    return;
  }

  //if everything is selected remove the layer entirely
  if (selectedLayerVersion.length === layerVersionList.length) {
    return layerName;
  }

  context.print.info('Layer versions marked for deletion:');
  selectedLayerVersion.forEach(version => {
    context.print.info(`> ${version.Version}  | Created on: ${version.CreatedDate} | Description: ${version.Description || ''}`);
  });
  const legacyLayerSelectedVersions = selectedLayerVersion.filter(r => r.LegacyLayer);
  const newLayerSelectedVersions = selectedLayerVersion.filter(r => !r.LegacyLayer);

  warnLegacyRemoval(context, legacyLayerSelectedVersions, newLayerSelectedVersions);

  const confirm = await promptConfirmationRemove(context);
  if (!confirm) {
    return;
  }

  await deleteLayer(
    context,
    getLayerName(context, layerName),
    legacyLayerSelectedVersions.map(r => r.Version),
  );
  const { envName } = stateManager.getLocalEnvInfo();
  saveLayerVersionToBeRemovedByCfn(
    layerName,
    newLayerSelectedVersions.map(r => r.Version),
    envName,
  );
  return;
}

function warnLegacyRemoval(context: $TSContext, legacyLayerVersions: LayerVersionMetadata[], newLayerVersions: LayerVersionMetadata[]) {
  const amplifyPush = chalk.green('amplify push');
  const legacyVersions: number[] = legacyLayerVersions.map(r => r.Version);

  if (legacyLayerVersions.length > 0 && newLayerVersions.length > 0) {
    context.print.warning(
      `Warning: By continuing, these layer versions [${legacyVersions.join(
        ', ',
      )}] will be immediately deleted. All other layer versions will be deleted on ${amplifyPush}.`,
    );
  } else if (legacyLayerVersions.length > 0) {
    context.print.warning(`Warning: By continuing, these layer versions [${legacyVersions.join(', ')}] will be immediately deleted.`);
  } else if (legacyLayerVersions.length) {
    context.print.warning(`Layer versions will be deleted on ${amplifyPush}.`);
  }

  context.print.warning(`All new layer versions created with the Amplify CLI will only be deleted on ${amplifyPush}.`);
  context.print.info('');
}

async function deleteLayer(context: $TSContext, layerName: string, versions: number[]) {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
  const Lambda = await providerPlugin.getLambdaSdk(context);
  const spinner = ora('Deleting layer version from the cloud...').start();
  try {
    await Lambda.deleteLayerVersions(layerName, versions);
    spinner.succeed('Layers deleted');
  } catch (ex) {
    spinner.fail('Failed deleting');
    throw ex;
  } finally {
    spinner.stop();
  }
}

const question = (layerVersionMetadata: LayerVersionMetadata[]): QuestionCollection[] => [
  {
    name: 'versions',
    message: removeLayerQuestion,
    type: 'checkbox',
    choices: layerVersionMetadata
      .sort((versiona, versionb) => versiona.Version - versionb.Version)
      .map(version => ({
        name: `${version.Version} : ${version.Description}`,
        short: version.Version.toString(),
        value: version,
      })),
  },
];
