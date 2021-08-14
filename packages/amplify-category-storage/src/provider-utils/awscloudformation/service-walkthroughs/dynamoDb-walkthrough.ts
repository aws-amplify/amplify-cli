const {
  getCloudFormationTemplatePath,
  getExistingStorageAttributeDefinitions,
  getExistingStorageGSIs,
  getExistingTableColumnNames,
} = require('../cfn-template-utils');
const inquirer = require('inquirer');
import * as path from 'path';
import * as fs from 'fs-extra';
import uuid from 'uuid';
const { ResourceDoesNotExistError, exitOnNextTick } = require('amplify-cli-core');
import { AmplifyCategories } from '../../../../../amplify-cli-core/lib';

// keep in sync with ServiceName in amplify-AmplifyCategories.STORAGE-function, but probably it will not change
const FunctionServiceNameLambdaFunction = 'Lambda';
const parametersFileName = 'parameters.json';
const storageParamsFileName = 'storage-params.json';
const serviceName = 'DynamoDB';
const templateFileName = 'dynamoDb-cloudformation-template.json.ejs';

async function addWalkthrough(context: any, defaultValuesFilename: any, serviceMetadata: any) {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
  return configure(context, defaultValuesFilename, serviceMetadata);
}

async function updateWalkthrough(context: any, defaultValuesFilename: any, serviceMetadata: any) {
  // const resourceName = resourceAlreadyExists(context);
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  const dynamoDbResources = {};

  Object.keys(amplifyMeta[AmplifyCategories.STORAGE]).forEach(resourceName => {
    if (
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].service === serviceName &&
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].mobileHubMigrated !== true &&
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].serviceType !== 'imported'
    ) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      dynamoDbResources[resourceName] = amplifyMeta[AmplifyCategories.STORAGE][resourceName];
    }
  });

  if (!amplifyMeta[AmplifyCategories.STORAGE] || Object.keys(dynamoDbResources).length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';

    context.print.error(errMessage);
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

  return await configure(context, defaultValuesFilename, serviceMetadata, answer.resourceName);
}

async function configure(context: any, defaultValuesFilename: any, serviceMetadata: any, resourceName: any) {
  const { amplify, print } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = path.join(__dirname, '..', 'default-values', defaultValuesFilename);
  const { getAllDefaults } = require(defaultValuesSrc);

  const defaultValues = getAllDefaults(amplify.getProjectDetails());
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  const attributeTypes = {
    string: { code: 'S', indexable: true },
    number: { code: 'N', indexable: true },
    binary: { code: 'B', indexable: true },
    boolean: { code: 'BOOL', indexable: false },
    list: { code: 'L', indexable: false },
    map: { code: 'M', indexable: false },
    null: { code: 'NULL', indexable: false },
    'string set': { code: 'SS', indexable: false },
    'number set': { code: 'NS', indexable: false },
    'binary set': { code: 'BS', indexable: false },
  };
  let usedAttributeDefinitions = new Set();
  let storageParams = {};

  if (resourceName) {
    const resourceDirPath = path.join(projectBackendDirPath, AmplifyCategories.STORAGE, resourceName);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    let parameters;

    try {
      parameters = context.amplify.readJsonFile(parametersFilePath);
    } catch (e) {
      parameters = {};
    }

    parameters.resourceName = resourceName;

    Object.assign(defaultValues, parameters);

    // Get storage question params
    const storageParamsFilePath = path.join(resourceDirPath, storageParamsFileName);

    try {
      storageParams = context.amplify.readJsonFile(storageParamsFilePath);
    } catch (e) {
      storageParams = {};
    }
  }

  const resourceQuestions = [
    {
      type: inputs[0].type,
      name: inputs[0].key,
      message: inputs[0].question,
      validate: amplify.inputValidation(inputs[0]),
      default: () => {
        const defaultValue = defaultValues[inputs[0].key];
        return defaultValue;
      },
    },
    {
      type: inputs[1].type,
      name: inputs[1].key,
      message: inputs[1].question,
      validate: amplify.inputValidation(inputs[1]),
      default: (answers: any) => {
        const defaultValue = defaultValues[inputs[1].key];
        return answers.resourceName || defaultValue;
      },
    },
  ];

  print.info('');
  print.info('Welcome to the NoSQL DynamoDB database wizard');
  print.info('This wizard asks you a series of questions to help determine how to set up your NoSQL database table.');
  print.info('');

  // Ask resource and table name question

  let answers = {};

  if (!resourceName) {
    answers = await inquirer.prompt(resourceQuestions);
  }

  print.info('');
  print.info('You can now add columns to the table.');
  print.info('');

  // Ask attribute questions

  const attributeQuestion = {
    type: inputs[2].type,
    name: inputs[2].key,
    message: inputs[2].question,
    validate: amplify.inputValidation(inputs[2]),
  };
  const attributeTypeQuestion = {
    type: inputs[3].type,
    name: inputs[3].key,
    message: inputs[3].question,
    choices: Object.keys(attributeTypes),
  };

  let continueAttributeQuestion = true;
  const attributeAnswers = [];

  if (resourceName) {
    attributeAnswers.push(
      {
        AttributeName: defaultValues.partitionKeyName,
        AttributeType: defaultValues.partitionKeyType,
      },
      {
        AttributeName: defaultValues.sortKeyName,
        AttributeType: defaultValues.sortKeyType,
      },
    );

    continueAttributeQuestion = await amplify.confirmPrompt('Would you like to add another column?');
  }

  const indexableAttributeList = await getExistingTableColumnNames(resourceName);

  while (continueAttributeQuestion) {
    const attributeAnswer = await inquirer.prompt([attributeQuestion, attributeTypeQuestion]);

    if (attributeAnswers.findIndex(attribute => attribute.AttributeName === attributeAnswer[inputs[2].key]) !== -1) {
      continueAttributeQuestion = await amplify.confirmPrompt('This attribute was already added. Do you want to add another attribute?');
      continue;
    }

    attributeAnswers.push({
      AttributeName: attributeAnswer[inputs[2].key],
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      AttributeType: attributeTypes[attributeAnswer[inputs[3].key]].code,
    });

    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    if (attributeTypes[attributeAnswer[inputs[3].key]].indexable) {
      indexableAttributeList.push(attributeAnswer[inputs[2].key]);
    }

    continueAttributeQuestion = await amplify.confirmPrompt('Would you like to add another column?');
  }

  (answers as any).AttributeDefinitions = attributeAnswers;

  print.info('');
  print.info(
    'Before you create the database, you must specify how items in your table are uniquely organized. You do this by specifying a primary key. The primary key uniquely identifies each item in the table so that no two items can have the same key. This can be an individual column, or a combination that includes a primary key and a sort key.',
  );
  print.info('');
  print.info('To learn more about primary keys, see:');
  print.info(
    'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey',
  );
  print.info('');
  // Ask for primary key
(answers as any).KeySchema = [];
  let partitionKeyName: any;
  let partitionKeyType;

  if (resourceName) {
    ({ partitionKeyName } = defaultValues);
    ({ partitionKeyType } = defaultValues);
  } else {
    const primaryKeyQuestion = {
      type: inputs[4].type,
      name: inputs[4].key,
      message: inputs[4].question,
      validate: amplify.inputValidation(inputs[3]),
      choices: indexableAttributeList,
    };

    const partitionKeyAnswer = await inquirer.prompt([primaryKeyQuestion]);

    partitionKeyName = partitionKeyAnswer[inputs[4].key];
  }

  (answers as any).KeySchema.push({
    AttributeName: partitionKeyName,
    KeyType: 'HASH',
});

  // Get the type for primary index
const primaryAttrTypeIndex = (answers as any).AttributeDefinitions.findIndex((attr: any) => attr.AttributeName === partitionKeyName);

  partitionKeyType = (answers as any).AttributeDefinitions[primaryAttrTypeIndex].AttributeType;

  usedAttributeDefinitions.add(partitionKeyName);

  let sortKeyName: any;
  let sortKeyType;

  if (resourceName) {
    ({ sortKeyName } = defaultValues);

    if (sortKeyName) {
      (answers as any).KeySchema.push({
    AttributeName: sortKeyName,
    KeyType: 'RANGE',
});

      usedAttributeDefinitions.add(sortKeyName);
    }
  } else if (await amplify.confirmPrompt('Do you want to add a sort key to your table?')) {
    // Ask for sort key
    if ((answers as any).AttributeDefinitions.length > 1) {
      const sortKeyQuestion = {
        type: inputs[5].type,
        name: inputs[5].key,
        message: inputs[5].question,
        choices: indexableAttributeList.filter((att: any) => att !== partitionKeyName),
      };
      const sortKeyAnswer = await inquirer.prompt([sortKeyQuestion]);

      sortKeyName = sortKeyAnswer[inputs[5].key];

      (answers as any).KeySchema.push({
    AttributeName: sortKeyName,
    KeyType: 'RANGE',
});

      usedAttributeDefinitions.add(sortKeyName);
    } else {
      context.print.error('You must add additional keys in order to select a sort key.');
    }
  }

  if (sortKeyName) {
    // Get the type for primary index
const sortKeyAttrTypeIndex = (answers as any).AttributeDefinitions.findIndex((attr: any) => attr.AttributeName === sortKeyName);
    sortKeyType = (answers as any).AttributeDefinitions[sortKeyAttrTypeIndex].AttributeType;
  }

  (answers as any).KeySchema = (answers as any).KeySchema;

  print.info('');
  print.info(
    'You can optionally add global secondary indexes for this table. These are useful when you run queries defined in a different column than the primary key.',
  );
  print.info('To learn more about indexes, see:');
  print.info(
    'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.SecondaryIndexes',
  );
  print.info('');

  // Ask for GSI's

  if (await amplify.confirmPrompt('Do you want to add global secondary indexes to your table?')) {
    let continuewithGSIQuestions = true;
    const gsiList = [];

    while (continuewithGSIQuestions) {
      if (indexableAttributeList.length > 0) {
        const gsiAttributeQuestion = {
          type: inputs[6].type,
          name: inputs[6].key,
          message: inputs[6].question,
        };
        const gsiPrimaryKeyQuestion = {
          type: inputs[7].type,
          name: inputs[7].key,
          message: inputs[7].question,
          validate: amplify.inputValidation(inputs[3]),
          choices: indexableAttributeList,
        };

        /*eslint-disable*/
        const gsiPrimaryAnswer = await inquirer.prompt([gsiAttributeQuestion, gsiPrimaryKeyQuestion]);

        const gsiPrimaryKeyName = gsiPrimaryAnswer[inputs[7].key];

        /* eslint-enable */
        const gsiItem = {
          ProvisionedThroughput: {
            ReadCapacityUnits: '5',
            WriteCapacityUnits: '5',
          },
          Projection: {
            ProjectionType: 'ALL',
          },
          IndexName: gsiPrimaryAnswer[inputs[6].key],
          KeySchema: [
            {
              AttributeName: gsiPrimaryKeyName,
              KeyType: 'HASH',
            },
          ],
        };

        usedAttributeDefinitions.add(gsiPrimaryKeyName);

        const sortKeyOptions = indexableAttributeList.filter((att: any) => att !== gsiPrimaryKeyName);

        if (sortKeyOptions.length > 0) {
          if (await amplify.confirmPrompt('Do you want to add a sort key to your global secondary index?')) {
            const sortKeyQuestion = {
              type: inputs[8].type,
              name: inputs[8].key,
              message: inputs[8].question,
              choices: sortKeyOptions,
            };

            const sortKeyAnswer = await inquirer.prompt([sortKeyQuestion]);

            gsiItem.KeySchema.push({
              AttributeName: sortKeyAnswer[inputs[8].key],
              KeyType: 'RANGE',
            });

            usedAttributeDefinitions.add(sortKeyAnswer[inputs[8].key]);
          }
        }

        gsiList.push(gsiItem);

        continuewithGSIQuestions = await amplify.confirmPrompt('Do you want to add more global secondary indexes to your table?');
      } else {
        context.print.error('You do not have any other attributes remaining to configure');
        break;
      }
    }

    // if resource name is undefined then it's an 'add storage' we want to check on an update
    if (resourceName) {
      const existingGSIs = await getExistingStorageGSIs(resourceName);
      const existingAttributeDefinitions = await getExistingStorageAttributeDefinitions(resourceName);
      const allAttributeDefinitionsMap = new Map([
    ...existingAttributeDefinitions.map((r: any) => [r.AttributeName, r]),
    ...(answers as any).AttributeDefinitions.map((r: any) => [r.AttributeName, r]),
]);

      if (
        !!existingGSIs.length &&
        (await amplify.confirmPrompt('Do you want to keep existing global seconday indexes created on your table?'))
      ) {
        existingGSIs.forEach((r: any) => gsiList.push(r));
        (answers as any).AttributeDefinitions = [...allAttributeDefinitionsMap.values()];

        usedAttributeDefinitions = existingGSIs.reduce((prev: any, current: any) => {
          current.KeySchema.map((r: any) => prev.add(r.AttributeName));
          return prev;
        }, usedAttributeDefinitions);
      }
    }

    if (gsiList.length > 0) {
      (answers as any).GlobalSecondaryIndexes = gsiList;
    }
  }

  // @ts-expect-error ts-migrate(2740) FIXME: Type 'unknown[]' is missing the following properti... Remove this comment to see the full error message
  usedAttributeDefinitions = Array.from(usedAttributeDefinitions);

  /* Filter out only attribute
 * definitions which have been used - cfn errors out otherwise */
(answers as any).AttributeDefinitions = (answers as any).AttributeDefinitions.filter((attributeDefinition: any) => (usedAttributeDefinitions as any).indexOf(attributeDefinition.AttributeName) !== -1);

  Object.assign(defaultValues, answers);

  // Ask Lambda trigger question
  if (!storageParams || !(storageParams as any).triggerFunctions || (storageParams as any).triggerFunctions.length === 0) {
    if (await amplify.confirmPrompt('Do you want to add a Lambda Trigger for your Table?', false)) {
      let triggerName;

      try {
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
        triggerName = await addTrigger(context, defaultValues.resourceName);

        if (!storageParams) {
          storageParams = {};
        }

        (storageParams as any).triggerFunctions = [triggerName];
      } catch (e) {
        context.print.error(e.message);
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
            triggerName = await addTrigger(context, defaultValues.resourceName, (storageParams as any).triggerFunctions);
            if (!storageParams) {
              storageParams = {};
            } else if (!(storageParams as any).triggerFunctions) {
              (storageParams as any).triggerFunctions = [triggerName];
            } else {
              (storageParams as any).triggerFunctions.push(triggerName);
            }

            continueWithTriggerOperationQuestion = false;
          } catch (e) {
            context.print.error(e.message);
            continueWithTriggerOperationQuestion = true;
          }
          break;
        }
        case 'Remove a trigger': {
          try {
            if (!storageParams || !(storageParams as any).triggerFunctions || (storageParams as any).triggerFunctions.length === 0) {
              throw new Error('No triggers found associated with this table');
            } else {
              triggerName = await removeTrigger(context, defaultValues.resourceName, (storageParams as any).triggerFunctions);

              const index = (storageParams as any).triggerFunctions.indexOf(triggerName);

              if (index >= 0) {
                (storageParams as any).triggerFunctions.splice(index, 1);
                continueWithTriggerOperationQuestion = false;
              } else {
                throw new Error('Could not find trigger function');
              }
            }
          } catch (e) {
            context.print.error(e.message);
            continueWithTriggerOperationQuestion = true;
          }

          break;
        }
        case 'Skip Question': {
          continueWithTriggerOperationQuestion = false;
          break;
        }
        default:
          context.print.error(`${triggerOperationAnswer.triggerOperation} not supported`);
      }
    }
  }

  const resource = defaultValues.resourceName;
  const resourceDirPath = path.join(projectBackendDirPath, AmplifyCategories.STORAGE, resource);

  delete defaultValues.resourceName;

  fs.ensureDirSync(resourceDirPath);

  const parametersFilePath = path.join(resourceDirPath, parametersFileName);

  // Copy just the table name as parameters
  const parameters = {
    tableName: defaultValues.tableName,
    partitionKeyName,
    partitionKeyType,
  };

  if (sortKeyName) {
    Object.assign(parameters, { sortKeyName, sortKeyType });
  }

  let jsonString = JSON.stringify(parameters, null, 4);

  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  const storageParamsFilePath = path.join(resourceDirPath, storageParamsFileName);

  jsonString = JSON.stringify(storageParams, null, 4);

  fs.writeFileSync(storageParamsFilePath, jsonString, 'utf8');

  await copyCfnTemplate(context, resource, defaultValues);

  return resource;
}

async function removeTrigger(context: any, resourceName: any, triggerList: any) {
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

async function addTrigger(context: any, resourceName: any, triggerList: any) {
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
      const filteredLambdaResources: any = [];

      lambdaResources.forEach((lambdaResource: any) => {
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

    context.print.success(`Successfully added resource ${functionName} locally`);
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
    context.print.success(`Successfully updated resource ${functionName} locally`);

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

function copyCfnTemplate(context: any, resourceName: any, options: any) {
  const pluginDir = __dirname;
  const copyJobs = [
    {
      dir: pluginDir,
      template: path.join('..', '..', '..', '..', 'resources', 'cloudformation-templates', templateFileName),
      target: getCloudFormationTemplatePath(resourceName),
    },
  ];

  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, options);
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
