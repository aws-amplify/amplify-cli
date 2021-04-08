import { $TSContext, exitOnNextTick, ResourceDoesNotExistError } from 'amplify-cli-core';
import inquirer, { InputQuestion } from 'inquirer';
import _ from 'lodash';
import { ServiceName } from '../utils/constants';
import { runtimeWalkthrough } from '../utils/functionPluginLoader';
import {
  layerAccountAccessPrompt,
  LayerInputParams,
  layerInputParamsToLayerPermissionArray,
  layerNameQuestion,
  layerOrgAccessPrompt,
  layerPermissionsQuestion,
  layerVersionQuestion,
  loadLayerDataFromCloud,
  loadPreviousLayerHash,
  loadStoredLayerParameters,
  previousPermissionsQuestion,
} from '../utils/layerHelpers';
import {
  AccountsLayer,
  LayerVersionCfnMetadata,
  LayerParameters,
  LayerRuntime,
  OrgsLayer,
  PermissionEnum,
  PrivateLayer,
} from '../utils/layerParams';

export async function createLayerWalkthrough(
  context: $TSContext,
  parameters: Partial<LayerParameters> = {},
): Promise<Partial<LayerParameters>> {
  _.assign(parameters, await inquirer.prompt(layerNameQuestion(context)));

  const runtimeReturn = await runtimeWalkthrough(context, parameters);

  // need to map cloudTemplateValue: string => cloudTemplateValues: string[]
  parameters.runtimes = runtimeReturn.map(val => ({
    name: val.runtime.name,
    value: val.runtime.value,
    layerExecutablePath: val.runtime.layerExecutablePath,
    cloudTemplateValues: [val.runtime.cloudTemplateValue],
    layerDefaultFiles: val.runtime?.layerDefaultFiles ?? [],
    runtimePluginId: val.runtimePluginId,
  })) as LayerRuntime[];

  let layerInputParameters: LayerInputParams = {};
  _.assign(layerInputParameters, await inquirer.prompt(layerPermissionsQuestion()));

  for (const permission of layerInputParameters.layerPermissions) {
    switch (permission) {
      case PermissionEnum.AwsAccounts:
        layerInputParameters.accountIds = await layerAccountAccessPrompt();
        break;
      case PermissionEnum.AwsOrg:
        layerInputParameters.orgIds = await layerOrgAccessPrompt();
        break;
    }
  }
  parameters.permissions = layerInputParamsToLayerPermissionArray(layerInputParameters);
  parameters.build = true;
  return parameters;
}

export async function updateLayerWalkthrough(
  context: $TSContext,
  lambdaToUpdate?: string, // resourceToUpdate not used in this method but required by the SupportedServices interface
  parameters?: Partial<LayerParameters>,
): Promise<Partial<LayerParameters>> {
  const { allResources } = await context.amplify.getResourceStatus();
  const resources = allResources.filter(resource => resource.service === ServiceName.LambdaLayer).map(resource => resource.resourceName);

  if (resources.length === 0) {
    const errMessage = 'No Lambda layer resource to update. Please use "amplify add function" to create a new Layer';
    context.print.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
  }
  if (resources.length === 1) {
    parameters.layerName = resources[0];
  } else if (lambdaToUpdate && resources.includes(lambdaToUpdate)) {
    parameters.layerName = lambdaToUpdate;
  } else {
    const resourceQuestion: InputQuestion = [
      {
        name: 'resourceName',
        message: 'Select the Lambda layer to update:',
        type: 'list',
        choices: resources,
      },
    ];
    const resourceAnswer = await inquirer.prompt(resourceQuestion);
    parameters.layerName = resourceAnswer.resourceName;
  }

  // check if layer is still in create state
  const isLayerInCreateState = loadPreviousLayerHash(parameters.layerName) === undefined;

  // load parameters.json
  const storedLayerParameters = loadStoredLayerParameters(context, parameters.layerName);
  let { permissions } = storedLayerParameters;
  let layerInputParameters: LayerInputParams = {};

  if (await context.amplify.confirmPrompt('Do you want to adjust layer version permissions?', true)) {
    let defaultLayerPermissions: PermissionEnum[];
    let defaultOrgs: string[] = [];
    let defaultAccounts: string[] = [];
    let selectedVersion;

    // select layer version
    if (!isLayerInCreateState) {
      const layerVersions = await loadLayerDataFromCloud(context, parameters.layerName);
      const layerVersionNumbers = layerVersions.map(layerVersionMetadata => layerVersionMetadata.Version);
      const selectedVersionNumber = Number((await inquirer.prompt(layerVersionQuestion(layerVersionNumbers))).layerVersion);
      selectedVersion = layerVersions.filter(version => version.Version === selectedVersionNumber)[0];
      permissions = selectedVersion.permissions;

      // parameters.deployedVersions = layerVersions;
      parameters.selectedVersion = selectedVersion;

      // TODO version specific permissions
    }

    // load defaults
    defaultLayerPermissions = permissions.map(permission => permission.type);
    defaultOrgs = permissions
      .filter(p => p.type === PermissionEnum.AwsOrg)
      .reduce((orgs: string[], permission: OrgsLayer) => (orgs = [...orgs, ...permission.orgs]), []);

    defaultAccounts = permissions
      .filter(p => p.type === PermissionEnum.AwsAccounts)
      .reduce((accounts: string[], permission: AccountsLayer) => (accounts = [...accounts, ...permission.accounts]), []);

    // select permission strategy
    _.assign(layerInputParameters, await inquirer.prompt(layerPermissionsQuestion(defaultLayerPermissions)));

    // get the account and/or org IDs based on the permissions selected and pass defaults in the questions workflow
    for (const permission of layerInputParameters.layerPermissions) {
      switch (permission) {
        case PermissionEnum.AwsAccounts:
          layerInputParameters.accountIds = await layerAccountAccessPrompt(defaultAccounts);
          break;
        case PermissionEnum.AwsOrg:
          layerInputParameters.orgIds = await layerOrgAccessPrompt(defaultOrgs);
          break;
      }
    }

    // update layer version based on inputs
    parameters.permissions = layerInputParamsToLayerPermissionArray(layerInputParameters);

    // layerState.setPermissionsForVersion(selectedVersion, layerPermissions);
  } else {
    const defaultPermission: PrivateLayer = { type: PermissionEnum.Private };
    parameters.permissions = storedLayerParameters.permissions || [defaultPermission];
  }
  parameters.runtimes = storedLayerParameters.runtimes;
  parameters.build = true;
  return parameters;
}

export async function lambdaLayerNewVersionWalkthrough(params: LayerParameters, timestampString: string): Promise<LayerParameters> {
  const changeLayerPermissions = await inquirer.prompt(previousPermissionsQuestion());
  let permissions = params.permissions;
  if (!changeLayerPermissions.usePreviousPermissions) {
    permissions = [{ type: PermissionEnum.Private }];
  }
  const descriptionResponse = await inquirer.prompt({
    name: 'description',
    default: `Updated layer version: ${timestampString}`,
    message: 'Description:',
  });

  return {
    ...params,
    permissions,
    description: descriptionResponse.description,
  };
}
