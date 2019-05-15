const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');

const categoryName = 'function';
const serviceName = 'Lambda';
const functionParametersFileName = 'function-parameters.json';

const parametersFileName = 'parameters.json';

async function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());
  let dependsOn = [];
  const parameters = {};
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


  if (await context.amplify.confirmPrompt.run('Do you want to access resources created in your Amplify Project from your Lambda function?')) {
    await askExecRolePermissionsQuestions(context, allDefaultValues, parameters);
  }
  allDefaultValues.parameters = parameters;
  ({ dependsOn } = allDefaultValues);
  return { answers: allDefaultValues, dependsOn };
}

async function updateWalkthrough(context) {
  const { allResources } = await context.amplify.getResourceStatus();
  const resources = allResources
    .filter(resource => resource.service === serviceName)
    .map(resource => resource.resourceName);

  if (resources.length === 0) {
    context.print.error('No Lambda Functions resource to update. Please use "amplify add function" command to create a new Function');
    process.exit(0);
    return;
  }

  const resourceQuestion = [{
    name: 'resourceName',
    message: 'Please select the Lambda Function you would want to update',
    type: 'list',
    choices: resources,
  }];

  const newParams = {};
  const answers = {};
  const currentDefaults = {};
  let dependsOn;

  const resourceAnswer = await inquirer.prompt(resourceQuestion);
  answers.resourceName = resourceAnswer.resourceName;

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(
    projectBackendDirPath, categoryName,
    resourceAnswer.resourceName,
  );
  const parametersFilePath = path.join(resourceDirPath, functionParametersFileName);
  let currentParameters;
  try {
    currentParameters = JSON.parse(fs.readFileSync(parametersFilePath));
  } catch (e) {
    currentParameters = {};
  }
  if (currentParameters.permissions) {
    currentDefaults.categories = Object.keys(currentParameters.permissions);
    currentDefaults.categoryPermissionMap = currentParameters.permissions;
  }

  if (await context.amplify.confirmPrompt.run('Do you want to update permissions for access resources created in your Amplify Project from your Lambda function?')) {
    await askExecRolePermissionsQuestions(context, answers, newParams, currentDefaults);

    const cfnFileName = `${resourceAnswer.resourceName}-cloudformation-template.json`;
    const cfnFilePath = path.join(resourceDirPath, cfnFileName);
    const cfnContent = JSON.parse(fs.readFileSync(cfnFilePath));
    const dependsOnParams = { env: { Type: 'String' } };

    Object.keys(answers.resourcePropertiesJSON).forEach((resourceProperty) => {
      dependsOnParams[resourceProperty] = {
        Type: 'String',
        Default: resourceProperty,
      };
    });
    cfnContent.Parameters = dependsOnParams;

    Object.assign(answers.resourcePropertiesJSON, { ENV: { Ref: 'env' } });

    if (!cfnContent.Resources.AmplifyResourcesPolicy) {
      cfnContent.Resources.AmplifyResourcesPolicy = {
        DependsOn: [
          'LambdaExecutionRole',
        ],
        Type: 'AWS::IAM::Policy',
        Properties: {
          PolicyName: 'amplify-lambda-execution-policy',
          Roles: [
            {
              Ref: 'LambdaExecutionRole',
            },
          ],
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [],
          },
        },
      };
    }

    if (answers.categoryPolicies.length === 0) {
      delete cfnContent.Resources.AmplifyResourcesPolicy;
    } else {
      cfnContent.Resources.AmplifyResourcesPolicy.Properties.PolicyDocument.Statement =
      answers.categoryPolicies;
    }
    cfnContent.Resources.LambdaFunction.Properties.Environment.Variables =
      answers.resourcePropertiesJSON;
    fs.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
    answers.parameters = newParams;
    ({ dependsOn } = answers);
    if (!dependsOn) {
      dependsOn = [];
    }
  }
  return { answers, dependsOn };
}

async function askExecRolePermissionsQuestions(
  context,
  allDefaultValues,
  parameters, currentDefaults,
) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

  let categories = Object.keys(amplifyMeta);
  categories = categories.filter(category => category !== 'providers');

  const categoryPermissionQuestion = {
    type: 'checkbox',
    name: 'categories',
    message: 'Select the category',
    choices: categories,
    default: (currentDefaults ? currentDefaults.categories : undefined),
  };

  const categoryPermissionAnswer = await inquirer.prompt([categoryPermissionQuestion]);
  const selectedCategories = categoryPermissionAnswer.categories;
  let categoryPolicies = [];
  let resources = [];
  const crudOptions = ['create', 'read', 'update', 'delete'];
  parameters.permissions = {};

  const categoryPlugins = context.amplify.getCategoryPlugins(context);
  for (let i = 0; i < selectedCategories.length; i += 1) {
    const category = selectedCategories[i];

    const resourcesList = Object.keys(amplifyMeta[category]);

    if (resourcesList.length === 0) {
      context.print.warning(`No resources found for ${category}`);
      continue;
    }

    try {
      const { getPermissionPolicies } = require(categoryPlugins[category]);
      if (!getPermissionPolicies) {
        context.print.warning(`Policies cannot be added for ${category}`);
        continue;
      } else {
        const resourceQuestion = {
          type: 'checkbox',
          name: 'resources',
          message: `Select the resources for ${category} category`,
          choices: resourcesList,
          validate: (value) => {
            if (value.length === 0) {
              return 'You must select at least resource';
            }

            return true;
          },
          default: () => {
            if (currentDefaults && currentDefaults.categoryPermissionMap[category]) {
              return Object.keys(currentDefaults.categoryPermissionMap[category]);
            }
          },
        };

        const resourceAnswer = await inquirer.prompt([resourceQuestion]);
        const selectedResources = resourceAnswer.resources;

        for (let j = 0; j < selectedResources.length; j += 1) {
          const resourceName = selectedResources[j];
          const crudPermissionQuestion = {
            type: 'checkbox',
            name: 'crudOptions',
            message: `Select the operations you want to permit for ${resourceName}`,
            choices: crudOptions,
            validate: (value) => {
              if (value.length === 0) {
                return 'You must select at least one operation';
              }

              return true;
            },
            default: () => {
              if (currentDefaults && currentDefaults.categoryPermissionMap[category]
                && currentDefaults.categoryPermissionMap[category][resourceName]) {
                return currentDefaults.categoryPermissionMap[category][resourceName];
              }
            },
          };

          const crudPermissionAnswer = await inquirer.prompt([crudPermissionQuestion]);
          if (!parameters.permissions[category]) {
            parameters.permissions[category] = {};
          }
          parameters.permissions[category][resourceName] = crudPermissionAnswer.crudOptions;
        }
        if (selectedResources.length > 0) {
          const { permissionPolicies, resourceAttributes } =
          await getPermissionPolicies(context, parameters.permissions[category]);
          categoryPolicies = categoryPolicies.concat(permissionPolicies);
          resources = resources.concat(resourceAttributes);
        }
      }
    } catch (e) {
      context.print.warning(`Policies cannot be added for ${category}`);
      context.print.info(e.stack);
    }
  }

  allDefaultValues.categoryPolicies = categoryPolicies;
  const resourceProperties = [];
  const resourcePropertiesJSON = {};
  const categoryMapping = {};
  resources.forEach((resource) => {
    const { category, resourceName, attributes } = resource;
    attributes.forEach((attribute) => {
      resourceProperties.push(`"${category}${resourceName}${attribute}": {"Ref": "${category}${resourceName}${attribute}"}`);
      resourcePropertiesJSON[`${category}${resourceName}${attribute}`] = { Ref: `${category}${resourceName}${attribute}` };
      if (!categoryMapping[category]) {
        categoryMapping[category] = [];
      }
      categoryMapping[category].push(`${category}${resourceName}${attribute}`);
    });
    if (!allDefaultValues.dependsOn) {
      allDefaultValues.dependsOn = [];
    }
    allDefaultValues.dependsOn.push({
      category: resource.category,
      resourceName: resource.resourceName,
      attributes: resource.attributes,
    });
  });

  allDefaultValues.resourceProperties = resourceProperties.join(',');
  allDefaultValues.resourcePropertiesJSON = resourcePropertiesJSON;

  context.print.info('');
  context.print.info('You can access the following resource attributes as variables from your Lambda function');
  Object.keys(categoryMapping).forEach((category) => {
    if (categoryMapping[category].length > 0) {
      context.print.info(category);
      context.print.info('------------');
      categoryMapping[category].forEach((resourceAttribute) => {
        context.print.info(`process.env.${resourceAttribute}`);
      });
    }
    context.print.info('');
  });
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
    parameters = context.amplify.readJsonFile(parametersFilePath);
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

function migrate(context, projectPath, resourceName) {
  const resourceDirPath = path.join(projectPath, 'amplify', 'backend', categoryName, resourceName);
  const cfnFilePath = path.join(resourceDirPath, `${resourceName}-cloudformation-template.json`);
  const oldCfn = context.amplify.readJsonFile(cfnFilePath);
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

function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  const actions = [];

  crudOptions.forEach((crudOption) => {
    switch (crudOption) {
      case 'create': actions.push(
        'lambda:Create*',
        'lambda:Put*',
        'lambda:Add*',
      );
        break;
      case 'update': actions.push('lambda:Update*');
        break;
      case 'read': actions.push('lambda:Get*', 'lambda:List*', 'lambda:Invoke*');
        break;
      case 'delete': actions.push('lambda:Delete*', 'lambda:Remove*');
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
            'arn:aws:lambda:',
            {
              Ref: 'AWS::Region',
            },
            ':',
            { Ref: 'AWS::AccountId' },
            ':function',
            {
              Ref: `${categoryName}${resourceName}Name`,
            },
          ],
        ],
      },
    ],
  };

  const attributes = ['Name'];

  return { policy, attributes };
}

module.exports = {
  serviceWalkthrough, updateWalkthrough, migrate, getIAMPolicies,
};
