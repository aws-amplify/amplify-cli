import { $TSContext, AmplifyCategories, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import inquirer from 'inquirer';
import path from 'path';
const TransformPackage = require('graphql-transformer-core');
const { ResourceDoesNotExistError, exitOnNextTick } = require('amplify-cli-core');
export async function askDynamoDBQuestions(context: $TSContext, currentProjectOnly = false): Promise<{ resourceName: string }> {
  const dynamoDbTypeQuestion = {
    type: 'list',
    name: 'dynamoDbType',
    message: 'Choose a DynamoDB data source option',
    choices: [
      {
        name: 'Use DynamoDB table configured in the current Amplify project',
        value: 'currentProject',
      },
      {
        name: 'Create a new DynamoDB table',
        value: 'newResource',
      },
    ],
  };
  for (let count = 0; count < 2; count++) {
    // give the developer a chance to go back and select a valid response
    const dynamoDbTypeAnswer = currentProjectOnly ? { dynamoDbType: 'currentProject' } : await inquirer.prompt([dynamoDbTypeQuestion]);
    switch (dynamoDbTypeAnswer.dynamoDbType) {
      case 'currentProject': {
        const storageResources = context.amplify.getProjectDetails().amplifyMeta.storage;
        const dynamoDbProjectResources: any[] = [];
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
          type: 'list',
          name: 'dynamoDbResources',
          message: 'Choose from one of the already configured DynamoDB tables',
          choices: dynamoDbProjectResources,
        };

        const dynamoResourceAnswer = await inquirer.prompt([dynamoResourceQuestion]);

        return { resourceName: dynamoResourceAnswer.dynamoDbResources as string };
      }
      case 'newResource': {
        const resourceName = await context.amplify.invokePluginMethod<string>(context, 'storage', undefined, 'add', [
          context,
          'awscloudformation',
          'DynamoDB',
        ]);

        context.print.success('Successfully added DynamoDb table locally');

        return { resourceName };
      }
      default:
        context.print.error('Invalid option selected');
    }
  }
  throw new Error('Invalid option selected');
}

export async function getTableParameters(dynamoAnswers: any): Promise<TableParams | Record<string, unknown>> {
  if (dynamoAnswers.Arn) {
    // Looking for table parameters on DynamoDB public API
    const hashKey = dynamoAnswers.KeySchema.find((attr: any) => attr.KeyType === 'HASH') || {};
    const hashType = dynamoAnswers.AttributeDefinitions.find((attr: any) => attr.AttributeName === hashKey.AttributeName) || {};
    const rangeKey = dynamoAnswers.KeySchema.find((attr: any) => attr.KeyType === 'RANGE') || {};
    const rangeType = dynamoAnswers.AttributeDefinitions.find((attr: any) => attr.AttributeName === rangeKey.AttributeName) || {};
    return {
      tableName: dynamoAnswers.TableName,
      partitionKeyName: hashKey.AttributeName,
      partitionKeyType: hashType.AttributeType,
      sortKeyName: rangeKey.AttributeName,
      sortKeyType: rangeType.AttributeType,
    };
  }
  // Look for table config in parameters.json, then build/parameters.json, then fallback to {}
  const parametersJson: TableParams = stateManager.getResourceParametersJson(
    undefined,
    AmplifyCategories.STORAGE,
    dynamoAnswers.resourceName,
    { throwIfNotExist: false },
  );
  const buildParamsJson = JSONUtilities.readJson<TableParams>(
    path.join(
      pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.STORAGE, dynamoAnswers.resourceName),
      'build',
      'parameters.json',
    ),
    { throwIfNotExist: false },
  );
  return parametersJson ?? buildParamsJson ?? {};
}

type TableParams = {
  tableName: string;
  partitionKeyName: string;
  partitionKeyType: string;
  sortKeyName?: string;
  sortKeyType?: string;
};

export async function askAPICategoryDynamoDBQuestions(context: any) {
  const { allResources } = await context.amplify.getResourceStatus();
  const appSyncResources = allResources.filter((resource: any) => resource.service === 'AppSync');

  let targetResourceName: any;
  if (appSyncResources.length === 0) {
    const errMessage = `
      No AppSync resources have been configured in the API category.
      Please use "amplify add api" command to create a new appsync resource`;
    context.print.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
  } else if (appSyncResources.length === 1) {
    targetResourceName = appSyncResources[0].resourceName;
    context.print.success(`Selected resource ${targetResourceName}`);
  } else {
    const resourceNameQuestion = {
      type: 'list',
      name: 'dynamoDbAPIResourceName',
      message: 'Choose an API resource to associate with',
      choices: appSyncResources.map((resource: any) => resource.resourceName),
    };

    const answer = await inquirer.prompt([resourceNameQuestion]);
    targetResourceName = answer.dynamoDbAPIResourceName;
  }

  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(backendDir, 'api', targetResourceName);
  const project = await TransformPackage.readProjectConfiguration(resourceDirPath);
  const directiveMap = TransformPackage.collectDirectivesByTypeNames(project.schema);
  const modelNames = Object.keys(directiveMap.types).filter(typeName => directiveMap.types[typeName].includes('model'));

  let targetModelNames: string[] = [];
  if (modelNames.length === 0) {
    throw Error('Unable to find graphql model info.');
  } else if (modelNames.length === 1) {
    const [modelName] = modelNames;
    context.print.success(`Selected @model ${modelName}`);
    targetModelNames = modelNames;
  } else {
    while (targetModelNames.length === 0) {
      const modelNameQuestion = {
        type: 'checkbox',
        name: 'graphqlAPIModelName',
        message: 'Choose the graphql @model(s)',
        choices: modelNames,
      };
      const modelNameAnswer = await inquirer.prompt([modelNameQuestion]);
      targetModelNames = modelNameAnswer.graphqlAPIModelName as string[];

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
      functionTemplateName: 'trigger-dynamodb.js.ejs',
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
