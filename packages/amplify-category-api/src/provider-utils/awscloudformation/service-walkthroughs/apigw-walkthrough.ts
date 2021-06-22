import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import uuid from 'uuid';
import { rootAssetDir } from '../aws-constants';
import { checkForPathOverlap, validatePathName, formatCFNPathParamsForExpressJs } from '../utils/rest-api-path-utils';
import { ResourceDoesNotExistError, exitOnNextTick, $TSContext, stateManager, open } from 'amplify-cli-core';

// keep in sync with ServiceName in amplify-category-function, but probably it will not change
const FunctionServiceNameLambdaFunction = 'Lambda';

const category = 'api';
const serviceName = 'API Gateway';
const elasticContainerServiceName = 'ElasticContainer';
const parametersFileName = 'api-params.json';
const cfnParametersFilename = 'parameters.json';

export async function serviceWalkthrough(context, defaultValuesFilename) {
  const { amplify } = context;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = await import(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  let answers = {
    paths: [],
  };

  const apiNames = await askApiNames(context, allDefaultValues);
  answers = { ...answers, ...apiNames };

  return pathFlow(context, answers);
}

export async function updateWalkthrough(context, defaultValuesFilename) {
  const { amplify } = context;
  const { allResources } = await context.amplify.getResourceStatus();
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = await import(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());
  const resources = allResources
    .filter(resource => resource.service === serviceName && resource.mobileHubMigrated !== true)
    .map(resource => resource.resourceName);

  // There can only be one appsync resource
  if (resources.length === 0) {
    const errMessage = 'No REST API resource to update. Please use "amplify add api" command to create a new REST API';
    context.print.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return;
  }

  let answers: any = {
    paths: [],
  };

  const question = [
    {
      name: 'resourceName',
      message: 'Please select the REST API you would want to update',
      type: 'list',
      choices: resources,
    },
    {
      name: 'operation',
      message: 'What would you like to do',
      type: 'list',
      when: context.input.command !== 'add',
      choices: [
        { name: 'Add another path', value: 'add' },
        { name: 'Update path', value: 'update' },
        { name: 'Remove path', value: 'remove' },
      ],
    },
  ];

  const updateApi = await inquirer.prompt(question);

  // Inquirer does not currently support combining 'when' and 'default', so
  // manually set the operation if the user ended up here via amplify api add.
  if (context.input.command === 'add') {
    updateApi.operation = 'add';
  }

  if (updateApi.resourceName === 'AdminQueries') {
    const errMessage = `The Admin Queries API is maintained through the Auth category and should be updated using 'amplify update auth' command`;
    context.print.warning(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
  }

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, category, updateApi.resourceName as string);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  let parameters;
  try {
    parameters = context.amplify.readJsonFile(parametersFilePath);
  } catch (e) {
    parameters = {};
  }
  parameters.resourceName = updateApi.resourceName;

  Object.assign(allDefaultValues, parameters);
  answers = { ...answers, ...parameters };
  [answers.uuid] = uuid().split('-');
  const pathList = answers.paths.map(path => path.name);
  let updatedResult = {};

  switch (updateApi.operation) {
    case 'add': {
      updatedResult = pathFlow(context, answers);
      break;
    }
    case 'remove': {
      const pathToRemove = await inquirer.prompt({
        name: 'path',
        message: 'Please select the path you would want to remove',
        type: 'list',
        choices: pathList,
      });

      answers.paths = answers.paths.filter(path => path.name !== pathToRemove.path);

      const { dependsOn, functionArns } = await findDependsOn(answers.paths, context);
      answers.dependsOn = dependsOn;
      answers.functionArns = functionArns;

      updatedResult = { answers, dependsOn };
      break;
    }
    case 'update': {
      const pathToEdit = await inquirer.prompt({
        name: 'path',
        message: 'Please select the path you would want to edit',
        type: 'list',
        choices: pathList,
      });

      // removing path from paths list
      const currentPath = answers.paths.find(path => path.name === pathToEdit.path);
      answers.paths = answers.paths.filter(path => path.name !== pathToEdit.path);

      updatedResult = pathFlow(context, answers, currentPath);
      break;
    }
    default: {
      updatedResult = {};
    }
  }

  return updatedResult;
}

async function pathFlow(context, answers, currentPath?) {
  const pathsAnswer = await askPaths(context, answers, currentPath);
  answers = { ...answers, paths: pathsAnswer.paths, functionArns: pathsAnswer.functionArns };
  const { dependsOn } = pathsAnswer;

  const privacy = {
    auth: pathsAnswer.paths.filter(path => path.privacy.auth && path.privacy.auth.length > 0).length,
    unauth: pathsAnswer.paths.filter(path => path.privacy.unauth && path.privacy.unauth.length > 0).length,
  };

  answers = { ...answers, privacy, dependsOn };

  if (
    context.amplify.getProjectDetails() &&
    context.amplify.getProjectDetails().amplifyMeta &&
    context.amplify.getProjectDetails().amplifyMeta.providers &&
    context.amplify.getProjectDetails().amplifyMeta.providers.awscloudformation
  ) {
    // TODO: read from utility functions (Dustin PR)
    const { amplifyMeta } = context.amplify.getProjectDetails();
    const providerInfo = amplifyMeta.providers.awscloudformation;

    answers.privacy.authRoleName = providerInfo.AuthRoleName;
    answers.privacy.unAuthRoleName = providerInfo.UnauthRoleName;
  }

  return { answers, dependsOn };
}

async function askApiNames(context, defaults) {
  const { amplify } = context;
  // TODO: Check if default name is already taken
  const answer: { apiName?: string; resourceName: string } = await inquirer.prompt([
    {
      name: 'resourceName',
      type: 'input',
      message: 'Provide a friendly name for your resource to be used as a label for this category in the project:',
      default: defaults.resourceName,
      validate: amplify.inputValidation({
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
        required: true,
      }),
    },
  ]);

  answer.apiName = answer.resourceName;

  return answer;
}

async function askPrivacy(context, answers, currentPath) {
  while (true) {
    const apiAccess = await inquirer.prompt({
      name: 'restrict',
      type: 'confirm',
      default: !(currentPath && currentPath.open),
      message: 'Restrict API access',
    });

    if (!apiAccess.restrict) {
      return { open: true };
    }

    const userPoolGroupList = await context.amplify.getUserPoolGroupList(context);

    let permissionSelected = 'Auth/Guest Users';
    const privacy: any = {};

    if (userPoolGroupList.length > 0) {
      do {
        if (permissionSelected === 'Learn more') {
          context.print.info('');
          context.print.info(
            'You can restrict access using CRUD policies for Authenticated Users, Guest Users, or on individual Group that users belong to in a User Pool. If a user logs into your application and is not a member of any group they will use policy set for “Authenticated Users”, however if they belong to a group they will only get the policy associated with that specific group.',
          );
          context.print.info('');
        }
        const permissionSelection = await inquirer.prompt({
          name: 'selection',
          type: 'list',
          message: 'Restrict access by?',
          choices: ['Auth/Guest Users', 'Individual Groups', 'Both', 'Learn more'],
          default: 'Auth/Guest Users',
        });

        permissionSelected = permissionSelection.selection;
      } while (permissionSelected === 'Learn more');
    }

    if (permissionSelected === 'Both' || permissionSelected === 'Auth/Guest Users') {
      const answer = await inquirer.prompt({
        name: 'privacy',
        type: 'list',
        message: 'Who should have access?',
        choices: [
          {
            name: 'Authenticated users only',
            value: 'private',
          },
          {
            name: 'Authenticated and Guest users',
            value: 'protected',
          },
        ],
        default: currentPath && currentPath.privacy && currentPath.privacy.protected ? 'protected' : 'private',
      });

      privacy[answer.privacy] = true;

      context.api = {
        privacy: answer.privacy,
      };

      let {
        privacy: { auth: authPrivacy },
      } = currentPath || { privacy: {} };
      let {
        privacy: { unauth: unauthPrivacy },
      } = currentPath || { privacy: {} };

      // convert legacy permissions to CRUD structure
      if (authPrivacy && ['r', 'rw'].includes(authPrivacy)) {
        authPrivacy = convertToCRUD(authPrivacy);
      }
      if (unauthPrivacy && ['r', 'rw'].includes(unauthPrivacy)) {
        unauthPrivacy = convertToCRUD(unauthPrivacy);
      }

      if (answer.privacy === 'private') {
        privacy.auth = await askReadWrite('Authenticated', context, authPrivacy);

        const apiRequirements = { authSelections: 'identityPoolAndUserPool' };

        await ensureAuth(context, apiRequirements, answers.resourceName);
      }

      if (answer.privacy === 'protected') {
        privacy.auth = await askReadWrite('Authenticated', context, authPrivacy);
        privacy.unauth = await askReadWrite('Guest', context, unauthPrivacy);
        const apiRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities: true };

        await ensureAuth(context, apiRequirements, answers.resourceName);
      }
    }

    if (permissionSelected === 'Both' || permissionSelected === 'Individual Groups') {
      // Enable Auth if not enabled

      const apiRequirements = { authSelections: 'identityPoolAndUserPool' };

      await ensureAuth(context, apiRequirements, answers.resourceName);

      // Get Auth resource name
      const authResourceName = await getAuthResourceName(context);
      answers.authResourceName = authResourceName;

      let defaultSelectedGroups = [];

      if (currentPath && currentPath.privacy && currentPath.privacy.userPoolGroups) {
        defaultSelectedGroups = Object.keys(currentPath.privacy.userPoolGroups);
      }

      const userPoolGroupSelection = await inquirer.prompt([
        {
          name: 'userpoolGroups',
          type: 'checkbox',
          message: 'Select groups:',
          choices: userPoolGroupList,
          default: defaultSelectedGroups,
          validate: inputs => {
            if (inputs.length === 0) {
              return 'Select at least one option';
            }
            return true;
          },
        },
      ]);

      const selectedUserPoolGroupList = userPoolGroupSelection.userpoolGroups;

      for (let i = 0; i < selectedUserPoolGroupList.length; i += 1) {
        let defaults = [];
        if (
          currentPath &&
          currentPath.privacy &&
          currentPath.privacy.userPoolGroups &&
          currentPath.privacy.userPoolGroups[selectedUserPoolGroupList[i]]
        ) {
          defaults = currentPath.privacy.userPoolGroups[selectedUserPoolGroupList[i]];
        }
        if (!privacy.userPoolGroups) {
          privacy.userPoolGroups = {};
        }
        privacy.userPoolGroups[selectedUserPoolGroupList[i]] = await askReadWrite(selectedUserPoolGroupList[i], context, defaults);
      }
    }
    return privacy;
  }
}

async function ensureAuth(context, apiRequirements, resourceName) {
  const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    apiRequirements,
    context,
    'api',
    resourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new Error(checkResult.errors.join(os.EOL));
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    context.print.warning(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    try {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
        context,
        'api',
        resourceName,
        apiRequirements,
      ]);
    } catch (error) {
      context.print.error(error);
      throw error;
    }
  }
}

async function askReadWrite(userType, context, privacy) {
  const permissionMap = {
    create: ['/POST'],
    read: ['/GET'],
    update: ['/PUT', '/PATCH'],
    delete: ['/DELETE'],
  };

  const defaults = [];
  if (privacy) {
    Object.values(permissionMap).forEach((el, index) => {
      if (el.every(i => privacy.includes(i))) {
        defaults.push(Object.keys(permissionMap)[index]);
      }
    });
  }

  const crudAnswers = await context.amplify.crudFlow(userType, permissionMap, defaults);

  return crudAnswers;
}

async function askPaths(context, answers, currentPath) {
  // const existingLambdaArns = true;

  const existingFunctions = functionsExist(context);

  const choices = [
    {
      name: 'Create a new Lambda function',
      value: 'newFunction',
    },
  ];

  /*
  Removing this option for now in favor of multi-env support
  - NOT CRITICAL
  if (existingLambdaArns) {
    choices.push({
      name: 'Use a Lambda function already deployed on AWS',
      value: 'arn',
    });
  }
  */

  if (existingFunctions) {
    choices.push({
      name: 'Use a Lambda function already added in the current Amplify project',
      value: 'projectFunction',
    });
  }

  let defaultFunctionType = 'newFunction';
  if (currentPath) {
    defaultFunctionType = currentPath.lambdaArn ? 'arn' : 'projectFunction';
  }

  const paths = [...answers.paths];

  let addAnotherPath;
  do {
    let pathName;
    let isPathValid;
    do {
      const pathAnswer = await inquirer.prompt({
        name: 'name',
        type: 'input',
        message: 'Provide a path (e.g., /book/{isbn}):',
        default: currentPath ? currentPath.name : '/items',
        validate: value => validatePathName(value),
      });
      pathName = pathAnswer.name;

      const overlapCheckResult = checkForPathOverlap(pathName, paths);
      if (overlapCheckResult === false) {
        // The path provided by the user is valid, and doesn't overlap with any other endpoints that they've stood up with API Gateway.
        isPathValid = true;
      } else {
        // The path provided by the user overlaps with another endpoint that they've stood up with API Gateway.
        // Ask them if they're okay with this. If they are, then we'll consider their provided path to be valid.
        const higherOrderPath = overlapCheckResult.higherOrderPath;
        const lowerOrderPath = overlapCheckResult.lowerOrderPath;
        isPathValid = (
          await inquirer.prompt({
            name: 'isOverlappingPathOK',
            type: 'confirm',
            message: `The path ${lowerOrderPath} overlaps with ${higherOrderPath}. Users authorized to access ${higherOrderPath} will also have access to ${lowerOrderPath}. Are you sure you want to continue?`,
            default: false,
          })
        ).isOverlappingPathOK;
      }
    } while (!isPathValid);

    const lambdaAnswer = await inquirer.prompt({
      name: 'functionType',
      type: 'list',
      message: 'Choose a Lambda source',
      choices,
      default: defaultFunctionType,
    });

    // TODO: add path validation like awsmobile-cli does
    let path = { name: pathName };
    let lambda;
    do {
      lambda = await askLambdaSource(context, lambdaAnswer.functionType, path.name, currentPath);
    } while (!lambda);
    const privacy = await askPrivacy(context, answers, currentPath);
    path = { ...path, ...lambda, privacy };
    paths.push(path);

    if (currentPath) {
      break;
    }

    addAnotherPath = (
      await inquirer.prompt({
        name: 'anotherPath',
        type: 'confirm',
        message: 'Do you want to add another path?',
        default: false,
      })
    ).anotherPath;
  } while (addAnotherPath);

  const { dependsOn, functionArns } = await findDependsOn(paths, context);

  return { paths, dependsOn, functionArns };
}

async function findDependsOn(paths, context) {
  // go thru all paths and add lambdaFunctions to dependsOn and functionArns uniquely
  const dependsOn = [];
  const functionArns = [];

  for (let i = 0; i < paths.length; i += 1) {
    if (paths[i].lambdaFunction && !paths[i].lambdaArn) {
      if (!dependsOn.find(func => func.resourceName === paths[i].lambdaFunction)) {
        dependsOn.push({
          category: 'function',
          resourceName: paths[i].lambdaFunction,
          attributes: ['Name', 'Arn'],
        });
      }
    }
    if (!functionArns.find(func => func.lambdaFunction === paths[i].lambdaFunction)) {
      functionArns.push({
        lambdaFunction: paths[i].lambdaFunction,
        lambdaArn: paths[i].lambdaArn,
      });
    }
    if (paths[i].privacy && paths[i].privacy.userPoolGroups) {
      const userPoolGroups = Object.keys(paths[i].privacy.userPoolGroups);
      if (userPoolGroups.length > 0) {
        // Get auth resource name

        const authResourceName = await getAuthResourceName(context);

        if (!dependsOn.find(resource => resource.resourceName === authResourceName)) {
          dependsOn.push({
            category: 'auth',
            resourceName: authResourceName,
            attributes: ['UserPoolId'],
          });
        }

        userPoolGroups.forEach(group => {
          if (!dependsOn.find(resource => resource.attributes[0] === `${group}GroupRole`)) {
            dependsOn.push({
              category: 'auth',
              resourceName: 'userPoolGroups',
              attributes: [`${group}GroupRole`],
            });
          }
        });
      }
    }
  }
  return { dependsOn, functionArns };
}

async function getAuthResourceName(context) {
  let authResources = (await context.amplify.getResourceStatus('auth')).allResources;
  authResources = authResources.filter(resource => resource.service === 'Cognito');
  if (authResources.length === 0) {
    throw new Error('No auth resource found. Please add it using amplify add auth');
  }

  const authResourceName = authResources[0].resourceName;
  return authResourceName;
}

function functionsExist(context) {
  if (!context.amplify.getProjectDetails().amplifyMeta.function) {
    return false;
  }

  const functionResources = context.amplify.getProjectDetails().amplifyMeta.function;
  const lambdaFunctions = [];
  Object.keys(functionResources).forEach(resourceName => {
    if (functionResources[resourceName].service === FunctionServiceNameLambdaFunction) {
      lambdaFunctions.push(resourceName);
    }
  });

  if (lambdaFunctions.length === 0) {
    return false;
  }

  return true;
}

async function askLambdaSource(context, functionType, path, currentPath) {
  switch (functionType) {
    case 'arn':
      return askLambdaArn(context, currentPath);
    case 'projectFunction':
      return askLambdaFromProject(context, currentPath);
    case 'newFunction':
      return newLambdaFunction(context, path);
    default:
      throw new Error('Type not supported');
  }
}

async function newLambdaFunction(context, path) {
  context.api = {
    path,
    // ExpressJS represents path parameters as /:param instead of /{param}. This expression performs this replacement.
    expressPath: formatCFNPathParamsForExpressJs(path),
    functionTemplate: 'serverless',
  };
  let params = {
    functionTemplate: {
      parameters: {
        path,
        expressPath: formatCFNPathParamsForExpressJs(path),
      },
    },
  };

  const resourceName = await context.amplify.invokePluginMethod(context, 'function', undefined, 'add', [
    context,
    'awscloudformation',
    FunctionServiceNameLambdaFunction,
    params,
  ]);

  context.print.success('Succesfully added the Lambda function locally');

  return { lambdaFunction: resourceName };
}

async function askLambdaFromProject(context, currentPath) {
  const functionResources = context.amplify.getProjectDetails().amplifyMeta.function;
  const lambdaFunctions = [];
  Object.keys(functionResources).forEach(resourceName => {
    if (functionResources[resourceName].service === FunctionServiceNameLambdaFunction) {
      lambdaFunctions.push(resourceName);
    }
  });

  const answer = await inquirer.prompt({
    name: 'lambdaFunction',
    type: 'list',
    message: 'Choose the Lambda function to invoke by this path',
    choices: lambdaFunctions,
    default: currentPath ? currentPath.lambdaFunction : lambdaFunctions[0],
  });

  return { lambdaFunction: answer.lambdaFunction };
}

async function askLambdaArn(context, currentPath) {
  const lambdaFunctions = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getLambdaFunctions');

  const lambdaOptions = lambdaFunctions.map(lambdaFunction => ({
    value: lambdaFunction.FunctionArn,
    name: `${lambdaFunction.FunctionName} (${lambdaFunction.FunctionArn})`,
  }));

  if (lambdaOptions.length === 0) {
    context.print.error('You do not have any Lambda functions configured for the selected Region');
    return null;
  }

  const lambdaCloudOptionQuestion = {
    type: 'list',
    name: 'lambdaChoice',
    message: 'Please select a Lambda function',
    choices: lambdaOptions,
    default: currentPath && currentPath.lambdaArn ? `${currentPath.lambdaArn}` : `${lambdaOptions[0].value}`,
  };

  let lambdaOption;
  while (!lambdaOption) {
    try {
      lambdaOption = await inquirer.prompt([lambdaCloudOptionQuestion]);
    } catch (err) {
      context.print.error('Select a Lambda Function');
    }
  }

  const lambdaCloudOptionAnswer = lambdaFunctions.find(lambda => lambda.FunctionArn === lambdaOption.lambdaChoice);

  return {
    lambdaArn: lambdaCloudOptionAnswer.FunctionArn,
    lambdaFunction: lambdaCloudOptionAnswer.FunctionName,
  };
}

export async function migrate(context, projectPath, resourceName) {
  const { amplify } = context;

  const targetDir = amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(targetDir, category, resourceName);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  let parameters;
  try {
    parameters = amplify.readJsonFile(parametersFilePath);
  } catch (e) {
    context.print.error(`Error reading api-params.json file for ${resourceName} resource`);
    throw e;
  }
  const copyJobs = [
    {
      dir: path.join(rootAssetDir, 'cloudformation-templates'),
      template: 'apigw-cloudformation-template-default.json.ejs',
      target: `${targetDir}/${category}/${resourceName}/${resourceName}-cloudformation-template.json`,
    },
  ];

  // copy over the files
  await context.amplify.copyBatch(context, copyJobs, parameters, true, false);

  // Create parameters.json file
  const cfnParameters = {
    authRoleName: {
      Ref: 'AuthRoleName',
    },
    unauthRoleName: {
      Ref: 'UnauthRoleName',
    },
  };

  const cfnParametersFilePath = path.join(resourceDirPath, cfnParametersFilename);
  const jsonString = JSON.stringify(cfnParameters, null, 4);
  fs.writeFileSync(cfnParametersFilePath, jsonString, 'utf8');
}

function convertToCRUD(privacy) {
  if (privacy === 'r') {
    privacy = ['/GET'];
  } else if (privacy === 'rw') {
    privacy = ['/POST', '/GET', '/PUT', '/PATCH', '/DELETE'];
  }

  return privacy;
}

export function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  const actions = [];

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actions.push('apigateway:POST', 'apigateway:PUT');
        break;
      case 'update':
        actions.push('apigateway:PATCH');
        break;
      case 'read':
        actions.push('apigateway:GET', 'apigateway:HEAD', 'apigateway:OPTIONS');
        break;
      case 'delete':
        actions.push('apigateway:DELETE');
        break;
      default:
        console.log(`${crudOption} not supported`);
    }
  });

  policy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
        'Fn::Join': [
          '',
          [
            'arn:aws:apigateway:',
            {
              Ref: 'AWS::Region',
            },
            '::/restapis/',
            {
              Ref: `${category}${resourceName}ApiName`,
            },
            '/*',
          ],
        ],
      },
    ],
  };

  const attributes = ['ApiName', 'ApiId'];

  return { policy, attributes };
}

export const openConsole = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const categoryAmplifyMeta = amplifyMeta[category];
  const { Region } = amplifyMeta.providers.awscloudformation;

  const restApis = Object.keys(categoryAmplifyMeta).filter(resourceName => {
    const resource = categoryAmplifyMeta[resourceName];
    return (
      resource.output &&
      (resource.service === serviceName || (resource.service === elasticContainerServiceName && resource.apiType === 'REST'))
    );
  });

  if (restApis) {
    let url;
    let selectedApi = restApis[0];

    if (restApis.length > 1) {
      ({ selectedApi } = await inquirer.prompt({
        type: 'list',
        name: 'selectedApi',
        choices: restApis,
        message: 'Please select the API',
      }));
    }
    const selectedResource = categoryAmplifyMeta[selectedApi];

    if (selectedResource.service === serviceName) {
      const {
        output: { ApiId },
      } = selectedResource;

      url = `https://${Region}.console.aws.amazon.com/apigateway/home?region=${Region}#/apis/${ApiId}/resources/`;
    } else {
      // Elastic Container API
      const {
        output: { PipelineName, ServiceName, ClusterName },
      } = selectedResource;
      const codePipeline = 'CodePipeline';
      const elasticContainer = 'ElasticContainer';

      const { selectedConsole } = await inquirer.prompt({
        name: 'selectedConsole',
        message: 'Which console you want to open',
        type: 'list',
        choices: [
          {
            name: 'Elastic Container Service (Deployed container status)',
            value: elasticContainer,
          },
          {
            name: 'CodePipeline (Container build status)',
            value: codePipeline,
          },
        ],
      });

      if (selectedConsole === elasticContainer) {
        url = `https://console.aws.amazon.com/ecs/home?region=${Region}#/clusters/${ClusterName}/services/${ServiceName}/details`;
      } else if (selectedConsole === codePipeline) {
        url = `https://${Region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${PipelineName}/view`;
      } else {
        context.print.error('Option not available');
        return;
      }
    }

    open(url, { wait: false });
  } else {
    context.print.error('There are no REST APIs pushed to the cloud');
  }
};
