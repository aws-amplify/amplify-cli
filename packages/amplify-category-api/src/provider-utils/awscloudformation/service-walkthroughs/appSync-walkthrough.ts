import { ListQuestion, CheckboxQuestion, ListChoiceOptions } from 'inquirer';
import { dataStoreLearnMore } from '../sync-conflict-handler-assets/syncAssets';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { rootAssetDir } from '../aws-constants';
import { collectDirectivesByTypeNames, readProjectConfiguration, ConflictHandlerType } from 'graphql-transformer-core';
import { category } from '../../../category-constants';
import { UpdateApiRequest } from '../../../../../amplify-headless-interface/lib/interface/api/update';
import { authConfigToAppSyncAuthType } from '../utils/auth-config-to-app-sync-auth-type-bi-di-mapper';
import { resolverConfigToConflictResolution } from '../utils/resolver-config-to-conflict-resolution-bi-di-mapper';
import _ from 'lodash';
import { getAppSyncAuthConfig, checkIfAuthExists, authConfigHasApiKey } from '../utils/amplify-meta-utils';
import {
  ResourceAlreadyExistsError,
  ResourceDoesNotExistError,
  UnknownResourceTypeError,
  exitOnNextTick,
  stateManager,
  FeatureFlags,
  $TSContext,
  open,
} from 'amplify-cli-core';

const serviceName = 'AppSync';
const elasticContainerServiceName = 'ElasticContainer';
const providerName = 'awscloudformation';
const graphqlSchemaDir = path.join(rootAssetDir, 'graphql-schemas');

const authProviderChoices = [
  {
    name: 'API key',
    value: 'API_KEY',
  },
  {
    name: 'Amazon Cognito User Pool',
    value: 'AMAZON_COGNITO_USER_POOLS',
  },
  {
    name: 'IAM',
    value: 'AWS_IAM',
  },
  {
    name: 'OpenID Connect',
    value: 'OPENID_CONNECT',
  },
];

export const openConsole = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const categoryAmplifyMeta = amplifyMeta[category];
  const { Region } = amplifyMeta.providers[providerName];

  const graphQLApis = Object.keys(categoryAmplifyMeta).filter(resourceName => {
    const resource = categoryAmplifyMeta[resourceName];

    return (
      resource.output &&
      (resource.service === serviceName || (resource.service === elasticContainerServiceName && resource.apiType === 'GRAPHQL'))
    );
  });

  if (graphQLApis) {
    let url;
    let selectedApi = graphQLApis[0];

    if (graphQLApis.length > 1) {
      ({ selectedApi } = await inquirer.prompt({
        type: 'list',
        name: 'selectedApi',
        choices: graphQLApis,
        message: 'Please select the API',
      }));
    }

    const selectedResource = categoryAmplifyMeta[selectedApi];

    if (selectedResource.service === serviceName) {
      const {
        output: { GraphQLAPIIdOutput },
      } = selectedResource;
      const appId = amplifyMeta.providers[providerName].AmplifyAppId;
      if (!appId) {
        throw new Error('Missing AmplifyAppId in amplify-meta.json');
      }

      url = `https://console.aws.amazon.com/appsync/home?region=${Region}#/${GraphQLAPIIdOutput}/v1/queries`;

      const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
      const { isAdminApp, region } = await providerPlugin.isAmplifyAdminApp(appId);
      if (isAdminApp) {
        if (region !== Region) {
          context.print.warning(`Region mismatch: Amplify service returned '${region}', but found '${Region}' in amplify-meta.json.`);
        }
        const { envName } = context.amplify.getEnvInfo();
        const baseUrl: string = providerPlugin.adminBackendMap[region].amplifyAdminUrl;
        url = `${baseUrl}/admin/${appId}/${envName}/datastore`;
      }
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
    context.print.error('AppSync API is not pushed in the cloud.');
  }
};

export const serviceWalkthrough = async (context: $TSContext, defaultValuesFilename, serviceMetadata) => {
  const resourceName = resourceAlreadyExists(context);
  let authConfig;
  let defaultAuthType;
  let resolverConfig;

  if (resourceName) {
    const errMessage =
      'You already have an AppSync API in your project. Use the "amplify update api" command to update your existing AppSync API.';
    context.print.warning(errMessage);
    await context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
    exitOnNextTick(0);
  }

  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  const resourceQuestions = [
    {
      type: inputs[1].type,
      name: inputs[1].key,
      message: inputs[1].question,
      validate: amplify.inputValidation(inputs[1]),
      default: () => {
        const defaultValue = allDefaultValues[inputs[1].key];
        return defaultValue;
      },
    },
  ];

  // API name question

  const resourceAnswers = await inquirer.prompt(resourceQuestions);
  resourceAnswers[inputs[0].key] = resourceAnswers[inputs[1].key];

  // Ask additonal questions

  ({ authConfig, defaultAuthType } = await askDefaultAuthQuestion(context));
  ({ authConfig, resolverConfig } = await askAdditionalQuestions(context, authConfig, defaultAuthType));

  // Ask schema file question

  const schemaFileQuestion = {
    type: inputs[2].type,
    name: inputs[2].key,
    message: inputs[2].question,
    validate: amplify.inputValidation(inputs[2]),
    default: () => {
      const defaultValue = allDefaultValues[inputs[2].key];
      return defaultValue;
    },
  };

  const schemaFileAnswer = await inquirer.prompt(schemaFileQuestion);

  let schemaContent = '';
  let askToEdit = true;
  if (schemaFileAnswer[inputs[2].key]) {
    // User has an annotated schema file
    const filePathQuestion = {
      type: inputs[3].type,
      name: inputs[3].key,
      message: inputs[3].question,
      validate: amplify.inputValidation(inputs[3]),
    };
    const { schemaFilePath } = await inquirer.prompt(filePathQuestion);
    schemaContent = fs.readFileSync(schemaFilePath, 'utf8');
    askToEdit = false;
  } else {
    // Schema template selection
    const templateSelectionQuestion = {
      type: inputs[4].type,
      name: inputs[4].key,
      message: inputs[4].question,
      choices: inputs[4].options.filter(templateSchemaFilter(authConfig)),
      validate: amplify.inputValidation(inputs[4]),
    };

    const { templateSelection } = await inquirer.prompt(templateSelectionQuestion);
    const schemaFilePath = path.join(graphqlSchemaDir, templateSelection);
    schemaContent = fs.readFileSync(schemaFilePath, 'utf8');
  }

  return {
    answers: resourceAnswers,
    output: {
      authConfig,
    },
    noCfnFile: true,
    resolverConfig,
    schemaContent,
    askToEdit,
  };
};

export const updateWalkthrough = async (context): Promise<UpdateApiRequest> => {
  const { allResources } = await context.amplify.getResourceStatus();
  let resourceDir;
  let resourceName;
  let authConfig;
  let defaultAuthType;
  const resources = allResources.filter(resource => resource.service === 'AppSync');

  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    if (resource.providerPlugin !== providerName) {
      // TODO: Move message string to seperate file
      throw new Error(
        `The selected resource is not managed using AWS Cloudformation. Please use the AWS AppSync Console to make updates to your API - ${resource.resourceName}`,
      );
    }
    ({ resourceName } = resource);
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
  } else {
    const errMessage = 'No AppSync resource to update. Use the "amplify add api" command to update your existing AppSync API.';
    context.print.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
  }

  // Get models
  const project = await readProjectConfiguration(resourceDir);
  let resolverConfig = project.config.ResolverConfig;

  // Check for common errors
  const directiveMap = collectDirectivesByTypeNames(project.schema);
  let modelTypes = [];

  if (directiveMap.types) {
    Object.keys(directiveMap.types).forEach(type => {
      if (directiveMap.types[type].includes('model')) {
        modelTypes.push(type);
      }
    });
  }
  const updateChoices = [
    {
      name: 'Walkthrough all configurations',
      value: 'all',
    },
    {
      name: 'Update auth settings',
      value: 'authUpdate',
    },
  ];
  // check if DataStore is enabled for the entire API
  if (project.config && !_.isEmpty(project.config.ResolverConfig)) {
    updateChoices.push({ name: 'Disable DataStore for entire API', value: 'disableDatastore' });
  } else {
    updateChoices.push({ name: 'Enable DataStore for entire API', value: 'enableDatastore' });
  }

  const updateOptionQuestion = {
    type: 'list',
    name: 'updateOption',
    message: 'Select from the options below',
    choices: updateChoices,
  };

  const { updateOption } = await inquirer.prompt([updateOptionQuestion]);

  if (updateOption === 'enableDatastore') {
    resolverConfig = {
      project: { ConflictHandler: ConflictHandlerType.AUTOMERGE, ConflictDetection: 'VERSION' },
    };
  } else if (updateOption === 'disableDatastore') {
    resolverConfig = {};
  } else if (updateOption === 'authUpdate') {
    ({ authConfig, defaultAuthType } = await askDefaultAuthQuestion(context));
    authConfig = await askAdditionalAuthQuestions(context, authConfig, defaultAuthType);
  } else if (updateOption === 'all') {
    ({ authConfig, defaultAuthType } = await askDefaultAuthQuestion(context));
    ({ authConfig, resolverConfig } = await askAdditionalQuestions(context, authConfig, defaultAuthType, modelTypes));
  }

  return {
    version: 1,
    serviceModification: {
      serviceName: 'AppSync',
      defaultAuthType: authConfigToAppSyncAuthType(authConfig ? authConfig.defaultAuthentication : undefined),
      additionalAuthTypes:
        authConfig && authConfig.additionalAuthenticationProviders
          ? authConfig.additionalAuthenticationProviders.map(authConfigToAppSyncAuthType)
          : undefined,
      conflictResolution: resolverConfigToConflictResolution(resolverConfig),
    },
  };
};

async function askAdditionalQuestions(context, authConfig, defaultAuthType, modelTypes?) {
  let resolverConfig;

  const advancedSettingsQuestion = {
    type: 'list',
    name: 'advancedSettings',
    message: 'Do you want to configure advanced settings for the GraphQL API',
    choices: [
      {
        name: 'No, I am done.',
        value: false,
      },
      {
        name: 'Yes, I want to make some additional changes.',
        value: true,
      },
    ],
  };

  const advancedSettingsAnswer = await inquirer.prompt([advancedSettingsQuestion]);

  if (advancedSettingsAnswer.advancedSettings) {
    authConfig = await askAdditionalAuthQuestions(context, authConfig, defaultAuthType);
    resolverConfig = await askResolverConflictQuestion(context, modelTypes);
  }

  return { authConfig, resolverConfig };
}

async function askResolverConflictQuestion(context, modelTypes?) {
  let resolverConfig: any = {};

  if (await context.prompt.confirm('Enable conflict detection?')) {
    const askConflictResolutionStrategy = async msg => {
      let conflictResolutionStrategy;

      do {
        const conflictResolutionQuestion: ListQuestion = {
          type: 'list',
          name: 'conflictResolutionStrategy',
          message: msg,
          default: 'AUTOMERGE',
          choices: [
            {
              name: 'Auto Merge',
              value: 'AUTOMERGE',
            },
            {
              name: 'Optimistic Concurrency',
              value: 'OPTIMISTIC_CONCURRENCY',
            },
            {
              name: 'Custom Lambda',
              value: 'LAMBDA',
            },
            {
              name: 'Learn More',
              value: 'Learn More',
            },
          ],
        };
        if (conflictResolutionStrategy === 'Learn More') {
          conflictResolutionQuestion.prefix = dataStoreLearnMore;
        }
        ({ conflictResolutionStrategy } = await inquirer.prompt([conflictResolutionQuestion]));
      } while (conflictResolutionStrategy === 'Learn More');

      let syncConfig: any = {
        ConflictHandler: conflictResolutionStrategy,
        ConflictDetection: 'VERSION',
      };

      if (conflictResolutionStrategy === 'LAMBDA') {
        const { newFunction, lambdaFunctionName } = await askSyncFunctionQuestion(context);
        syncConfig.LambdaConflictHandler = {
          name: lambdaFunctionName,
          new: newFunction,
        };
      }

      return syncConfig;
    };

    resolverConfig.project = await askConflictResolutionStrategy('Select the default resolution strategy');

    // Ask for per-model resolver override setting

    if (modelTypes && modelTypes.length > 0) {
      if (await context.prompt.confirm('Do you want to override default per model settings?', false)) {
        const modelTypeQuestion = {
          type: 'checkbox',
          name: 'selectedModelTypes',
          message: 'Select the models from below:',
          choices: modelTypes,
        };

        const { selectedModelTypes } = await inquirer.prompt([modelTypeQuestion]);

        if (selectedModelTypes.length > 0) {
          resolverConfig.models = {};
          for (let i = 0; i < selectedModelTypes.length; i += 1) {
            resolverConfig.models[selectedModelTypes[i]] = await askConflictResolutionStrategy(
              `Select the resolution strategy for ${selectedModelTypes[i]} model`,
            );
          }
        }
      }
    }
  }

  return resolverConfig;
}

async function askSyncFunctionQuestion(context) {
  const syncLambdaQuestion = {
    type: 'list',
    name: 'syncLambdaAnswer',
    message: 'Select from the options below',
    choices: [
      {
        name: 'Create a new Lambda Function',
        value: 'NEW',
      },
      {
        name: 'Existing Lambda Function',
        value: 'EXISTING',
      },
    ],
  };

  const { syncLambdaAnswer } = await inquirer.prompt([syncLambdaQuestion]);

  let lambdaFunctionName;
  const newFunction = syncLambdaAnswer === 'NEW';

  if (!newFunction) {
    const syncLambdaNameQuestion = {
      type: 'input',
      name: 'lambdaFunctionName',
      message: 'Enter lambda function name',
      validate: val => !!val,
    };
    ({ lambdaFunctionName } = await inquirer.prompt([syncLambdaNameQuestion]));
  }

  return { newFunction, lambdaFunctionName };
}
async function askDefaultAuthQuestion(context) {
  const currentAuthConfig = getAppSyncAuthConfig(context.amplify.getProjectMeta());
  const currentDefaultAuth =
    currentAuthConfig && currentAuthConfig.defaultAuthentication ? currentAuthConfig.defaultAuthentication.authenticationType : undefined;
  const defaultAuthTypeQuestion = {
    type: 'list',
    name: 'defaultAuthType',
    message: 'Choose the default authorization type for the API',
    choices: authProviderChoices,
    default: currentDefaultAuth,
  };

  const { defaultAuthType } = await inquirer.prompt([defaultAuthTypeQuestion]);

  // Get default auth configured
  const defaultAuth = await askAuthQuestions(defaultAuthType, context);

  return {
    authConfig: {
      defaultAuthentication: defaultAuth,
    },
    defaultAuthType,
  };
}

export async function askAdditionalAuthQuestions(context, authConfig, defaultAuthType) {
  const currentAuthConfig = getAppSyncAuthConfig(context.amplify.getProjectMeta());
  authConfig.additionalAuthenticationProviders = [];
  if (await context.prompt.confirm('Configure additional auth types?')) {
    // Get additional auth configured
    const remainingAuthProviderChoices = authProviderChoices.filter(p => p.value !== defaultAuthType);
    const currentAdditionalAuth = ((currentAuthConfig && currentAuthConfig.additionalAuthenticationProviders
      ? currentAuthConfig.additionalAuthenticationProviders
      : []) as any[]).map(authProvider => authProvider.authenticationType);

    const additionalProvidersQuestion: CheckboxQuestion = {
      type: 'checkbox',
      name: 'authType',
      message: 'Choose the additional authorization types you want to configure for the API',
      choices: remainingAuthProviderChoices,
      default: currentAdditionalAuth,
    };

    const additionalProvidersAnswer = await inquirer.prompt([additionalProvidersQuestion]);

    for (let i = 0; i < additionalProvidersAnswer.authType.length; i += 1) {
      const authProvider = additionalProvidersAnswer.authType[i];

      const config = await askAuthQuestions(authProvider, context, true);

      authConfig.additionalAuthenticationProviders.push(config);
    }
  } else {
    authConfig.additionalAuthenticationProviders = (currentAuthConfig?.additionalAuthenticationProviders || []).filter(
      p => p.authenticationType !== defaultAuthType,
    );
  }
  return authConfig;
}

async function askAuthQuestions(authType, context, printLeadText = false) {
  if (authType === 'AMAZON_COGNITO_USER_POOLS') {
    if (printLeadText) {
      context.print.info('Cognito UserPool configuration');
    }

    const userPoolConfig = await askUserPoolQuestions(context);

    return userPoolConfig;
  }

  if (authType === 'API_KEY') {
    if (printLeadText) {
      context.print.info('API key configuration');
    }

    const apiKeyConfig = await askApiKeyQuestions();

    return apiKeyConfig;
  }

  if (authType === 'AWS_IAM') {
    return {
      authenticationType: 'AWS_IAM',
    };
  }

  if (authType === 'OPENID_CONNECT') {
    if (printLeadText) {
      context.print.info('OpenID Connect configuration');
    }

    const openIDConnectConfig = await askOpenIDConnectQuestions();

    return openIDConnectConfig;
  }

  const errMessage = `Unknown authType: ${authType}`;
  context.print.error(errMessage);
  await context.usageData.emitError(new UnknownResourceTypeError(errMessage));
  exitOnNextTick(1);
}

async function askUserPoolQuestions(context) {
  let authResourceName = checkIfAuthExists(context);

  if (!authResourceName) {
    authResourceName = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
  } else {
    context.print.info('Use a Cognito user pool configured as a part of this project.');
  }

  // Added resources are prefixed with auth
  authResourceName = `auth${authResourceName}`;

  return {
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    userPoolConfig: {
      userPoolId: authResourceName,
    },
  };
}

async function askApiKeyQuestions() {
  const apiKeyQuestions = [
    {
      type: 'input',
      name: 'description',
      message: 'Enter a description for the API key:',
    },
    {
      type: 'input',
      name: 'apiKeyExpirationDays',
      message: 'After how many days from now the API key should expire (1-365):',
      default: 7,
      validate: validateDays,
      // adding filter to ensure parsing input as int -> https://github.com/SBoudrias/Inquirer.js/issues/866
      filter: value => (isNaN(parseInt(value, 10)) ? value : parseInt(value, 10)),
    },
  ];

  const apiKeyConfig = await inquirer.prompt(apiKeyQuestions);

  return {
    authenticationType: 'API_KEY',
    apiKeyConfig,
  };
}

async function askOpenIDConnectQuestions() {
  const openIDConnectQuestions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter a name for the OpenID Connect provider:',
    },
    {
      type: 'input',
      name: 'issuerUrl',
      message: 'Enter the OpenID Connect provider domain (Issuer URL):',
      validate: validateIssuerUrl,
    },
    {
      type: 'input',
      name: 'clientId',
      message: 'Enter the Client Id from your OpenID Client Connect application (optional):',
    },
    {
      type: 'input',
      name: 'iatTTL',
      message: 'Enter the number of milliseconds a token is valid after being issued to a user:',
      validate: validateTTL,
    },
    {
      type: 'input',
      name: 'authTTL',
      message: 'Enter the number of milliseconds a token is valid after being authenticated:',
      validate: validateTTL,
    },
  ];

  const openIDConnectConfig = await inquirer.prompt(openIDConnectQuestions);

  return {
    authenticationType: 'OPENID_CONNECT',
    openIDConnectConfig,
  };
}

function validateDays(input) {
  const isValid = /^\d+$/.test(input);
  const days = isValid ? parseInt(input, 10) : 0;
  if (!isValid || days < 1 || days > 365) {
    return 'Number of days must be between 1 and 365.';
  }

  return true;
}

function validateIssuerUrl(input) {
  const isValid = /^(((?!http:\/\/(?!localhost))([a-zA-Z0-9.]{1,}):\/\/([a-zA-Z0-9-._~:?#@!$&'()*+,;=/]{1,})\/)|(?!http)(?!https)([a-zA-Z0-9.]{1,}):\/\/)$/.test(
    input,
  );

  if (!isValid) {
    return 'The value must be a valid URI with a trailing forward slash. HTTPS must be used instead of HTTP unless you are using localhost.';
  }

  return true;
}

function validateTTL(input) {
  const isValid = /^\d+$/.test(input);

  if (!isValid) {
    return 'The value must be a number.';
  }

  return true;
}

function resourceAlreadyExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let resourceName;

  if (amplifyMeta[category]) {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === serviceName) {
        resourceName = resource;
      }
    });
  }

  return resourceName;
}

export const migrate = async context => {
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
    forceCompile: true,
    migrate: true,
  });
};

export const getIAMPolicies = (resourceName: string, operations: string[], context: any) => {
  let policy: any = {};
  const resources = [];
  const actions = [];
  if (!FeatureFlags.getBoolean('appSync.generateGraphQLPermissions')) {
    operations.forEach(crudOption => {
      switch (crudOption) {
        case 'create':
          actions.push('appsync:Create*', 'appsync:StartSchemaCreation', 'appsync:GraphQL');
          resources.push(buildPolicyResource(resourceName, '/*'));
          break;
        case 'update':
          actions.push('appsync:Update*');
          break;
        case 'read':
          actions.push('appsync:Get*', 'appsync:List*');
          break;
        case 'delete':
          actions.push('appsync:Delete*');
          break;
        default:
          console.log(`${crudOption} not supported`);
      }
    });
    resources.push(buildPolicyResource(resourceName, null));
  } else {
    actions.push('appsync:GraphQL');
    operations.forEach(operation => resources.push(buildPolicyResource(resourceName, `/types/${operation}/*`)));
  }

  policy = {
    Effect: 'Allow',
    Action: actions,
    Resource: resources,
  };

  const attributes = ['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput'];
  if (authConfigHasApiKey(getAppSyncAuthConfig(context.amplify.getProjectMeta()))) {
    attributes.push('GraphQLAPIKeyOutput');
  }

  return { policy, attributes };
};

const buildPolicyResource = (resourceName: string, path: string | null) => {
  return {
    'Fn::Join': [
      '',
      [
        'arn:aws:appsync:',
        { Ref: 'AWS::Region' },
        ':',
        { Ref: 'AWS::AccountId' },
        ':apis/',
        {
          Ref: `${category}${resourceName}GraphQLAPIIdOutput`,
        },
        ...(path ? [path] : [])
      ]
    ],
  };
};

const templateSchemaFilter = authConfig => {
  const authIncludesCognito = getAuthTypes(authConfig).includes('AMAZON_COGNITO_USER_POOLS');
  return (templateOption: ListChoiceOptions): boolean =>
    authIncludesCognito || templateOption.value !== 'single-object-auth-schema.graphql';
};

const getAuthTypes = authConfig => {
  const additionalAuthTypes = (authConfig.additionalAuthenticationProviders || [])
    .map(provider => provider.authenticationType)
    .filter(t => !!t);

  const uniqueAuthTypes = new Set([...additionalAuthTypes, authConfig.defaultAuthentication.authenticationType]);

  return [...uniqueAuthTypes.keys()];
};
