import inquirer from 'inquirer';
import _ from 'lodash';
import path from 'path';
import { LayerParameters, Permissions, layerMetadataFactory, LayerMetadata } from '../utils/layerParams';
import { runtimeWalkthrough } from '../utils/functionPluginLoader';
import {
  layerNameQuestion,
  layerPermissionsQuestion,
  layerAccountAccessQuestion,
  layerOrgAccessQuestion,
  createVersionsMap,
  layerVersionQuestion,
  LayerInputParams,
} from '../utils/layerHelpers';
import { ServiceName, categoryName, layerParametersFileName } from '../utils/constants';

export async function createLayerWalkthrough(context: any, parameters: Partial<LayerParameters> = {}): Promise<Partial<LayerParameters>> {
  _.assign(parameters, await inquirer.prompt(layerNameQuestion(context)));

  let runtimeReturn = await runtimeWalkthrough(context, parameters);
  parameters.runtimes = runtimeReturn.map(val => val.runtime);

  let layerInputParameters: LayerInputParams = {};
  _.assign(layerInputParameters, await inquirer.prompt(layerPermissionsQuestion()));

  for (let permission of layerInputParameters.layerPermissions) {
    switch (permission) {
      case Permissions.awsAccounts:
        _.assign(layerInputParameters, await inquirer.prompt(layerAccountAccessQuestion()));
        break;
      case Permissions.awsOrg:
        _.assign(layerInputParameters, await inquirer.prompt(layerOrgAccessQuestion()));
        break;
    }
  }
  _.assign(parameters, { layerVersion: '1' });
  // add layer version to parameters
  _.assign(parameters, { layerVersionsMap: createVersionsMap(layerInputParameters, '1') });
  _.assign(parameters, { build: true });
  return parameters;
}

export async function updateLayerWalkthrough(
  context: any,
  templateParameters: Partial<LayerParameters>,
): Promise<Partial<LayerParameters>> {
  const { allResources } = await context.amplify.getResourceStatus();
  const resources = allResources.filter(resource => resource.service === ServiceName.LambdaLayer).map(resource => resource.resourceName);

  if (resources.length === 0) {
    context.print.error('No Lambda Layer resource to update. Please use "amplify add function" command to create a new Function');
    process.exit(0);
    return;
  }
  const resourceQuestion = [
    {
      name: 'resourceName',
      message: 'Please select the Lambda Layer you want to update',
      type: 'list',
      choices: resources,
    },
  ];
  const resourceAnswer = await inquirer.prompt(resourceQuestion);
  _.assign(templateParameters, { layerName: resourceAnswer.resourceName });

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, templateParameters.layerName);
  const parametersFilePath = path.join(resourceDirPath, layerParametersFileName);
  const currentParameters = context.amplify.readJsonFile(parametersFilePath, undefined, false) || {};

  _.assign(templateParameters, currentParameters.parameters);

  // get the LayerObj
  const layerData = layerMetadataFactory(context, templateParameters.layerName);
  // runtime question
  let islayerVersionChanged: boolean = false;
  if (await context.amplify.confirmPrompt.run('Do you want to change the compatible runtimes?', false)) {
    const runtimeReturn = await runtimeWalkthrough(context, templateParameters as LayerParameters);
    templateParameters.runtimes = runtimeReturn.map(val => val.runtime);
    islayerVersionChanged = true;
  }
  // get the latest version from #currentcloudbackend
  const layerDataPushed: LayerMetadata = layerMetadataFactory(context, templateParameters.layerName, true);
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
        case Permissions.awsAccounts:
          _.assign(layerInputParameters, await inquirer.prompt(layerAccountAccessQuestion(defaultaccounts)));
          break;
        case Permissions.awsOrg:
          _.assign(layerInputParameters, await inquirer.prompt(layerOrgAccessQuestion(defaultorgs)));
          break;
      }
    }
  }
  if (islayerVersionChanged) {
    if (latestVersion === latestVersionPushed) {
      latestVersion += 1;
    }
    // updating map for a new version
    let map = createVersionsMap(layerInputParameters, String(latestVersion));
    templateParameters.layerVersionsMap[Object.keys(map)[0]] = map[Object.keys(map)[0]];
  } else {
    //updating map for the selected version
    let versions = layerData.listVersions();
    const versionAnswer = await inquirer.prompt(layerVersionQuestion(versions));
    let map = createVersionsMap(layerInputParameters, String(versionAnswer.layerVersion));
    templateParameters.layerVersionsMap[Object.keys(map)[0]] = map[Object.keys(map)[0]];
  }
  _.assign(templateParameters, { layerVersion: String(latestVersion) });

  if (latestVersion === latestVersionPushed) {
    _.assign(templateParameters, { build: false });
  } else {
    _.assign(templateParameters, { build: true });
  }
  return templateParameters;
}
