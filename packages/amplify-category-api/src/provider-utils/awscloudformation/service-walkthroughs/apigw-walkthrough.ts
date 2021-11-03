import {
  $TSAny,
  $TSContext,
  $TSObject,
  AmplifyCategories,
  AmplifySupportedService,
  exitOnNextTick,
  isResourceNameUnique,
  open,
  pathManager,
  ResourceDoesNotExistError,
  stateManager,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import inquirer from 'inquirer';
import os from 'os';
import { v4 as uuid } from 'uuid';
import { ApigwInputState } from '../apigw-input-state';
import { CrudOperation, PermissionSetting } from '../cdk-stack-builder';
import { getAllDefaults } from '../default-values/apigw-defaults';
import { ApigwAnswers, ApigwPath, ApigwWalkthroughReturnPromise, ApiRequirements } from '../service-walkthrough-types/apigw-types';
import { checkForPathOverlap, formatCFNPathParamsForExpressJs, validatePathName } from '../utils/rest-api-path-utils';

const category = AmplifyCategories.API;
const serviceName = AmplifySupportedService.APIGW;
const elasticContainerServiceName = 'ElasticContainer';

export async function serviceWalkthrough(context: $TSContext): ApigwWalkthroughReturnPromise {
  const allDefaultValues = getAllDefaults(context.amplify.getProjectDetails());

  const resourceName = await askApiName(context, allDefaultValues.resourceName);
  const answers = { paths: {}, resourceName, dependsOn: undefined };

  return pathFlow(context, answers);
}

export async function updateWalkthrough(context: $TSContext) {
  const { allResources } = await context.amplify.getResourceStatus();
  const allDefaultValues = getAllDefaults(context.amplify.getProjectDetails());
  const resources = allResources
    .filter(resource => resource.service === serviceName && resource.mobileHubMigrated !== true)
    .map(resource => resource.resourceName);

  if (resources.length === 0) {
    const errMessage = 'No REST API resource to update. Use "amplify add api" command to create a new REST API';
    printer.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return;
  }

  let answers: $TSAny = {
    paths: [],
  };

  const selectedApiName = await prompter.pick<'one', string>('Select the REST API you want to update:', resources);
  let updateApiOperation = await prompter.pick<'one', string>('What would you like to do?', [
    { name: 'Add another path', value: 'add' },
    { name: 'Update path', value: 'update' },
    { name: 'Remove path', value: 'remove' },
  ]);

  // Inquirer does not currently support combining 'when' and 'default', so
  // manually set the operation if the user ended up here via amplify api add.
  if (context.input.command === 'add') {
    updateApiOperation = 'add';
  }

  if (selectedApiName === 'AdminQueries') {
    const errMessage = `The Admin Queries API is maintained through the Auth category and should be updated using 'amplify update auth' command`;
    printer.warn(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
  }

  const projRoot = pathManager.findProjectRoot();
  if (!stateManager.resourceInputsJsonExists(projRoot, category, selectedApiName)) {
    // Not yet migrated
    console.log(selectedApiName);
    await migrate(context, projRoot, selectedApiName);
  }

  const parameters = stateManager.getResourceInputsJson(projRoot, category, selectedApiName);
  parameters.resourceName = selectedApiName;

  Object.assign(allDefaultValues, parameters);
  answers = { ...answers, ...parameters };
  [answers.uuid] = uuid().split('-');
  const pathNames = Object.keys(answers.paths);
  let updatedResult = {};

  switch (updateApiOperation) {
    case 'add': {
      updatedResult = pathFlow(context, answers);
      break;
    }
    case 'remove': {
      const pathToRemove = await inquirer.prompt({
        name: 'path',
        message: 'Select the path you would want to remove',
        type: 'list',
        choices: pathNames,
      });

      delete answers.paths[pathToRemove.path];

      const { dependsOn, functionArns } = await findDependsOn(answers.paths);
      answers.dependsOn = dependsOn;
      answers.functionArns = functionArns;

      updatedResult = { answers };
      break;
    }
    case 'update': {
      const pathToEdit = await inquirer.prompt({
        name: 'pathName',
        message: 'Select the path you would want to edit',
        type: 'list',
        choices: pathNames,
      });

      // removing path from paths list
      const currentPath: ApigwPath = answers.paths[pathToEdit.pathName];
      delete answers.paths[pathToEdit.pathName];

      updatedResult = pathFlow(context, answers, currentPath);
      break;
    }
    default: {
      throw new Error(`Unrecognized API update operation "${updateApiOperation}"`);
    }
  }

  return updatedResult;
}

async function pathFlow(context: $TSContext, answers: ApigwAnswers, currentPath?: ApigwPath): ApigwWalkthroughReturnPromise {
  const pathsAnswer = await askPaths(context, answers, currentPath);

  return { answers: pathsAnswer };
}

async function askApiName(context: $TSContext, defaultResourceName: string) {
  const apiNameValidator = (input: string) => {
    const amplifyValidatorOutput = context.amplify.inputValidation({
      validation: {
        operator: 'regex',
        value: '^[a-zA-Z0-9]+$',
        onErrorMsg: 'Resource name should be alphanumeric',
      },
      required: true,
    })(input);

    let uniqueCheck = false;
    try {
      uniqueCheck = isResourceNameUnique(category, input);
    } catch (e) {
      return e.message || e;
    }
    return typeof amplifyValidatorOutput === 'string' ? amplifyValidatorOutput : uniqueCheck;
  };

  const resourceName = await prompter.input<'one', string>(
    'Provide a friendly name for your resource to be used as a label for this category in the project:',
    { initial: defaultResourceName, validate: apiNameValidator },
  );

  return resourceName;
}

async function askPermissions(
  context: $TSContext,
  answers: $TSObject,
  currentPath: ApigwPath,
): Promise<{ setting?: PermissionSetting; auth?: CrudOperation[]; open?: boolean; userPoolGroups?: $TSObject; unauth?: CrudOperation[] }> {
  while (true) {
    const apiAccess = await prompter.yesOrNo('Restrict API access', currentPath?.permissions?.setting !== PermissionSetting.OPEN);

    if (!apiAccess) {
      return { setting: PermissionSetting.OPEN };
    }

    const userPoolGroupList = context.amplify.getUserPoolGroupList();

    let permissionSelected = 'Auth/Guest Users';
    const permissions: $TSAny = {};

    if (userPoolGroupList.length > 0) {
      do {
        if (permissionSelected === 'Learn more') {
          printer.blankLine();
          printer.info(
            'You can restrict access using CRUD policies for Authenticated Users, Guest Users, or on individual Group that users belong to' +
              ' in a User Pool. If a user logs into your application and is not a member of any group they will use policy set for ' +
              '“Authenticated Users”, however if they belong to a group they will only get the policy associated with that specific group.',
          );
          printer.blankLine();
        }
        const permissionSelection = await prompter.pick<'one', string>('Restrict access by?', [
          'Auth/Guest Users',
          'Individual Groups',
          'Both',
          'Learn more',
        ]);

        permissionSelected = permissionSelection;
      } while (permissionSelected === 'Learn more');
    }

    if (permissionSelected === 'Both' || permissionSelected === 'Auth/Guest Users') {
      const permissionSetting = await prompter.pick<'one', string>(
        'Who should have access?',
        [
          {
            name: 'Authenticated users only',
            value: PermissionSetting.PRIVATE,
          },
          {
            name: 'Authenticated and Guest users',
            value: PermissionSetting.PROTECTED,
          },
        ],
        { initial: currentPath?.permissions?.setting === PermissionSetting.PROTECTED ? 1 : 0 },
      );

      permissions.setting = permissionSetting;

      let {
        permissions: { auth: authPermissions },
      } = currentPath || { permissions: { auth: [] } };
      let {
        permissions: { unauth: unauthPermissions },
      } = currentPath || { permissions: { unauth: [] } };

      if (permissionSetting === PermissionSetting.PRIVATE) {
        permissions.auth = await askCRUD('Authenticated', authPermissions);

        const apiRequirements: ApiRequirements = { authSelections: 'identityPoolAndUserPool' };

        await ensureAuth(context, apiRequirements, answers.resourceName);
      }

      if (permissionSetting === PermissionSetting.PROTECTED) {
        permissions.auth = await askCRUD('Authenticated', authPermissions);
        permissions.unauth = await askCRUD('Guest', unauthPermissions);
        const apiRequirements: ApiRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities: true };

        await ensureAuth(context, apiRequirements, answers.resourceName);
      }
    }

    if (permissionSelected === 'Both' || permissionSelected === 'Individual Groups') {
      // Enable Auth if not enabled

      const apiRequirements: ApiRequirements = { authSelections: 'identityPoolAndUserPool' };

      await ensureAuth(context, apiRequirements, answers.resourceName);

      // Get Auth resource name
      const authResourceName = getAuthResourceName();
      answers.authResourceName = authResourceName;

      let defaultSelectedGroups = [];

      if (currentPath?.permissions?.userPoolGroups) {
        defaultSelectedGroups = Object.keys(currentPath.permissions.userPoolGroups);
      }

      const userPoolGroupSelection = await inquirer.prompt({
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
      });

      const selectedUserPoolGroupList = userPoolGroupSelection.userpoolGroups;

      for (const selectedUserPoolGroup of selectedUserPoolGroupList) {
        let defaults = [];
        if (currentPath?.permissions?.userPoolGroups?.[selectedUserPoolGroup]) {
          defaults = currentPath.permissions.userPoolGroups[selectedUserPoolGroup];
        }
        if (!permissions.userPoolGroups) {
          permissions.userPoolGroups = {};
        }
        permissions.userPoolGroups[selectedUserPoolGroup] = await askCRUD(selectedUserPoolGroup, defaults);
      }
    }
    return permissions;
  }
}

async function ensureAuth(context: $TSContext, apiRequirements: ApiRequirements, resourceName: string) {
  const checkResult: $TSAny = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
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
    printer.warn(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    try {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
        context,
        AmplifyCategories.API,
        resourceName,
        apiRequirements,
      ]);
    } catch (error) {
      printer.error(error);
      throw error;
    }
  }
}

async function askCRUD(userType: string, permissions: string[] = []) {
  const crudOptions = ['create', 'read', 'update', 'delete'];
  const crudAnswers = await prompter.pick<'many', string>(`What permissions do you want to grant to ${userType}`, crudOptions, {
    returnSize: 'many',
    initial: permissions.map(p => crudOptions.indexOf(p)),
  });

  return crudAnswers;
}

async function askPaths(context: $TSContext, answers: $TSObject, currentPath: ApigwPath): Promise<ApigwAnswers> {
  const existingFunctions = functionsExist();

  let defaultFunctionType = 'newFunction';
  const defaultChoice = {
    name: 'Create a new Lambda function',
    value: defaultFunctionType,
  };
  const choices = [defaultChoice];

  if (existingFunctions) {
    choices.push({
      name: 'Use a Lambda function already added in the current Amplify project',
      value: 'projectFunction',
    });
  }

  const paths = answers.paths;

  let addAnotherPath: boolean;
  do {
    let pathName: string;
    let isPathValid: boolean;
    do {
      pathName = await prompter.input('Provide a path (e.g., /book/{isbn}):', {
        initial: currentPath ? currentPath.name : '/items',
        validate: validatePathName,
      });

      const overlapCheckResult = checkForPathOverlap(pathName, Object.keys(paths));
      if (overlapCheckResult === false) {
        // The path provided by the user is valid, and doesn't overlap with any other endpoints that they've stood up with API Gateway.
        isPathValid = true;
      } else {
        // The path provided by the user overlaps with another endpoint that they've stood up with API Gateway.
        // Ask them if they're okay with this. If they are, then we'll consider their provided path to be valid.
        const higherOrderPath = overlapCheckResult.higherOrderPath;
        const lowerOrderPath = overlapCheckResult.lowerOrderPath;

        isPathValid = await prompter.confirmContinue(
          `The path ${lowerOrderPath} overlaps with ${higherOrderPath}. Users authorized to access ${higherOrderPath} will also have access` +
            ` to ${lowerOrderPath}. Are you sure you want to continue?`,
        );
      }
    } while (!isPathValid);

    const functionType = await prompter.pick<'one', string>('Choose a Lambda source', choices, { initial: choices.indexOf(defaultChoice) });

    let path = { name: pathName };
    let lambda;
    do {
      lambda = await askLambdaSource(context, functionType, pathName, currentPath);
    } while (!lambda);
    const permissions = await askPermissions(context, answers, currentPath);
    path = { ...path, ...lambda, permissions };
    paths[pathName] = path;

    if (currentPath) {
      break;
    }

    addAnotherPath = await prompter.confirmContinue('Do you want to add another path?');
  } while (addAnotherPath);

  const { dependsOn, functionArns } = await findDependsOn(paths);

  return { paths, dependsOn, resourceName: answers.resourceName, functionArns };
}

async function findDependsOn(paths: $TSObject[]) {
  // go thru all paths and add lambdaFunctions to dependsOn and functionArns uniquely
  const dependsOn = [];
  const functionArns = [];

  for (const path of Object.values(paths)) {
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
    if (path?.permissions?.userPoolGroups) {
      const userPoolGroups = Object.keys(path.privacy.userPoolGroups);
      if (userPoolGroups.length > 0) {
        // Get auth resource name

        const authResourceName = getAuthResourceName();

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

function getAuthResourceName(): string {
  const meta = stateManager.getMeta();
  const authResources = (meta?.auth || []).filter(resource => resource.service === AmplifySupportedService.COGNITO);
  if (authResources.length === 0) {
    throw new Error('No auth resource found. Add it using amplify add auth');
  }

  const authResourceName = authResources[0].resourceName;
  return authResourceName;
}

function functionsExist() {
  const meta = stateManager.getMeta();
  if (!meta.function) {
    return false;
  }

  const functionResources = meta.function;
  const lambdaFunctions = [];
  Object.keys(functionResources).forEach(resourceName => {
    if (functionResources[resourceName].service === AmplifySupportedService.LAMBDA) {
      lambdaFunctions.push(resourceName);
    }
  });

  if (lambdaFunctions.length === 0) {
    return false;
  }

  return true;
}

async function askLambdaSource(context: $TSContext, functionType: string, path: string, currentPath: ApigwPath) {
  switch (functionType) {
    case 'arn':
      return askLambdaArn(context, currentPath);
    case 'projectFunction':
      return askLambdaFromProject(currentPath);
    case 'newFunction':
      return newLambdaFunction(context as $TSAny, path);
    default:
      throw new Error('Type not supported');
  }
}

async function newLambdaFunction(context: $TSContext, path: string) {
  let params = {
    functionTemplate: {
      parameters: {
        path,
        expressPath: formatCFNPathParamsForExpressJs(path),
      },
    },
  };

  const resourceName = await context.amplify.invokePluginMethod(context, AmplifyCategories.FUNCTION, undefined, 'add', [
    context,
    'awscloudformation',
    AmplifySupportedService.LAMBDA,
    params,
  ]);

  printer.success('Succesfully added the Lambda function locally');

  return { lambdaFunction: resourceName };
}

async function askLambdaFromProject(currentPath?: ApigwPath) {
  const meta = stateManager.getMeta();
  const lambdaFunctions = [];
  Object.keys(meta?.function || {}).forEach(resourceName => {
    if (meta.function[resourceName].service === AmplifySupportedService.LAMBDA) {
      lambdaFunctions.push(resourceName);
    }
  });

  const lambdaFunction = await prompter.pick<'one', string>('Choose the Lambda function to invoke by this path', lambdaFunctions, {
    initial: currentPath ? lambdaFunctions.indexOf(currentPath.lambdaFunction) : 0,
  });

  return { lambdaFunction };
}

async function askLambdaArn(context: $TSContext, currentPath?: ApigwPath) {
  const lambdaFunctions = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getLambdaFunctions');

  const lambdaOptions = lambdaFunctions.map(lambdaFunction => ({
    value: lambdaFunction.FunctionArn,
    name: `${lambdaFunction.FunctionName} (${lambdaFunction.FunctionArn})`,
  }));

  if (lambdaOptions.length === 0) {
    printer.error('You do not have any Lambda functions configured for the selected Region');
    return null;
  }

  const lambdaCloudOptionQuestion = {
    type: 'list',
    name: 'lambdaChoice',
    message: 'Select a Lambda function',
    choices: lambdaOptions,
    default: currentPath && currentPath.lambdaFunction ? `${currentPath.lambdaFunction}` : `${lambdaOptions[0].value}`,
  };

  let lambdaOption;
  while (!lambdaOption) {
    try {
      lambdaOption = await inquirer.prompt([lambdaCloudOptionQuestion]);
    } catch (err) {
      printer.error('Select a Lambda Function');
    }
  }

  const lambdaCloudOptionAnswer = lambdaFunctions.find(lambda => lambda.FunctionArn === lambdaOption.lambdaChoice);

  return {
    lambdaArn: lambdaCloudOptionAnswer.FunctionArn,
    lambdaFunction: lambdaCloudOptionAnswer.FunctionName,
  };
}

export async function migrate(context: $TSContext, projectPath: string, resourceName: string) {
  const apigwInputState = ApigwInputState.getInstance(context, resourceName);
  return apigwInputState.migrateApigwResource(resourceName);
}

export function getIAMPolicies(resourceName: string, crudOptions: string[]) {
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
        printer.info(`${crudOption} not supported`);
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

export const openConsole = async (context?: $TSContext) => {
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
      selectedApi = await prompter.pick<'one', string>('Select the API', restApis);
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

      const selectedConsole = await prompter.pick<'one', string>('Which console you want to open', [
        {
          name: 'Elastic Container Service (Deployed container status)',
          value: elasticContainer,
        },
        {
          name: 'CodePipeline (Container build status)',
          value: codePipeline,
        },
      ]);

      if (selectedConsole === elasticContainer) {
        url = `https://console.aws.amazon.com/ecs/home?region=${Region}#/clusters/${ClusterName}/services/${ServiceName}/details`;
      } else if (selectedConsole === codePipeline) {
        url = `https://${Region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${PipelineName}/view`;
      } else {
        printer.error('Option not available');
        return;
      }
    }

    open(url, { wait: false });
  } else {
    printer.error('There are no REST APIs pushed to the cloud');
  }
};
