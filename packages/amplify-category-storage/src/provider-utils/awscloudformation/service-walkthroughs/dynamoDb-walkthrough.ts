import * as path from 'path';
import * as fs from 'fs-extra';
import uuid from 'uuid';
import { printer } from 'amplify-prompts';
import { $TSContext, AmplifyCategories, pathManager, ResourceDoesNotExistError, exitOnNextTick } from 'amplify-cli-core';
import { DynamoDBInputState } from './dynamoDB-input-state';
import {
  DynamoDBAttributeDefType,
  DynamoDBCLIInputs,
  DynamoDBCLIInputsGSIType,
  DynamoDBCLIInputsKeyType,
} from '../service-walkthrough-types/dynamoDB-user-input-types';
import { DDBStackTransform } from '../cdk-stack-builder/ddb-stack-transform';
const inquirer = require('inquirer');
// keep in sync with ServiceName in amplify-AmplifyCategories.STORAGE-function, but probably it will not change
const FunctionServiceNameLambdaFunction = 'Lambda';
const serviceName = 'DynamoDB';

async function addWalkthrough(context: $TSContext, defaultValuesFilename: string) {
  printer.info('');
  printer.info('Welcome to the NoSQL DynamoDB database wizard');
  printer.info('This wizard asks you a series of questions to help determine how to set up your NoSQL database table.');
  printer.info('');

  const defaultValuesSrc = path.join(__dirname, '..', 'default-values', defaultValuesFilename);
  const { getAllDefaults } = require(defaultValuesSrc);
  const { amplify } = context;
  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const resourceName = await askResourceNameQuestion(context, defaultValues); // Cannot be changed once added
  const tableName = await askTableNameQuestion(context, defaultValues, resourceName); // Cannot be changed once added

  const { attributeAnswers, indexableAttributeList } = await askAttributeListQuestion(context);

  const partitionKey = await askPrimaryKeyQuestion(indexableAttributeList, attributeAnswers); // Cannot be changed once added

  let cliInputs: DynamoDBCLIInputs = {
    resourceName,
    tableName,
    partitionKey,
  };

  cliInputs.sortKey = await askSortKeyQuestion(context, indexableAttributeList, attributeAnswers, cliInputs.partitionKey.fieldName);

  cliInputs.gsi = await askGSIQuestion(context, indexableAttributeList, attributeAnswers);

  cliInputs.triggerFunctions = await askTriggersQuestion(context, cliInputs.resourceName);

  const cliInputsState = new DynamoDBInputState(cliInputs.resourceName);
  cliInputsState.saveCliInputPayload(cliInputs);

  const stackGenerator = new DDBStackTransform(cliInputs.resourceName);
  stackGenerator.transform();

  return cliInputs.resourceName;
}

async function updateWalkthrough(context: $TSContext) {
  // const resourceName = resourceAlreadyExists(context);
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  const dynamoDbResources: any = {};

  Object.keys(amplifyMeta[AmplifyCategories.STORAGE]).forEach(resourceName => {
    if (
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].service === serviceName &&
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].mobileHubMigrated !== true &&
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].serviceType !== 'imported'
    ) {
      dynamoDbResources[resourceName] = amplifyMeta[AmplifyCategories.STORAGE][resourceName];
    }
  });

  if (!amplifyMeta[AmplifyCategories.STORAGE] || Object.keys(dynamoDbResources).length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';

    printer.error(errMessage);
    context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return;
  }

  const resources = Object.keys(dynamoDbResources);
  const question = [
    {
      name: 'resourceName',
      message: 'Specify the resource that you would want to update',
      type: 'list',
      choices: resources,
    },
  ];

  const answer = await inquirer.prompt(question);

  const cliInputsState = new DynamoDBInputState(answer.resourceName);

  const cliInputs = cliInputsState.getCliInputPayload();

  let existingAttributeDefinitions: DynamoDBCLIInputsKeyType[] = [];

  if (cliInputs.partitionKey) {
    existingAttributeDefinitions.push(cliInputs.partitionKey);
  }
  if (cliInputs.sortKey) {
    existingAttributeDefinitions.push(cliInputs.sortKey);
  }
  if (cliInputs.gsi && cliInputs.gsi.length > 0) {
    cliInputs.gsi.forEach((gsi: DynamoDBCLIInputsGSIType) => {
      if (gsi.partitionKey) {
        existingAttributeDefinitions.push(gsi.partitionKey);
      }
      if (gsi.sortKey) {
        existingAttributeDefinitions.push(gsi.sortKey);
      }
    });
  }

  if (!cliInputs.resourceName) {
    throw new Error('resourceName not found in cli-inputs');
  }

  const { attributeAnswers, indexableAttributeList } = await askAttributeListQuestion(context, existingAttributeDefinitions);

  cliInputs.gsi = await askGSIQuestion(context, indexableAttributeList, attributeAnswers, cliInputs.gsi);
  cliInputs.triggerFunctions = await askTriggersQuestion(context, cliInputs.resourceName, cliInputs.triggerFunctions);

  cliInputsState.saveCliInputPayload(cliInputs);

  const stackGenerator = new DDBStackTransform(cliInputs.resourceName);
  stackGenerator.transform();

  return cliInputs;
}

async function askTriggersQuestion(context: $TSContext, resourceName: string, existingTriggerFunctions?: string[]): Promise<string[]> {
  const { amplify } = context;
  let triggerFunctions: string[] = existingTriggerFunctions || [];

  if (!existingTriggerFunctions || existingTriggerFunctions.length === 0) {
    if (await amplify.confirmPrompt('Do you want to add a Lambda Trigger for your Table?', false)) {
      let triggerName;
      try {
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
        triggerName = await addTrigger(context, resourceName);
        return [triggerName];
      } catch (e) {
        printer.error(e.message);
      }
    }
  } else {
    const triggerOperationQuestion = {
      type: 'list',
      name: 'triggerOperation',
      message: 'Select from the following options',
      choices: ['Add a Trigger', 'Remove a trigger', 'Skip Question'],
    };
    let triggerName;
    let continueWithTriggerOperationQuestion = true;

    while (continueWithTriggerOperationQuestion) {
      const triggerOperationAnswer = await inquirer.prompt([triggerOperationQuestion]);

      switch (triggerOperationAnswer.triggerOperation) {
        case 'Add a Trigger': {
          try {
            triggerName = await addTrigger(context, resourceName, triggerFunctions);
            triggerFunctions.push(triggerName);
            continueWithTriggerOperationQuestion = false;
          } catch (e) {
            printer.error(e.message);
            continueWithTriggerOperationQuestion = true;
          }
          break;
        }
        case 'Remove a trigger': {
          try {
            if (triggerFunctions.length === 0) {
              throw new Error('No triggers found associated with this table');
            } else {
              triggerName = await removeTrigger(context, resourceName, triggerFunctions);

              const index = triggerFunctions.indexOf(triggerName);

              if (index >= 0) {
                triggerFunctions.splice(index, 1);
                continueWithTriggerOperationQuestion = false;
              } else {
                throw new Error('Could not find trigger function');
              }
            }
          } catch (e) {
            printer.error(e.message);
            continueWithTriggerOperationQuestion = true;
          }

          break;
        }
        case 'Skip Question': {
          continueWithTriggerOperationQuestion = false;
          break;
        }
        default:
          printer.error(`${triggerOperationAnswer.triggerOperation} not supported`);
      }
    }
  }
  return triggerFunctions;
}

async function askGSIQuestion(
  context: $TSContext,
  indexableAttributeList: string[],
  attributeDefinitions: DynamoDBAttributeDefType[],
  existingGSIList?: DynamoDBCLIInputsGSIType[],
) {
  printer.info('');
  printer.info(
    'You can optionally add global secondary indexes for this table. These are useful when you run queries defined in a different column than the primary key.',
  );
  printer.info('To learn more about indexes, see:');
  printer.info(
    'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.SecondaryIndexes',
  );
  printer.info('');

  const { amplify } = context;
  let gsiList: DynamoDBCLIInputsGSIType[] = [];

  if (
    existingGSIList &&
    !!existingGSIList.length &&
    (await amplify.confirmPrompt('Do you want to keep existing global seconday indexes created on your table?'))
  ) {
    gsiList = existingGSIList;
  }

  if (await amplify.confirmPrompt('Do you want to add global secondary indexes to your table?')) {
    let continuewithGSIQuestions = true;

    while (continuewithGSIQuestions) {
      if (indexableAttributeList.length > 0) {
        const gsiAttributeQuestion = {
          type: 'input',
          name: 'gsiName',
          message: 'Please provide the GSI name:',
          validate: amplify.inputValidation({
            validation: {
              operator: 'regex',
              value: '^[a-zA-Z0-9_-]+$',
              onErrorMsg: 'You can use the following characters: a-z A-Z 0-9 - _',
            },
          }),
        };
        const gsiPrimaryKeyQuestion = {
          type: 'list',
          name: 'gsiPartitionKey',
          message: 'Please choose partition key for the GSI:',
          choices: [...new Set(indexableAttributeList)],
        };

        /*eslint-disable*/
        const gsiPrimaryAnswer = await inquirer.prompt([gsiAttributeQuestion, gsiPrimaryKeyQuestion]);

        const gsiPrimaryKeyName = gsiPrimaryAnswer['gsiPartitionKey'];
        const gsiPrimaryKeyIndex = attributeDefinitions.findIndex(
          (attr: DynamoDBAttributeDefType) => attr.AttributeName === gsiPrimaryKeyName,
        );

        /* eslint-enable */
        let gsiItem: DynamoDBCLIInputsGSIType = {
          name: gsiPrimaryAnswer['gsiName'],
          partitionKey: {
            fieldName: gsiPrimaryKeyName,
            fieldType: attributeDefinitions[gsiPrimaryKeyIndex].AttributeType,
          },
        };

        const sortKeyOptions = indexableAttributeList.filter((att: string) => att !== gsiPrimaryKeyName);

        if (sortKeyOptions.length > 0) {
          if (await amplify.confirmPrompt('Do you want to add a sort key to your global secondary index?')) {
            const sortKeyQuestion = {
              type: 'list',
              name: 'gsiSortKey',
              message: 'Please choose sort key for the GSI:',
              choices: [...new Set(sortKeyOptions)],
            };

            const sortKeyAnswer = await inquirer.prompt([sortKeyQuestion]);

            const gsiSortKeyName = sortKeyAnswer['gsiSortKey'];
            const gsiSortKeyIndex = attributeDefinitions.findIndex(
              (attr: DynamoDBAttributeDefType) => attr.AttributeName === gsiSortKeyName,
            );

            gsiItem.sortKey = {
              fieldName: sortKeyAnswer['gsiSortKey'],
              fieldType: attributeDefinitions[gsiSortKeyIndex].AttributeType,
            };
          }
        }

        gsiList.push(gsiItem);
        continuewithGSIQuestions = await amplify.confirmPrompt('Do you want to add more global secondary indexes to your table?');
      } else {
        printer.error('You do not have any other attributes remaining to configure');
        break;
      }
    }
  }
  return gsiList;
}

async function askSortKeyQuestion(
  context: $TSContext,
  indexableAttributeList: string[],
  attributeDefinitions: DynamoDBAttributeDefType[],
  partitionKeyFieldName: string,
): Promise<undefined | DynamoDBCLIInputsKeyType> {
  const { amplify } = context;

  if (await amplify.confirmPrompt('Do you want to add a sort key to your table?')) {
    // Ask for sort key
    if (attributeDefinitions.length > 1) {
      const sortKeyQuestion = {
        type: 'list',
        name: 'sortKey',
        message: 'Please choose sort key for the table:',
        choices: indexableAttributeList.filter((att: string) => att !== partitionKeyFieldName),
      };

      const sortKeyAnswer = await inquirer.prompt([sortKeyQuestion]);

      const sortKeyName = sortKeyAnswer['sortKey'];
      const sortKeyAttrTypeIndex = attributeDefinitions.findIndex((attr: DynamoDBAttributeDefType) => attr.AttributeName === sortKeyName);

      return {
        fieldName: sortKeyName,
        fieldType: attributeDefinitions[sortKeyAttrTypeIndex].AttributeType,
      };
    } else {
      printer.error('You must add additional keys in order to select a sort key.');
    }
  }
  return;
}

async function askPrimaryKeyQuestion(indexableAttributeList: string[], attributeDefinitions: DynamoDBAttributeDefType[]) {
  printer.info('');
  printer.info(
    'Before you create the database, you must specify how items in your table are uniquely organized. You do this by specifying a primary key. The primary key uniquely identifies each item in the table so that no two items can have the same key. This can be an individual column, or a combination that includes a primary key and a sort key.',
  );
  printer.info('');
  printer.info('To learn more about primary keys, see:');
  printer.info(
    'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey',
  );
  printer.info('');

  const primaryKeyQuestion = {
    type: 'list',
    name: 'partitionKey',
    message: 'Please choose partition key for the table:',
    choices: indexableAttributeList,
  };

  const partitionKeyAnswer = await inquirer.prompt([primaryKeyQuestion]);

  const partitionKeyName = partitionKeyAnswer['partitionKey'];
  const primaryAttrTypeIndex = attributeDefinitions.findIndex((attr: DynamoDBAttributeDefType) => attr.AttributeName === partitionKeyName);

  return {
    fieldName: partitionKeyName,
    fieldType: attributeDefinitions[primaryAttrTypeIndex].AttributeType,
  };
}

async function askAttributeListQuestion(context: $TSContext, existingAttributeDefinitions?: DynamoDBCLIInputsKeyType[]) {
  const attributeTypes = {
    string: { code: 'string', indexable: true },
    number: { code: 'number', indexable: true },
    binary: { code: 'binary', indexable: true },
    boolean: { code: 'boolean', indexable: false },
    list: { code: 'list', indexable: false },
    map: { code: 'map', indexable: false },
    null: { code: 'null', indexable: false },
    'string-set': { code: 'string-set', indexable: false },
    'number-set': { code: 'number-set', indexable: false },
    'binary-set': { code: 'binary-set', indexable: false },
  };

  printer.info('');
  printer.info('You can now add columns to the table.');
  printer.info('');

  const QUESTION_KEY = 'attribute';
  const { amplify } = context;

  const attributeQuestion = {
    type: 'input',
    name: QUESTION_KEY,
    message: 'What would you like to name this column:',
    validate: amplify.inputValidation({
      validation: {
        operator: 'regex',
        value: '^[a-zA-Z0-9_-]+$',
        onErrorMsg: "'You can use the following characters: a-z A-Z 0-9 - _'",
      },
    }),
  };

  const attributeTypeQuestion = {
    type: 'list',
    name: 'attributeType',
    message: 'Please choose the data type:',
    choices: Object.keys(attributeTypes),
  };

  let continueAttributeQuestion = true;
  let attributeAnswers: DynamoDBAttributeDefType[] = [];
  let indexableAttributeList: string[] = [];
  let existingAttributes: DynamoDBAttributeDefType[] = [];

  if (existingAttributeDefinitions) {
    existingAttributes = existingAttributeDefinitions.map((attr: DynamoDBCLIInputsKeyType) => {
      return {
        AttributeName: attr.fieldName,
        AttributeType: attr.fieldType,
      };
    });
  }

  if (existingAttributes.length > 0) {
    attributeAnswers = existingAttributes;
    indexableAttributeList = attributeAnswers.map((attr: DynamoDBAttributeDefType) => attr.AttributeName);
    continueAttributeQuestion = await amplify.confirmPrompt('Would you like to add another column?');
  }

  while (continueAttributeQuestion) {
    const attributeAnswer = await inquirer.prompt([attributeQuestion, attributeTypeQuestion]);

    if (
      attributeAnswers.findIndex((attribute: DynamoDBAttributeDefType) => attribute.AttributeName === attributeAnswer[QUESTION_KEY]) !== -1
    ) {
      continueAttributeQuestion = await amplify.confirmPrompt('This attribute was already added. Do you want to add another attribute?');
      continue;
    }

    attributeAnswers.push({
      AttributeName: attributeAnswer[QUESTION_KEY],
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      AttributeType: attributeTypes[attributeAnswer['attributeType']].code,
    });

    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    if (attributeTypes[attributeAnswer['attributeType']].indexable) {
      indexableAttributeList.push(attributeAnswer[QUESTION_KEY]);
    }

    continueAttributeQuestion = await amplify.confirmPrompt('Would you like to add another column?');
  }

  return { attributeAnswers, indexableAttributeList };
}

async function askTableNameQuestion(context: $TSContext, defaultValues: any, resourceName: string) {
  const { amplify } = context;

  const question = [
    {
      type: 'input',
      name: 'tableName',
      message: 'Please provide table name:',
      validate: amplify.inputValidation({
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9._-]+$',
          onErrorMsg: 'You can use the following characters: a-z A-Z 0-9 . - _',
        },
      }),
      default: (answers: any) => {
        const defaultValue = defaultValues['tableName'];
        return resourceName || defaultValue;
      },
    },
  ];

  const answer = await inquirer.prompt(question);

  return answer.tableName;
}

async function askResourceNameQuestion(context: $TSContext, defaultValues: any): Promise<string> {
  const { amplify } = context;

  const question = [
    {
      type: 'input',
      name: 'resourceName',
      message: 'Please provide a friendly name for your resource that will be used to label this category in the project:',
      validate: amplify.inputValidation({
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
      }),
      default: () => {
        const defaultValue = defaultValues['resourceName'];
        return defaultValue;
      },
    },
  ];
  const answer = await inquirer.prompt(question);
  return answer.resourceName;
}

async function removeTrigger(context: any, resourceName: string, triggerList: string[]) {
  const triggerOptionQuestion = {
    type: 'list',
    name: 'triggerOption',
    message: 'Select from the function you would like to remove',
    choices: triggerList,
  };

  const triggerOptionAnswer = await inquirer.prompt([triggerOptionQuestion]);

  const functionName = triggerOptionAnswer.triggerOption;
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const functionCFNFilePath = path.join(projectBackendDirPath, 'function', functionName, `${functionName}-cloudformation-template.json`);

  if (fs.existsSync(functionCFNFilePath)) {
    const functionCFNFile = context.amplify.readJsonFile(functionCFNFilePath);

    delete functionCFNFile.Resources[`${resourceName}TriggerPolicy`];
    delete functionCFNFile.Resources[`${resourceName}Trigger`];

    // Update the functions resource
    const functionCFNString = JSON.stringify(functionCFNFile, null, 4);

    fs.writeFileSync(functionCFNFilePath, functionCFNString, 'utf8');
  }

  return functionName;
}

async function addTrigger(context: any, resourceName: string, triggerList: string[]) {
  const triggerTypeQuestion = {
    type: 'list',
    name: 'triggerType',
    message: 'Select from the following options',
    choices: ['Choose an existing function from the project', 'Create a new function'],
  };
  const triggerTypeAnswer = await inquirer.prompt([triggerTypeQuestion]);
  let functionName;

  if (triggerTypeAnswer.triggerType === 'Choose an existing function from the project') {
    let lambdaResources = await getLambdaFunctions(context);

    if (triggerList) {
      const filteredLambdaResources: string[] = [];

      lambdaResources.forEach((lambdaResource: string) => {
        if (triggerList.indexOf(lambdaResource) === -1) {
          filteredLambdaResources.push(lambdaResource);
        }
      });

      lambdaResources = filteredLambdaResources;
    }

    if (lambdaResources.length === 0) {
      throw new Error("No functions were found in the project. Use 'amplify add function' to add a new function.");
    }

    const triggerOptionQuestion = {
      type: 'list',
      name: 'triggerOption',
      message: 'Select from the following options',
      choices: lambdaResources,
    };

    const triggerOptionAnswer = await inquirer.prompt([triggerOptionQuestion]);

    functionName = triggerOptionAnswer.triggerOption;
  } else {
    // Create a new lambda trigger

    const targetDir = context.amplify.pathManager.getBackendDirPath();
    const [shortId] = uuid().split('-');

    functionName = `${resourceName}Trigger${shortId}`;

    const pluginDir = __dirname;

    const defaults = {
      functionName: `${functionName}`,
      roleName: `${resourceName}LambdaRole${shortId}`,
    };

    const copyJobs = [
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', '..', 'resources', 'triggers', 'dynamoDB', 'lambda-cloudformation-template.json.ejs'),
        target: path.join(targetDir, 'function', functionName, `${functionName}-cloudformation-template.json`),
      },
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', '..', 'resources', 'triggers', 'dynamoDB', 'event.json'),
        target: path.join(targetDir, 'function', functionName, 'src', 'event.json'),
      },
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', '..', 'resources', 'triggers', 'dynamoDB', 'index.js'),
        target: path.join(targetDir, 'function', functionName, 'src', 'index.js'),
      },
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', '..', 'resources', 'triggers', 'dynamoDB', 'package.json.ejs'),
        target: path.join(targetDir, 'function', functionName, 'src', 'package.json'),
      },
    ];

    // copy over the files
    await context.amplify.copyBatch(context, copyJobs, defaults);

    // Update amplify-meta and backend-config

    const backendConfigs = {
      service: FunctionServiceNameLambdaFunction,
      providerPlugin: 'awscloudformation',
      build: true,
    };

    context.amplify.updateamplifyMetaAfterResourceAdd('function', functionName, backendConfigs);

    printer.success(`Successfully added resource ${functionName} locally`);
  }

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const functionCFNFilePath = path.join(projectBackendDirPath, 'function', functionName, `${functionName}-cloudformation-template.json`);

  if (fs.existsSync(functionCFNFilePath)) {
    const functionCFNFile = context.amplify.readJsonFile(functionCFNFilePath);

    // Update parameters block
    functionCFNFile.Parameters[`storage${resourceName}Name`] = {
      Type: 'String',
      Default: `storage${resourceName}Name`,
    };

    functionCFNFile.Parameters[`storage${resourceName}Arn`] = {
      Type: 'String',
      Default: `storage${resourceName}Arn`,
    };

    functionCFNFile.Parameters[`storage${resourceName}StreamArn`] = {
      Type: 'String',
      Default: `storage${resourceName}Arn`,
    };

    // Update policies
    functionCFNFile.Resources[`${resourceName}TriggerPolicy`] = {
      DependsOn: ['LambdaExecutionRole'],
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: `lambda-trigger-policy-${resourceName}`,
        Roles: [
          {
            Ref: 'LambdaExecutionRole',
          },
        ],
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
              Resource: [
                {
                  Ref: `storage${resourceName}StreamArn`,
                },
              ],
            },
          ],
        },
      },
    };

    // Add TriggerResource

    functionCFNFile.Resources[`${resourceName}Trigger`] = {
      Type: 'AWS::Lambda::EventSourceMapping',
      DependsOn: [`${resourceName}TriggerPolicy`],
      Properties: {
        BatchSize: 100,
        Enabled: true,
        EventSourceArn: {
          Ref: `storage${resourceName}StreamArn`,
        },
        FunctionName: {
          'Fn::GetAtt': ['LambdaFunction', 'Arn'],
        },
        StartingPosition: 'LATEST',
      },
    };

    // Update dependsOn

    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);

    const resourceDependsOn = amplifyMeta.function[functionName].dependsOn || [];
    let resourceExists = false;

    resourceDependsOn.forEach((resource: any) => {
      if (resource.resourceName === resourceName) {
        resourceExists = true;
        resourceDependsOn.attributes = ['Name', 'Arn', 'StreamArn'];
      }
    });

    if (!resourceExists) {
      resourceDependsOn.push({
        category: AmplifyCategories.STORAGE,
        resourceName,
        attributes: ['Name', 'Arn', 'StreamArn'],
      });
    }

    // Update the functions resource
    const functionCFNString = JSON.stringify(functionCFNFile, null, 4);

    fs.writeFileSync(functionCFNFilePath, functionCFNString, 'utf8');

    context.amplify.updateamplifyMetaAfterResourceUpdate('function', functionName, 'dependsOn', resourceDependsOn);
    printer.success(`Successfully updated resource ${functionName} locally`);

    if (await context.amplify.confirmPrompt(`Do you want to edit the local ${functionName} lambda function now?`)) {
      await context.amplify.openEditor(context, `${projectBackendDirPath}/function/${functionName}/src/index.js`);
    }
  } else {
    throw new Error(`Function ${functionName} does not exist`);
  }

  return functionName;
}

async function getLambdaFunctions(context: any) {
  const { allResources } = await context.amplify.getResourceStatus();
  const lambdaResources = allResources
    .filter((resource: any) => resource.service === FunctionServiceNameLambdaFunction)
    .map((resource: any) => resource.resourceName);

  return lambdaResources;
}

function migrateCategory(context: any, projectPath: any, resourceName: any) {
  const resourceDirPath = path.join(projectPath, 'amplify', 'backend', AmplifyCategories.STORAGE, resourceName);
  const cfnFilePath = path.join(resourceDirPath, `${resourceName}-cloudformation-template.json`);

  // Removes dangling commas from a JSON
  const removeDanglingCommas = (value: any) => {
    const regex = /,(?!\s*?[{["'\w])/g;

    return value.replace(regex, '');
  };

  /* Current Dynamo CFN's have a trailing comma (accepted by CFN),
  but fails on JSON.parse(), hence removing it */

  let oldcfnString = fs.readFileSync(cfnFilePath, 'utf8');
  oldcfnString = removeDanglingCommas(oldcfnString);

  const oldCfn = JSON.parse(oldcfnString);

  const newCfn = {};

  Object.assign(newCfn, oldCfn);

  // Add env parameter
  if (!(newCfn as any).Parameters) {
    (newCfn as any).Parameters = {};
  }

  (newCfn as any).Parameters.env = {
    Type: 'String',
  };

  // Add conditions block
  if (!(newCfn as any).Conditions) {
    (newCfn as any).Conditions = {};
  }

  (newCfn as any).Conditions.ShouldNotCreateEnvResources = {
    'Fn::Equals': [
      {
        Ref: 'env',
      },
      'NONE',
    ],
  };

  // Add if condition for resource name change
  (newCfn as any).Resources.DynamoDBTable.Properties.TableName = {
    'Fn::If': [
      'ShouldNotCreateEnvResources',
      {
        Ref: 'tableName',
      },
      {
        'Fn::Join': [
          '',
          [
            {
              Ref: 'tableName',
            },
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

function getIAMPolicies(resourceName: any, crudOptions: any) {
  let policy = {};
  const actions: any = [];

  crudOptions.forEach((crudOption: any) => {
    switch (crudOption) {
      case 'create':
        actions.push('dynamodb:Put*', 'dynamodb:Create*', 'dynamodb:BatchWriteItem');
        break;
      case 'update':
        actions.push('dynamodb:Update*', 'dynamodb:RestoreTable*');
        break;
      case 'read':
        actions.push('dynamodb:Get*', 'dynamodb:BatchGetItem', 'dynamodb:List*', 'dynamodb:Describe*', 'dynamodb:Scan', 'dynamodb:Query');
        break;
      case 'delete':
        actions.push('dynamodb:Delete*');
        break;
      default:
        console.log(`${crudOption} not supported`);
    }
  });

  policy = {
    Effect: 'Allow',
    Action: actions,
    Resource: crudOptions.customPolicyResource
      ? crudOptions.customPolicyResource
      : [
          { Ref: `${AmplifyCategories.STORAGE}${resourceName}Arn` },
          {
            'Fn::Join': [
              '/',
              [
                {
                  Ref: `${AmplifyCategories.STORAGE}${resourceName}Arn`,
                },
                'index/*',
              ],
            ],
          },
        ],
  };

  const attributes = ['Name', 'Arn', 'StreamArn'];

  return { policy, attributes };
}

module.exports = {
  addWalkthrough,
  updateWalkthrough,
  migrate: migrateCategory,
  getIAMPolicies,
};
