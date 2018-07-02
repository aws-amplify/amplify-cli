const inquirer = require('inquirer');

function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  const questions = [];
  for (let i = 0; i < 3; i += 1) {
    let question = {
      name: inputs[i].key,
      message: inputs[i].question,
      validate: amplify.inputValidation(inputs[i]),
      default: () => {
        const defaultValue = allDefaultValues[inputs[i].key];
        return defaultValue;
      },
    };

    if (inputs[i].type && inputs[i].type === 'list') {
      question = Object.assign({
        type: 'list',
        choices: inputs[i].options,
      }, question);
    } else if (inputs[i].type && inputs[i].type === 'multiselect') {
      question = Object.assign({
        type: 'checkbox',
        choices: inputs[i].options,
      }, question);
    } else {
      question = Object.assign({
        type: 'input',
      }, question);
    }
    questions.push(question);
  }

  return inquirer.prompt(questions)
    .then((answers) => {
      if (answers.templateSelection === 'default') {
        Object.assign(allDefaultValues, answers);
        return allDefaultValues;
      }
      return askCustomQuestions(context, inputs)
        .then((result) => {
          Object.assign(allDefaultValues, result.answers);
          allDefaultValues.customCfnFile = 'appSync-cloudformation-template-custom.yml.ejs';
          return { answers: allDefaultValues, dependsOn: result.dependsOn };
        });
    });
}

async function askCustomQuestions(context, inputs) {
  const answers = {};
  let dependsOn = [];

  if (await context.prompt.confirm('Do you want to add a data source to your AppSync API?')) {
    const dataSourceAnswers = await askDataSourceQuestions(context, inputs);
    const { dataSources } = dataSourceAnswers;
    ({ dependsOn } = dataSourceAnswers.dependsOn);
    Object.assign(answers, { dataSources });
    Object.assign(answers, { dependsOn });
  }
  return { answers, dependsOn };
}
async function askDataSourceQuestions(context, inputs) {
  const dataSourceTypeQuestion = {
    type: inputs[3].type,
    name: inputs[3].key,
    message: inputs[3].question,
    choices: inputs[3].options,
  };
  const dataSources = {};
  const dependsOn = [];
  let continueDataSourcesQuestion = true;

  // Ask data source related questions

  while (continueDataSourcesQuestion) {
    const dataSourceAnswer = await inquirer.prompt([dataSourceTypeQuestion]);
    switch (dataSourceAnswer[inputs[3].key]) {
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
    type: inputs[4].type,
    name: inputs[4].key,
    message: inputs[4].question,
    choices: inputs[4].options,
  };
  const dynamoDbTypeAnswer = await inquirer.prompt([dynamoDbTypeQuestion]);
  while (true) {
    switch (dynamoDbTypeAnswer[inputs[4].key]) {
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
          type: inputs[5].type,
          name: inputs[5].key,
          message: inputs[5].question,
          choices: dynamoDbProjectResources,
        };

        const dynamoResourceAnswer = await inquirer.prompt([dynamoResourceQuestion]);

        return dynamoResourceAnswer[inputs[5].key];
      }
      case 'newResource': {
        const { add } = require('amplify-category-storage');
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
