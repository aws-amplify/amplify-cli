const inquirer = require('inquirer');
const pathLib = require('path');
const fs = require('fs-extra');

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
  const resources = allResources
    .filter(resource => resource.service === serviceName)
    .map(resource => resource.resourceName);

  // There can only be one appsync resource
  if (resources.length === 0) {
    context.print.error('No REST API resource to update. Please use "amplify add api" command to create a new REST API');
    process.exit(0);
    return;
  }

  let answers = {
    paths: [],
  };

  const question = [{
    name: 'resourceName',
    message: 'Please select the REST API you would want to update',
    type: 'list',
    choices: resources,
  }, {
    name: 'operation',
    message: 'What would you like to do',
    type: 'list',
    choices: [
      { name: 'Add another path', value: 'add' },
      { name: 'Update path', value: 'update' },
      { name: 'Remove path', value: 'remove' }],
  }];

  const updateApi = await inquirer.prompt(question);

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

      const { dependsOn, functionArns } = findDependsOn(answers.paths);
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
  privacy.auth = pathsAnswer.paths
    .filter(path => path.privacy.auth && path.privacy.auth.length > 0).length;
  privacy.unauth = pathsAnswer.paths
    .filter(path => path.privacy.unauth && path.privacy.unauth.length > 0).length;

  answers = { ...answers, privacy, dependsOn };

  if (context.amplify.getProjectDetails() && context.amplify.getProjectDetails().amplifyMeta &&
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
      default: !((currentPath && currentPath.open)),
      message: 'Restrict API access',
    });

    if (!apiAccess.restrict) {
      return { open: true };
    }

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
      default: (currentPath && currentPath.privacy && currentPath.privacy.protected) ? 'protected' : 'private',
    });

    const privacy = {};
    privacy[answer.privacy] = true;

    if (answer.privacy === 'open') { return privacy; }

    const { checkRequirements, externalAuthEnable } = require('amplify-category-auth');
    context.api = {
      privacy: answer.privacy,
    };

    let { privacy: { auth: authPrivacy } } = currentPath || { privacy: {} };
    let { privacy: { unauth: unauthPrivacy } } = currentPath || { privacy: {} };

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
          return privacy;
        } catch (e) {
          context.print.error(e);
          throw e;
        }
      }
    }

    if (answer.privacy === 'protected') {
      privacy.auth = await askReadWrite('Authenticated', context, authPrivacy);
      privacy.unauth = await askReadWrite('Guest', context, unauthPrivacy);

      const apiRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities: true };
      // getting requirement satisfaction map
      const satisfiedRequirements = await checkRequirements(apiRequirements, context, 'api', answers.resourceName);
      // checking to see if any requirements are unsatisfied
      const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

      // if requirements are unsatisfied, trigger auth

      if (foundUnmetRequirements) {
        try {
          await externalAuthEnable(context, 'api', answers.resourceName, apiRequirements);
          return privacy;
        } catch (e) {
          context.print.error(e);
          throw e;
        }
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

  return await context.amplify.crudFlow(
    userType,
    permissionMap,
    defaults,
  );
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
      message: 'Provide a path (e.g., /items)',
      default: currentPath ? currentPath.name : '/items',
      validate(value) {
        const err = validatePathName(value, answers.paths);
        if (err) {
          return err;
        }
        return true;
      },
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
    addAnotherPath = (await inquirer.prompt({
      name: 'anotherPath',
      type: 'confirm',
      message: 'Do you want to add another path?',
      default: false,
    })).anotherPath;
  } while (addAnotherPath);

  const { dependsOn, functionArns } = findDependsOn(paths);

  return { paths, dependsOn, functionArns };
}

function validatePathName(name, paths) {
  const err = null;

  if (name.length === 0 || name.substring(name.length - 1) === '/') {
    return 'Each sub-path must begin with a letter or number.';
  }

  // Set / as a first character of path name
  if (name.substring(0, 1) !== '/') {
    return 'Path must begin with / e.g. /items';
  }
  if (/[^a-zA-Z0-9\-/]/.test(name)) {
    return 'You can use the following characters: a-z A-Z 0-9 - /';
  }

  // If the are is something like /asasd//asa must be detected
  // Splitting the string with / to find empty sub-path
  const split = name.split('/');
  for (let i = 1; i < split.length; i += 1) {
    const val = split[i];
    if (val.length === 0) {
      return 'Each sub-path must begin with a letter or number';
    }
  }

  // Checking if there is already that path created on the API
  if (paths.find(path => path.name === name)) {
    return 'Path name already exists';
  }

  // Create subpath from the beginning to find a match on existing paths
  const findSubPath = (path, subpath) => path.name === subpath;
  let subpath = '';
  split.forEach((sub) => {
    subpath = `${subpath}/${sub}`;
    const subpathFind = paths.find(path => findSubPath(path, subpath));
    if (subpathFind) {
      return `A different path already matches this sub-path: ${subpath}`;
    }
  });

  // Check if other paths are a subpath of the new path
  subpath = paths.find(path => path.name.indexOf(name) === 0);
  if (subpath) {
    return `An existing path already match with the one provided: ${subpath.name}`;
  }

  return err;
}

function findDependsOn(paths) {
  // go thru all paths and add lambdaFunctions to dependsOn and functionArns uniquely
  const dependsOn = [];
  const functionArns = [];
  paths.forEach((path) => {
    if (path.lambdaFunction && !path.lambdaArn) {
      if (!dependsOn.find(func => func.resourceName === path.lambdaFunction)) {
        dependsOn.push({
          category: 'function',
          resourceName: path.lambdaFunction,
          attributes: ['Name', 'Arn'],
        });
      }
    }
    if (!functionArns.find(func => func.lambdaFunction === path.lambdaFunction)) {
      functionArns.push({
        lambdaFunction: path.lambdaFunction,
        lambdaArn: path.lambdaArn,
      });
    }
  });
  return { dependsOn, functionArns };
}

function functionsExist(context) {
  if (!context.amplify.getProjectDetails().amplifyMeta.function) {
    return false;
  }

  const functionResources = context.amplify.getProjectDetails().amplifyMeta.function;
  const lambdaFunctions = [];
  Object.keys(functionResources).forEach((resourceName) => {
    if (functionResources[resourceName].service === 'Lambda') {
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
    case 'arn': return askLambdaArn(context, currentPath);
    case 'projectFunction': return askLambdaFromProject(context, currentPath);
    case 'newFunction': return newLambdaFunction(context, path);
    default: throw new Error('Type not supported');
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
    functionTemplate: 'serverless',
  };
  return add(context, 'awscloudformation', 'Lambda')
    .then((resourceName) => {
      context.print.success('Succesfully added the Lambda function locally');
      return { lambdaFunction: resourceName };
    });
}

async function askLambdaFromProject(context, currentPath) {
  const functionResources = context.amplify.getProjectDetails().amplifyMeta.function;
  const lambdaFunctions = [];
  Object.keys(functionResources).forEach((resourceName) => {
    if (functionResources[resourceName].service === 'Lambda') {
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
    default: (currentPath && currentPath.lambdaArn) ?
      `${currentPath.lambdaArn}` : `${lambdaOptions[0].value}`,
  };

  let lambdaOption;
  while (!lambdaOption) {
    try {
      lambdaOption = await inquirer.prompt([lambdaCloudOptionQuestion]);
    } catch (err) {
      context.print.error('Select a Lambda Function');
    }
  }

  const lambdaCloudOptionAnswer =
    lambdaFunctions.find(lambda => lambda.FunctionArn === lambdaOption.lambdaChoice);

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

  crudOptions.forEach((crudOption) => {
    switch (crudOption) {
      case 'create': actions.push(
        'apigateway:POST',
        'apigateway:PUT',
      );
        break;
      case 'update': actions.push('apigateway:PATCH');
        break;
      case 'read': actions.push(
        'apigateway:GET', 'apigateway:HEAD',
        'apigateway:OPTIONS',
      );
        break;
      case 'delete': actions.push('apigateway:DELETE');
        break;
      default: console.log(`${crudOption} not supported`);
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

  const attributes = ['ApiName'];

  return { policy, attributes };
}

module.exports = {
  serviceWalkthrough, updateWalkthrough, migrate, getIAMPolicies,
};
