import { $TSContext } from 'amplify-cli-core';
import { ListQuestion, prompt } from 'inquirer';
import _ from 'lodash';
import ora from 'ora';
import path from 'path';
import uuid from 'uuid';
import { Permission, LayerPermission } from '../utils/layerParams';

export interface LayerInputParams {
  layerPermissions?: PermissionEnum[];
  accountIds?: string[];
  orgIds?: string[];
}

export function layerVersionQuestion(versions: string[]): ListQuestion {
  return {
    type: 'list',
    name: 'layerVersion',
    message: 'Select the layer version to update:',
    choices: versions,
  };
}

export function layerNameQuestion(projectName: string): InputQuestion {
  return {
    type: 'input',
    name: 'layerName',
    message: 'Provide a name for your Lambda layer:',
    validate: (input: string) => {
      input = input.trim();
      const meta = stateManager.getMeta();
      if (!/^[a-zA-Z0-9-_]{1,87}$/.test(input)) {
        return 'Lambda layer names must be 1-87 characters long. Only alphanumeric, -, and _ characters supported.';
      } else if (meta?.function?.input || meta?.function?.[`${projectName}-${input}`]) {
        return `A Lambda layer with the name ${input} already exists in this project.`;
      }
      return true;
    },
  ];
}

// TODO check if name exists in cloud
export function layerNameQuestion(context: $TSContext) {
  return [
    {
      type: 'input',
      name: 'layerName',
      message: 'Provide a name for your Lambda layer:',
      validate: input => {
        input = input.trim();
        const meta = context.amplify.getProjectMeta();
        if (!/^[a-zA-Z0-9]{1,108}$/.test(input)) {
          return 'Lambda layer names must be 1-108 alphanumeric characters.';
        } else if (meta?.function.hasOwnProperty(input)) {
          return `A Lambda layer with the name ${input} already exists in this project.`;
        }
        return true;
      },
      {
        name: 'Specific AWS organization',
        value: PermissionEnum.AwsOrg,
        checked: _.includes(params, PermissionEnum.AwsOrg),
      },
      {
        name: 'Public (Anyone on AWS can use this layer)',
        short: 'Public',
        value: PermissionEnum.Public,
        checked: _.includes(params, PermissionEnum.Public),
      },
    ],
    default: [PermissionEnum.Private],
  };
}

export async function layerAccountAccessPrompt(defaultAccountIds?: string[]): Promise<string[]> {
  const hasDefaults = defaultAccountIds && defaultAccountIds.length > 0;
  const answer = await prompt({
    type: 'input',
    name: 'authorizedAccountIds',
    message: 'Provide a list of comma-separated AWS account IDs:',
    validate: (input: string) => {
      const accounts = input.split(',');
      for (const accountId of accounts) {
        if (!/^[0-9]{12}$/.test(accountId.trim())) {
          return `AWS account IDs must be 12 digits long. ${accountId} did not match the criteria.`;
        }
      }
      return true;
    },
    default: hasDefaults ? defaultAccountIds.join(',') : undefined,
  });
  return _.uniq(answer.authorizedAccountIds.split(',').map((accountId: string) => accountId.trim()));
}

export async function layerOrgAccessPrompt(defaultOrgs?: string[]): Promise<string[]> {
  const hasDefaults = defaultOrgs && defaultOrgs.length > 0;
  const answer = await prompt({
    type: 'input',
    name: 'authorizedOrgIds',
    message: 'Provide a list of comma-separated AWS organization IDs:',
    validate: (input: string) => {
      const orgIds = input.split(',');
      for (const orgId of orgIds) {
        if (!/^o-[a-zA-Z0-9]{10,32}$/.test(orgId.trim())) {
          return 'The organization ID starts with "o-" followed by a 10-32 character-long alphanumeric string.';
        }
        return true;
      },
      default: hasDefaults ? defaultOrgs.join(',') : undefined,
    },
  ];
}

export function previousPermissionsQuestion(): ListQuestion[] {
  return [
    {
      type: 'list',
      name: 'usePreviousPermissions',
      message: 'What permissions do you want to grant to this new layer version?',
      choices: [
        {
          name: 'The same permission as the latest layer version',
          short: 'Previous version permissions',
          value: true,
        },
        {
          name: 'Only accessible by the current account. You can always edit this later with: amplify update function',
          short: 'Private',
          value: false,
        },
      ],
      default: 0,
    },
  ];
}

// export async function chooseParamsOnEnvInit(context: $TSContext, layerName: string) {
//   const teamProviderInfo = stateManager.getTeamProviderInfo();
//   const filteredEnvs = Object.keys(teamProviderInfo).filter(env =>
//     _.has(teamProviderInfo, [env, 'nonCFNdata', categoryName, layerName, 'layerVersionMap']),
//   );
//   const currentEnv = context.amplify.getEnvInfo().envName;
//   if (filteredEnvs.includes(currentEnv)) {
//     return _.get(teamProviderInfo, [currentEnv, 'nonCFNdata', categoryName, layerName]);
//   }
//   context.print.info(`Adding Lambda layer ${layerName} to ${currentEnv} environment.`);
//   const yesFlagSet = _.get(context, ['parameters', 'options', 'yes'], false);
//   let envName;
//   if (!yesFlagSet) {
//     envName = (await prompt(chooseParamsOnEnvInitQuestion(layerName, filteredEnvs))).envName;
//   }
//   const defaultPermission = [{ type: 'private' }];
//   if (yesFlagSet || envName === undefined) {
//     return {
//       runtimes: [],
//       layerVersionMap: {
//         1: {
//           permissions: defaultPermission,
//         },
//       },
//     };
//   }
//   const layerToCopy = teamProviderInfo[envName].nonCFNdata.function[layerName];
//   const latestVersion = Math.max(...Object.keys(layerToCopy.layerVersionMap || {}).map(v => Number(v)));
//   const permissions = latestVersion ? layerToCopy.layerVersionMap[latestVersion].permissions : defaultPermission;
//   return {
//     runtimes: layerToCopy.runtimes,
//     layerVersionMap: {
//       1: { permissions },
//     },
//   };
// }

// TODO - use whatever is in parameters.json instead
// function chooseParamsOnEnvInitQuestion(layerName: string, filteredEnvs: string[]): ListQuestion[] {
//   const choices = filteredEnvs
//     .map(env => ({ name: env, value: env }))
//     .concat([{ name: 'Apply default access (Only this AWS account)', value: undefined }]);
//   return [
//     {
//       type: 'list',
//       name: 'envName',
//       message: `Choose the environment to import the layer access settings from:`,
//       choices,
//     },
//   ];
// }

export async function isNewVersion(layerName: string) {
  const previousHash = loadPreviousLayerHash(layerName);
  const currentHash = await hashLayerVersionContents(getLayerPath(layerName));
  return previousHash !== currentHash;
}

export function isMultiEnvLayer(layerName: string) {
  const layerParametersPath = path.join(getLayerPath(layerName), layerParametersFileName);
  return !fs.existsSync(layerParametersPath);
}

export async function loadLayerDataFromCloud(context: $TSContext, layerName: string): Promise<LayerVersionMetadata[]> {
  const spinner = ora('Loading layer data from the cloud...').start();
  let layerMetadata: LayerVersionMetadata[];
  try {
    const { envName }: { envName: string } = context.amplify.getEnvInfo();
    const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
    const Lambda = await providerPlugin.getLambdaSdk(context);
    const layerVersionList = await Lambda.listLayerVersions(isMultiEnvLayer(layerName) ? `${layerName}-${envName}` : layerName);
    const Cfn = await providerPlugin.getCloudFormationSdk(context);
    const stackList = await Cfn.listStackResources();
    const layerStacks = stackList?.StackResourceSummaries?.filter(stack => stack.LogicalResourceId.includes(layerName));
    let detailedLayerStack;

    if (layerStacks?.length > 0) {
      detailedLayerStack = (await Cfn.listStackResources(layerStacks[0].PhysicalResourceId)).StackResourceSummaries; // TODO this only works for 1 layer
    }
    layerVersionList.forEach(layerVersion => {
      let layerLogicalIdSuffix;
      detailedLayerStack
        .filter(stack => stack.ResourceType === 'AWS::Lambda::LayerVersion' && stack.PhysicalResourceId === layerVersion.LayerVersionArn)
        .forEach(stack => {
          layerVersion.LogicalName = stack.LogicalResourceId;
          layerLogicalIdSuffix = stack.LogicalResourceId.replace('LambdaLayerVersion', '');
        });

      detailedLayerStack
        .filter(
          stack =>
            stack.ResourceType === 'AWS::Lambda::LayerVersionPermission' &&
            stack.PhysicalResourceId.split('#')[0] === layerVersion.LayerVersionArn,
        )
        .forEach(stack => {
          // layer version permission
          layerVersion.permissions = layerVersion.permissions || [];
          const permissionTypeString = stack.LogicalResourceId.replace('LambdaLayerPermission', '').replace(layerLogicalIdSuffix, '');
          const accountIds = [];
          const orgIds = [];
          if (permissionTypeString === PermissionEnum.Private) {
            layerVersion.permissions.push({ type: PermissionEnum.Private });
          } else if (permissionTypeString === PermissionEnum.Public) {
            layerVersion.permissions.push({ type: PermissionEnum.Public });
          } else if (permissionTypeString.startsWith(PermissionEnum.AwsAccounts)) {
            accountIds.push(permissionTypeString.replace(PermissionEnum.AwsAccounts, ''));
          } else if (permissionTypeString.startsWith(PermissionEnum.AwsOrg)) {
            const orgId = permissionTypeString.replace(PermissionEnum.AwsOrg + 'o', 'o-');
            orgIds.push(orgId);
          }

          if (accountIds.length > 0) {
            layerVersion.permissions.push({
              type: PermissionEnum.AwsAccounts,
              accounts: accountIds,
            });
          }
          if (orgIds.length > 0) {
            layerVersion.permissions.push({
              type: PermissionEnum.AwsOrg,
              orgs: orgIds,
            });
          }
        });
    });
    layerMetadata = layerVersionList;
  } catch (e) {
    // TODO error handling
    spinner.fail();
    context.print.error(`An error occurred getting latest layer version metadata for "${layerName}": ${e}`);
    throw e;
  }
  spinner.stop();
  return layerMetadata;
}

// Check hash results for content changes, bump version if so
export async function ensureLayerVersion(context: $TSContext, layerName: string, previousHash: string) {
  const currentHash = await hashLayerVersionContents(getLayerPath(layerName));
  if (previousHash !== currentHash) {
    if (previousHash) {
      context.print.success(`Content changes in Lambda layer ${layerName} detected.`);
    }
  }

  const layerParameters = loadStoredLayerParameters(context, layerName);
  await updateLayerArtifacts(context, layerParameters, { layerParams: false });
  return currentHash;
}

export function loadPreviousLayerHash(layerName: string): string {
  const meta: $TSMeta = stateManager.getMeta();
  const previousHash = _.get(meta, [categoryName, layerName, 'versionHash'], undefined);
  return previousHash;
}

// hashes just the content that will be zipped into the layer version.
// for efficiency, it only hashes package.json files in the node_modules folder of nodejs layers
export const hashLayerVersionContents = async (layerPath: string): Promise<string> => {
  // TODO load paths from layer-runtimes.json
  const nodePath = path.join(layerPath, 'lib', 'nodejs');
  const nodeHashOptions = {
    files: {
      include: ['package.json'],
    },
  };
  const pyPath = path.join(layerPath, 'lib', 'python');
  const optPath = path.join(layerPath, 'opt');

  const joinedHashes = (await Promise.all([safeHash(nodePath, nodeHashOptions), safeHash(pyPath), safeHash(optPath)])).join();

  return crypto.createHash('sha256').update(joinedHashes).digest('base64');
};

// wrapper around hashElement that will return an empty string if the path does not exist
const safeHash = async (path: string, opts?: HashElementOptions): Promise<string> => {
  if (fs.pathExistsSync(path)) {
    return (
      await hashElement(path, opts).catch(() => {
        throw new Error(`An error occurred hashing directory ${path}`);
      })
    ).hash;
  }
  return '';
};

export function validFilesize(context: $TSContext, zipPath: string, maxSize = 250) {
  try {
    const { size } = fs.statSync(zipPath);
    const fileSize = Math.round(size / 1024 ** 2);
    return fileSize < maxSize;
  } catch (error) {
    context.print.error(error);
    return new Error(`Calculating file size failed: ${zipPath}`);
  }
}

// hashes all of the layer contents as well as the files in the layer path (CFN, parameters, etc)
export const hashLayerResource = async (layerPath: string): Promise<string> => {
  return (await globby(['*'], { cwd: layerPath }))
    .map(filePath => fs.readFileSync(path.join(layerPath, filePath), 'utf8'))
    .reduce((acc, it) => acc.update(it), crypto.createHash('sha256'))
    .update(await hashLayerVersionContents(layerPath))
    .digest('base64');
};
