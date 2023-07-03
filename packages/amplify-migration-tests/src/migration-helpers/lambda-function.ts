import { $TSAny } from '@aws-amplify/amplify-cli-core';
import {
  ExecutionContext,
  getBackendAmplifyMeta,
  getCLIPath,
  multiSelect,
  singleSelect,
  nspawn as spawn,
  loadFeatureFlags,
  moveUp,
  moveDown,
} from '@aws-amplify/amplify-e2e-core';
import _ from 'lodash';

type FunctionActions = 'create' | 'update';
type FunctionRuntimes = 'dotnet6' | 'go' | 'java' | 'nodejs' | 'python';
type FunctionCallback = (chain: $TSAny, cwd: string, settings: $TSAny) => $TSAny;

// runtimeChoices are shared between tests
export const runtimeChoices = ['.NET 6', 'Go', 'Java', 'NodeJS', 'Python'];

// templateChoices is per runtime
const dotNetTemplateChoices = [
  'CRUD function for DynamoDB (Integration with API Gateway)',
  'Hello World',
  'Serverless',
  'Trigger (DynamoDb, Kinesis)',
];

const goTemplateChoices = ['Hello World'];

const javaTemplateChoices = ['Hello World'];

const nodeJSTemplateChoices = [
  'AppSync - GraphQL API request (with IAM)',
  'CRUD function for DynamoDB (Integration with API Gateway)',
  'GraphQL Lambda Authorizer',
  'Hello World',
  'Lambda trigger',
  'Serverless ExpressJS function (Integration with API Gateway)',
];

const pythonTemplateChoices = ['Hello World'];

const crudOptions = ['create', 'read', 'update', 'delete'];

const appSyncOptions = ['Query', 'Mutation', 'Subscription'];

const additionalPermissions = (cwd: string, chain: ExecutionContext, settings: $TSAny) => {
  multiSelect(chain.wait('Select the categories you want this function to have access to'), settings.permissions, settings.choices);

  if (!settings.resources) {
    return;
  }

  if (settings.resourceChoices === undefined) {
    settings.resourceChoices = settings.resources;
  }
  // when single resource, it gets auto selected
  if (settings.resourceChoices.length > 1) {
    chain.wait('Select the one you would like your Lambda to access');
    if (settings.keepExistingResourceSelection) {
      chain.sendCarriageReturn();
    } else {
      multiSelect(chain, settings.resources, settings.resourceChoices);
    }
  }

  // n-resources repeated questions
  settings.resources.forEach((elem: string) => {
    const service = _.get(getBackendAmplifyMeta(cwd), ['api', elem, 'service']);
    const graphQlPermFF = !!_.get(loadFeatureFlags(cwd), ['features', 'appsync', 'generateGraphQlPermissions']);
    const isAppSyncApi = service === 'AppSync';
    const allChoices = isAppSyncApi && graphQlPermFF ? appSyncOptions : crudOptions;
    multiSelect(chain.wait(`Select the operations you want to permit on ${elem}`), settings.operations, allChoices);
  });
};

const updateFunctionCore = (cwd: string, chain: ExecutionContext, settings: CoreFunctionSettings) => {
  singleSelect(
    chain.wait('Which setting do you want to update?'),
    settings.additionalPermissions
      ? 'Resource access permissions'
      : settings.schedulePermissions
      ? 'Scheduled recurring invocation'
      : settings.layerOptions
      ? 'Lambda layers configuration'
      : settings.environmentVariables
      ? 'Environment variables configuration'
      : 'Secret values configuration',
    [
      'Resource access permissions',
      'Scheduled recurring invocation',
      'Lambda layers configuration',
      'Environment variables configuration',
      'Secret values configuration',
    ],
  );
  if (settings.additionalPermissions) {
    // update permissions
    additionalPermissions(cwd, chain, settings.additionalPermissions);
  }
  if (settings.schedulePermissions) {
    // update scheduling
    if (settings.schedulePermissions.noScheduleAdded) {
      chain.wait('Do you want to invoke this function on a recurring schedule?');
    } else {
      chain.wait(`Do you want to update or remove the function's schedule?`);
    }
    chain.sendConfirmYes();
    cronWalkthrough(chain, settings, settings.schedulePermissions.noScheduleAdded ? 'create' : 'update');
  }
  if (settings.layerOptions) {
    // update layers
    chain.wait('Do you want to enable Lambda layers for this function?');
    if (settings.layerOptions === undefined) {
      chain.sendConfirmNo();
    } else {
      chain.sendConfirmYes();
      addLayerWalkthrough(chain, settings.layerOptions);
    }
  }
  if (settings.secretsConfig) {
    if (settings.secretsConfig.operation === 'add') {
      throw new Error('Secrets update walkthrough only supports update and delete');
    }
    // this walkthrough assumes 1 existing secret is configured for the function
    const actions = ['Add a secret', 'Update a secret', 'Remove secrets', "I'm done"];
    const action = settings.secretsConfig.operation === 'delete' ? actions[2] : actions[1];
    chain.wait('What do you want to do?');
    singleSelect(chain, action, actions);
    switch (settings.secretsConfig.operation) {
      case 'delete': {
        chain.wait('Select the secrets to delete:');
        chain.sendLine(' '); // assumes one secret
        break;
      }
      case 'update': {
        chain.wait('Select the secret to update:');
        chain.sendCarriageReturn(); // assumes one secret
        chain.sendLine(settings.secretsConfig.value);
        break;
      }
    }
    chain.wait('What do you want to do?');
    chain.sendCarriageReturn(); // "I'm done"
  }
};

export type CoreFunctionSettings = {
  testingWithLatestCodebase?: boolean;
  name?: string;
  packageManager?: {
    name: string;
    command?: string;
  };
  functionTemplate?: string;
  expectFailure?: boolean;
  additionalPermissions?: $TSAny;
  schedulePermissions?: $TSAny;
  layerOptions?: LayerOptions;
  environmentVariables?: $TSAny;
  secretsConfig?: AddSecretInput | UpdateSecretInput | DeleteSecretInput;
  triggerType?: string;
  eventSource?: string;
};

const coreFunction = (
  cwd: string,
  settings: CoreFunctionSettings,
  action: FunctionActions,
  runtime: FunctionRuntimes,
  functionConfigCallback: FunctionCallback,
) => {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(settings.testingWithLatestCodebase), [action === 'update' ? 'update' : 'add', 'function'], {
      cwd,
      stripColors: true,
    });

    if (action === 'create') {
      chain
        .wait('Select which capability you want to add:')
        .sendCarriageReturn() // lambda function
        .wait('Provide an AWS Lambda function name:')
        .sendLine(settings.name || '');

      selectRuntime(chain, runtime);
      const templateChoices = getTemplateChoices(runtime);
      if (templateChoices.length > 1) {
        selectTemplate(chain, settings.functionTemplate, runtime);
      }
    } else {
      if (settings.layerOptions && settings.layerOptions.layerAndFunctionExist) {
        chain.wait('Select which capability you want to update:').sendCarriageReturn(); // lambda function
      }
      chain.wait('Select the Lambda function you want to update').sendCarriageReturn(); // assumes only one function configured in the project
    }

    if (functionConfigCallback) {
      functionConfigCallback(chain, cwd, settings);
    }

    if (settings.expectFailure) {
      runChain(chain, resolve, reject);
      return;
    }

    // advanced settings flow
    if (action === 'create') {
      chain.wait('Do you want to configure advanced settings?');

      if (
        settings.additionalPermissions ||
        settings.schedulePermissions ||
        settings.layerOptions ||
        settings.environmentVariables ||
        settings.secretsConfig
      ) {
        chain.sendConfirmYes().wait('Do you want to access other resources in this project from your Lambda function?');
        if (settings.additionalPermissions) {
          // other permissions flow
          chain.sendConfirmYes();
          additionalPermissions(cwd, chain, settings.additionalPermissions);
        } else {
          chain.sendConfirmNo();
        }

        //scheduling questions
        chain.wait('Do you want to invoke this function on a recurring schedule?');

        if (settings.schedulePermissions === undefined) {
          chain.sendConfirmNo();
        } else {
          chain.sendConfirmYes();
          cronWalkthrough(chain, settings, action);
        }

        // lambda layers question
        chain.wait('Do you want to enable Lambda layers for this function?');
        if (settings.layerOptions === undefined) {
          chain.sendConfirmNo();
        } else {
          chain.sendConfirmYes();
          addLayerWalkthrough(chain, settings.layerOptions);
        }

        // environment variable question
        chain.wait('Do you want to configure environment variables for this function?');
        if (settings.environmentVariables === undefined) {
          chain.sendConfirmNo();
        } else {
          chain.sendConfirmYes();
          addEnvVarWalkthrough(chain, settings.environmentVariables);
        }

        // secrets config
        chain.wait('Do you want to configure secret values this function can access?');
        if (settings.secretsConfig === undefined) {
          chain.sendConfirmNo();
        } else {
          if (settings.secretsConfig.operation !== 'add') {
            throw new Error('add walkthrough only supports add secrets operation');
          }
          chain.sendConfirmYes();
          addSecretWalkthrough(chain, settings.secretsConfig);
        }
      } else {
        chain.sendConfirmNo();
      }
    } else {
      updateFunctionCore(cwd, chain, settings);
    }

    // edit function question
    chain.wait('Do you want to edit the local lambda function now?').sendConfirmNo().sendEof();

    runChain(chain, resolve, reject);
  });
};

const runChain = (chain: ExecutionContext, resolve, reject) => {
  chain.run((err: Error) => {
    if (!err) {
      resolve();
    } else {
      reject(err);
    }
  });
};

export const addFunctionPreV12 = (
  cwd: string,
  settings: CoreFunctionSettings,
  runtime: FunctionRuntimes,
  functionConfigCallback: FunctionCallback = undefined,
) => {
  return coreFunction(cwd, settings, 'create', runtime, functionConfigCallback);
};

export const updateFunction = (cwd: string, settings: CoreFunctionSettings, runtime: FunctionRuntimes) => {
  return coreFunction(cwd, settings, 'update', runtime, undefined);
};

export const selectRuntime = (chain: ExecutionContext, runtime: FunctionRuntimes) => {
  const runtimeName = getRuntimeDisplayName(runtime);
  chain.wait('Choose the runtime that you want to use:');

  // reset cursor to top of list because node is default but it throws off offset calculations
  moveUp(chain, runtimeChoices.indexOf(getRuntimeDisplayName('nodejs')));

  singleSelect(chain, runtimeName, runtimeChoices);
};

export const selectTemplate = (chain: ExecutionContext, functionTemplate: string, runtime: FunctionRuntimes) => {
  const templateChoices = getTemplateChoices(runtime);
  chain.wait('Choose the function template that you want to use');

  // reset cursor to top of list because Hello World is default but it throws off offset calculations
  moveUp(chain, templateChoices.indexOf('Hello World'));

  singleSelect(chain, functionTemplate, templateChoices);
};

export interface LayerOptions {
  select?: string[]; // list options to select
  layerAndFunctionExist?: boolean; // whether this test involves both a function and a layer
  expectedListOptions?: string[]; // the expected list of all layers
  versions?: Record<string, { version: number; expectedVersionOptions: number[] }>; // map with keys for each element of select that determines the version and expected version for each layer
  customArns?: string[]; // external ARNs to enter
  skipLayerAssignment?: boolean; // true if the layer assignment must be left unchanged for the function, otherwise true
  layerWalkthrough?: (chain: ExecutionContext) => void; // If this function is provided the addLayerWalkthrough will invoke it instead of the standard one, suitable for full customization
}

const addLayerWalkthrough = (chain: ExecutionContext, options: LayerOptions) => {
  if (options.layerWalkthrough) {
    options.layerWalkthrough(chain);

    return;
  }

  chain.wait('Provide existing layers');

  const hasCustomArns = options.customArns && options.customArns.length > 0;

  // If no select passed in then it was called from update function probably and
  // there is a layer already assigned and no need to change
  if (options.skipLayerAssignment === true) {
    chain.sendCarriageReturn();
  } else {
    const prependedListOptions = ['Provide existing Lambda layer ARNs', ...options.expectedListOptions];
    const amendedSelection = [...options.select];

    if (hasCustomArns) {
      amendedSelection.unshift('Provide existing Lambda layer ARNs');
    }

    multiSelect(chain, amendedSelection, prependedListOptions);
  }

  // If no versions present in options, skip the version selection prompt
  if (options.versions) {
    options.select.forEach((selection) => {
      chain.wait(`Select a version for ${selection}`);

      singleSelect(chain, options.versions[selection].version.toString(), [
        'Always choose latest version',
        ...options.versions[selection].expectedVersionOptions.map((op) => op.toString()),
      ]);
    });
  }

  if (hasCustomArns) {
    chain.wait('existing Lambda layer ARNs (comma-separated)');
    chain.sendLine(options.customArns.join(', '));
  }

  // not going to attempt to automate the reorder thingy. For e2e tests we can just create the lambda layers in the order we want them
  const totalLength = hasCustomArns ? options.customArns.length : 0 + options.select.length;

  if (totalLength > 1) {
    chain.wait('Modify the layer order');
    chain.sendCarriageReturn();
  }
};

export type EnvVarInput = {
  key: string;
  value: string;
};

const addEnvVarWalkthrough = (chain: ExecutionContext, input: EnvVarInput) => {
  chain.wait('Enter the environment variable name:').sendLine(input.key);
  chain.wait('Enter the environment variable value:').sendLine(input.value);
  chain.wait("I'm done").sendCarriageReturn();
};

export type AddSecretInput = {
  operation: 'add';
  name: string;
  value: string;
};

export type DeleteSecretInput = {
  operation: 'delete';
  name: string;
};

export type UpdateSecretInput = {
  operation: 'update';
  name: string;
  value: string;
};

const addSecretWalkthrough = (chain: ExecutionContext, input: AddSecretInput) => {
  chain.wait('Enter a secret name');
  chain.sendLine(input.name);
  chain.wait(`Enter the value for`);
  chain.sendLine(input.value);
  chain.wait("I'm done").sendCarriageReturn();
};

const cronWalkthrough = (chain: ExecutionContext, settings: $TSAny, action: string) => {
  if (action === 'create') {
    addCron(chain, settings);
  } else {
    chain.wait('Select from the following options:');

    switch (settings.schedulePermissions.action) {
      case 'Update the schedule':
        chain.sendCarriageReturn();
        addCron(chain, settings);
        break;
      case 'Remove the schedule':
        moveDown(chain, 1).sendCarriageReturn();
        break;
      default:
        chain.sendCarriageReturn();
        break;
    }
  }

  return chain;
};

const addMinutes = (chain: ExecutionContext) => {
  chain.wait('Enter rate for minutes(1-59)?').sendLine('5').sendCarriageReturn();
  return chain;
};

const addHourly = (chain: ExecutionContext) => {
  chain.wait('Enter rate for hours(1-23)?').sendLine('5').sendCarriageReturn();
  return chain;
};

const addWeekly = (chain: ExecutionContext) => {
  chain
    .wait('Select the day to invoke the function:')
    .sendCarriageReturn()
    .wait('Select the start time in UTC (use arrow keys):')
    .sendCarriageReturn();
  return chain;
};

const addMonthly = (chain: ExecutionContext) => {
  chain.wait('Select date to start cron').sendCarriageReturn();
  return chain;
};

const addYearly = (chain: ExecutionContext) => {
  chain.wait('Select date to start cron').sendCarriageReturn();
  return chain;
};

const addCron = (chain: ExecutionContext, settings: $TSAny) => {
  chain.wait('At which interval should the function be invoked:');

  switch (settings.schedulePermissions.interval) {
    case 'Minutes':
      addMinutes(chain);
      break;
    case 'Hourly':
      addHourly(moveDown(chain, 1).sendCarriageReturn());
      break;
    case 'Daily':
      moveDown(chain, 2).sendCarriageReturn().wait('Select the start time in UTC (use arrow keys):').sendCarriageReturn();
      break;
    case 'Weekly':
      addWeekly(moveDown(chain, 3).sendCarriageReturn());
      break;
    case 'Monthly':
      addMonthly(moveDown(chain, 4).sendCarriageReturn());
      break;
    case 'Yearly':
      addYearly(moveDown(chain, 5).sendCarriageReturn());
      break;
    case 'Custom AWS cron expression':
      moveDown(chain, 6).sendCarriageReturn();
      break;
    default:
      chain.sendCarriageReturn();
      break;
  }

  return chain;
};

const getTemplateChoices = (runtime: FunctionRuntimes) => {
  switch (runtime) {
    case 'dotnet6':
      return dotNetTemplateChoices;
    case 'go':
      return goTemplateChoices;
    case 'java':
      return javaTemplateChoices;
    case 'nodejs':
      return nodeJSTemplateChoices;
    case 'python':
      return pythonTemplateChoices;
    default:
      throw new Error(`Invalid runtime value: ${runtime}`);
  }
};

const getRuntimeDisplayName = (runtime: FunctionRuntimes) => {
  switch (runtime) {
    case 'dotnet6':
      return '.NET 6';
    case 'go':
      return 'Go';
    case 'java':
      return 'Java';
    case 'nodejs':
      return 'NodeJS';
    case 'python':
      return 'Python';
    default:
      throw new Error(`Invalid runtime value: ${runtime}`);
  }
};
