import inquirer from 'inquirer';
import _ from 'lodash';
import uuid from 'uuid';
import path from 'path';
import { LayerParameters, Permissions } from '../utils/layerParams';
import { runtimeWalkthrough } from '../utils/functionPluginLoader';
import { ServiceName, categoryName, layerParametersFileName } from '../utils/constants';
import { objectExtension } from 'graphql-transformer-core/lib/TransformerContext';

export async function createLayerWalkthrough(context: any, parameters: Partial<LayerParameters> = {}): Promise<Partial<LayerParameters>> {
  _.assign(parameters, await inquirer.prompt(layerNameQuestion(context)));

  let runtimeReturn = await runtimeWalkthrough(context, parameters);
  parameters.runtimes = runtimeReturn.map(val => val.runtime);

  _.assign(parameters, await inquirer.prompt(layerPermissionsQuestion(parameters)));

  for (let permissions of parameters.layerPermissions) {
    switch (permissions) {
      case Permissions.awsAccounts:
        _.assign(parameters, await inquirer.prompt(layerAccountAccessQuestion()));
        break;
      case Permissions.awsOrg:
        _.assign(parameters, await inquirer.prompt(layerOrgAccessQuestion()));
        break;
    }
  }
  return parameters;
}

export async function updateLayerWalkthrough(
  context: any,
  templateParameters: Partial<LayerParameters> = {},
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
      message: 'Please select the Lambda Layer you would want to update',
      type: 'list',
      choices: resources,
    },
  ];
  const resourceAnswer = await inquirer.prompt(resourceQuestion);
  templateParameters.layerName = String(resourceAnswer.resourceName);

  // get layer-patameters
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, templateParameters.layerName);
  const parametersFilePath = path.join(resourceDirPath, layerParametersFileName);
  let currentParameters;
  try {
    currentParameters = context.amplify.readJsonFile(parametersFilePath);
  } catch (e) {
    currentParameters = {};
  }

  _.assign(templateParameters, currentParameters);
  // runtime question
  let islayerVersionChanged: boolean = true;
  if (await context.amplify.confirmPrompt.run('Do you want to change the compatible runtimes?', false)) {
    let runtimeReturn = await runtimeWalkthrough(context, templateParameters);
    templateParameters.runtimes = runtimeReturn.map(val => val.runtime);
  } else {
    islayerVersionChanged = false;
  }
  if (await context.amplify.confirmPrompt.run('Do you want to adjust who can access the current & new layer version?', true)) {
    _.assign(templateParameters, await inquirer.prompt(layerPermissionsQuestion(templateParameters)));

    for (let permissions of templateParameters.layerPermissions) {
      switch (permissions) {
        case Permissions.awsAccounts:
          _.assign(templateParameters, await inquirer.prompt(layerAccountAccessQuestion()));
          break;
        case Permissions.awsOrg:
          _.assign(templateParameters, await inquirer.prompt(layerOrgAccessQuestion()));
          break;
      }
    }
    // if (islayerVersionChanged) {
    //   _.assign(templateParameters, await inquirer.prompt(layerVersionQuestion(context)));
    // }
  }
  return templateParameters;
}

// function layerVersionQuestion(context: any) {
//   return [
//     {
//       type: 'input',
//       name: 'layerVersion',
//       message: 'Provide a version number for your updated Lambda layer:',
//       validate: input => {
//         // TODO: make sure name is unique from other layers in project
//         if (/^[a-zA-Z0-9_\-]{1,140}$/.test(input)) {
//           return true;
//         }
//         return 'Lambda Layer names are 1-140 characters long and can only contain letters, numbers, -, _';
//       },
//       default: () => {
//         const appName = context.amplify
//           .getProjectDetails()
//           .projectConfig.projectName.toLowerCase()
//           .replace(/[^a-zA-Z0-9]/gi, '');
//         const [shortId] = uuid().split('-');
//         return `${appName}${shortId}`;
//       },
//     },
//   ];
// }

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

function layerPermissionsQuestion(params: Partial<LayerParameters>) {
  return [
    {
      type: 'checkbox',
      name: 'layerPermissions',
      message: 'Who should have permission to use this layer?',
      choices: [
        {
          name: 'Only the current AWS account',
          value: Permissions.private,
          checked: _.includes(params.layerPermissions, Permissions.private) ? true : false,
        },
        {
          name: 'Specific AWS accounts',
          value: Permissions.awsAccounts,
          checked: _.includes(params.layerPermissions, Permissions.awsAccounts) ? true : false,
        },
        {
          name: 'Specific AWS organization',
          value: Permissions.awsOrg,
          checked: _.includes(params.layerPermissions, Permissions.awsOrg) ? true : false,
        },
        {
          name: 'Public (everyone on AWS can use this layer)',
          value: Permissions.public,
          checked: _.includes(params.layerPermissions, Permissions.public) ? true : false,
        },
      ],
    },
  ];
}

function layerAccountAccessQuestion() {
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
    },
  ];
}

function layerOrgAccessQuestion() {
  return [
    {
      type: 'input',
      name: 'authorizedOrgId',
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
