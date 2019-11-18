const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const TransformPackage = require('graphql-transformer-core');

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
    Object.assign(dynamoAnswers, { category: 'storage' }, { tableDefinition: { ...tableParameters } });
    Object.assign(allDefaultValues, { database: dynamoAnswers });

    if (!dynamoAnswers.Arn) {
      dependsOn.push({
        category: 'storage',
        resourceName: dynamoAnswers.resourceName,
        attributes: ['Name', 'Arn'],
      });
    }
    allDefaultValues.dependsOn = dependsOn;
  } else if (answers.functionTemplate === 'lambdaTrigger') {
    const eventSourceAnswers = await askEventSourceQuestions(context, inputs);
    Object.assign(allDefaultValues, eventSourceAnswers);
    if (eventSourceAnswers.dependsOn) {
      dependsOn.push(...eventSourceAnswers.dependsOn);
    }
    allDefaultValues.dependsOn = dependsOn;
  }

  let topLevelComment;
  if (await context.amplify.confirmPrompt.run('Do you want to access other resources created in this project from your Lambda function?')) {
    ({ topLevelComment } = await askExecRolePermissionsQuestions(context, allDefaultValues, parameters));
  }
  allDefaultValues.parameters = parameters;
  allDefaultValues.topLevelComment = topLevelComment;
  ({ dependsOn } = allDefaultValues);
  return { answers: allDefaultValues, dependsOn };
}

async function updateWalkthrough(context, lambdaToUpdate) {
  const { allResources } = await context.amplify.getResourceStatus();
  const resources = allResources.filter(resource => resource.service === serviceName).map(resource => resource.resourceName);

  if (resources.length === 0) {
    context.print.error('No Lambda Functions resource to update. Please use "amplify add function" command to create a new Function');
    process.exit(0);
    return;
  }

  const resourceQuestion = [
    {
      name: 'resourceName',
      message: 'Please select the Lambda Function you would want to update',
      type: 'list',
      choices: resources,
    },
  ];

  const newParams = {};
  const answers = {};
  const currentDefaults = {};
  let dependsOn;

  const resourceAnswer = !lambdaToUpdate ? await inquirer.prompt(resourceQuestion) : { resourceName: lambdaToUpdate };
  answers.resourceName = resourceAnswer.resourceName;

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, resourceAnswer.resourceName);
  const parametersFilePath = path.join(resourceDirPath, functionParametersFileName);
  let currentParameters;
  try {
    currentParameters = context.amplify.readJsonFile(parametersFilePath);
  } catch (e) {
    currentParameters = {};
  }
  if (currentParameters.permissions) {
    currentDefaults.categories = Object.keys(currentParameters.permissions);
    currentDefaults.categoryPermissionMap = currentParameters.permissions;
  }

  if (
    await context.amplify.confirmPrompt.run(
      'Do you want to update permissions granted to this Lambda function to perform on other resources in your project?'
    )
  ) {
    // Get current dependsOn for the resource

    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
    const resourceDependsOn = amplifyMeta.function[answers.resourceName].dependsOn || [];
    answers.dependsOn = resourceDependsOn;

    const { topLevelComment } = await askExecRolePermissionsQuestions(context, answers, newParams, currentDefaults);

    const cfnFileName = `${resourceAnswer.resourceName}-cloudformation-template.json`;
    const cfnFilePath = path.join(resourceDirPath, cfnFileName);
    const cfnContent = context.amplify.readJsonFile(cfnFilePath);
    const dependsOnParams = { env: { Type: 'String' } };

    Object.keys(answers.resourcePropertiesJSON).forEach(resourceProperty => {
      dependsOnParams[answers.resourcePropertiesJSON[resourceProperty].Ref] = {
        Type: 'String',
        Default: answers.resourcePropertiesJSON[resourceProperty].Ref,
      };
    });

    cfnContent.Parameters = getNewCFNParameters(cfnContent.Parameters, currentParameters, dependsOnParams, newParams);

    Object.assign(answers.resourcePropertiesJSON, { ENV: { Ref: 'env' }, REGION: { Ref: 'AWS::Region' } });

    if (!cfnContent.Resources.AmplifyResourcesPolicy) {
      cfnContent.Resources.AmplifyResourcesPolicy = {
        DependsOn: ['LambdaExecutionRole'],
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
      cfnContent.Resources.AmplifyResourcesPolicy.Properties.PolicyDocument.Statement = answers.categoryPolicies;
    }

    cfnContent.Resources.LambdaFunction.Properties.Environment.Variables = getNewCFNEnvVariables(
      cfnContent.Resources.LambdaFunction.Properties.Environment.Variables,
      currentParameters,
      answers.resourcePropertiesJSON,
      newParams
    ); // Need to update
    // Update top level comment in app.js or index.js file

    const updateTopLevelComment = filePath => {
      const commentRegex = /\/\* Amplify Params - DO NOT EDIT[a-zA-Z0-9\-\s._=]+Amplify Params - DO NOT EDIT \*\//;
      let fileContents = fs.readFileSync(filePath).toString();
      const commentMatches = fileContents.match(commentRegex);
      if (!commentMatches || commentMatches.length === 0) {
        fileContents = topLevelComment + fileContents;
      } else {
        fileContents = fileContents.replace(commentRegex, topLevelComment);
      }
      fs.writeFileSync(filePath, fileContents);
    };
    const appJSFilePath = path.join(resourceDirPath, 'src', 'app.js');
    const indexJSFilePath = path.join(resourceDirPath, 'src', 'index.js');
    if (fs.existsSync(appJSFilePath)) {
      updateTopLevelComment(appJSFilePath);
    } else if (fs.existsSync(indexJSFilePath)) {
      updateTopLevelComment(indexJSFilePath);
    }

    fs.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
    answers.parameters = newParams;
    ({ dependsOn } = answers);
    if (!dependsOn) {
      dependsOn = [];
    }
  }
  return { answers, dependsOn };
}

function getNewCFNEnvVariables(oldCFNEnvVariables, currentDefaults, newCFNEnvVariables, newDefaults) {
  const currentResources = [];
  const newResources = [];
  const deletedResources = [];

  if (currentDefaults.permissions) {
    Object.keys(currentDefaults.permissions).forEach(category => {
      Object.keys(currentDefaults.permissions[category]).forEach(resourceName => {
        currentResources.push(`${category.toUpperCase()}_${resourceName.toUpperCase()}_`);
      });
    });
  }

  if (newDefaults.permissions) {
    Object.keys(newDefaults.permissions).forEach(category => {
      Object.keys(newDefaults.permissions[category]).forEach(resourceName => {
        newResources.push(`${category.toUpperCase()}_${resourceName.toUpperCase()}_`);
      });
    });
  }

  currentResources.forEach(resourceName => {
    if (newResources.indexOf(resourceName) === -1) {
      deletedResources.push(resourceName);
    }
  });

  const toBeDeletedEnvVariables = [];

  Object.keys(oldCFNEnvVariables).forEach(envVar => {
    for (let i = 0; i < deletedResources.length; i += 1) {
      if (envVar.includes(deletedResources[i])) {
        toBeDeletedEnvVariables.push(envVar);
        break;
      }
    }
  });

  toBeDeletedEnvVariables.forEach(envVar => {
    delete oldCFNEnvVariables[envVar];
  });

  Object.assign(oldCFNEnvVariables, newCFNEnvVariables);

  return oldCFNEnvVariables;
}

function getNewCFNParameters(oldCFNParameters, currentDefaults, newCFNResourceParameters, newDefaults) {
  const currentResources = [];
  const newResources = [];
  const deletedResources = [];

  if (currentDefaults.permissions) {
    Object.keys(currentDefaults.permissions).forEach(category => {
      Object.keys(currentDefaults.permissions[category]).forEach(resourceName => {
        currentResources.push(`${category}${resourceName}`);
      });
    });
  }

  if (newDefaults.permissions) {
    Object.keys(newDefaults.permissions).forEach(category => {
      Object.keys(newDefaults.permissions[category]).forEach(resourceName => {
        newResources.push(`${category}${resourceName}`);
      });
    });
  }

  currentResources.forEach(resourceName => {
    if (newResources.indexOf(resourceName) === -1) {
      deletedResources.push(resourceName);
    }
  });

  const toBeDeletedParameters = [];

  Object.keys(oldCFNParameters).forEach(parameter => {
    for (let i = 0; i < deletedResources.length; i += 1) {
      if (parameter.includes(deletedResources[i])) {
        toBeDeletedParameters.push(parameter);
        break;
      }
    }
  });
  toBeDeletedParameters.forEach(parameter => {
    delete oldCFNParameters[parameter];
  });

  Object.assign(oldCFNParameters, newCFNResourceParameters);

  return oldCFNParameters;
}

async function askExecRolePermissionsQuestions(context, allDefaultValues, parameters, currentDefaults) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);

  let categories = Object.keys(amplifyMeta);
  categories = categories.filter(category => category !== 'providers');

  const categoryPermissionQuestion = {
    type: 'checkbox',
    name: 'categories',
    message: 'Select the category',
    choices: categories,
    default: currentDefaults ? currentDefaults.categories : undefined,
  };
  const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
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
        let selectedResources = [];

        if (resourcesList.length === 1) {
          context.print.info(`${capitalizeFirstLetter(category)} category has a resource called ${resourcesList[0]}`);
          selectedResources = [resourcesList[0]];
        } else {
          const resourceQuestion = {
            type: 'checkbox',
            name: 'resources',
            message: `${capitalizeFirstLetter(category)} has ${
              resourcesList.length
            } resources in this project. Select the one you would like your Lambda to access`,
            choices: resourcesList,
            validate: value => {
              if (value.length === 0) {
                return 'You must select at least resource';
              }
              return true;
            },
            default: () => {
              if (currentDefaults && currentDefaults.categoryPermissionMap && currentDefaults.categoryPermissionMap[category]) {
                return Object.keys(currentDefaults.categoryPermissionMap[category]);
              }
            },
          };

          const resourceAnswer = await inquirer.prompt([resourceQuestion]);
          selectedResources = resourceAnswer.resources;
        }

        for (let j = 0; j < selectedResources.length; j += 1) {
          const resourceName = selectedResources[j];
          const crudPermissionQuestion = {
            type: 'checkbox',
            name: 'crudOptions',
            message: `Select the operations you want to permit for ${resourceName}`,
            choices: crudOptions,
            validate: value => {
              if (value.length === 0) {
                return 'You must select at least one operation';
              }

              return true;
            },
            default: () => {
              if (
                currentDefaults &&
                currentDefaults.categoryPermissionMap &&
                currentDefaults.categoryPermissionMap[category] &&
                currentDefaults.categoryPermissionMap[category][resourceName]
              ) {
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
          const { permissionPolicies, resourceAttributes } = await getPermissionPolicies(context, parameters.permissions[category]);
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
  resources.forEach(resource => {
    const { category, resourceName, attributes } = resource;
    attributes.forEach(attribute => {
      const envName = `${category.toUpperCase()}_${resourceName.toUpperCase()}_${attribute.toUpperCase()}`;
      const varName = `${category}${capitalizeFirstLetter(resourceName)}${capitalizeFirstLetter(attribute)}`;
      const refName = `${category}${resourceName}${attribute}`;

      resourceProperties.push(`"${envName}": {"Ref": "${refName}"}`);
      resourcePropertiesJSON[`${envName}`] = { Ref: `${category}${resourceName}${attribute}` };
      if (!categoryMapping[category]) {
        categoryMapping[category] = [];
      }
      categoryMapping[category].push({ envName, varName });
    });

    if (!allDefaultValues.dependsOn) {
      allDefaultValues.dependsOn = [];
    }

    let resourceExists = false;
    allDefaultValues.dependsOn.forEach(amplifyResource => {
      if (amplifyResource.resourceName === resourceName) {
        resourceExists = true;
      }
    });

    if (!resourceExists) {
      allDefaultValues.dependsOn.push({
        category: resource.category,
        resourceName: resource.resourceName,
        attributes: resource.attributes,
      });
    }
  });

  allDefaultValues.resourceProperties = resourceProperties.join(',');
  allDefaultValues.resourcePropertiesJSON = resourcePropertiesJSON;

  context.print.info('');
  let topLevelComment = '/* Amplify Params - DO NOT EDIT\n';
  let terminalOutput = 'You can access the following resource attributes as environment variables from your Lambda function\n';
  terminalOutput += 'var environment = process.env.ENV\n';
  terminalOutput += 'var region = process.env.REGION\n';

  Object.keys(categoryMapping).forEach(category => {
    if (categoryMapping[category].length > 0) {
      categoryMapping[category].forEach(args => {
        terminalOutput += `var ${args.varName} = process.env.${args.envName}\n`;
      });
    }
  });

  context.print.info(terminalOutput);
  topLevelComment += `${terminalOutput}\nAmplify Params - DO NOT EDIT */`;

  return { topLevelComment };
}

async function getTableParameters(context, dynamoAnswers) {
  if (dynamoAnswers.Arn) {
    // Looking for table parameters on DynamoDB public API
    const hashKey = dynamoAnswers.KeySchema.find(attr => attr.KeyType === 'HASH') || {};
    const hashType = dynamoAnswers.AttributeDefinitions.find(attr => attr.AttributeName === hashKey.AttributeName) || {};
    const rangeKey = dynamoAnswers.KeySchema.find(attr => attr.KeyType === 'RANGE') || {};
    const rangeType = dynamoAnswers.AttributeDefinitions.find(attr => attr.AttributeName === rangeKey.AttributeName) || {};
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

async function askEventSourceQuestions(context, inputs) {
  const eventSourceTypeInput = inputs.find(input => input.key === 'eventSourceType');
  if (eventSourceTypeInput === undefined) {
    throw Error('Unable to find eventSourceType question data. (this is likely an amplify error, please report)');
  }

  const selectEventSourceQuestion = {
    type: eventSourceTypeInput.type,
    name: eventSourceTypeInput.key,
    message: eventSourceTypeInput.question,
    choices: eventSourceTypeInput.options,
  };

  const eventSourceTypeAnswer = await inquirer.prompt([selectEventSourceQuestion]);

  let arnInput;
  let arnQuestion;
  let arnAnswer;
  let eventSourceArn;
  let streamKindInput;
  let streamKindQuestion;
  let streamKindAnswer;
  let streamKind;
  let dynamoDBCategoryStorageRes;
  let dynamoDBCategoryStorageStreamArnRef;
  switch (eventSourceTypeAnswer[eventSourceTypeInput.key]) {
    case 'kinesis':
      streamKindInput = inputs.find(input => input.key === 'kinesisStreamKind');
      if (streamKindInput === undefined) {
        throw Error('Unable to find kinesisStreamKind question data. (this is likely an amplify error, please report)');
      }
      streamKindQuestion = {
        type: streamKindInput.type,
        name: streamKindInput.key,
        message: streamKindInput.question,
        choices: streamKindInput.options,
      };
      streamKindAnswer = await inquirer.prompt([streamKindQuestion]);
      streamKind = streamKindAnswer[streamKindInput.key];
      switch (streamKind) {
        case 'kinesisStreamRawARN':
          arnInput = inputs.find(input => input.key === 'amazonKinesisStreamARN');
          if (arnInput === undefined) {
            throw Error('Unable to find amazonKinesisStreamARN question data. (this is likely an amplify error, please report)');
          }
          arnQuestion = {
            name: arnInput.key,
            message: arnInput.question,
            validate: context.amplify.inputValidation(arnInput),
          };
          arnAnswer = await inquirer.prompt([arnQuestion]);
          eventSourceArn = arnAnswer[arnInput.key];
          return {
            triggerEventSourceMapping: {
              batchSize: 100,
              startingPosition: 'LATEST',
              eventSourceArn,
              functionTemplateName: 'trigger-custom.js',
              triggerPolicies: [
                {
                  Effect: 'Allow',
                  Action: [
                    'kinesis:DescribeStream',
                    'kinesis:DescribeStreamSummary',
                    'kinesis:GetRecords',
                    'kinesis:GetShardIterator',
                    'kinesis:ListShards',
                    'kinesis:ListStreams',
                    'kinesis:SubscribeToShard',
                  ],
                  Resource: eventSourceArn,
                },
              ],
            },
          };
        case 'analyticsKinesisStream':
          return await askAnalyticsCategoryKinesisQuestions(context, inputs);
        default:
          return {};
      }
    case 'dynamoDB':
      streamKindInput = inputs.find(input => input.key === 'dynamoDbStreamKind');
      if (streamKindInput === undefined) {
        throw Error('Unable to find dynamoDBStreamKindInput question data. (this is likely an amplify error, please report)');
      }
      streamKindQuestion = {
        type: streamKindInput.type,
        name: streamKindInput.key,
        message: streamKindInput.question,
        choices: streamKindInput.options,
      };
      streamKindAnswer = await inquirer.prompt([streamKindQuestion]);
      streamKind = streamKindAnswer[streamKindInput.key];
      switch (streamKind) {
        case 'dynamoDbStreamRawARN':
          arnInput = inputs.find(input => input.key === 'dynamoDbARN');
          if (arnInput === undefined) {
            throw Error('Unable to find dynamoDbARN question data. (this is likely an amplify error, please report)');
          }
          arnQuestion = {
            name: arnInput.key,
            message: arnInput.question,
            validate: context.amplify.inputValidation(arnInput),
          };
          arnAnswer = await inquirer.prompt([arnQuestion]);
          eventSourceArn = arnAnswer[arnInput.key];
          return {
            triggerEventSourceMapping: {
              batchSize: 100,
              startingPosition: 'LATEST',
              eventSourceArn,
              functionTemplateName: 'trigger-dynamodb.js',
              triggerPolicies: [
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
                  Resource: eventSourceArn,
                },
              ],
            },
          };
        case 'graphqlModelTable':
          return await askAPICategoryDynamoDBQuestions(context, inputs);
        case 'storageDynamoDBTable':
          dynamoDBCategoryStorageRes = await askDynamoDBQuestions(context, inputs, true);
          dynamoDBCategoryStorageStreamArnRef = {
            Ref: `storage${dynamoDBCategoryStorageRes.resourceName}StreamArn`,
          };

          return {
            triggerEventSourceMapping: {
              batchSize: 100,
              startingPosition: 'LATEST',
              eventSourceArn: dynamoDBCategoryStorageStreamArnRef,
              functionTemplateName: 'trigger-dynamodb.js',
              triggerPolicies: [
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
                  Resource: dynamoDBCategoryStorageStreamArnRef,
                },
              ],
            },
            dependsOn: [
              {
                category: 'storage',
                resourceName: dynamoDBCategoryStorageRes.resourceName,
                attributes: ['StreamArn'],
              },
            ],
          };
        default:
          return {};
      }
    default:
      context.print.error('Unrecognized option selected. (this is likely an amplify error, please report)');
      return {};
  }
}

async function askAnalyticsCategoryKinesisQuestions(context, inputs) {
  const { amplify } = context;
  const { allResources } = await amplify.getResourceStatus();
  const kinesisResources = allResources.filter(resource => resource.service === 'Kinesis');

  let targetResourceName;
  if (kinesisResources.length === 0) {
    context.print.error('No Kinesis streams resource to select. Please use "amplify add analytics" command to create a new Kinesis stream');
    process.exit(0);
    return;
  } else if (kinesisResources.length === 1) {
    targetResourceName = kinesisResources[0].resourceName;
    context.print.success(`Selected resource ${targetResourceName}`);
  } else {
    const resourceNameInput = inputs.find(input => input.key === 'kinesisAnalyticsResourceName');
    if (resourceNameInput === undefined) {
      throw Error('Unable to find kinesisAnalyticsResourceName question data. (this is likely an amplify error, please report)');
    }

    const resourceNameQuestion = {
      type: resourceNameInput.type,
      name: resourceNameInput.key,
      message: resourceNameInput.question,
      choices: kinesisResources.map(resource => resource.resourceName),
    };

    const answer = await inquirer.prompt(resourceNameQuestion);
    targetResourceName = answer.kinesisAnalyticsResourceName;
  }

  const streamArnParamRef = {
    Ref: `analytics${targetResourceName}kinesisStreamArn`,
  };

  return {
    triggerEventSourceMapping: {
      batchSize: 100,
      startingPosition: 'LATEST',
      eventSourceArn: streamArnParamRef,
      functionTemplateName: 'trigger-custom.js',
      triggerPolicies: [
        {
          Effect: 'Allow',
          Action: [
            'kinesis:DescribeStream',
            'kinesis:DescribeStreamSummary',
            'kinesis:GetRecords',
            'kinesis:GetShardIterator',
            'kinesis:ListShards',
            'kinesis:ListStreams',
            'kinesis:SubscribeToShard',
          ],
          Resource: streamArnParamRef,
        },
      ],
    },
    dependsOn: [
      {
        category: 'analytics',
        resourceName: targetResourceName,
        attributes: ['kinesisStreamArn'],
      },
    ],
  };
}

async function askAPICategoryDynamoDBQuestions(context, inputs) {
  const { allResources } = await context.amplify.getResourceStatus();
  const appSynchResources = allResources.filter(resource => resource.service === 'AppSync');

  let targetResourceName;
  if (appSynchResources.length === 0) {
    context.print.error(`
      No AppSync resources have been configured in API category. 
      Please use "amplify add api" command to create a new appsync resource`);
    process.exit(0);
    return;
  } else if (appSynchResources.length === 1) {
    targetResourceName = appSynchResources[0].resourceName;
    context.print.success(`Selected resource ${targetResourceName}`);
  } else {
    const resourceNameInput = inputs.find(input => input.key === 'dynamoDbAPIResourceName');
    if (resourceNameInput === undefined) {
      throw Error('Unable to find dynamoDbAPIResourceName question data. (this is likely an amplify error, please report)');
    }

    const resourceNameQuestion = {
      type: resourceNameInput.type,
      name: resourceNameInput.key,
      message: resourceNameInput.question,
      choices: appSynchResources.map(resource => resource.resourceName),
    };

    const answer = await inquirer.prompt(resourceNameQuestion);
    targetResourceName = answer.dynamoDbAPIResourceName;
  }

  const targetResource = appSynchResources.find(resource => resource.resourceName === targetResourceName);
  const resourceOutput = targetResource.output;
  const graphqlAPIId = resourceOutput.GraphQLAPIIdOutput;
  if (!graphqlAPIId) {
    throw Error(`Unable to find graphql api id for ${targetResourceName} resource`);
  }

  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(backendDir, 'api', targetResourceName);
  const project = await TransformPackage.readProjectConfiguration(resourceDirPath);
  const directiveMap = TransformPackage.collectDirectivesByTypeNames(project.schema);
  const modelNames = Object.keys(directiveMap.types).filter(typeName => directiveMap.types[typeName].includes('model'));

  const modelNameInput = inputs.find(input => input.key === 'graphqlAPIModelName');
  if (modelNameInput === undefined) {
    throw Error('Unable to find graphqlAPIModelName question data. (this is likely an amplify error, please report)');
  }

  let targetModelNames = [];
  if (modelNames.length === 0) {
    throw Error('Unable to find graphql model info.');
  } else if (modelNames.length === 1) {
    const [modelName] = modelNames;
    context.print.success(`Selected @model ${modelName}`);
    targetModelNames = modelNames;
  } else {
    while (targetModelNames.length === 0) {
      const modelNameQuestion = {
        type: modelNameInput.type,
        name: modelNameInput.key,
        message: modelNameInput.question,
        choices: modelNames,
      };
      const modelNameAnswer = await inquirer.prompt([modelNameQuestion]);
      targetModelNames = modelNameAnswer[modelNameInput.key];

      if (targetModelNames.length === 0) {
        context.print.info('You need to select at least one @model');
      }
    }
  }

  const triggerEventSourceMappings = targetModelNames.map(modelName => {
    const streamArnParamRef = {
      'Fn::ImportValue': {
        'Fn::Sub': [`\${api${targetResourceName}GraphQLAPIIdOutput}`, 'GetAtt', `${modelName}Table`, 'StreamArn'].join(':'),
      },
    };

    return {
      modelName,
      batchSize: 100,
      startingPosition: 'LATEST',
      eventSourceArn: streamArnParamRef,
      functionTemplateName: 'trigger-dynamodb.js',
      triggerPolicies: [
        {
          Effect: 'Allow',
          Action: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
          Resource: streamArnParamRef,
        },
      ],
    };
  });

  return {
    triggerEventSourceMappings,
    dependsOn: [
      {
        category: 'api',
        resourceName: targetResourceName,
        attributes: ['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput'],
      },
    ],
  };
}

async function askDynamoDBQuestions(context, inputs, currentProjectOnly = false) {
  const dynamoDbTypeQuestion = {
    type: inputs[5].type,
    name: inputs[5].key,
    message: inputs[5].question,
    choices: inputs[5].options,
  };
  while (true) {
    //eslint-disable-line
    const dynamoDbTypeAnswer = currentProjectOnly ? { [inputs[5].key]: 'currentProject' } : await inquirer.prompt([dynamoDbTypeQuestion]);
    switch (dynamoDbTypeAnswer[inputs[5].key]) {
      case 'currentProject': {
        const storageResources = context.amplify.getProjectDetails().amplifyMeta.storage;
        const dynamoDbProjectResources = [];
        if (!storageResources) {
          context.print.error('There are no DynamoDB resources configured in your project currently');
          break;
        }
        Object.keys(storageResources).forEach(resourceName => {
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
        return add(context, 'awscloudformation', 'DynamoDB').then(resourceName => {
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
      default:
        context.print.error('Invalid option selected');
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

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actions.push('lambda:Create*', 'lambda:Put*', 'lambda:Add*');
        break;
      case 'update':
        actions.push('lambda:Update*');
        break;
      case 'read':
        actions.push('lambda:Get*', 'lambda:List*', 'lambda:Invoke*');
        break;
      case 'delete':
        actions.push('lambda:Delete*', 'lambda:Remove*');
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
            'arn:aws:lambda:',
            {
              Ref: 'AWS::Region',
            },
            ':',
            { Ref: 'AWS::AccountId' },
            ':function:',
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
  serviceWalkthrough,
  updateWalkthrough,
  migrate,
  getIAMPolicies,
  askExecRolePermissionsQuestions,
};
