const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');

const category = 'function';

const parametersFileName = 'parameters.json';

async function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());
  const dependsOn = [];
  // Ask resource and Lambda function name

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
  ];

  const pathDetails = {
    path: '/items',
  };

  if (context.api) {
    inputs[4].options.splice(0, 1);
    Object.assign(pathDetails, context.api);
    resourceQuestions.push({
      type: inputs[4].type,
      name: inputs[4].key,
      message: inputs[4].question,
      choices: inputs[4].options,
      default: 'crud',
    });
  } else {
    resourceQuestions.push({
      type: inputs[4].type,
      name: inputs[4].key,
      message: inputs[4].question,
      choices: inputs[4].options,
    });
  }

  const answers = await inquirer.prompt(resourceQuestions);

  Object.assign(allDefaultValues, pathDetails, answers);
  if (answers.functionTemplate === 'crud') {
    const dynamoAnswers = await askDynamoDBQuestions(context, inputs);

    const tableParameters = await getTableParameters(context, dynamoAnswers);
    Object.assign(
      dynamoAnswers,
      { category: 'storage' },
      { tableDefinition: { ...tableParameters } },
    );
    Object.assign(allDefaultValues, { database: dynamoAnswers });

    if (!dynamoAnswers.Arn) {
      dependsOn.push({
        category: 'storage',
        resourceName: dynamoAnswers.resourceName,
        attributes: ['Name', 'Arn'],
      });
    }
    allDefaultValues.dependsOn = dependsOn;
  }
  return { answers: allDefaultValues, dependsOn };
}

async function getTableParameters(context, dynamoAnswers) {
  if (dynamoAnswers.Arn) { // Looking for table parameters on DynamoDB public API
    const hashKey = dynamoAnswers.KeySchema.find(attr => attr.KeyType === 'HASH') || {};
    const hashType = dynamoAnswers.AttributeDefinitions.find(attr =>
      attr.AttributeName === hashKey.AttributeName) || {};
    const rangeKey = dynamoAnswers.KeySchema.find(attr =>
      attr.KeyType === 'RANGE') || {};
    const rangeType = dynamoAnswers.AttributeDefinitions.find(attr =>
      attr.AttributeName === rangeKey.AttributeName) || {};
    return {
      tableName: dynamoAnswers.TableName,
      partitionKeyName: hashKey.AttributeName,
      partitionKeyType: hashType.AttributeType,
      sortKeyName: rangeKey.AttributeName,
      sortKeyType: rangeType.AttributeType,
    };
  } // Looking for table parameters on local configuration
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, 'storage', dynamoAnswers.resourceName);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  let parameters;
  try {
    parameters = JSON.parse(fs.readFileSync(parametersFilePath));
  } catch (e) {
    parameters = {};
  }

  return parameters;
}

async function askDynamoDBQuestions(context, inputs) {
  const dynamoDbTypeQuestion = {
    type: inputs[5].type,
    name: inputs[5].key,
    message: inputs[5].question,
    choices: inputs[5].options,
  };
  while (true) { //eslint-disable-line
    const dynamoDbTypeAnswer = await inquirer.prompt([dynamoDbTypeQuestion]);
    switch (dynamoDbTypeAnswer[inputs[5].key]) {
      case 'currentProject': {
        const storageResources = context.amplify.getProjectDetails().amplifyMeta.storage;
        const dynamoDbProjectResources = [];
        if (!storageResources) {
          context.print.error('There are no DynamoDB resources configured in your project currently');
          break;
        }
        Object.keys(storageResources).forEach((resourceName) => {
          if (storageResources[resourceName].service === 'DynamoDB') {
            dynamoDbProjectResources.push(resourceName);
          }
        });
        if (dynamoDbProjectResources.length === 0) {
          context.print.error('There are no DynamoDB resources configured in your project currently');
          break;
        }
        const dynamoResourceQuestion = {
          type: inputs[6].type,
          name: inputs[6].key,
          message: inputs[6].question,
          choices: dynamoDbProjectResources,
        };

        const dynamoResourceAnswer = await inquirer.prompt([dynamoResourceQuestion]);

        return { resourceName: dynamoResourceAnswer[inputs[6].key] };
      }
      case 'newResource': {
        let add;
        try {
          ({ add } = require('amplify-category-storage'));
        } catch (e) {
          context.print.error('Storage plugin is not installed in the CLI. You must install it to use this feature.');
          break;
        }
        return add(context, 'awscloudformation', 'DynamoDB')
          .then((resourceName) => {
            context.print.success('Succesfully added DynamoDb table locally');
            return { resourceName };
          });
      }
      /* eslint-disable */

      /*Commented this section until we figure out
        multi-environemnt solution for existing tables - NOT CRITICAL

        case 'cloudResource': {
        const dynamodbTables =
          await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getDynamoDBTables');
        const dynamodbOptions = dynamodbTables.map(dynamodbTable => ({
          value: {
            resourceName: dynamodbTable.Name,
            region: dynamodbTable.Region,
            Arn: dynamodbTable.Arn,
            TableName: dynamodbTable.Name,
            KeySchema: dynamodbTable.KeySchema,
            AttributeDefinitions: dynamodbTable.AttributeDefinitions,
          },
          name: `${dynamodbTable.Name} (${dynamodbTable.Arn})`,
        }));

        if (dynamodbOptions.length === 0) {
          context.print.error('You do not have any DynamoDB tables configured for the selected Region');
          break;
        }

        const dynamoCloudOptionQuestion = {
          type: inputs[7].type,
          name: inputs[7].key,
          message: inputs[7].question,
          choices: dynamodbOptions,
        };

        const dynamoCloudOptionAnswer = await inquirer.prompt([dynamoCloudOptionQuestion]);
        return dynamoCloudOptionAnswer[inputs[7].key];
      } */

      /* eslint-enable */
      default: context.print.error('Invalid option selected');
    }
  }
}

function migrate(projectPath, resourceName) {
  const resourceDirPath = path.join(projectPath, 'amplify', 'backend', category, resourceName);
  const cfnFilePath = path.join(resourceDirPath, `${resourceName}-cloudformation-template.json`);
  const oldCfn = JSON.parse(fs.readFileSync(cfnFilePath, 'utf8'));
  const newCfn = {};
  Object.assign(newCfn, oldCfn);

  // Add env parameter
  if (!newCfn.Parameters) {
    newCfn.Parameters = {};
  }
  newCfn.Parameters.env = {
    Type: 'String',
  };

  // Add conditions block
  if (!newCfn.Conditions) {
    newCfn.Conditions = {};
  }
  newCfn.Conditions.ShouldNotCreateEnvResources = {
    'Fn::Equals': [
      {
        Ref: 'env',
      },
      'NONE',
    ],
  };

  // Add if condition for resource name change
  const oldFunctionName = newCfn.Resources.LambdaFunction.Properties.FunctionName;

  newCfn.Resources.LambdaFunction.Properties.FunctionName = {
    'Fn::If': [
      'ShouldNotCreateEnvResources',
      oldFunctionName,
      {

        'Fn::Join': [
          '',
          [
            oldFunctionName,
            '-',
            {
              Ref: 'env',
            },
          ],
        ],
      },
    ],
  };

  newCfn.Resources.LambdaFunction.Properties.Environment = { Variables: { ENV: { Ref: 'env' } } };

  const oldRoleName = newCfn.Resources.LambdaExecutionRole.Properties.RoleName;

  newCfn.Resources.LambdaExecutionRole.Properties.RoleName = {
    'Fn::If': [
      'ShouldNotCreateEnvResources',
      oldRoleName,
      {

        'Fn::Join': [
          '',
          [
            oldRoleName,
            '-',
            {
              Ref: 'env',
            },
          ],
        ],
      },
    ],
  };

  const jsonString = JSON.stringify(newCfn, null, '\t');
  fs.writeFileSync(cfnFilePath, jsonString, 'utf8');
}

module.exports = { serviceWalkthrough, migrate };
