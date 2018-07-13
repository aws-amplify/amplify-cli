const inquirer = require('inquirer');
const moment = require('moment');

const securityTypeMapping = {
  apiKey: 'API_KEY',
  iam: 'AWS_IAM',
  cognito: 'AMAZON_COGNITO_USER_POOLS',
  openId: 'OPENID_CONNECT',
};

async function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  const resourceQuestions = [
    {
      type: inputs[0].type,
      name: inputs[0].key,
      message: inputs[0].question,
      validate: amplify.inputValidation(inputs[0]),
      default: () => {
        const defaultValue = getAllDefaults(amplify.getProjectDetails())[inputs[0].key];
        return defaultValue;
      },
    },
    {
      type: inputs[1].type,
      name: inputs[1].key,
      message: inputs[1].question,
      validate: amplify.inputValidation(inputs[1]),
      default: answers => answers.resourceName,
    },
    {
      type: inputs[2].type,
      name: inputs[2].key,
      message: inputs[2].question,
      choices: inputs[2].options,
      validate: amplify.inputValidation(inputs[2]),
    },
  ];

  // Ask resource and API name question

  const resourceAnswers = await inquirer.prompt(resourceQuestions);
  Object.assign(allDefaultValues, resourceAnswers);

  if (resourceAnswers[inputs[2].key] === 'default') {
    return { answers: allDefaultValues, output: { securityType: 'AWS_IAM' } };
  }

  return askCustomQuestions(context, inputs)
    .then((result) => {
      Object.assign(allDefaultValues, result.answers);
      allDefaultValues.customCfnFile = 'appSync-cloudformation-template-custom.yml.ejs';
      return { answers: allDefaultValues, dependsOn: result.dependsOn, output: result.output };
    });
}

async function askCustomQuestions(context, inputs) {
  const answers = {};
  let dependsOn = [];

  const securitySetting = await askSecurityQuestions(context, inputs);
  const output = {
    securityType: securityTypeMapping[securitySetting.type],
  };
  Object.assign(answers, { securitySetting });

  if (await context.prompt.confirm('Do you want to add a data source to your AppSync API?')) {
    const dataSourceAnswers = await askDataSourceQuestions(context, inputs);
    const { dataSources } = dataSourceAnswers;
    ({ dependsOn } = dataSourceAnswers);
    Object.assign(answers, { dataSources });
    Object.assign(answers, { dependsOn });
  }
  return { answers, dependsOn, output };
}

async function askSecurityQuestions(context, inputs) {
  const securityTypeQuestion = {
    type: inputs[3].type,
    name: inputs[3].key,
    message: inputs[3].question,
    choices: inputs[3].options,
  };

  const securitySetting = {};
  while (!securitySetting.options) {
    const securityTypeAnswer = await inquirer.prompt([securityTypeQuestion]);
    securitySetting.type = securityTypeAnswer[inputs[3].key];

    switch (securityTypeAnswer[inputs[3].key]) {
      case 'cognito': securitySetting.options = await askCognitoQuestions(context, inputs);
        break;
      case 'openId': securitySetting.options = await askOpenIdQuestions(context, inputs);
        break;
      case 'apiKey': securitySetting.options = await askApiKeyQuestions(context, inputs);
        break;
      case 'iam': securitySetting.options = {};
        break;
      default: context.print.error('Invalid option');
    }
  }

  return securitySetting;
}

async function askCognitoQuestions(context, inputs) {
  const { amplify } = context;

  const regions = await amplify.executeProviderUtils(context, 'amplify-provider-awscloudformation', 'getRegions');

  const regionQuestion = {
    type: inputs[4].type,
    name: inputs[4].key,
    message: inputs[4].question,
    choices: regions,
  };

  const regionAnswer = await inquirer.prompt([regionQuestion]);

  const userPools = await amplify.executeProviderUtils(context, 'amplify-provider-awscloudformation', 'getUserPools', { region: regionAnswer[inputs[4].key] });

  const userPoolOptions = userPools.map(userPool => ({
    value: userPool.Id,
    name: `${userPool.Id} (${userPool.Name})`,
  }));

  if (userPoolOptions.length === 0) {
    context.print.error('You do not have any user pools configured for the selected region');
    return;
  }

  const userPoolIdQuestion = {
    type: inputs[5].type,
    name: inputs[5].key,
    message: inputs[5].question,
    choices: userPoolOptions,
  };

  const defaultActionQuestion = {
    type: inputs[6].type,
    name: inputs[6].key,
    message: inputs[6].question,
    choices: inputs[6].options,
    validate: amplify.inputValidation(inputs[6]),
  };

  const appIdClientRegexQuestion = {
    type: inputs[7].type,
    name: inputs[7].key,
    message: inputs[7].question,
    validate: amplify.inputValidation(inputs[7]),
  };

  const cognitoAnswers = await inquirer.prompt([userPoolIdQuestion,
    defaultActionQuestion,
    appIdClientRegexQuestion]);
  Object.assign(cognitoAnswers, regionAnswer);

  return cognitoAnswers;
}

async function askOpenIdQuestions(context, inputs) {
  const { amplify } = context;

  const openIdDomainQuestion = {
    type: inputs[8].type,
    name: inputs[8].key,
    message: inputs[8].question,
    validate: amplify.inputValidation(inputs[8]),
  };

  const clientIdQuestion = {
    type: inputs[9].type,
    name: inputs[9].key,
    message: inputs[9].question,
    validate: amplify.inputValidation(inputs[9]),
  };

  const issueTTLQuestion = {
    type: inputs[10].type,
    name: inputs[10].key,
    message: inputs[10].question,
    validate: amplify.inputValidation(inputs[10]),
    default: 0,
  };

  const authTTLQuestion = {
    type: inputs[11].type,
    name: inputs[11].key,
    message: inputs[11].question,
    validate: amplify.inputValidation(inputs[11]),
    default: 0,
  };

  return await inquirer.prompt([openIdDomainQuestion,
    clientIdQuestion,
    issueTTLQuestion,
    authTTLQuestion]);
}

async function askApiKeyQuestions(context, inputs) {
  const apiKeyExpiryQuestion = {
    type: inputs[12].type,
    name: inputs[12].key,
    message: inputs[12].question,
    validate: answer => new Promise((resolve, reject) => {
      if (!answer || Number.isNaN(Number(answer)) || Number(answer) <= 0 || Number(answer) > 365) {
        reject(new Error('The number of days should be set between 1 to 365'));
      }
      resolve(true);
    }),
  };

  const apiKeyExpiryAnswer = await inquirer.prompt([apiKeyExpiryQuestion]);
  apiKeyExpiryAnswer[inputs[12].key] = moment().add(Number(apiKeyExpiryAnswer[inputs[12].key]), 'days').unix();
  context.print.info(`Expiry date of the API key set to: ${moment.unix(apiKeyExpiryAnswer[inputs[12].key]).local().format('YYYY-MM-DD HH:mm:ss')}`);
  return apiKeyExpiryAnswer;
}

async function askDataSourceQuestions(context, inputs) {
  const dataSourceTypeQuestion = {
    type: inputs[13].type,
    name: inputs[13].key,
    message: inputs[13].question,
    choices: inputs[13].options,
  };
  const dataSources = {};
  const dependsOn = [];
  let continueDataSourcesQuestion = true;

  // Ask data source related questions

  while (continueDataSourcesQuestion) {
    const dataSourceAnswer = await inquirer.prompt([dataSourceTypeQuestion]);
    switch (dataSourceAnswer[inputs[13].key]) {
      case 'DynamoDb': {
        const dynamoAnswers = await askDynamoDBQuestions(context, inputs);
        Object.assign(dynamoAnswers, { category: 'storage' });
        if (!dataSources.dynamoDb) {
          dataSources.dynamoDb = [dynamoAnswers];
        } else {
          dataSources.dynamoDb.push(dynamoAnswers);
        }
        if (!dynamoAnswers.Arn) {
          dependsOn.push({
            category: 'storage',
            resourceName: dynamoAnswers.resourceName,
            attributes: ['Name', 'Arn'],
          });
        }
      }
        break;
      case 'Lambda': {
        const lambdaAnswers = await askLambdaQuestions(context, inputs);
        Object.assign(lambdaAnswers, { category: 'function' });

        if (!dataSources.lambda) {
          dataSources.lambda = [lambdaAnswers];
        } else {
          dataSources.lambda.push(lambdaAnswers);
        }

        if (!lambdaAnswers.Arn) {
          dependsOn.push({
            category: 'function',
            resourceName: lambdaAnswers.resourceName,
            attributes: ['Name', 'Arn'],
          });
        }
      }
        break;
      default: context.print.error('Feature not yet implemented');
    }
    continueDataSourcesQuestion = await context.prompt.confirm('Do you want to add another data source?');
  }

  return { dataSources, dependsOn };
}

async function askDynamoDBQuestions(context, inputs) {
  const dynamoDbTypeQuestion = {
    type: inputs[14].type,
    name: inputs[14].key,
    message: inputs[14].question,
    choices: inputs[14].options,
  };
  while (true) {
    const dynamoDbTypeAnswer = await inquirer.prompt([dynamoDbTypeQuestion]);
    switch (dynamoDbTypeAnswer[inputs[14].key]) {
      case 'currentProject': {
        const storageResources = context.amplify.getProjectDetails().amplifyMeta.storage;
        const dynamoDbProjectResources = [];
        Object.keys(storageResources).forEach((resourceName) => {
          if (storageResources[resourceName].service === 'DynamoDB') {
            dynamoDbProjectResources.push(resourceName);
          }
        });
        if (dynamoDbProjectResources.length === 0) {
          context.print.error('There are no DynamoDb resources configured in your project currently');
          break;
        }
        const dynamoResourceQuestion = {
          type: inputs[15].type,
          name: inputs[15].key,
          message: inputs[15].question,
          choices: dynamoDbProjectResources,
        };

        const dynamoResourceAnswer = await inquirer.prompt([dynamoResourceQuestion]);

        return { resourceName: dynamoResourceAnswer[inputs[15].key] };
      }
      case 'newResource': {
        let add;
        try {
          ({ add } = require('amplify-category-storage'));
        } catch (e) {
          context.print.error('Storage plugin not installed in the CLI. Please install it to use this feature');
          break;
        }
        return add(context, 'amplify-provider-awscloudformation', 'DynamoDB')
          .then((resourceName) => {
            context.print.success('Succesfully added DynamoDb table localy');
            return { resourceName };
          });
      }
      case 'cloudResource': {
        const regions = await context.amplify.executeProviderUtils(context, 'amplify-provider-awscloudformation', 'getRegions');

        const regionQuestion = {
          type: inputs[4].type,
          name: inputs[4].key,
          message: inputs[4].question,
          choices: regions,
        };

        const regionAnswer = await inquirer.prompt([regionQuestion]);

        const dynamodbTables = await context.amplify.executeProviderUtils(context, 'amplify-provider-awscloudformation', 'getDynamoDBTables', { region: regionAnswer[inputs[4].key] });

        const dynamodbOptions = dynamodbTables.map(dynamodbTable => ({
          value: {
            resourceName: dynamodbTable.Name.replace(/[^0-9a-zA-Z]/gi, ''),
            region: dynamodbTable.Region,
            Arn: dynamodbTable.Arn,
            TableName: dynamodbTable.Name,
          },
          name: `${dynamodbTable.Name} (${dynamodbTable.Arn})`,
        }));

        if (dynamodbOptions.length === 0) {
          context.print.error('You do not have any DynamoDB tables configured for the selected region');
          break;
        }

        const dynamoCloudOptionQuestion = {
          type: inputs[19].type,
          name: inputs[19].key,
          message: inputs[19].question,
          choices: dynamodbOptions,
        };

        const dynamoCloudOptionAnswer = await inquirer.prompt([dynamoCloudOptionQuestion]);
        return dynamoCloudOptionAnswer[inputs[19].key];
      }
      default: context.print.error('Invalid option selected');
    }
  }
}

async function askLambdaQuestions(context, inputs) {
  const lambdaTypeQuestion = {
    type: inputs[16].type,
    name: inputs[16].key,
    message: inputs[16].question,
    choices: inputs[16].options,
  };
  while (true) {
    const lambdaTypeAnswer = await inquirer.prompt([lambdaTypeQuestion]);
    switch (lambdaTypeAnswer[inputs[16].key]) {
      case 'currentProject': {
        const storageResources = context.amplify.getProjectDetails().amplifyMeta.function;
        const lambdaProjectResources = [];
        Object.keys(storageResources).forEach((resourceName) => {
          if (storageResources[resourceName].service === 'Lambda') {
            lambdaProjectResources.push(resourceName);
          }
        });
        if (lambdaProjectResources.length === 0) {
          context.print.error('There are no Lambda resources configured in your project currently');
          break;
        }
        const lambdaResourceQuestion = {
          type: inputs[17].type,
          name: inputs[17].key,
          message: inputs[17].question,
          choices: lambdaProjectResources,
        };

        const lambdaResourceAnswer = await inquirer.prompt([lambdaResourceQuestion]);

        return { resourceName: lambdaResourceAnswer[inputs[17].key] };
      }
      case 'newResource': {
        let add;
        try {
          ({ add } = require('amplify-category-function'));
        } catch (e) {
          context.print.error('Function plugin not installed in the CLI. Please install it to use this feature');
          break;
        }
        return add(context, 'amplify-provider-awscloudformation', 'Lambda')
          .then((resourceName) => {
            context.print.success('Succesfully added Lambda table localy');
            return { resourceName };
          });
      }
      case 'cloudResource': {
        const regions = await context.amplify.executeProviderUtils(context, 'amplify-provider-awscloudformation', 'getRegions');

        const regionQuestion = {
          type: inputs[4].type,
          name: inputs[4].key,
          message: inputs[4].question,
          choices: regions,
        };

        const regionAnswer = await inquirer.prompt([regionQuestion]);

        const lambdaFunctions = await context.amplify.executeProviderUtils(context, 'amplify-provider-awscloudformation', 'getLambdaFunctions', { region: regionAnswer[inputs[4].key] });

        const lambdaOptions = lambdaFunctions.map(lambdaFunction => ({
          value: {
            resourceName: lambdaFunction.FunctionName.replace(/[^0-9a-zA-Z]/gi, ''),
            Arn: lambdaFunction.FunctionArn,
            FunctionName: lambdaFunction.FunctionName,
          },
          name: `${lambdaFunction.FunctionName} (${lambdaFunction.FunctionArn})`,
        }));

        if (lambdaOptions.length === 0) {
          context.print.error('You do not have any lambda functions configured for the selected region');
          break;
        }

        const lambdaCloudOptionQuestion = {
          type: inputs[18].type,
          name: inputs[18].key,
          message: inputs[18].question,
          choices: lambdaOptions,
        };

        const lambdaCloudOptionAnswer = await inquirer.prompt([lambdaCloudOptionQuestion]);
        return lambdaCloudOptionAnswer[inputs[18].key];
      }
      default: context.print.error('Invalid option selected');
    }
  }
}

module.exports = { serviceWalkthrough };
