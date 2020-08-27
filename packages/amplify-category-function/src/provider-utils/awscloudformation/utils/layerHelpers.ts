import { JSONUtilities } from 'amplify-cli-core';
import { ListQuestion, prompt } from 'inquirer';
import _ from 'lodash';
import uuid from 'uuid';
import { categoryName } from './constants';
import { Permission, LayerPermission } from '../utils/layerParams';

export interface LayerInputParams {
  layerPermissions?: Permission[];
  authorizedAccountIds?: string;
  authorizedOrgId?: string;
}

export function layerVersionQuestion(versions: number[]) {
  return [
    {
      type: 'list',
      name: 'layerVersion',
      message: 'Select the layer version to update:',
      choices: versions,
    },
  ];
}

export function layerNameQuestion(context: any) {
  return [
    {
      type: 'input',
      name: 'layerName',
      message: 'Provide a name for your Lambda layer:',
      validate: input => {
        input = input.trim();
        const meta = context.amplify.getProjectMeta();
        if (!/^[a-zA-Z0-9]{1,129}$/.test(input)) {
          return 'Lambda layer names must be 1-129 alphanumeric characters.';
        } else if (meta.function && meta.function.hasOwnProperty(input)) {
          return `A Lambda layer with the name ${input} already exists in this project.`;
        }
        return true;
      },
      default: () => {
        const appName = context.amplify
          .getProjectDetails()
          .projectConfig.projectName.toLowerCase()
          .replace(/[^a-zA-Z0-9]/gi, '');
        const [shortId] = uuid().split('-');
        return `${appName}${shortId}`;
      },
    },
  ];
}

export function layerPermissionsQuestion(params?: Permission[]) {
  return [
    {
      type: 'checkbox',
      name: 'layerPermissions',
      message:
        'The current AWS account will always have access to this layer.\nOptionally, configure who else can access this layer. (Hit <Enter> to skip)',
      choices: [
        {
          name: 'Specific AWS accounts',
          value: Permission.awsAccounts,
          checked: _.includes(params, Permission.awsAccounts),
        },
        {
          name: 'Specific AWS organization',
          value: Permission.awsOrg,
          checked: _.includes(params, Permission.awsOrg),
        },
        {
          name: 'Public (Anyone on AWS can use this layer)',
          short: 'Public',
          value: Permission.public,
          checked: _.includes(params, Permission.public),
        },
      ],
      default: [Permission.private],
    },
  ];
}

export function layerAccountAccessQuestion(defaultAccountIds?: string[]) {
  const hasDefaults = defaultAccountIds && defaultAccountIds.length > 0;
  return [
    {
      type: 'input',
      name: 'authorizedAccountIds',
      message: 'Provide a list of comma-separated AWS account IDs:',
      validate: (input: string) => {
        const accounts = input.split(',');
        const set = new Set();
        for (let accountID of accounts) {
          accountID = accountID.trim();
          if (!/^[0-9]{12}$/.test(accountID)) {
            return `AWS account IDs must be 12 digits long. ${accountID} did not match the criteria.`;
          }
          if (set.has(accountID)) {
            return `Duplicate ID detected: ${accountID}`;
          }
          set.add(accountID);
        }
        return true;
      },
      default: hasDefaults ? defaultAccountIds.join(',') : undefined,
    },
  ];
}

export function layerOrgAccessQuestion(defaultOrgs?: string[]) {
  const hasDefaults = defaultOrgs && defaultOrgs.length > 0;
  return [
    {
      type: 'input',
      name: 'authorizedOrgId',
      message: 'Provide a list of comma-separated AWS organization IDs:',
      validate: input => {
        const orgIds = input.split(',');
        const set = new Set();
        for (let orgId of orgIds) {
          orgId = orgId.trim();
          if (!/^o-[a-zA-Z0-9]{10,32}$/.test(orgId)) {
            return 'The organization ID starts with "o-" followed by a 10-32 character-long alphanumeric string.';
          }
          if (set.has(orgId)) {
            return `Duplicate ID detected: ${orgId}`;
          }
          set.add(orgId);
        }
        return true;
      },
      default: hasDefaults ? defaultOrgs.join(',') : undefined,
    },
  ];
}

export function previousPermissionsQuestion(layerName: string): ListQuestion[] {
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

export async function chooseParamsOnEnvInit(context: any, layerName: string) {
  const teamProviderInfoPath = context.amplify.pathManager.getProviderInfoFilePath();
  const teamProviderInfo = JSONUtilities.readJson(teamProviderInfoPath);
  const filteredEnvs = Object.keys(teamProviderInfo).filter(env =>
    _.has(teamProviderInfo, [env, 'nonCFNdata', categoryName, layerName, 'layerVersionMap']),
  );
  const currentEnv = context.amplify.getEnvInfo().envName;
  if (filteredEnvs.includes(currentEnv)) {
    return _.get(teamProviderInfo, [currentEnv, 'nonCFNdata', categoryName, layerName]);
  }
  context.print.info(`Adding Lambda layer ${layerName} to ${currentEnv} environment.`);
  const { envName } = await prompt(chooseParamsOnEnvInitQuestion(layerName, filteredEnvs));
  const defaultPermission = [{ type: 'private' }];
  if (envName === undefined) {
    return {
      runtimes: [],
      layerVersionMap: {
        1: {
          permissions: defaultPermission,
        },
      },
    };
  }
  const layerToCopy = teamProviderInfo[envName].nonCFNdata.function[layerName];
  const latestVersion = Math.max(...Object.keys(layerToCopy.layerVersionMap || {}).map(v => Number(v)));
  const permissions = latestVersion ? layerToCopy.layerVersionMap[latestVersion].permissions : defaultPermission;
  return {
    runtimes: layerToCopy.runtimes,
    layerVersionMap: {
      1: { permissions },
    },
  };
}

function chooseParamsOnEnvInitQuestion(layerName: string, filteredEnvs: string[]): ListQuestion[] {
  const choices = filteredEnvs
    .map(env => ({ name: env, value: env }))
    .concat([{ name: 'Apply default settings (Access level: Only this AWS account, Runtimes: none)', value: undefined }]);
  return [
    {
      type: 'list',
      name: 'envName',
      message: `Choose the environment to clone the layer access & runtime settings from:`,
      choices,
    },
  ];
}

export function layerInputParamsToLayerPermissionArray(parameters: LayerInputParams): LayerPermission[] {
  const { layerPermissions } = parameters;
  let permissionObj: Array<LayerPermission> = [];

  if (layerPermissions !== undefined && layerPermissions.length > 0) {
    layerPermissions.forEach(val => {
      let obj: LayerPermission;
      if (val === Permission.public) {
        obj = {
          type: Permission.public,
        };
      } else if (val === Permission.awsOrg) {
        obj = {
          type: Permission.awsOrg,
          orgs: parameters.authorizedOrgId.split(','),
        };
      } else if (val === Permission.awsAccounts) {
        obj = {
          type: Permission.awsAccounts,
          accounts: parameters.authorizedAccountIds.split(','),
        };
      }
      permissionObj.push(obj);
    });
  }
  const privateObj: LayerPermission = {
    type: Permission.private,
  };
  permissionObj.push(privateObj); // layer is always accessible by the aws account of the owner
  return permissionObj;
}
