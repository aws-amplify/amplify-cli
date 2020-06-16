import inquirer from 'inquirer';
import _ from 'lodash';
import path from 'path';
import { layerMetadataFactory, LayerMetadata, LayerParameters, Permission } from '../utils/layerParams';
import { runtimeWalkthrough } from '../utils/functionPluginLoader';
import {
  createVersionsMap,
  layerAccountAccessQuestion,
  LayerInputParams,
  layerNameQuestion,
  layerOrgAccessQuestion,
  layerPermissionsQuestion,
  layerVersionQuestion,
} from '../utils/layerHelpers';
import { categoryName, layerParametersFileName, ServiceName } from '../utils/constants';

export async function createLayerWalkthrough(context: any, parameters: Partial<LayerParameters> = {}): Promise<Partial<LayerParameters>> {
  _.assign(parameters, await inquirer.prompt(layerNameQuestion(context)));

  let runtimeReturn = await runtimeWalkthrough(context, parameters);
  parameters.runtimes = runtimeReturn.map(val => val.runtime);

  let layerInputParameters: LayerInputParams = {};
  _.assign(layerInputParameters, await inquirer.prompt(layerPermissionsQuestion()));

  for (let permission of layerInputParameters.layerPermissions) {
    switch (permission) {
      case Permission.awsAccounts:
        _.assign(layerInputParameters, await inquirer.prompt(layerAccountAccessQuestion()));
        break;
      case Permission.awsOrg:
        _.assign(layerInputParameters, await inquirer.prompt(layerOrgAccessQuestion()));
        break;
    }
  }
  _.assign(parameters, { layerVersion: '1' });
  // add layer version to parameters
  _.assign(parameters, { layerVersionMap: createVersionsMap(layerInputParameters, '1') });
  _.assign(parameters, { build: true });
  return parameters;
}

export async function updateLayerWalkthrough(
  context: any,
  lambdaToUpdate?: string,
  parameters?: Partial<LayerParameters>,
): Promise<Partial<LayerParameters>> {
  const { allResources } = await context.amplify.getResourceStatus();
  const resources = allResources.filter(resource => resource.service === ServiceName.LambdaLayer).map(resource => resource.resourceName);

  if (resources.length === 0) {
    context.print.error('No Lambda Layer resource to update. Please use "amplify add function" to create a new Layer');
    process.exit(0);
    return;
  }
  const resourceQuestion = [
    {
      name: 'resourceName',
      message: 'Select the Lambda Layer to update:',
      type: 'list',
      choices: resources,
    },
  ];
  if (resources.length === 1) {
    _.assign(parameters, { layerName: resources[0] });
  } else {
    const resourceAnswer = await inquirer.prompt(resourceQuestion);
    _.assign(parameters, { layerName: resourceAnswer.resourceName });
  }

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, parameters.layerName);
  const parametersFilePath = path.join(resourceDirPath, layerParametersFileName);
  const currentParameters = context.amplify.readJsonFile(parametersFilePath, undefined, false) || {};

  _.assign(parameters, currentParameters);

  // get the LayerObj
  const layerData = layerMetadataFactory(context.amplify.pathManager.getBackendDirPath(), parameters.layerName);
  // runtime question
  let islayerVersionChanged: boolean = false;
  if (await context.amplify.confirmPrompt.run('Do you want to change the compatible runtimes?', false)) {
    const runtimeReturn = await runtimeWalkthrough(context, parameters as LayerParameters);
    parameters.runtimes = runtimeReturn.map(val => val.runtime);
  }
  islayerVersionChanged = !_.isEqual(parameters.runtimes, layerData.runtimes);
  // get the latest version from #currentcloudbackend
  const layerDataPushed: LayerMetadata = layerMetadataFactory(
    context.amplify.pathManager.getCurrentCloudBackendDirPath(),
    parameters.layerName,
    true,
  );
  const latestVersionPushed = layerDataPushed !== undefined ? layerDataPushed.getLatestVersion() : 0;
  let latestVersion = layerData.getLatestVersion();

  // get the latest accounts/orgsid
  const defaultlayerPermissions = layerData.getVersion(latestVersion).permissions.map(permission => permission.type);
  const defaultorgs = layerData.getVersion(latestVersion).listOrgAccess();
  const defaultaccounts = layerData.getVersion(latestVersion).listAccoutAccess();

  let layerInputParameters: LayerInputParams = {};

  if (await context.amplify.confirmPrompt.run('Do you want to adjust who can access the current & new layer version?', true)) {
    _.assign(layerInputParameters, await inquirer.prompt(layerPermissionsQuestion(defaultlayerPermissions)));

    // get the account/orgsID based on the permissions selected and pass defaults in the questions workflow
    for (let permission of layerInputParameters.layerPermissions) {
      switch (permission) {
        case Permission.awsAccounts:
          _.assign(layerInputParameters, await inquirer.prompt(layerAccountAccessQuestion(defaultaccounts)));
          break;
        case Permission.awsOrg:
          _.assign(layerInputParameters, await inquirer.prompt(layerOrgAccessQuestion(defaultorgs)));
          break;
      }
    }
  }
  if (islayerVersionChanged) {
    context.print.info('');
    context.print.warning(
      'New Lambda layer version created. Any function that wants to use the latest layer version need to configure it by running - "amplify function update"',
    );
    if (latestVersion === latestVersionPushed) {
      latestVersion += 1;
    }
    // updating map for a new version
    const map = createVersionsMap(layerInputParameters, String(latestVersion));
    parameters.layerVersionMap[Object.keys(map)[0]] = map[Object.keys(map)[0]];
  } else {
    // updating map for the selected version
    const versions = layerData.listVersions();
    const versionAnswer = await inquirer.prompt(layerVersionQuestion(versions));
    const selectedVersion = String(versionAnswer.layerVersion);
    const map = createVersionsMap(
      { ...layerInputParameters, ...{ hash: parameters.layerVersionMap[selectedVersion].hash } },
      selectedVersion,
    );
    parameters.layerVersionMap[Object.keys(map)[0]] = map[Object.keys(map)[0]];
  }
  _.assign(parameters, { layerVersion: String(latestVersion) });

  _.assign(parameters, { build: true });
  return parameters;
}
