import uuid from 'uuid';
import { Permission, LayerPermission } from '../utils/layerParams';
import _ from 'lodash';

export interface LayerInputParams {
  layerPermissions?: Permission[];
  authorizedAccountIds?: string;
  authorizedOrgId?: string;
  hash?: string;
}

export function layerVersionQuestion(choices) {
  return [
    {
      type: 'list',
      name: 'layerVersion',
      message: 'Select the layer version to update:',
      choices: choices,
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
        if (!/^[a-zA-Z0-9]{1,140}$/.test(input)) {
          return 'Lambda Layer names must be 1-140 alphanumeric characters.';
        } else if (meta.function && meta.function.hasOwnProperty(input)) {
          return `A Lambda Layer with the name ${input} already exists in this project.`;
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
      message: 'Who should have permission to use this layer? (Current AWS account always has access)',
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
          name: 'Public (everyone on AWS can use this layer)',
          value: Permission.public,
          checked: _.includes(params, Permission.public),
        },
      ],
      default: [Permission.private],
    },
  ];
}

export function layerAccountAccessQuestion(defaultaccounts?: string[]) {
  return [
    {
      type: 'input',
      name: 'authorizedAccountIds',
      message: 'Provide a list of comma-separated AWS account IDs:',
      validate: input => {
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
      default: defaultaccounts !== undefined ? defaultaccounts.join(',') : '',
    },
  ];
}

export function layerOrgAccessQuestion(defaultorgs?: string[]) {
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
      default: defaultorgs !== undefined ? defaultorgs.join(',') : '',
    },
  ];
}

export function createVersionsMap(parameters: LayerInputParams, version: string) {
  const { layerPermissions } = parameters;
  const hash = _.get(parameters, 'hash', null);
  let versionMap: object = {};
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
  permissionObj.push(privateObj);
  // add private as default in versionMap
  versionMap[version] = { permissions: permissionObj };
  if (hash) {
    versionMap[version].hash = hash;
  }
  return versionMap;
}
