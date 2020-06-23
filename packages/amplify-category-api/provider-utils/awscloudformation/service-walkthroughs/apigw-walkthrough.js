const inquirer = require('inquirer');
const pathLib = require('path');
const fs = require('fs-extra');
const { ServiceName: FunctionServiceName } = require('amplify-category-function');

const category = 'api';
const serviceName = 'API Gateway';
const parametersFileName = 'api-params.json';
const cfnParametersFilename = 'parameters.json';
const uuid = require('uuid');

async function serviceWalkthrough(context, defaultValuesFilename) {
  const { amplify } = context;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  let answers = {
    paths: [],
  };

  const apiNames = await askApiNames(context, allDefaultValues);
  answers = { ...answers, ...apiNames };

  return pathFlow(context, answers);
}

async function updateWalkthrough(context, defaultValuesFilename) {
  const { amplify } = context;
  const { allResources } = await context.amplify.getResourceStatus();
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());
  const resources = allResources.filter(resource => resource.service === serviceName).map(resource => resource.resourceName);

  // There can only be one appsync resource
  if (resources.length === 0) {
    context.print.error('No REST API resource to update. Please use "amplify add api" command to create a new REST API');
    process.exit(0);
    return;
  }

  let answers = {
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
      choices: [
        { name: 'Add another path', value: 'add' },
        { name: 'Update path', value: 'update' },
        { name: 'Remove path', value: 'remove' },
      ],
    },
  ];

  const updateApi = await inquirer.prompt(question);

  if (updateApi.resourceName === 'AdminQueries') {
    context.print.warning(
      `The Admin Queries API is maintained through the Auth category and should be updated using 'amplify update auth' command`,
    );
    process.exit(0);
  }

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = pathLib.join(projectBackendDirPath, category, updateApi.resourceName);
  const parametersFilePath = pathLib.join(resourceDirPath, parametersFileName);
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

async function pathFlow(context, answers, currentPath) {
  const pathsAnswer = await askPaths(context, answers, currentPath);
  answers = { ...answers, paths: pathsAnswer.paths, functionArns: pathsAnswer.functionArns };
  const { dependsOn } = pathsAnswer;

  const privacy = {};
  privacy.auth = pathsAnswer.paths.filter(path => path.privacy.auth && path.privacy.auth.length > 0).length;
  privacy.unauth = pathsAnswer.paths.filter(path => path.privacy.unauth && path.privacy.unauth.length > 0).length;

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
  const answer = await inquirer.prompt([
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
    let allowUnauthenticatedIdentities = false;
    const privacy = {};
    const { checkRequirements, externalAuthEnable } = require('amplify-category-auth');

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
        // getting requirement satisfaction map
        const satisfiedRequirements = await checkRequirements(apiRequirements, context, 'api', answers.resourceName);
        // checking to see if any requirements are unsatisfied
        const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

        // if requirements are unsatisfied, trigger auth

        if (foundUnmetRequirements) {
          try {
            await externalAuthEnable(context, 'api', answers.resourceName, apiRequirements);
          } catch (e) {
            context.print.error(e);
            throw e;
          }
        }
      }

      if (answer.privacy === 'protected') {
        privacy.auth = await askReadWrite('Authenticated', context, authPrivacy);
        privacy.unauth = await askReadWrite('Guest', context, unauthPrivacy);
        allowUnauthenticatedIdentities = true;
        const apiRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };
        // getting requirement satisfaction map
        const satisfiedRequirements = await checkRequirements(apiRequirements, context, 'api', answers.resourceName);
        // checking to see if any requirements are unsatisfied
        const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

        // if requirements are unsatisfied, trigger auth

        if (foundUnmetRequirements) {
          try {
            await externalAuthEnable(context, 'api', answers.resourceName, apiRequirements);
          } catch (e) {
            context.print.error(e);
            throw e;
          }
        }
      }
    }

    if (permissionSelected === 'Both' || permissionSelected === 'Individual Groups') {
      // Enable Auth if not enabled

      const apiRequirements = { authSelections: 'identityPoolAndUserPool' };
      // getting requirement satisfaction map
      const satisfiedRequirements = await checkRequirements(apiRequirements, context, 'api', answers.resourceName);
      // checking to see if any requirements are unsatisfied
      const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

      // if requirements are unsatisfied, trigger auth

      if (foundUnmetRequirements) {
        try {
          await externalAuthEnable(context, 'api', answers.resourceName, apiRequirements);
        } catch (e) {
          context.print.error(e);
          throw e;
        }
      }

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

  const questions = [
    {
      name: 'name',
      type: 'input',
      message: 'Provide a path (e.g., /book/{isbn}):',
      default: currentPath ? currentPath.name : '/items',
      validate: value => validatePathName(value, answers.paths),
    },
    {
      name: 'functionType',
      type: 'list',
      message: 'Choose a Lambda source',
      choices,
      default: defaultFunctionType,
    },
  ];

  let addAnotherPath;
  const paths = [...answers.paths];

  do {
    const answer = await inquirer.prompt(questions);
    // TODO: add path validation like awsmobile-cli does
    let path = { name: answer.name };
    let lambda;
    do {
      lambda = await askLambdaSource(context, answer.functionType, answer.name, currentPath);
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

function validatePathName(name, paths) {
  if (name.length === 0) {
    return 'The path must not be empty';
  }

  if (name.charAt(name.length - 1) === '/') {
    return 'The path must not end with /';
  }

  if (name.charAt(0) !== '/') {
    return 'The path must begin with / e.g. /items';
  }

  // Matches parameterized paths such as /book/{isbn}/page/{pageNum}
  // This regex also catches the above conditions, but those are left in to provide clearer error messages.
  if (!/^(?:\/(?:[a-zA-Z0-9\-]+|{[a-zA-Z0-9\-]+}))+$/.test(name)) {
    return 'Each path part must use characters a-z A-Z 0-9 - and must not be empty.\nOptionally, a path part can be surrounded by { } to denote a path parameter.';
  }

  const split = name.split('/').filter(sub => sub !== ''); // because name starts with a /, this filters out the first empty element
  // Check if any prefix of this path matches an existing path
  let subpath = '';
  const subMatch = split.some(sub => {
    subpath = `${subpath}/${sub}`;
    return paths.map(path => path.name).find(name => name === subpath) !== undefined;
  });
  if (subMatch) {
    return `An existing path already matches this sub-path: ${subpath}`;
  }

  return true;
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
    if (functionResources[resourceName].service === FunctionServiceName.LambdaFunction) {
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

function newLambdaFunction(context, path) {
  let add;
  try {
    ({ add } = require('amplify-category-function'));
  } catch (e) {
    throw new Error('Function plugin not installed in the CLI. You need to install it to use this feature.');
  }
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

  return add(context, 'awscloudformation', FunctionServiceName.LambdaFunction, params).then(resourceName => {
    context.print.success('Succesfully added the Lambda function locally');
    return { lambdaFunction: resourceName };
  });
}

// Convert a CloudFormation parameterized path to an ExpressJS parameterized path
// /library/{libraryId}/book/{isbn} => /library/:libraryId/book/:isbn
function formatCFNPathParamsForExpressJs(path) {
  return path.replace(/{([a-zA-Z0-9\-]+)}/g, ':$1');
}

async function askLambdaFromProject(context, currentPath) {
  const functionResources = context.amplify.getProjectDetails().amplifyMeta.function;
  const lambdaFunctions = [];
  Object.keys(functionResources).forEach(resourceName => {
    if (functionResources[resourceName].service === FunctionServiceName.LambdaFunction) {
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

async function migrate(context, projectPath, resourceName) {
  const { amplify } = context;

  const targetDir = amplify.pathManager.getBackendDirPath();
  const resourceDirPath = pathLib.join(targetDir, category, resourceName);
  const parametersFilePath = pathLib.join(resourceDirPath, parametersFileName);
  let parameters;
  try {
    parameters = amplify.readJsonFile(parametersFilePath);
  } catch (e) {
    context.print.error(`Error reading api-params.json file for ${resourceName} resource`);
    throw e;
  }
  const pluginDir = `${__dirname}/../`;
  const copyJobs = [
    {
      dir: pluginDir,
      template: 'cloudformation-templates/apigw-cloudformation-template-default.json.ejs',
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

  const cfnParametersFilePath = pathLib.join(resourceDirPath, cfnParametersFilename);
  const jsonString = JSON.stringify(cfnParameters, null, 4);
  fs.writeFileSync(cfnParametersFilePath, jsonString, 'utf8');
}

// function checkIfAuthExists(context) {
//   const { amplify } = context;
//   const { amplifyMeta } = amplify.getProjectDetails();
//   let authExists = false;
//   const authServiceName = 'Cognito';
//   const authCategory = 'auth';

//   if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
//     const categoryResources = amplifyMeta[authCategory];
//     Object.keys(categoryResources).forEach((resource) => {
//       if (categoryResources[resource].service === authServiceName) {
//         authExists = true;
//       }
//     });
//   }
//   return authExists;
// }
function convertToCRUD(privacy) {
  if (privacy === 'r') {
    privacy = ['/GET'];
  } else if (privacy === 'rw') {
    privacy = ['/POST', '/GET', '/PUT', '/PATCH', '/DELETE'];
  }

  return privacy;
}

function getIAMPolicies(resourceName, crudOptions) {
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

module.exports = {
  serviceWalkthrough,
  updateWalkthrough,
  migrate,
  getIAMPolicies,
};
