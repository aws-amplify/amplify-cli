import { ListQuestion, CheckboxQuestion, ListChoiceOptions } from 'inquirer';
import { dataStoreLearnMore } from '../sync-conflict-handler-assets/syncAssets';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { rootAssetDir, provider } from '../aws-constants';
import { collectDirectivesByTypeNames, readProjectConfiguration } from 'graphql-transformer-core';
import { category } from '../../../category-constants';
import { UpdateApiRequest } from '../../../../../amplify-headless-interface/lib/interface/api/update';
import { authConfigToAppSyncAuthType } from '../utils/auth-config-to-app-sync-auth-type-bi-di-mapper';
import { resolverConfigToConflictResolution } from '../utils/resolver-config-to-conflict-resolution-bi-di-mapper';
import _ from 'lodash';
import chalk from 'chalk';
import uuid from 'uuid';
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
import { Duration, Expiration } from '@aws-cdk/core';
import { defineGlobalSandboxMode } from '../utils/global-sandbox-mode';

const serviceName = 'AppSync';
const elasticContainerServiceName = 'ElasticContainer';
const providerName = 'awscloudformation';
const graphqlSchemaDir = path.join(rootAssetDir, 'graphql-schemas');

// keep in sync with ServiceName in amplify-category-function, but probably it will not change
const FunctionServiceNameLambdaFunction = 'Lambda';

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

const conflictResolutionHanlderChoices = [
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
];

const blankSchemaFile = 'blank-schema.graphql';
const schemaTemplatesV1 = [
  {
    name: 'Single object with fields (e.g., “Todo” with ID, name, description)',
    value: 'single-object-schema.graphql',
  },
  {
    name: 'One-to-many relationship (e.g., “Blogs” with “Posts” and “Comments”)',
    value: 'many-relationship-schema.graphql',
  },
  {
    name: 'Objects with fine-grained access control (e.g., a project management app with owner-based authorization)',
    value: 'single-object-auth-schema.graphql',
  },
  {
    name: 'Blank Schema',
    value: blankSchemaFile,
  },
];

const schemaTemplatesV2 = [
  {
    name: 'Single object with fields (e.g., “Todo” with ID, name, description)',
    value: 'single-object-schema-v2.graphql',
  },
  {
    name: 'One-to-many relationship (e.g., “Blogs” with “Posts” and “Comments”)',
    value: 'many-relationship-schema-v2.graphql',
  },
  {
    name: 'Objects with fine-grained access control (e.g., a project management app with owner-based authorization)',
    value: 'single-object-auth-schema-v2.graphql',
  },
  {
    name: 'Blank Schema',
    value: blankSchemaFile,
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

      const providerPlugin = await import(context.amplify.getProviderPlugins(context)[provider]);
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

const serviceApiInputWalkthrough = async (context: $TSContext, defaultValuesFilename, serviceMetadata) => {
  let continuePrompt = false;
  let authConfig;
  let defaultAuthType;
  let resolverConfig;
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  let resourceAnswers = {};
  resourceAnswers[inputs[1].key] = allDefaultValues[inputs[1].key];
  resourceAnswers[inputs[0].key] = resourceAnswers[inputs[1].key];

  //
  // Default authConfig - API Key (expires in 7 days)
  //
  authConfig = {
    defaultAuthentication: {
      apiKeyConfig: {
        apiKeyExpirationDays: 7,
      },
      authenticationType: 'API_KEY',
    },
    additionalAuthenticationProviders: [],
  };

  //
  // Repeat prompt until user selects Continue
  //
  while (!continuePrompt) {
    const getAuthModeChoice = async () => {
      if (authConfig.defaultAuthentication.authenticationType === 'API_KEY') {
        return `${
          authProviderChoices.find(choice => choice.value === authConfig.defaultAuthentication.authenticationType).name
        } (default, expiration time: ${authConfig.defaultAuthentication.apiKeyConfig.apiKeyExpirationDays} days from now)`;
      }
      return `${authProviderChoices.find(choice => choice.value === authConfig.defaultAuthentication.authenticationType).name} (default)`;
    };

    const getAdditionalAuthModeChoices = async () => {
      let additionalAuthModesText = '';
      authConfig.additionalAuthenticationProviders.map(async authMode => {
        additionalAuthModesText += `, ${authProviderChoices.find(choice => choice.value === authMode.authenticationType).name}`;
      });
      return additionalAuthModesText;
    };

    const basicInfoQuestionChoices = [];

    basicInfoQuestionChoices.push({
      name: chalk`{bold Name:} ${resourceAnswers[inputs[1].key]}`,
      value: 'API_NAME',
    });

    basicInfoQuestionChoices.push({
      name: chalk`{bold Authorization modes:} ${await getAuthModeChoice()}${await getAdditionalAuthModeChoices()}`,
      value: 'API_AUTH_MODE',
    });

    basicInfoQuestionChoices.push({
      name: chalk`{bold Conflict detection (required for DataStore):} ${resolverConfig?.project ? 'Enabled' : 'Disabled'}`,
      value: 'CONFLICT_DETECTION',
    });

    if (resolverConfig?.project) {
      basicInfoQuestionChoices.push({
        name: chalk`{bold Conflict resolution strategy:} ${
          conflictResolutionHanlderChoices.find(x => x.value === resolverConfig.project.ConflictHandler).name
        }`,
        value: 'CONFLICT_STRATEGY',
      });
    }

    basicInfoQuestionChoices.push({
      name: 'Continue',
      value: 'CONTINUE',
    });

    const basicInfoQuestion = {
      type: 'list',
      name: 'basicApiSettings',
      message: 'Here is the GraphQL API that we will create. Select a setting to edit or continue',
      default: 'CONTINUE',
      choices: basicInfoQuestionChoices,
    };

    let { basicApiSettings } = await inquirer.prompt([basicInfoQuestion]);

    switch (basicApiSettings) {
      case 'API_NAME':
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
        resourceAnswers = await inquirer.prompt(resourceQuestions);
        resourceAnswers[inputs[0].key] = resourceAnswers[inputs[1].key];
        allDefaultValues[inputs[1].key] = resourceAnswers[inputs[1].key];
        break;
      case 'API_AUTH_MODE':
        // Ask additonal questions
        ({ authConfig, defaultAuthType } = await askDefaultAuthQuestion(context));
        ({ authConfig } = await askAdditionalQuestions(context, authConfig, defaultAuthType));
        break;
      case 'CONFLICT_DETECTION':
        resolverConfig = await askResolverConflictQuestion(context, resolverConfig);
        break;
      case 'CONFLICT_STRATEGY':
        resolverConfig = await askResolverConflictHandlerQuestion(context);
        break;
      case 'CONTINUE':
        continuePrompt = true;
        break;
    }
  }

  return {
    answers: resourceAnswers,
    output: {
      authConfig,
    },
    resolverConfig,
  };
};

const updateApiInputWalkthrough = async (context, project, resolverConfig, modelTypes) => {
  let authConfig;
  let defaultAuthType;
  const updateChoices = [
    {
      name: 'Authorization modes',
      value: 'AUTH_MODE',
    },
  ];
  // check if DataStore is enabled for the entire API
  if (project.config && !_.isEmpty(project.config.ResolverConfig)) {
    updateChoices.push({
      name: 'Conflict resolution strategy',
      value: 'CONFLICT_STRATEGY',
    });
    updateChoices.push({
      name: 'Disable conflict detection',
      value: 'DISABLE_CONFLICT',
    });
  } else {
    updateChoices.push({
      name: 'Enable conflict detection (required for DataStore)',
      value: 'ENABLE_CONFLICT',
    });
  }

  const updateOptionQuestion = {
    type: 'list',
    name: 'updateOption',
    message: 'Select a setting to edit',
    choices: updateChoices,
  };

  const { updateOption } = await inquirer.prompt([updateOptionQuestion]);

  if (updateOption === 'ENABLE_CONFLICT') {
    resolverConfig = await askResolverConflictHandlerQuestion(context, modelTypes);
  } else if (updateOption === 'DISABLE_CONFLICT') {
    resolverConfig = {};
  } else if (updateOption === 'AUTH_MODE') {
    ({ authConfig, defaultAuthType } = await askDefaultAuthQuestion(context));
    authConfig = await askAdditionalAuthQuestions(context, authConfig, defaultAuthType);
  } else if (updateOption === 'CONFLICT_STRATEGY') {
    resolverConfig = await askResolverConflictHandlerQuestion(context, modelTypes);
  }

  return {
    authConfig,
    resolverConfig,
  };
};

export const serviceWalkthrough = async (context: $TSContext, defaultValuesFilename, serviceMetadata) => {
  const resourceName = resourceAlreadyExists(context);
  const providerPlugin = await import(context.amplify.getProviderPlugins(context)[provider]);
  const transformerVersion = providerPlugin.getTransformerVersion(context);
  await addLambdaAuthorizerChoice(context);
  if (resourceName) {
    const errMessage =
      'You already have an AppSync API in your project. Use the "amplify update api" command to update your existing AppSync API.';
    context.print.warning(errMessage);
    await context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
    exitOnNextTick(0);
  }

  const { amplify } = context;
  const { inputs } = serviceMetadata;

  const basicInfoAnswers = await serviceApiInputWalkthrough(context, defaultValuesFilename, serviceMetadata);
  let schemaContent = '';
  let askToEdit = true;

  // Schema template selection
  const schemaTemplateOptions = transformerVersion === 2 ? schemaTemplatesV2 : schemaTemplatesV1;
  const templateSelectionQuestion = {
    type: inputs[4].type,
    name: inputs[4].key,
    message: inputs[4].question,
    choices: schemaTemplateOptions.filter(templateSchemaFilter(basicInfoAnswers.output.authConfig)),
    validate: amplify.inputValidation(inputs[4]),
  };

  const { templateSelection } = await inquirer.prompt(templateSelectionQuestion);
  const schemaFilePath = path.join(graphqlSchemaDir, templateSelection);
  schemaContent += transformerVersion === 2 ? defineGlobalSandboxMode() : '';
  schemaContent += fs.readFileSync(schemaFilePath, 'utf8');

  return {
    ...basicInfoAnswers,
    noCfnFile: true,
    schemaContent,
    askToEdit,
  };
};

export const updateWalkthrough = async (context): Promise<UpdateApiRequest> => {
  const { allResources } = await context.amplify.getResourceStatus();
  let resourceDir;
  let resourceName;
  let resource;
  let authConfig;
  const resources = allResources.filter(resource => resource.service === 'AppSync');
  await addLambdaAuthorizerChoice(context);

  // There can only be one appsync resource
  if (resources.length > 0) {
    resource = resources[0];
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

  await displayApiInformation(context, resource, project);

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

  ({ authConfig, resolverConfig } = await updateApiInputWalkthrough(context, project, resolverConfig, modelTypes));

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

async function displayApiInformation(context, resource, project) {
  let authModes: string[] = [];
  authModes.push(
    `- Default: ${await displayAuthMode(context, resource, resource.output.authConfig.defaultAuthentication.authenticationType)}`,
  );
  await resource.output.authConfig.additionalAuthenticationProviders.map(async authMode => {
    authModes.push(`- ${await displayAuthMode(context, resource, authMode.authenticationType)}`);
  });

  context.print.info('');

  context.print.success('General information');
  context.print.info('- Name: '.concat(resource.resourceName));
  if (resource?.output?.GraphQLAPIEndpointOutput) {
    context.print.info(`- API endpoint: ${resource?.output?.GraphQLAPIEndpointOutput}`);
  }
  context.print.info('');

  context.print.success('Authorization modes');
  authModes.forEach(authMode => context.print.info(authMode));
  context.print.info('');

  context.print.success('Conflict detection (required for DataStore)');
  if (project.config && !_.isEmpty(project.config.ResolverConfig)) {
    context.print.info(
      `- Conflict resolution strategy: ${
        conflictResolutionHanlderChoices.find(choice => choice.value === project.config.ResolverConfig.project.ConflictHandler).name
      }`,
    );
  } else {
    context.print.info('- Disabled');
  }

  context.print.info('');
}

async function displayAuthMode(context, resource, authMode) {
  if (authMode == 'API_KEY' && resource.output.GraphQLAPIKeyOutput) {
    let { apiKeys } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getAppSyncApiKeys', {
      apiId: resource.output.GraphQLAPIIdOutput,
    });
    let apiKeyExpires = apiKeys.find(key => key.id == resource.output.GraphQLAPIKeyOutput)?.expires;
    if (!apiKeyExpires) {
      return authProviderChoices.find(choice => choice.value === authMode).name;
    }
    let apiKeyExpiresDate = new Date(apiKeyExpires * 1000);
    return `${authProviderChoices.find(choice => choice.value === authMode).name} expiring ${apiKeyExpiresDate}: ${
      resource.output.GraphQLAPIKeyOutput
    }`;
  }
  return authProviderChoices.find(choice => choice.value === authMode).name;
}

async function askAdditionalQuestions(context, authConfig, defaultAuthType, modelTypes?) {
  authConfig = await askAdditionalAuthQuestions(context, authConfig, defaultAuthType);
  return { authConfig };
}

async function askResolverConflictQuestion(context, resolverConfig, modelTypes?) {
  let resolverConfigResponse: any = {};

  if (await context.prompt.confirm('Enable conflict detection?', !resolverConfig?.project)) {
    resolverConfigResponse = await askResolverConflictHandlerQuestion(context, modelTypes);
  }

  return resolverConfigResponse;
}

async function askResolverConflictHandlerQuestion(context, modelTypes?) {
  let resolverConfig: any = {};
  const askConflictResolutionStrategy = async msg => {
    let conflictResolutionStrategy;

    do {
      const conflictResolutionQuestion: ListQuestion = {
        type: 'list',
        name: 'conflictResolutionStrategy',
        message: msg,
        default: 'AUTOMERGE',
        choices: conflictResolutionHanlderChoices,
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

async function addLambdaAuthorizerChoice(context) {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context)[provider]);
  const transformerVersion = providerPlugin.getTransformerVersion(context);
  if (transformerVersion === 2 && !authProviderChoices.some(choice => choice.value == 'AWS_LAMBDA')) {
    authProviderChoices.push({
      name: 'Lambda',
      value: 'AWS_LAMBDA',
    });
  }
}

async function askDefaultAuthQuestion(context) {
  await addLambdaAuthorizerChoice(context);
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
  const defaultAuth = await askAuthQuestions(defaultAuthType, context, false, currentAuthConfig?.defaultAuthentication);

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
    const currentAdditionalAuth = (
      (currentAuthConfig && currentAuthConfig.additionalAuthenticationProviders
        ? currentAuthConfig.additionalAuthenticationProviders
        : []) as any[]
    ).map(authProvider => authProvider.authenticationType);

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

      const config = await askAuthQuestions(
        authProvider,
        context,
        true,
        currentAuthConfig?.additionalAuthenticationProviders?.find(authSetting => authSetting.authenticationType == authProvider),
      );

      authConfig.additionalAuthenticationProviders.push(config);
    }
  } else {
    authConfig.additionalAuthenticationProviders = (currentAuthConfig?.additionalAuthenticationProviders || []).filter(
      p => p.authenticationType !== defaultAuthType,
    );
  }
  return authConfig;
}

export async function askAuthQuestions(authType, context, printLeadText = false, authSettings) {
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

    const apiKeyConfig = await askApiKeyQuestions(authSettings);

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

    const openIDConnectConfig = await askOpenIDConnectQuestions(authSettings);

    return openIDConnectConfig;
  }

  if (authType === 'AWS_LAMBDA') {
    if (printLeadText) {
      context.print.info('Lambda Authorizer configuration');
    }

    const lambdaConfig = await askLambdaQuestion(context);

    return lambdaConfig;
  }

  const errMessage = `Unknown authType: ${authType}`;
  context.print.error(errMessage);
  await context.usageData.emitError(new UnknownResourceTypeError(errMessage));
  exitOnNextTick(1);
}

async function askUserPoolQuestions(context) {
  let authResourceName = checkIfAuthExists(context);
  if (!authResourceName) {
    authResourceName = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context, true]);
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

export async function askApiKeyQuestions(authSettings = undefined) {
  let defaultValues = {
    apiKeyExpirationDays: 7,
    description: undefined,
  };
  Object.assign(defaultValues, authSettings?.apiKeyConfig);

  const apiKeyQuestions = [
    {
      type: 'input',
      name: 'description',
      message: 'Enter a description for the API key:',
      default: defaultValues.description,
    },
    {
      type: 'input',
      name: 'apiKeyExpirationDays',
      message: 'After how many days from now the API key should expire (1-365):',
      default: defaultValues.apiKeyExpirationDays,
      validate: validateDays,
      // adding filter to ensure parsing input as int -> https://github.com/SBoudrias/Inquirer.js/issues/866
      filter: value => {
        const val = parseInt(value, 10);
        if (isNaN(val) || val <= 0 || val > 365) {
          return value;
        }
        return val;
      },
    },
  ];

  const apiKeyConfig = await inquirer.prompt(apiKeyQuestions);
  const apiKeyExpirationDaysNum = Number(apiKeyConfig.apiKeyExpirationDays);
  apiKeyConfig.apiKeyExpirationDate = Expiration.after(Duration.days(apiKeyExpirationDaysNum)).date;

  return {
    authenticationType: 'API_KEY',
    apiKeyConfig,
  };
}

async function askOpenIDConnectQuestions(authSettings) {
  let defaultValues = {
    authTTL: undefined,
    clientId: undefined,
    iatTTL: undefined,
    issuerUrl: undefined,
    name: undefined,
  };
  Object.assign(defaultValues, authSettings?.openIDConnectConfig);

  const openIDConnectQuestions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter a name for the OpenID Connect provider:',
      default: defaultValues.name,
    },
    {
      type: 'input',
      name: 'issuerUrl',
      message: 'Enter the OpenID Connect provider domain (Issuer URL):',
      validate: validateIssuerUrl,
      default: defaultValues.issuerUrl,
    },
    {
      type: 'input',
      name: 'clientId',
      message: 'Enter the Client Id from your OpenID Client Connect application (optional):',
      default: defaultValues.clientId,
    },
    {
      type: 'input',
      name: 'iatTTL',
      message: 'Enter the number of milliseconds a token is valid after being issued to a user:',
      validate: validateTTL,
      default: defaultValues.iatTTL,
    },
    {
      type: 'input',
      name: 'authTTL',
      message: 'Enter the number of milliseconds a token is valid after being authenticated:',
      validate: validateTTL,
      default: defaultValues.authTTL,
    },
  ];

  const openIDConnectConfig = await inquirer.prompt(openIDConnectQuestions);

  return {
    authenticationType: 'OPENID_CONNECT',
    openIDConnectConfig,
  };
}

async function validateDays(input) {
  const isValid = /^\d{0,3}$/.test(input);
  const days = isValid ? parseInt(input, 10) : 0;
  if (!isValid || days < 1 || days > 365) {
    return 'Number of days must be between 1 and 365.';
  }

  return true;
}

function validateIssuerUrl(input) {
  const isValid =
    /^(((?!http:\/\/(?!localhost))([a-zA-Z0-9.]{1,}):\/\/([a-zA-Z0-9-._~:?#@!$&'()*+,;=/]{1,})\/)|(?!http)(?!https)([a-zA-Z0-9.]{1,}):\/\/)$/.test(
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
        ...(path ? [path] : []),
      ],
    ],
  };
};

const templateSchemaFilter = authConfig => {
  const authIncludesCognito = getAuthTypes(authConfig).includes('AMAZON_COGNITO_USER_POOLS');
  return (templateOption: ListChoiceOptions): boolean =>
    authIncludesCognito ||
    templateOption.name !== 'Objects with fine-grained access control (e.g., a project management app with owner-based authorization)';
};

const getAuthTypes = authConfig => {
  const additionalAuthTypes = (authConfig.additionalAuthenticationProviders || [])
    .map(provider => provider.authenticationType)
    .filter(t => !!t);

  const uniqueAuthTypes = new Set([...additionalAuthTypes, authConfig.defaultAuthentication.authenticationType]);

  return [...uniqueAuthTypes.keys()];
};

async function askLambdaQuestion(context) {
  const existingFunctions = functionsExist(context);
  const choices = [
    {
      name: 'Create a new Lambda function',
      value: 'newFunction',
    },
  ];
  if (existingFunctions) {
    choices.push({
      name: 'Use a Lambda function already added in the current Amplify project',
      value: 'projectFunction',
    });
  }

  let defaultFunctionType = 'newFunction';
  const lambdaAnswer = await inquirer.prompt({
    name: 'functionType',
    type: 'list',
    message: 'Choose a Lambda authorization function',
    choices,
    default: defaultFunctionType,
  });

  const { lambdaFunction } = await askLambdaSource(context, lambdaAnswer.functionType);
  const { ttlSeconds } = await inquirer.prompt({
    type: 'input',
    name: 'ttlSeconds',
    message: 'How long should the authorization response be cached in seconds?',
    validate: validateTTL,
    default: 300,
  });

  const lambdaAuthorizerConfig = {
    lambdaFunction,
    ttlSeconds,
  };

  return {
    authenticationType: 'AWS_LAMBDA',
    lambdaAuthorizerConfig,
  };
}

function functionsExist(context: $TSContext): boolean {
  const functionResources = context.amplify.getProjectDetails().amplifyMeta.function;
  if (!functionResources) {
    return false;
  }

  const lambdaFunctions = [];
  Object.keys(functionResources).forEach(resourceName => {
    if (functionResources[resourceName].service === FunctionServiceNameLambdaFunction) {
      lambdaFunctions.push(resourceName);
    }
  });

  return lambdaFunctions.length !== 0;
}

async function askLambdaSource(context: $TSContext, functionType: string) {
  switch (functionType) {
    case 'projectFunction':
      return await askLambdaFromProject(context);
    case 'newFunction':
      return await newLambdaFunction(context);
    default:
      throw new Error(`Type ${functionType} not supported`);
  }
}

async function newLambdaFunction(context: $TSContext) {
  const resourceName = await createLambdaAuthorizerFunction(context);
  return { lambdaFunction: resourceName };
}

async function askLambdaFromProject(context: $TSContext) {
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
    message: 'Choose one of the Lambda functions',
    choices: lambdaFunctions,
    default: lambdaFunctions[0],
  });

  await context.amplify.invokePluginMethod(context, 'function', undefined, 'addAppSyncInvokeMethodPermission', [answer.lambdaFunction]);

  return { lambdaFunction: answer.lambdaFunction };
}

async function createLambdaAuthorizerFunction(context: $TSContext) {
  const [shortId] = uuid().split('-');
  const functionName = `graphQlLambdaAuthorizer${shortId}`;
  const resourceName = await context.amplify.invokePluginMethod(context, 'function', undefined, 'add', [
    context,
    'awscloudformation',
    FunctionServiceNameLambdaFunction,
    {
      functionName,
      defaultRuntime: 'nodejs',
      providerContext: {
        provider: 'awscloudformation',
      },
      template: 'lambda-auth',
      skipAdvancedSection: true,
      skipNextSteps: true,
    },
  ]);

  context.print.success(`Successfully added ${resourceName} function locally`);
  await context.amplify.invokePluginMethod(context, 'function', undefined, 'addAppSyncInvokeMethodPermission', [resourceName]);
  return resourceName;
}
