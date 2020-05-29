import inquirer from 'inquirer';
import _ from 'lodash';
import uuid from 'uuid';
import { LayerParameters, Permissions } from '../utils/layerParams';
import { runtimeWalkthrough } from '../utils/functionPluginLoader';

export async function createLayerWalkthrough(context: any, parameters: Partial<LayerParameters> = {}): Promise<Partial<LayerParameters>> {
  _.assign(parameters, await inquirer.prompt(layerNameQuestion(context)));

  let runtimeReturn = await runtimeWalkthrough(context, parameters);
  parameters.runtimes = runtimeReturn.map(val => val.runtime);

  _.assign(parameters, await inquirer.prompt(layerPermissionsQuestion()));

  switch (parameters.layerPermissions) {
    case Permissions.awsAccounts:
      _.assign(parameters, await inquirer.prompt(layerAccountAccessQuestion()));
      break;
    case Permissions.awsOrg:
      _.assign(parameters.authorizedOrgId, await inquirer.prompt(layerOrgAccessQuestion()));
      break;
  }
  return parameters;
}

function layerNameQuestion(context: any) {
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
    },
  ];
}

function layerPermissionsQuestion() {
  return [
    {
      type: 'list',
      name: 'layerPermissions',
      message: 'Who should have permission to use this layer?',
      choices: [
        {
          name: 'Only the current AWS account',
          value: Permissions.private,
        },
        {
          name: 'Specific AWS accounts',
          value: Permissions.awsAccounts,
        },
        {
          name: 'Specific AWS organization',
          value: Permissions.awsOrg,
        },
        {
          name: 'Public (everyone on AWS can use this layer)',
          value: Permissions.public,
        },
      ],
      default: Permissions.private,
    },
  ];
}

function layerAccountAccessQuestion() {
  return [
    {
      type: 'input',
      name: 'layerAccountAccess',
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
    },
  ];
}

function layerOrgAccessQuestion() {
  return [
    {
      type: 'input',
      name: 'layerOrgAccess',
      message: 'Provide an AWS organization ID:',
      validate: input => {
        if (/^o-[a-zA-Z0-9]{10,32}$/.test(input)) {
          return true;
        }
        return 'The organization ID starts with "o-" followed by a 10-32 character-long alphanumeric string.';
      },
    },
  ];
}
