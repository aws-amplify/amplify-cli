const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const open = require('open');

const category = 'api';
const serviceName = 'AppSync';
const parametersFileName = 'parameters.json';
const schemaFileName = 'schema.graphql';
const providerName = 'awscloudformation';
const resolversDirName = 'resolvers';
const stacksDirName = 'stacks';
const defaultStackName = 'CustomResources.json';

function openConsole(context) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const categoryAmplifyMeta = amplifyMeta[category];
  let appSyncMeta;
  Object.keys((categoryAmplifyMeta)).forEach((resourceName) => {
    if (categoryAmplifyMeta[resourceName].service === serviceName &&
      categoryAmplifyMeta[resourceName].output) {
      appSyncMeta = categoryAmplifyMeta[resourceName].output;
    }
  });


  if (appSyncMeta) {
    const { GraphQLAPIIdOutput } = appSyncMeta;
    const { Region } = amplifyMeta.providers[providerName];

    const consoleUrl =
          `https://console.aws.amazon.com/appsync/home?region=${Region}#/${GraphQLAPIIdOutput}/v1/queries`;
    open(consoleUrl, { wait: false });
  } else {
    context.print.error('AppSync API is not pushed in the cloud.');
  }
}

async function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const resourceName = resourceAlreadyExists(context);

  if (resourceName) {
    context.print.warning('You already have an AppSync API in your project. Use the "amplify update api" command to update your existing AppSync API.');
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

  // Ask auth/security question

  const authType = await askSecurityQuestions(context, parameters);

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

    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { resourceDir, parameters });

    return { answers: resourceAnswers, output: { securityType: authType }, noCfnFile: true };
  }

  // The user doesn't have an annotated schema file

  if (!await amplify.confirmPrompt.run('Do you want a guided schema creation?')) {
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

    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { resourceDir, parameters, noConfig: true });

    return { answers: resourceAnswers, output: { securityType: authType }, noCfnFile: true };
  }
  // Guided creation of the transform schema

  let templateSchemaChoices = inputs[4].options;
  if (authType === 'API_KEY') {
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
    return context.amplify.openEditor(context, targetSchemaFilePath)
      .then(async () => {
        let notCompiled = true;
        while (notCompiled) {
          try {
            await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { resourceDir, parameters });
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

        return { answers: resourceAnswers, output: { securityType: authType }, noCfnFile: true };
      });
  }


  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { resourceDir, parameters });


  return { answers: resourceAnswers, output: { securityType: authType }, noCfnFile: true };
}

async function updateWalkthrough(context) {
  const { allResources } = await context.amplify.getResourceStatus();
  let resourceDir;
  let resourceName;
  const resources = allResources.filter(resource => resource.service === 'AppSync');

  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    if (resource.providerPlugin !== providerName) {
      // TODO: Move message string to seperate file
      throw new Error(`The selected resource is not managed using AWS Cloudformation. Please use the AWS AppSync Console to make updates to your API - ${resource.resourceName}`);
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

  const authType = await askSecurityQuestions(context, parameters);

  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);

  amplifyMeta[category][resourceName].output.securityType = authType;
  let jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath();
  const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);

  backendConfig[category][resourceName].output.securityType = authType;
  jsonString = JSON.stringify(backendConfig, null, '\t');
  fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');

  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { resourceDir, parameters });
}

async function askSecurityQuestions(context, parameters) {
  const securityTypeQuestion = {
    type: 'list',
    name: 'authType',
    message: 'Choose an authorization type for the API',
    choices: [
      {
        name: 'API key',
        value: 'API_KEY',
      },
      {
        name: 'Amazon Cognito User Pool',
        value: 'AMAZON_COGNITO_USER_POOLS',
      },
    ],
  };

  const { authType } = await inquirer.prompt([securityTypeQuestion]);

  if (authType === 'AMAZON_COGNITO_USER_POOLS') {
    let authResourceName = checkIfAuthExists(context);

    if (!authResourceName) {
      try {
        const { add } = require('amplify-category-auth');

        authResourceName = await add(context);
      } catch (e) {
        context.print.error('Auth plugin not installed in the CLI. You need to install it to use this feature.');
      }
    } else {
      context.print.info('Use a Cognito user pool configured as a part of this project');
    }

    parameters.AuthCognitoUserPoolId = {
      'Fn::GetAtt': [
        `auth${authResourceName}`,
        'Outputs.UserPoolId',
      ],
    };
  } else if (authType === 'API_KEY') {
    if (parameters.AuthCognitoUserPoolId) {
      delete parameters.AuthCognitoUserPoolId;
    }
  }

  return authType;
}

function resourceAlreadyExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let resourceName;

  if (amplifyMeta[category]) {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach((resource) => {
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
    Object.keys(categoryResources).forEach((resource) => {
      if (categoryResources[resource].service === authServiceName) {
        authResourceName = resource;
      }
    });
  }
  return authResourceName;
}

async function migrate(context) {
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { noConfig: true, forceCompile: true, migrate: true });
}

function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  const actions = [];

  crudOptions.forEach((crudOption) => {
    switch (crudOption) {
      case 'create': actions.push('appsync:Create*', 'appsync:StartSchemaCreation', 'appsync:GraphQL');
        break;
      case 'update': actions.push('appsync:Update*');
        break;
      case 'read': actions.push('appsync:Get*', 'appsync:List*');
        break;
      case 'delete': actions.push('appsync:Delete*');
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


module.exports = {
  serviceWalkthrough, updateWalkthrough, openConsole, migrate, getIAMPolicies,
};
