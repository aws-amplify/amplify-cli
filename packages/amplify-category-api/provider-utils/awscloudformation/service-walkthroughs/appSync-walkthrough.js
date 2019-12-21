const syncAssets = require('../sync-conflict-handler-assets/syncAssets');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const uuid = require('uuid');
const path = require('path');
const open = require('open');
const TransformPackage = require('graphql-transformer-core');

const category = 'api';
const serviceName = 'AppSync';
const parametersFileName = 'parameters.json';
const schemaFileName = 'schema.graphql';
const providerName = 'awscloudformation';
const resolversDirName = 'resolvers';
const stacksDirName = 'stacks';
const defaultStackName = 'CustomResources.json';

const {
  collectDirectivesByTypeNames,
  readTransformerConfiguration,
  writeTransformerConfiguration,
  TRANSFORM_CURRENT_VERSION,
} = TransformPackage;

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

function openConsole(context) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const categoryAmplifyMeta = amplifyMeta[category];
  let appSyncMeta;
  Object.keys(categoryAmplifyMeta).forEach(resourceName => {
    if (categoryAmplifyMeta[resourceName].service === serviceName && categoryAmplifyMeta[resourceName].output) {
      appSyncMeta = categoryAmplifyMeta[resourceName].output;
    }
  });

  if (appSyncMeta) {
    const { GraphQLAPIIdOutput } = appSyncMeta;
    const { Region } = amplifyMeta.providers[providerName];

    const consoleUrl = `https://console.aws.amazon.com/appsync/home?region=${Region}#/${GraphQLAPIIdOutput}/v1/queries`;
    open(consoleUrl, { wait: false });
  } else {
    context.print.error('AppSync API is not pushed in the cloud.');
  }
}

async function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const resourceName = resourceAlreadyExists(context);
  let authConfig;
  let defaultAuthType;
  let resolverConfig;

  if (resourceName) {
    context.print.warning(
      'You already have an AppSync API in your project. Use the "amplify update api" command to update your existing AppSync API.'
    );
    process.exit(0);
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

  const parameters = {
    AppSyncApiName: resourceAnswers[inputs[1].key],
    DynamoDBBillingMode: 'PAY_PER_REQUEST',
    DynamoDBEnableServerSideEncryption: 'false',
  };

  // Ask additonal questions

  /* eslint-disable */
  ({ authConfig, defaultAuthType } = await askDefaultAuthQuestion(context, parameters));
  ({ authConfig, resolverConfig } = await askAdditionalQuestions(context, parameters, authConfig, defaultAuthType));
  await checkForCognitoUserPools(context, parameters, authConfig);
  /* eslint-disable */

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

  const backendDir = amplify.pathManager.getBackendDirPath();

  const resourceDir = `${backendDir}/${category}/${resourceAnswers[inputs[0].key]}`;

  // Ensure the project directory exists and create the stacks & resolvers directories.
  fs.ensureDirSync(resourceDir);
  const resolverDirectoryPath = path.join(resourceDir, resolversDirName);
  if (!fs.existsSync(resolverDirectoryPath)) {
    fs.mkdirSync(resolverDirectoryPath);
  }
  const stacksDirectoryPath = path.join(resourceDir, stacksDirName);
  if (!fs.existsSync(stacksDirectoryPath)) {
    fs.mkdirSync(stacksDirectoryPath);
  }

  // During API add, make sure we're creating a transform.conf.json file with the latest version the CLI supports.
  await updateTransformerConfigVersion(resourceDir);

  await writeResolverConfig(resolverConfig, resourceDir);

  // Write the default custom resources stack out to disk.
  const defaultCustomResourcesStack = fs.readFileSync(`${__dirname}/defaultCustomResources.json`);
  fs.writeFileSync(`${resourceDir}/${stacksDirName}/${defaultStackName}`, defaultCustomResourcesStack);

  if (schemaFileAnswer[inputs[2].key]) {
    // User has an annotated schema file

    const filePathQuestion = {
      type: inputs[3].type,
      name: inputs[3].key,
      message: inputs[3].question,
      validate: amplify.inputValidation(inputs[3]),
    };
    const { schemaFilePath } = await inquirer.prompt(filePathQuestion);

    fs.copyFileSync(schemaFilePath, `${resourceDir}/${schemaFileName}`);

    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
      resourceDir,
      parameters,
      authConfig,
    });

    return { answers: resourceAnswers, output: { authConfig }, noCfnFile: true };
  }

  // The user doesn't have an annotated schema file

  if (!(await amplify.confirmPrompt.run('Do you want a guided schema creation?'))) {
    // Copy the most basic schema onto the users resource dir and transform that

    const targetSchemaFilePath = `${resourceDir}/${schemaFileName}`;
    const typeNameQuestion = {
      type: 'input',
      name: 'typeName',
      message: 'Provide a custom type name',
      default: 'MyType',
      validate: amplify.inputValidation({
        operator: 'regex',
        value: '^[a-zA-Z0-9]+$',
        onErrorMsg: 'Resource name should be alphanumeric',
      }),
    };
    const typeNameAnswer = await inquirer.prompt(typeNameQuestion);

    // fs.copyFileSync(schemaFilePath, targetSchemaFilePath);
    const schemaDir = `${__dirname}/../appsync-schemas`;

    const copyJobs = [
      {
        dir: schemaDir,
        template: 'basic-schema.graphql.ejs',
        target: targetSchemaFilePath,
      },
    ];

    // copy over the ejs file
    await context.amplify.copyBatch(context, copyJobs, typeNameAnswer);

    context.print.info('Creating a base schema for you...');

    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
      resourceDir,
      parameters,
      authConfig,
    });

    return { answers: resourceAnswers, output: { authConfig }, noCfnFile: true };
  }

  // Guided creation of the transform schema
  const authTypes = getAuthTypes(authConfig);
  const onlyApiKeyAuthEnabled = authTypes.includes('API_KEY') && authTypes.length === 1;

  let templateSchemaChoices = inputs[4].options;

  if (onlyApiKeyAuthEnabled) {
    templateSchemaChoices = templateSchemaChoices.filter(schema => schema.value !== 'single-object-auth-schema.graphql');
  }

  const templateQuestions = [
    {
      type: inputs[4].type,
      name: inputs[4].key,
      message: inputs[4].question,
      choices: templateSchemaChoices,
      validate: amplify.inputValidation(inputs[4]),
    },
    {
      type: inputs[5].type,
      name: inputs[5].key,
      message: inputs[5].question,
      validate: amplify.inputValidation(inputs[5]),
      default: () => {
        const defaultValue = allDefaultValues[inputs[5].key];
        return defaultValue;
      },
    },
  ];

  const { templateSelection, editSchemaChoice } = await inquirer.prompt(templateQuestions);
  const schemaFilePath = `${__dirname}/../appsync-schemas/${templateSelection}`;
  const targetSchemaFilePath = `${resourceDir}/${schemaFileName}`;

  fs.copyFileSync(schemaFilePath, targetSchemaFilePath);

  if (editSchemaChoice) {
    return context.amplify.openEditor(context, targetSchemaFilePath).then(async () => {
      let notCompiled = true;
      while (notCompiled) {
        try {
          await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
            resourceDir,
            parameters,
            authConfig,
          });
        } catch (e) {
          context.print.error('Failed compiling GraphQL schema:');
          context.print.info(e.message);
          const continueQuestion = {
            type: 'input',
            name: 'pressKey',
            message: `Correct the errors in schema.graphql and press Enter to re-compile.\n\nPath to schema.graphql:\n${targetSchemaFilePath}`,
          };
          await inquirer.prompt(continueQuestion);
          continue;
        }
        notCompiled = false;
      }

      return { answers: resourceAnswers, output: { authConfig }, noCfnFile: true };
    });
  }

  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
    resourceDir,
    parameters,
    authConfig,
  });

  return { answers: resourceAnswers, output: { authConfig }, noCfnFile: true };
}
// write to the transformer conf if the resolverConfig is valid
async function writeResolverConfig(resolverConfig, resourceDir) {
  if (resolverConfig && (resolverConfig.project || resolverConfig.models)) {
    const localTransformerConfig = await readTransformerConfiguration(resourceDir);
    localTransformerConfig.ResolverConfig = resolverConfig;
    await writeTransformerConfiguration(resourceDir, localTransformerConfig);
  }
}

async function updateTransformerConfigVersion(resourceDir) {
  const localTransformerConfig = await readTransformerConfiguration(resourceDir);
  localTransformerConfig.Version = TRANSFORM_CURRENT_VERSION;
  await writeTransformerConfiguration(resourceDir, localTransformerConfig);
}

async function createSyncFunction(context) {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;
  const [shortId] = uuid().split('-');

  const functionName = `syncConflictHandler${shortId}`;

  const functionProps = {
    functionName: `${functionName}`,
    roleName: `${functionName}LambdaRole`,
  };

  const copyJobs = [
    {
      dir: pluginDir,
      template: '../sync-conflict-handler-assets/sync-conflict-handler-index.js.ejs',
      target: `${targetDir}/function/${functionName}/src/index.js`,
    },
    {
      dir: pluginDir,
      template: '../sync-conflict-handler-assets/sync-conflict-handler-package.json.ejs',
      target: `${targetDir}/function/${functionName}/src/package.json`,
    },
    {
      dir: pluginDir,
      template: '../sync-conflict-handler-assets/sync-conflict-handler-template.json.ejs',
      target: `${targetDir}/function/${functionName}/${functionName}-cloudformation-template.json`,
    },
  ];

  // copy over the files
  await context.amplify.copyBatch(context, copyJobs, functionProps, true);

  const backendConfigs = {
    service: 'Lambda',
    providerPlugin: 'awscloudformation',
    build: true,
  };

  await context.amplify.updateamplifyMetaAfterResourceAdd('function', functionName, backendConfigs);
  context.print.success(`Successfully added ${functionName} function locally`);

  return functionName + '-${env}';
}

async function updateWalkthrough(context) {
  const { allResources } = await context.amplify.getResourceStatus();
  let resourceDir;
  let resourceName;
  let authConfig, defaultAuthType, resolverConfig;
  const resources = allResources.filter(resource => resource.service === 'AppSync');

  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    if (resource.providerPlugin !== providerName) {
      // TODO: Move message string to seperate file
      throw new Error(
        `The selected resource is not managed using AWS Cloudformation. Please use the AWS AppSync Console to make updates to your API - ${resource.resourceName}`
      );
    }
    ({ resourceName } = resource);
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
  } else {
    context.print.error('No AppSync resource to update. Use the "amplify add api" command to update your existing AppSync API.');
    process.exit(0);
    return;
  }

  const parametersFilePath = path.join(resourceDir, parametersFileName);
  let parameters = {};

  try {
    parameters = context.amplify.readJsonFile(parametersFilePath);
  } catch (e) {
    context.print.error('Parameters file not found');
    context.print.info(e.stack);
  }

  // Get models

  const project = await TransformPackage.readProjectConfiguration(resourceDir);

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

  /* eslint-disable */
  ({ authConfig, defaultAuthType } = await askDefaultAuthQuestion(context, parameters));
  ({ authConfig, resolverConfig } = await askAdditionalQuestions(context, parameters, authConfig, defaultAuthType, modelTypes));
  await checkForCognitoUserPools(context, parameters, authConfig);
  /* eslint-disable */

  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);

  if (amplifyMeta[category][resourceName].output.securityType) {
    delete amplifyMeta[category][resourceName].output.securityType;
  }

  amplifyMeta[category][resourceName].output.authConfig = authConfig;
  let jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath();
  const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);

  if (backendConfig[category][resourceName].output.securityType) {
    delete backendConfig[category][resourceName].output.securityType;
  }

  backendConfig[category][resourceName].output.authConfig = authConfig;
  jsonString = JSON.stringify(backendConfig, null, '\t');
  fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');

  await writeResolverConfig(resolverConfig, resourceDir);

  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
    resourceDir,
    parameters,
    authConfig,
  });
}

async function askAdditionalQuestions(context, parameters, authConfig, defaultAuthType, modelTypes) {
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
    authConfig = await askAdditionalAuthQuestions(context, parameters, authConfig, defaultAuthType);
    resolverConfig = await askResolverConflictQuestion(context, parameters, modelTypes);
  }

  return { authConfig, resolverConfig };
}

async function askResolverConflictQuestion(context, parameters, modelTypes) {
  let resolverConfig = {};

  if (await context.prompt.confirm('Configure conflict detection?')) {
    const askConflictResolutionStrategy = async msg => {
      let conflictResolutionStrategy;

      do {
        const conflictResolutionQuestion = {
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
          conflictResolutionQuestion.prefix = syncAssets.getDataStoreLearnMore();
        }
        ({ conflictResolutionStrategy } = await inquirer.prompt([conflictResolutionQuestion]));
      } while (conflictResolutionStrategy === 'Learn More');

      let syncConfig = {
        ConflictHandler: conflictResolutionStrategy,
        ConflictDetection: 'VERSION',
      };

      if (conflictResolutionStrategy === 'LAMBDA') {
        const lambdaFunctionName = await askSyncFunctionQuestion(context);
        syncConfig.LambdaConflictHandler = {};
        syncConfig.LambdaConflictHandler.name = lambdaFunctionName;
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
              `Select the resolution strategy for ${selectedModelTypes[i]} model`
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

  if (syncLambdaAnswer === 'NEW') {
    lambdaFunctionName = await createSyncFunction(context);
  } else {
    const syncLambdaNameQuestion = {
      type: 'input',
      name: 'lambdaFunctionName',
      message: 'Enter lambda function name',
      validate: val => !!val,
    };
    ({ lambdaFunctionName } = await inquirer.prompt([syncLambdaNameQuestion]));
  }

  return lambdaFunctionName;
}
async function askDefaultAuthQuestion(context, parameters) {
  const defaultAuthTypeQuestion = {
    type: 'list',
    name: 'defaultAuthType',
    message: 'Choose the default authorization type for the API',
    choices: authProviderChoices,
  };

  const { defaultAuthType } = await inquirer.prompt([defaultAuthTypeQuestion]);

  const authConfig = {
    additionalAuthenticationProviders: [],
  };

  // Get default auth configured
  const defaultAuth = await askAuthQuestions(defaultAuthType, context);

  authConfig.defaultAuthentication = defaultAuth;

  return { authConfig, defaultAuthType };
}

async function askAdditionalAuthQuestions(context, parameters, authConfig, defaultAuthType) {
  if (await context.prompt.confirm('Configure additional auth types?')) {
    // Get additional auth configured
    const remainingAuthProviderChoices = authProviderChoices.filter(p => p.value !== defaultAuthType);

    const additionalProvidersQuestion = {
      type: 'checkbox',
      name: 'authType',
      message: 'Choose the additional authorization types you want to configure for the API',
      choices: remainingAuthProviderChoices,
    };

    const additionalProvidersAnswer = await inquirer.prompt([additionalProvidersQuestion]);

    for (let i = 0; i < additionalProvidersAnswer.authType.length; i += 1) {
      const authProvider = additionalProvidersAnswer.authType[i];

      const config = await askAuthQuestions(authProvider, context, true);

      authConfig.additionalAuthenticationProviders.push(config);
    }
  }

  return authConfig;
}

async function checkForCognitoUserPools(context, parameters, authConfig) {
  const additionalUserPoolProviders = authConfig.additionalAuthenticationProviders.filter(
    provider => provider.authenticationType === 'AMAZON_COGNITO_USER_POOLS'
  );
  const additionalUserPoolProvider = additionalUserPoolProviders.length > 0 ? additionalUserPoolProviders[0] : undefined;

  if (authConfig.defaultAuthentication.authenticationType === 'AMAZON_COGNITO_USER_POOLS' || additionalUserPoolProvider) {
    let userPoolId;
    const configuredUserPoolName = checkIfAuthExists(context);

    if (authConfig.userPoolConfig) {
      ({ userPoolId } = authConfig.userPoolConfig);
    } else if (additionalUserPoolProvider && additionalUserPoolProvider.userPoolConfig) {
      ({ userPoolId } = additionalUserPoolProvider.userPoolConfig);
    } else if (configuredUserPoolName) {
      userPoolId = `auth${configuredUserPoolName}`;
    } else {
      throw new Error('Cannot find a configured Cognito User Pool.');
    }

    parameters.AuthCognitoUserPoolId = {
      'Fn::GetAtt': [userPoolId, 'Outputs.UserPoolId'],
    };
  } else {
    delete parameters.AuthCognitoUserPoolId;
  }
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

  context.print.error(`Unknown authType: ${authType}`);
  process.exit(1);
}

async function askUserPoolQuestions(context) {
  let authResourceName = checkIfAuthExists(context);

  if (!authResourceName) {
    try {
      const { add } = require('amplify-category-auth');

      authResourceName = await add(context);
    } catch (e) {
      context.print.error('Auth plugin not installed in the CLI. You need to install it to use this feature.');
    }
  } else {
    context.print.info('Use a Cognito user pool configured as a part of this project.');
  }

  return {
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    userPoolConfig: {
      userPoolId: `auth${authResourceName}`,
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
    input
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

function checkIfAuthExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let authResourceName;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === authServiceName) {
        authResourceName = resource;
      }
    });
  }
  return authResourceName;
}

async function migrate(context) {
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
    forceCompile: true,
    migrate: true,
  });
}

function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  const actions = [];

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actions.push('appsync:Create*', 'appsync:StartSchemaCreation', 'appsync:GraphQL');
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

  policy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
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
            '/*',
          ],
        ],
      },
    ],
  };

  const attributes = ['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput'];

  return { policy, attributes };
}

function getAuthTypes(authConfig) {
  const additionalAuthTypes = (authConfig.additionalAuthenticationProviders || [])
    .map(provider => provider.authenticationType)
    .filter(t => !!t);

  const uniqueAuthTypes = new Set([...additionalAuthTypes, authConfig.defaultAuthentication.authenticationType]);

  return [...uniqueAuthTypes.keys()];
}

module.exports = {
  serviceWalkthrough,
  updateWalkthrough,
  openConsole,
  migrate,
  getIAMPolicies,
};
