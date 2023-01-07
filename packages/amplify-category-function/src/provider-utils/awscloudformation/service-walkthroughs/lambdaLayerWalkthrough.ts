import { $TSContext, exitOnNextTick, ResourceDoesNotExistError, $TSAny } from 'amplify-cli-core';
import _ from 'lodash';
import { ServiceName } from '../utils/constants';
import { runtimeWalkthrough } from '../utils/functionPluginLoader';
import { LayerCloudState } from '../utils/layerCloudState';
import { saveLayerVersionPermissionsToBeUpdatedInCfn } from '../utils/layerConfiguration';
import { v4 as uuid } from 'uuid';
import {
  layerAccountAccessPrompt,
  LayerInputParams,
  layerInputParamsToLayerPermissionArray,
  layerOrgAccessPrompt,
  loadPreviousLayerHash,
  loadStoredLayerParameters,
} from '../utils/layerHelpers';
import { migrateLegacyLayer } from '../utils/layerMigrationUtils';
import { AccountsLayer, defaultLayerPermission, LayerParameters, LayerRuntime, OrgsLayer, PermissionEnum } from '../utils/layerParams';
import { byValue, byValues, prompter } from 'amplify-prompts';
import { stateManager } from 'amplify-cli-core';

const layerPermissionsChoices: { name: string; value: $TSAny }[] = [
  {
    name: 'Specific AWS accounts',
    value: PermissionEnum.AwsAccounts,
  },
  {
    name: 'Specific AWS organization',
    value: PermissionEnum.AwsOrg,
  },
  {
    name: 'Public (Anyone on AWS can use this layer)',
    value: PermissionEnum.Public,
  },
];

export async function createLayerWalkthrough(
  context: $TSContext,
  parameters: Partial<LayerParameters> = {},
): Promise<Partial<LayerParameters>> {
  const projectName = context.amplify
    .getProjectDetails()
    .projectConfig.projectName.toLowerCase()
    .replace(/[^a-zA-Z0-9]/gi, '');

  const layerName = await prompter.input('Provide a name for your Lambda layer:', {
    validate: (input: string) => {
      input = input.trim();
      const meta = stateManager.getMeta();
      if (!/^[a-zA-Z0-9]{1,87}$/.test(input)) {
        return 'Lambda layer names must be 1-87 alphanumeric characters long.';
      } else if (meta?.function?.input || meta?.function?.[`${projectName}${input}`]) {
        return `A Lambda layer with the name ${input} already exists in this project.`;
      }
      return true;
    },
    initial: `layer${uuid().split('-')[0]}`,
  });
  parameters.layerName = `${projectName}${layerName}`; // prefix with project name

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

  const layerInputParameters: LayerInputParams = {};
  const layerPermissions = await prompter.pick<'many', $TSAny>(
    'The current AWS account will always have access to this layer.\nOptionally, configure who else can access this layer. (Hit <Enter> to skip)',
    layerPermissionsChoices,
    {
      returnSize: 'many',
      initial: byValues([PermissionEnum.Private]),
    },
  );

  _.assign(layerInputParameters, {
    layerPermissions,
  });

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
  lambdaToUpdate?: string,
  parameters?: Partial<LayerParameters>,
): Promise<{ parameters: Partial<LayerParameters>; resourceUpdated: boolean }> {
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
    parameters.layerName = await prompter.pick<'one', string>('Select the Lambda layer to update:', resources);
  }

  // if legacy layer, perform migration
  const hasMigrated = await migrateLegacyLayer(context, parameters.layerName);

  // check if layer is still in create state
  const layerHasDeployed = loadPreviousLayerHash(parameters.layerName) !== undefined;
  let permissionsUpdateConfirmed = false;

  // load parameters.json
  const storedLayerParameters = loadStoredLayerParameters(context, parameters.layerName);
  let { permissions } = storedLayerParameters;

  if (await context.amplify.confirmPrompt('Do you want to adjust layer version permissions?', true)) {
    permissionsUpdateConfirmed = true;
    let defaultOrgs: string[] = [];
    let defaultAccounts: string[] = [];
    let selectedVersionNumber: number;

    // select layer version
    if (layerHasDeployed) {
      const layerCloudState = LayerCloudState.getInstance(parameters.layerName);
      const layerVersions = await layerCloudState.getLayerVersionsFromCloud(context, parameters.layerName);
      const latestVersionText = 'Future layer versions';
      const layerVersionChoices = [
        latestVersionText,
        ...layerVersions.map(layerVersionMetadata => `${layerVersionMetadata.Version}: ${layerVersionMetadata.Description}`),
      ];

      const selectedVersion = await prompter.pick('Select the layer version to update:', layerVersionChoices);

      if (selectedVersion !== latestVersionText) {
        selectedVersionNumber = Number(_.first(selectedVersion.split(':')));
        parameters.selectedVersion = _.first(layerVersions.filter(version => version.Version === selectedVersionNumber));
        permissions = parameters.selectedVersion.permissions;
      }
    }

    // load defaults
    const defaultLayerPermissions = permissions.map(permission => permission.type);
    defaultOrgs = permissions
      .filter(p => p.type === PermissionEnum.AwsOrg)
      .reduce((orgs: string[], permission: OrgsLayer) => [...orgs, ...permission.orgs], []);

    defaultAccounts = permissions
      .filter(p => p.type === PermissionEnum.AwsAccounts)
      .reduce((accounts: string[], permission: AccountsLayer) => [...accounts, ...permission.accounts], []);

    // select permission strategy
    const layerInputParameters: LayerInputParams = {};
    const layerPermissions = await prompter.pick<'many', $TSAny>(
      'The current AWS account will always have access to this layer.\nOptionally, configure who else can access this layer. (Hit <Enter> to skip)',
      layerPermissionsChoices,
      {
        returnSize: 'many',
        initial: byValues([PermissionEnum.Private]),
      },
    );

    _.assign(layerInputParameters, {
      layerPermissions,
    });

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

    // update ephemeral state if deployed version is picked
    if (selectedVersionNumber) {
      const { envName }: { envName: string } = context.amplify.getEnvInfo();
      saveLayerVersionPermissionsToBeUpdatedInCfn(parameters.layerName, envName, selectedVersionNumber, parameters.permissions);
    }
  }

  const resourceUpdated = permissionsUpdateConfirmed && !_.isEqual(permissions, parameters.permissions);

  // In case answer to updating permissions is 'no', but migration occurred
  if (hasMigrated && parameters.permissions === undefined) {
    parameters.permissions = permissions;
  }

  parameters.runtimes = storedLayerParameters.runtimes;
  parameters.build = true;
  return { parameters, resourceUpdated };
}

export async function lambdaLayerNewVersionWalkthrough(params: LayerParameters, timestampString: string): Promise<LayerParameters> {
  const choices = [
    {
      name: 'The same permission as the latest layer version',
      value: 'LATEST_VERSION',
    },
    {
      name: 'Only accessible by the current account. You can always edit this later with: amplify update function',
      value: 'CURRENT_ACCOUNT',
    },
  ];

  const usePreviousPermissions = await prompter.pick('What permissions do you want to grant to this new layer version?', choices, {
    initial: byValue('LATEST_VERSION'),
  });
  let permissions = params.permissions;
  if (usePreviousPermissions === 'CURRENT_ACCOUNT') {
    permissions = [defaultLayerPermission];
  }
  const description = await descriptionQuestion(timestampString);

  return {
    ...params,
    permissions,
    description,
  };
}

async function descriptionQuestion(timestampString: string): Promise<string> {
  const response = await prompter.input('Description:', {
    initial: `${'Updated layer version'} ${timestampString}`,
    validate: (desc: string) => {
      if (desc.length === 0) return 'Description cannot be empty';
      if (desc.length > 256) return 'Description cannot be more than 256 characters';
      return true;
    },
  });

  return response;
}
