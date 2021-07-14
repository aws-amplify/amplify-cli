import { $TSContext, stateManager } from 'amplify-cli-core';
import chalk from 'chalk';
import inquirer, { QuestionCollection } from 'inquirer';
import ora from 'ora';
import { LayerCloudState } from '../utils/layerCloudState';
import { saveLayerVersionsToBeRemovedByCfn } from '../utils/layerConfiguration';
import { loadStoredLayerParameters, getLayerName } from '../utils/layerHelpers';
import { LayerVersionMetadata } from '../utils/layerParams';
import { updateLayerArtifacts } from '../utils/storeResources';

const removeLayerQuestion = 'Choose the Layer versions you want to remove.';

export async function removeWalkthrough(context: $TSContext, layerName: string): Promise<string | undefined> {
  const layerCloudState = LayerCloudState.getInstance(layerName);
  const layerVersionList = await layerCloudState.getLayerVersionsFromCloud(context, layerName);

  // if the layer hasn't been pushed return and remove it
  if (layerVersionList.length === 0) {
    return layerName;
  }

  const { versions } = await inquirer.prompt(question(layerVersionList));
  const selectedLayerVersion = versions as LayerVersionMetadata[];

  // if nothing is selected return;
  if (selectedLayerVersion.length === 0) {
    return undefined;
  }

  const legacyLayerSelectedVersions = selectedLayerVersion.filter(r => r.legacyLayer);
  const newLayerSelectedVersions = selectedLayerVersion.filter(r => !r.legacyLayer);

  // if everything is selected remove the layer entirely
  if (layerVersionList.length === newLayerSelectedVersions.length && legacyLayerSelectedVersions.length === 0) {
    return layerName;
  }

  context.print.info('Layer versions marked for deletion:');
  selectedLayerVersion.forEach(version => {
    context.print.info(`- ${version.Version} | Description: ${version.Description || ''}`);
  });

  warnLegacyRemoval(context, legacyLayerSelectedVersions, newLayerSelectedVersions);
  const totalSelectedVersionsToRemove = newLayerSelectedVersions.length + legacyLayerSelectedVersions.length;

  if (legacyLayerSelectedVersions.length > 0) {
    await deleteLayer(
      context,
      getLayerName(context, layerName),
      legacyLayerSelectedVersions.map(r => r.Version),
    );
  }

  // Save Layer versions to be removed by CFN only if layer versions remain
  if (layerVersionList.length > totalSelectedVersionsToRemove) {
    if (newLayerSelectedVersions.length > 0) {
      const { envName } = stateManager.getLocalEnvInfo();
      saveLayerVersionsToBeRemovedByCfn(
        layerName,
        newLayerSelectedVersions.map(r => r.Version),
        envName,
      );
    }

    // Load configuration for layer and regenerate cfn template
    const layerParameters = loadStoredLayerParameters(context, layerName);
    updateLayerArtifacts(context, layerParameters, {
      generateCfnFile: true,
      updateDescription: false,
      updateLayerParams: false,
      updateMeta: false,
    });

    return undefined;
  }

  return layerName;
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
  } else if (newLayerVersions.length > 0) {
    context.print.warning(`Layer versions will be deleted on ${amplifyPush}.`);
  }

  context.print.warning(`All new layer versions created with the Amplify CLI will only be deleted on ${amplifyPush}.`);
  context.print.info('');
}

async function deleteLayer(context: $TSContext, layerName: string, versions: number[]) {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
  const lambdaClient = await providerPlugin.getLambdaSdk(context);
  const spinner = ora('Deleting layer version from the cloud...').start();
  try {
    await lambdaClient.deleteLayerVersions(layerName, versions);
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
        name: `${version.Version}: ${version.Description}`,
        short: version.Version.toString(),
        value: version,
      })),
  },
];
