import {
  $TSAny,
  $TSContext,
  $TSObject,
  AmplifyCategories,
  AmplifySupportedService,
  exitOnNextTick,
  getMigrateResourceMessageForOverride,
  pathManager,
  ResourceDoesNotExistError,
  stateManager,
} from '@aws-amplify/amplify-cli-core';
import { alphanumeric, printer, prompter, Validator } from '@aws-amplify/amplify-prompts';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { DDBStackTransform } from '../cdk-stack-builder/ddb-stack-transform';
import {
  DynamoDBAttributeDefType,
  DynamoDBCLIInputs,
  DynamoDBCLIInputsGSIType,
  DynamoDBCLIInputsKeyType,
} from '../service-walkthrough-types/dynamoDB-user-input-types';
import { DynamoDBInputState } from './dynamoDB-input-state';

// keep in sync with ServiceName in amplify-AmplifyCategories.STORAGE-function, but probably it will not change

export async function addWalkthrough(context: $TSContext, defaultValuesFilename: string) {
  printer.blankLine();
  printer.info('Welcome to the NoSQL DynamoDB database wizard');
  printer.info('This wizard asks you a series of questions to help determine how to set up your NoSQL database table.');
  printer.blankLine();

  const defaultValuesSrc = path.join(__dirname, '..', 'default-values', defaultValuesFilename);
  const { getAllDefaults } = await import(defaultValuesSrc);
  const { amplify } = context;
  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const resourceName = await askResourceNameQuestion(defaultValues); // Cannot be changed once added
  const tableName = await askTableNameQuestion(defaultValues, resourceName); // Cannot be changed once added

  const { attributeAnswers, indexableAttributeList } = await askAttributeListQuestion();

  const partitionKey = await askPrimaryKeyQuestion(indexableAttributeList, attributeAnswers); // Cannot be changed once added

  const cliInputs: DynamoDBCLIInputs = {
    resourceName,
    tableName,
    partitionKey,
  };

  cliInputs.sortKey = await askSortKeyQuestion(indexableAttributeList, attributeAnswers, cliInputs.partitionKey.fieldName);

  cliInputs.gsi = await askGSIQuestion(indexableAttributeList, attributeAnswers);

  cliInputs.triggerFunctions = await askTriggersQuestion(context, cliInputs.resourceName);

  const cliInputsState = new DynamoDBInputState(context, cliInputs.resourceName);
  await cliInputsState.saveCliInputPayload(cliInputs);

  const stackGenerator = new DDBStackTransform(context, cliInputs.resourceName);
  await stackGenerator.transform();

  return cliInputs.resourceName;
}

export async function updateWalkthrough(context: $TSContext) {
  const amplifyMeta = stateManager.getMeta();
  const dynamoDbResources: $TSObject = {};

  Object.keys(amplifyMeta[AmplifyCategories.STORAGE]).forEach((resourceName) => {
    if (
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].service === AmplifySupportedService.DYNAMODB &&
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].mobileHubMigrated !== true &&
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].serviceType !== 'imported'
    ) {
      dynamoDbResources[resourceName] = amplifyMeta[AmplifyCategories.STORAGE][resourceName];
    }
  });

  if (!amplifyMeta[AmplifyCategories.STORAGE] || Object.keys(dynamoDbResources).length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';

    printer.error(errMessage);
    void context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return undefined;
  }

  const resources = Object.keys(dynamoDbResources);
  const resourceName = await prompter.pick('Specify the resource that you would want to update', resources);

  // Check if we need to migrate to cli-inputs.json
  const cliInputsState = new DynamoDBInputState(context, resourceName);

  const headlessMigrate = context.input.options?.yes || context.input.options?.forcePush || context.input.options?.headless;
  if (!cliInputsState.cliInputFileExists()) {
    if (headlessMigrate || (await prompter.yesOrNo(getMigrateResourceMessageForOverride(AmplifyCategories.STORAGE, resourceName), true))) {
      await cliInputsState.migrate();
      const stackGenerator = new DDBStackTransform(context, resourceName);
      await stackGenerator.transform();
    } else {
      return undefined;
    }
  }

  const cliInputs = cliInputsState.getCliInputPayload();

  const existingAttributeDefinitions: DynamoDBCLIInputsKeyType[] = [];

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

  const { attributeAnswers, indexableAttributeList } = await askAttributeListQuestion(existingAttributeDefinitions);

  cliInputs.gsi = await askGSIQuestion(indexableAttributeList, attributeAnswers, cliInputs.gsi);
  cliInputs.triggerFunctions = await askTriggersQuestion(context, cliInputs.resourceName, cliInputs.triggerFunctions);

  await cliInputsState.saveCliInputPayload(cliInputs);

  const stackGenerator = new DDBStackTransform(context, cliInputs.resourceName);
  await stackGenerator.transform();

  return cliInputs;
}

async function askTriggersQuestion(context: $TSContext, resourceName: string, existingTriggerFunctions?: string[]): Promise<string[]> {
  const triggerFunctions: string[] = existingTriggerFunctions || [];

  if (!existingTriggerFunctions || existingTriggerFunctions.length === 0) {
    if (await prompter.confirmContinue('Do you want to add a Lambda Trigger for your Table?')) {
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
    let triggerName;
    let continueWithTriggerOperationQuestion = true;

    while (continueWithTriggerOperationQuestion) {
      const triggerOperationAnswer = await prompter.pick('Select from the following options', [
        'Add a Trigger',
        'Remove a trigger',
        `I'm done`,
      ]);

      switch (triggerOperationAnswer) {
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
        case `I'm done`: {
          continueWithTriggerOperationQuestion = false;
          break;
        }
        default:
          printer.error(`${triggerOperationAnswer} not supported`);
      }
    }
  }
  return triggerFunctions;
}

async function askGSIQuestion(
  indexableAttributeList: string[],
  attributeDefinitions: DynamoDBAttributeDefType[],
  existingGSIList?: DynamoDBCLIInputsGSIType[],
) {
  printer.blankLine();
  printer.info(
    'You can optionally add global secondary indexes for this table. These are useful when you run queries defined in a different column than the primary key.',
  );
  printer.info('To learn more about indexes, see:');
  printer.info(
    'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.SecondaryIndexes',
  );
  printer.blankLine();

  let gsiList: DynamoDBCLIInputsGSIType[] = [];

  if (
    existingGSIList &&
    !!existingGSIList.length &&
    (await prompter.yesOrNo('Do you want to keep existing global secondary indexes created on your table?', true))
  ) {
    gsiList = existingGSIList;
  }

  if (await prompter.yesOrNo('Do you want to add global secondary indexes to your table?', true)) {
    let continueWithGSIQuestions = true;

    while (continueWithGSIQuestions) {
      if (indexableAttributeList.length > 0) {
        const gsiNameValidator =
          (message: string): Validator =>
          (input: string) =>
            /^[a-zA-Z0-9_-]+$/.test(input) ? true : message;

        const gsiName = await prompter.input('Provide the GSI name', {
          validate: gsiNameValidator('You can use the following characters: a-z A-Z 0-9 - _'),
        });

        const gsiPartitionKeyName = await prompter.pick('Choose partition key for the GSI', [...new Set(indexableAttributeList)]);

        const gsiPrimaryKeyIndex = attributeDefinitions.findIndex(
          (attr: DynamoDBAttributeDefType) => attr.AttributeName === gsiPartitionKeyName,
        );

        /* eslint-enable */
        const gsiItem: DynamoDBCLIInputsGSIType = {
          name: gsiName,
          partitionKey: {
            fieldName: gsiPartitionKeyName,
            fieldType: attributeDefinitions[gsiPrimaryKeyIndex].AttributeType,
          },
        };

        const sortKeyOptions = indexableAttributeList.filter((att: string) => att !== gsiPartitionKeyName);

        if (sortKeyOptions.length > 0) {
          if (await prompter.yesOrNo('Do you want to add a sort key to your global secondary index?', true)) {
            const gsiSortKeyName = await prompter.pick('Choose sort key for the GSI', [...new Set(sortKeyOptions)]);
            const gsiSortKeyIndex = attributeDefinitions.findIndex(
              (attr: DynamoDBAttributeDefType) => attr.AttributeName === gsiSortKeyName,
            );
            gsiItem.sortKey = {
              fieldName: gsiSortKeyName,
              fieldType: attributeDefinitions[gsiSortKeyIndex].AttributeType,
            };
          }
        }

        gsiList.push(gsiItem);
        continueWithGSIQuestions = await prompter.yesOrNo('Do you want to add more global secondary indexes to your table?', true);
      } else {
        printer.error('You do not have any other attributes remaining to configure');
        break;
      }
    }
  }
  return gsiList;
}

async function askSortKeyQuestion(
  indexableAttributeList: string[],
  attributeDefinitions: DynamoDBAttributeDefType[],
  partitionKeyFieldName: string,
): Promise<undefined | DynamoDBCLIInputsKeyType> {
  if (await prompter.yesOrNo('Do you want to add a sort key to your table?', true)) {
    // Ask for sort key
    if (attributeDefinitions.length > 1) {
      const sortKeyName = await prompter.pick(
        'Choose sort key for the table',
        indexableAttributeList.filter((att: string) => att !== partitionKeyFieldName),
      );
      const sortKeyAttrTypeIndex = attributeDefinitions.findIndex((attr: DynamoDBAttributeDefType) => attr.AttributeName === sortKeyName);

      return {
        fieldName: sortKeyName,
        fieldType: attributeDefinitions[sortKeyAttrTypeIndex].AttributeType,
      };
    } else {
      printer.error('You must add additional keys in order to select a sort key.');
    }
  }
  return undefined;
}

async function askPrimaryKeyQuestion(indexableAttributeList: string[], attributeDefinitions: DynamoDBAttributeDefType[]) {
  printer.blankLine();
  printer.info(
    'Before you create the database, you must specify how items in your table are uniquely organized. You do this by specifying a primary key. The primary key uniquely identifies each item in the table so that no two items can have the same key. This can be an individual column, or a combination that includes a primary key and a sort key.',
  );
  printer.blankLine();
  printer.info('To learn more about primary keys, see:');
  printer.info(
    'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey',
  );
  printer.blankLine();

  const partitionKeyName = await prompter.pick('Choose partition key for the table', indexableAttributeList);
  const primaryAttrTypeIndex = attributeDefinitions.findIndex((attr: DynamoDBAttributeDefType) => attr.AttributeName === partitionKeyName);

  return {
    fieldName: partitionKeyName,
    fieldType: attributeDefinitions[primaryAttrTypeIndex].AttributeType,
  };
}

async function askAttributeListQuestion(existingAttributeDefinitions?: DynamoDBCLIInputsKeyType[]) {
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

  printer.blankLine();
  printer.info('You can now add columns to the table.');
  printer.blankLine();

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
    continueAttributeQuestion = await prompter.yesOrNo('Would you like to add another column?', true);
  }

  while (continueAttributeQuestion) {
    const attributeNameValidator =
      (message: string): Validator =>
      (input: string) =>
        /^[a-zA-Z0-9_-]+$/.test(input) ? true : message;

    const attributeName = await prompter.input('What would you like to name this column', {
      validate: attributeNameValidator('You can use the following characters: a-z A-Z 0-9 - _'),
    });

    const attributeType = await prompter.pick('Choose the data type', Object.keys(attributeTypes));

    if (attributeAnswers.findIndex((attribute: DynamoDBAttributeDefType) => attribute.AttributeName === attributeName) !== -1) {
      continueAttributeQuestion = await prompter.confirmContinue('This attribute was already added. Do you want to add another attribute?');
      continue;
    }

    attributeAnswers.push({
      AttributeName: attributeName,
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expression is ambiguous... Remove this comment to see the full error message
      AttributeType: attributeTypes[attributeType].code,
    });

    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expression is ambiguous... Remove this comment to see the full error message
    if (attributeTypes[attributeType].indexable) {
      indexableAttributeList.push(attributeName);
    }

    continueAttributeQuestion = await prompter.yesOrNo('Would you like to add another column?', true);
  }

  return { attributeAnswers, indexableAttributeList };
}

async function askTableNameQuestion(defaultValues: any, resourceName: string) {
  const tableNameValidator =
    (message: string): Validator =>
    (input: string) =>
      /^[a-zA-Z0-9._-]+$/.test(input) ? true : message;

  const tableName = await prompter.input('Provide table name', {
    validate: tableNameValidator('You can use the following characters: a-z A-Z 0-9 . - _'),
    initial: resourceName || defaultValues['tableName'],
  });

  return tableName;
}

async function askResourceNameQuestion(defaultValues: any): Promise<string> {
  const resourceName = await prompter.input('Provide a friendly name', {
    validate: alphanumeric(),
    initial: defaultValues['resourceName'],
  });

  return resourceName;
}

async function removeTrigger(context: $TSContext, resourceName: string, triggerList: string[]) {
  const functionName = await prompter.pick('Select from the function you would like to remove', triggerList);

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

async function addTrigger(context: $TSContext, resourceName: string, triggerList: string[]) {
  const triggerTypeAnswer = await prompter.pick('Select from the following options', [
    'Choose an existing function from the project',
    'Create a new function',
  ]);
  let functionName;

  if (triggerTypeAnswer === 'Choose an existing function from the project') {
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

    functionName = await prompter.pick('Select from the following options', lambdaResources);
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
      service: AmplifySupportedService.LAMBDA,
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

    const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
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

    if (await prompter.confirmContinue(`Do you want to edit the local ${functionName} lambda function now?`)) {
      await context.amplify.openEditor(context, `${projectBackendDirPath}/function/${functionName}/src/index.js`);
    }
  } else {
    throw new Error(`Function ${functionName} does not exist`);
  }

  return functionName;
}

async function getLambdaFunctions(context: $TSContext) {
  const { allResources } = await context.amplify.getResourceStatus();
  const lambdaResources = allResources
    .filter((resource: any) => resource.service === AmplifySupportedService.LAMBDA)
    .map((resource: any) => resource.resourceName);

  return lambdaResources;
}

export function migrate(context: $TSContext, projectPath: any, resourceName: any) {
  const resourceDirPath = path.join(projectPath, 'amplify', 'backend', AmplifyCategories.STORAGE, resourceName);
  const cfnFilePath = path.join(resourceDirPath, `${resourceName}-cloudformation-template.json`);

  // Removes dangling commas from a JSON
  const removeDanglingCommas = (value: any) => {
    const regex = /,(?!\s*?[{["'\w])/g;

    return value.replace(regex, '');
  };

  /* Current Dynamo CFN's have a trailing comma (accepted by CFN),
  but fails on JSON.parse(), hence removing it */

  let oldCfnString = fs.readFileSync(cfnFilePath, 'utf8');
  oldCfnString = removeDanglingCommas(oldCfnString);

  const oldCfn = JSON.parse(oldCfnString);

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

export function getIAMPolicies(resourceName: string, crudOptions: $TSAny) {
  let policy: $TSObject = {};
  const actions: string[] = [];

  crudOptions.forEach((crudOption: $TSAny) => {
    switch (crudOption) {
      case 'create':
        actions.push('dynamodb:Put*', 'dynamodb:Create*', 'dynamodb:BatchWriteItem', 'dynamodb:PartiQLInsert');
        break;
      case 'update':
        actions.push('dynamodb:Update*', 'dynamodb:RestoreTable*', 'dynamodb:PartiQLUpdate');
        break;
      case 'read':
        actions.push(
          'dynamodb:Get*',
          'dynamodb:BatchGetItem',
          'dynamodb:List*',
          'dynamodb:Describe*',
          'dynamodb:Scan',
          'dynamodb:Query',
          'dynamodb:PartiQLSelect',
        );
        break;
      case 'delete':
        actions.push('dynamodb:Delete*', 'dynamodb:PartiQLDelete');
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
