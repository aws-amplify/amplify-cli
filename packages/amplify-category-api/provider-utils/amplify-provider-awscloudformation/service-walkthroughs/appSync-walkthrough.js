const inquirer = require('inquirer');
const moment = require('moment');

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
    return allDefaultValues;
  }

  return askCustomQuestions(context, inputs)
    .then((result) => {
      Object.assign(allDefaultValues, result.answers);
      allDefaultValues.customCfnFile = 'appSync-cloudformation-template-custom.yml.ejs';
      return { answers: allDefaultValues, dependsOn: result.dependsOn };
    });
}

async function askCustomQuestions(context, inputs) {
  const answers = {};
  let dependsOn = [];

  const securitySetting = await askSecurityQuestions(context, inputs);
  Object.assign(answers, { securitySetting });

  if (await context.prompt.confirm('Do you want to add a data source to your AppSync API?')) {
    const dataSourceAnswers = await askDataSourceQuestions(context, inputs);
    const { dataSources } = dataSourceAnswers;
    ({ dependsOn } = dataSourceAnswers);
    Object.assign(answers, { dataSources });
    Object.assign(answers, { dependsOn });
  }
  return { answers, dependsOn };
}

async function askSecurityQuestions(context, inputs) {
  const securityTypeQuestion = {
    type: inputs[3].type,
    name: inputs[3].key,
    message: inputs[3].question,
    choices: inputs[3].options,
  };

  const securitySetting = {};

  const securityTypeAnswer = await inquirer.prompt([securityTypeQuestion]);
  securitySetting.type = securityTypeAnswer[inputs[3].key];

  switch (securityTypeAnswer[inputs[3].key]) {
    case 'cognito': securitySetting.options = await askCognitoQuestions(context, inputs);
      break;
    case 'openId': securitySetting.options = await askOpenIdQuestions(context, inputs);
      break;
    case 'apiKey': securitySetting.options = await askApiKeyQuestions(context, inputs);
      break;
    case 'iam': break;
    default: context.print.error('Invalid option');
  }

  return securitySetting;
}

async function askCognitoQuestions(context, inputs) {
  const { amplify } = context;


  const userPoolIdQuestion = {
    type: inputs[4].type,
    name: inputs[4].key,
    message: inputs[4].question,
    validate: amplify.inputValidation(inputs[4]),
  };

  const defaultActionQuestion = {
    type: inputs[5].type,
    name: inputs[5].key,
    message: inputs[5].question,
    choices: inputs[5].options,
    validate: amplify.inputValidation(inputs[5]),
  };

  const appIdClientRegexQuestion = {
    type: inputs[6].type,
    name: inputs[6].key,
    message: inputs[6].question,
    validate: amplify.inputValidation(inputs[6]),
  };

  return await inquirer.prompt([userPoolIdQuestion,
    defaultActionQuestion,
    appIdClientRegexQuestion]);
}

async function askOpenIdQuestions(context, inputs) {
  const { amplify } = context;

  const openIdDomainQuestion = {
    type: inputs[7].type,
    name: inputs[7].key,
    message: inputs[7].question,
    validate: amplify.inputValidation(inputs[7]),
  };

  const clientIdQuestion = {
    type: inputs[8].type,
    name: inputs[8].key,
    message: inputs[8].question,
    validate: amplify.inputValidation(inputs[8]),
  };

  const issueTTLQuestion = {
    type: inputs[9].type,
    name: inputs[9].key,
    message: inputs[9].question,
    validate: amplify.inputValidation(inputs[9]),
    default: 0,
  };

  const authTTLQuestion = {
    type: inputs[10].type,
    name: inputs[10].key,
    message: inputs[10].question,
    validate: amplify.inputValidation(inputs[10]),
    default: 0,
  };

  return await inquirer.prompt([openIdDomainQuestion,
    clientIdQuestion,
    issueTTLQuestion,
    authTTLQuestion]);
}

async function askApiKeyQuestions(context, inputs) {
  const apiKeyExpiryQuestion = {
    type: inputs[11].type,
    name: inputs[11].key,
    message: inputs[11].question,
    validate: answer => new Promise((resolve, reject) => {
      if (!answer || Number.isNaN(answer) || Number(answer) <= 0 || Number(answer) > 365) {
        reject(new Error('The number of days should be set between 1 to 365'));
      }
      resolve(true);
    }),
  };

  const apiKeyExpiryAnswer = await inquirer.prompt([apiKeyExpiryQuestion]);
  apiKeyExpiryAnswer[inputs[11].key] = moment().add(Number(apiKeyExpiryAnswer[inputs[11].key]), 'days').unix();
  context.print.info(`Expiry date of the API key set to: ${moment.unix(apiKeyExpiryAnswer[inputs[11].key]).local().format('YYYY-MM-DD HH:mm:ss')}`);
  return apiKeyExpiryAnswer;
}

async function askDataSourceQuestions(context, inputs) {
  const dataSourceTypeQuestion = {
    type: inputs[12].type,
    name: inputs[12].key,
    message: inputs[12].question,
    choices: inputs[12].options,
  };
  const dataSources = {};
  const dependsOn = [];
  let continueDataSourcesQuestion = true;

  // Ask data source related questions

  while (continueDataSourcesQuestion) {
    const dataSourceAnswer = await inquirer.prompt([dataSourceTypeQuestion]);
    switch (dataSourceAnswer[inputs[12].key]) {
      case 'DynamoDb': {
        const resourceName = await askDynamoDBQuestions(context, inputs);
        if (!dataSources.dynamoDb) {
          dataSources.dynamoDb = [{ category: 'storage', resourceName }];
        } else {
          dataSources.dynamoDb.push({ category: 'storage', resourceName });
        }
        dependsOn.push({
          category: 'storage',
          resourceName,
          attributes: ['Name', 'Arn'],
        });
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
    type: inputs[13].type,
    name: inputs[13].key,
    message: inputs[13].question,
    choices: inputs[13].options,
  };
  while (true) {
    const dynamoDbTypeAnswer = await inquirer.prompt([dynamoDbTypeQuestion]);
    switch (dynamoDbTypeAnswer[inputs[13].key]) {
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
          type: inputs[14].type,
          name: inputs[14].key,
          message: inputs[14].question,
          choices: dynamoDbProjectResources,
        };

        const dynamoResourceAnswer = await inquirer.prompt([dynamoResourceQuestion]);

        return dynamoResourceAnswer[inputs[14].key];
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
            return resourceName;
          });
      }
      default: context.print.error('Invalid option selected');
    }
  }
}


module.exports = { serviceWalkthrough };
