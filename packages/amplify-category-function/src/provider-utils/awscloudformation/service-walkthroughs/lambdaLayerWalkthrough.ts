import inquirer, { InputQuestion } from 'inquirer';
import _ from 'lodash';
import { getLayerMetadataFactory, LayerMetadata, LayerParameters, Permission } from '../utils/layerParams';
import { runtimeWalkthrough } from '../utils/functionPluginLoader';
import {
  layerInputParamsToLayerPermissionArray,
  layerAccountAccessQuestion,
  LayerInputParams,
  layerNameQuestion,
  layerOrgAccessQuestion,
  layerPermissionsQuestion,
  layerVersionQuestion,
} from '../utils/layerHelpers';
import { ServiceName } from '../utils/constants';

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
  // add layer version to parameters
  parameters.layerVersionMap = {
    1: {
      permissions: layerInputParamsToLayerPermissionArray(layerInputParameters),
    },
  };
  parameters.build = true;
  return parameters;
}

export async function updateLayerWalkthrough(
  context: any,
  lambdaToUpdate?: string, // resourceToUpdate not used in this method but required by the SupportedServices interface
  parameters?: Partial<LayerParameters>,
): Promise<Partial<LayerParameters>> {
  const { allResources } = await context.amplify.getResourceStatus();
  const resources = allResources.filter(resource => resource.service === ServiceName.LambdaLayer).map(resource => resource.resourceName);

  if (resources.length === 0) {
    context.print.error('No Lambda layer resource to update. Please use "amplify add function" to create a new Layer');
    process.exit(0);
  }
  const resourceQuestion: InputQuestion = [
    {
      name: 'resourceName',
      message: 'Select the Lambda layer to update:',
      type: 'list',
      choices: resources,
    },
  ];
  if (resources.length === 1) {
    parameters.layerName = resources[0];
  } else {
    const resourceAnswer = await inquirer.prompt(resourceQuestion);
    parameters.layerName = resourceAnswer.resourceName;
  }

  // load the current layer state
  const layerState: LayerMetadata = getLayerMetadataFactory(context)(parameters.layerName);
  await layerState.syncVersions();

  // runtime question
  if (await context.amplify.confirmPrompt.run('Do you want to update the compatible runtimes?', false)) {
    const runtimeReturn = await runtimeWalkthrough(context, parameters as LayerParameters);
    layerState.updateCompatibleRuntimes(runtimeReturn.map(val => val.runtime));
  }

  let layerInputParameters: LayerInputParams = {};

  if (await context.amplify.confirmPrompt.run('Do you want to adjust layer version permissions?', true)) {
    // select layer version
    const selectedVersion = Number((await inquirer.prompt(layerVersionQuestion(layerState.listVersions()))).layerVersion as string);

    // load defaults
    const defaultLayerPermissions = layerState.getVersion(selectedVersion).permissions.map(permission => permission.type);
    const defaultOrgs = layerState.getVersion(selectedVersion).listOrgAccess();
    const defaultAccounts = layerState.getVersion(selectedVersion).listAccountAccess();

    // select permission strategy
    _.assign(layerInputParameters, await inquirer.prompt(layerPermissionsQuestion(defaultLayerPermissions)));

    // get the account and/or org IDs based on the permissions selected and pass defaults in the questions workflow
    for (let permission of layerInputParameters.layerPermissions) {
      switch (permission) {
        case Permission.awsAccounts:
          _.assign(layerInputParameters, await inquirer.prompt(layerAccountAccessQuestion(defaultAccounts)));
          break;
        case Permission.awsOrg:
          _.assign(layerInputParameters, await inquirer.prompt(layerOrgAccessQuestion(defaultOrgs)));
          break;
      }
    }

    // update layer version based on inputs
    const layerPermissions = layerInputParamsToLayerPermissionArray(layerInputParameters);
    layerState.setPermissionsForVersion(selectedVersion, layerPermissions);
  }
  _.assign(parameters, layerState.toStoredLayerParameters());
  parameters.build = true;
  return parameters;
}
