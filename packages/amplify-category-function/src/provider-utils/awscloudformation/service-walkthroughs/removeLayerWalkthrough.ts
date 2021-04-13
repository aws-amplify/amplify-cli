import { $TSContext } from 'amplify-cli-core';
import { getLayerName, LayerVersionMetadata, loadLayerDataFromCloud, loadStoredLayerParameters } from '../utils/layerHelpers';
import { ensureLayerFolders, saveCFNFileWithLayerVersion } from '../utils/storeResources';
import inquirer, { QuestionCollection } from 'inquirer';
import ora from 'ora';
import _ from 'lodash';

const removeLayerQuestion = 'Choose the Layer versions you want to remove.';
export async function removeWalkthrough(context: $TSContext, layerName: string) {
  const allLayerVersions = await loadLayerDataFromCloud(context, layerName);
  const { versions } = await inquirer.prompt(question(allLayerVersions));
  const selectedLayerVersion = versions as LayerVersionMetadata[];
  if (selectedLayerVersion.length === 0) return;
  context.print.warning('The following versions will be deleted instantly:');
  selectedLayerVersion.forEach(version => {
    context.print.info(`${version.Version}  | Created on: ${version.CreatedDate} | Description: ${version.Description || ''}`);
  });
  context.print.info('');

  // remove the layer entirely
  if (selectedLayerVersion.length === allLayerVersions.length) return layerName;
  await deleteLayer(
    context,
    getLayerName(context, layerName),
    selectedLayerVersion.map(r => r.Version),
  );
  const layerParameter = loadStoredLayerParameters(context, layerName);
  const layerDirPath = ensureLayerFolders(layerParameter);
  saveCFNFileWithLayerVersion(layerDirPath, layerParameter, false, _.difference(allLayerVersions, selectedLayerVersion));
  return;
}

async function deleteLayer(context: $TSContext, layerName: string, versions: number[]) {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
  const Lambda = await providerPlugin.getLambdaSdk(context);
  const spinner = ora('Deleting layer version from the cloud...').start();
  try {
    await Lambda.deleteLayerVersions(layerName, versions);
    spinner.succeed();
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
      .sort((versiona, versionb) => new Date(versiona.CreatedDate).getMilliseconds() - new Date(versionb.CreatedDate).getMilliseconds())
      .map(version => ({
        name: `${version.Version} : ${version.Description}`,
        short: version.Version.toString(),
        value: version,
      })),
  },
];
