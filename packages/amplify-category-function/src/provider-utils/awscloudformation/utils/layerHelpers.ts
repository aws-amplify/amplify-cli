import uuid from 'uuid';
import {Permissions, LayerPermission, LayerParameters } from '../utils/layerParams';
import _ from 'lodash';

export function layerVersionQuestion(choices){
    return [
      {
        type: 'list',
        name: 'layerVersion',
        message: 'Select the version number to update for given Lambda Layer: ',
        choices: choices
      }
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
          if (!/^[a-zA-Z0-9_\-]{1,140}$/.test(input)) {
            return 'Lambda Layer names are 1-140 characters long and can only contain letters, numbers, -, _';
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
    }];
}

export function layerPermissionsQuestion(params: Permissions[]) {
    return [
      {
        type: 'checkbox',
        name: 'layerPermissions',
        message: 'Who should have permission to use this layer?',
        choices: [
          {
            name: 'Only the current AWS account',
            value: Permissions.private,
            checked: _.includes(params, Permissions.private),
          },
          {
            name: 'Specific AWS accounts',
            value: Permissions.awsAccounts,
            checked: _.includes(params, Permissions.awsAccounts),
          },
          {
            name: 'Specific AWS organization',
            value: Permissions.awsOrg,
            checked: _.includes(params, Permissions.awsOrg),
          },
          {
            name: 'Public (everyone on AWS can use this layer)',
            value: Permissions.public,
            checked: _.includes(params, Permissions.public),
          },
        ],
        default: Permissions.private,
    }];
}

export function layerAccountAccessQuestion(defaultaccounts? : string[]) {
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
        default : defaultaccounts.toString()
    }];
}

export function layerOrgAccessQuestion(defaultorgs? : string[]) {
    return [
      {
        type: 'input',
        name: 'authorizedOrgId',
        message: 'Provide a list of comma-separated AWS organization IDs:',
        validate: input => {
          const orgIds = input.split(',');
          const set = new Set();
          orgIds.forEach(orgId => {
            orgId = orgId.trim();
            if (!/^o-[a-zA-Z0-9]{10,32}$/.test(orgId)) {
              return 'The organization ID starts with "o-" followed by a 10-32 character-long alphanumeric string.';
            }
            if (set.has(orgId)) {
              return `Duplicate ID detected: ${orgId}`;
            }
            set.add(orgId);
          })
          return true;
        },
        default : defaultorgs.toString()
    }];
}

export function createVersionsMap(parameters : Partial<LayerParameters>,version : string){
  let versionMap : Object = {};
  let permissionObj: Array<LayerPermission>= [];
  parameters.layerPermissions.forEach(permission=>{
    let obj : LayerPermission
      if(permission === Permissions.public){
        obj = {
          type : Permissions.public,
        }
      }
      else if(permission === Permissions.awsOrg){
        obj = {
          type : Permissions.awsOrg,
          orgs : parameters.authorizedOrgId.split(',')
        }
      }
      else if(permission === Permissions.awsAccounts){
        obj = {
          type : Permissions.awsAccounts,
          accounts : parameters.authorizedAccountIds.split(',')
        }
      }
      else{
        obj = {
          type : Permissions.private,
        }
      }
      permissionObj.push(obj);
  });
  versionMap[version] = permissionObj;
  return versionMap;
}