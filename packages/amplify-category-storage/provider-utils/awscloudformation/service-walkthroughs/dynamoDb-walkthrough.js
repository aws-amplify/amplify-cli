const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

const category = 'storage';
const parametersFileName = 'parameters.json';
const serviceName = 'DynamoDB';
const templateFileName = 'dynamoDb-cloudformation-template.json.ejs';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  return configure(context, defaultValuesFilename, serviceMetadata);
}

function updateWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  // const resourceName = resourceAlreadyExists(context);
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  const dynamoDbResources = {};

  Object.keys(amplifyMeta[category]).forEach((resourceName) => {
    if (amplifyMeta[category][resourceName].service === serviceName) {
      dynamoDbResources[resourceName] = amplifyMeta[category][resourceName];
    }
  });

  if (!amplifyMeta[category] || Object.keys(dynamoDbResources).length === 0) {
    context.print.error('No resources to update. You need to add a resource.');
    process.exit(0);
    return;
  }
  const resources = Object.keys(dynamoDbResources);
  const question = [{
    name: 'resourceName',
    message: 'Specify the resource that you would want to update',
    type: 'list',
    choices: resources,
  }];

  return inquirer.prompt(question)
    .then(answer => configure(
      context, defaultValuesFilename,
      serviceMetadata, answer.resourceName,
    ));
}

async function configure(context, defaultValuesFilename, serviceMetadata, resourceName) {
  const { amplify, print } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
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

  if (resourceName) {
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    let parameters;
    try {
      parameters = JSON.parse(fs.readFileSync(parametersFilePath));
    } catch (e) {
      parameters = {};
    }
    parameters.resourceName = resourceName;
    Object.assign(defaultValues, parameters);
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
      default: (answers) => {
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
    continueAttributeQuestion = await amplify.confirmPrompt.run('Would you like to add another column?');
  }
  const indexableAttributeList = [];

  while (continueAttributeQuestion) {
    const attributeAnswer = await inquirer.prompt([attributeQuestion, attributeTypeQuestion]);

    if (attributeAnswers.findIndex(attribute => attribute.AttributeName
      === attributeAnswer[inputs[2].key]) !== -1) {
      continueAttributeQuestion = await amplify.confirmPrompt.run('This attribute was already added. Do you want to add another attribute?');
      continue;
    }

    attributeAnswers.push({
      AttributeName: attributeAnswer[inputs[2].key],
      AttributeType: attributeTypes[attributeAnswer[inputs[3].key]].code,
    });

    if (attributeTypes[attributeAnswer[inputs[3].key]].indexable) {
      indexableAttributeList.push(attributeAnswer[inputs[2].key]);
    }
    continueAttributeQuestion = await amplify.confirmPrompt.run('Would you like to add another column?');
  }
  answers.AttributeDefinitions = attributeAnswers;

  print.info('');
  print.info('Before you create the database, you must specify how items in your table are uniquely organized. You do this by specifying a primary key. The primary key uniquely identifies each item in the table so that no two items can have the same key. This can be an individual column, or a combination that includes a primary key and a sort key.');
  print.info('');
  print.info('To learn more about primary keys, see:');
  print.info('http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey');
  print.info('');
  // Ask for primary key

  answers.KeySchema = [];
  let partitionKeyName;
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

  answers.KeySchema.push({
    AttributeName: partitionKeyName,
    KeyType: 'HASH',
  });

  // Get the type for primary index

  const primaryAttrTypeIndex = answers.AttributeDefinitions.findIndex(attr =>
    attr.AttributeName === partitionKeyName);
  partitionKeyType = answers.AttributeDefinitions[primaryAttrTypeIndex].AttributeType;

  const primaryKeyAttrIndex = indexableAttributeList.indexOf(partitionKeyName);

  if (primaryKeyAttrIndex > -1) {
    indexableAttributeList.splice(primaryKeyAttrIndex, 1);
  }
  usedAttributeDefinitions.add(partitionKeyName);

  let sortKeyName;
  let sortKeyType;

  if (resourceName) {
    ({ sortKeyName } = defaultValues);
    if (sortKeyName) {
      answers.KeySchema.push({
        AttributeName: sortKeyName,
        KeyType: 'RANGE',
      });
      usedAttributeDefinitions.add(sortKeyName);
    }
  } else if (await amplify.confirmPrompt.run('Do you want to add a sort key to your table?')) {
    // Ask for sort key
    if (answers.AttributeDefinitions.length > 1) {
      const sortKeyQuestion = {
        type: inputs[5].type,
        name: inputs[5].key,
        message: inputs[5].question,
        choices: indexableAttributeList,
      };
      const sortKeyAnswer = await inquirer.prompt([sortKeyQuestion]);
      sortKeyName = sortKeyAnswer[inputs[5].key];
      answers.KeySchema.push({
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
    const sortKeyAttrTypeIndex = answers.AttributeDefinitions.findIndex(attr =>
      attr.AttributeName === sortKeyName);
    sortKeyType = answers.AttributeDefinitions[sortKeyAttrTypeIndex].AttributeType;
  }

  answers.KeySchema = answers.KeySchema;

  print.info('');
  print.info('You can optionally add global secondary indexes for this table. These are useful when you run queries defined in a different column than the primary key.');
  print.info('To learn more about indexes, see:');
  print.info('http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.SecondaryIndexes');
  print.info('');

  // Ask for GSI's

  if (await amplify.confirmPrompt.run('Do you want to add global secondary indexes to your table?')) {
    let continuewithGSIQuestions = true;
    const gsiList = [];
    // Generates a clone of the attribute list
    const availableAttributes = indexableAttributeList.slice();

    while (continuewithGSIQuestions) {
      if (availableAttributes.length > 0) {
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
          choices: availableAttributes,
        };
        /*eslint-disable*/
        const gsiPrimaryAnswer = await inquirer.prompt([gsiAttributeQuestion, gsiPrimaryKeyQuestion]);
        /* eslint-enable */
        const gsiItem = {
          ProvisionedThroughput: {
            ReadCapacityUnits: '5',
            WriteCapacityUnits: '5',
          },
          Projection: {
            ProjectionType: 'ALL',
          },
          IndexName: gsiPrimaryAnswer[inputs[7].key],
          KeySchema: [
            {
              AttributeName: gsiPrimaryAnswer[inputs[7].key],
              KeyType: 'HASH',
            },
          ],
        };

        usedAttributeDefinitions.add(gsiPrimaryAnswer[inputs[7].key]);

        const gsiPrimaryAttrIndex = indexableAttributeList.indexOf(gsiPrimaryAnswer[inputs[7].key]);
        if (gsiPrimaryAttrIndex > -1) {
          availableAttributes.splice(gsiPrimaryAttrIndex, 1);
        }
        if (availableAttributes.length > 0) {
          if (await amplify.confirmPrompt.run('Do you want to add a sort key to your global secondary index?')) {
            const sortKeyQuestion = {
              type: inputs[8].type,
              name: inputs[8].key,
              message: inputs[8].question,
              choices: availableAttributes,
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
        continuewithGSIQuestions = await amplify.confirmPrompt.run('Do you want to add more global secondary indexes to your table?');
      } else {
        context.print.error('You do not have any other attributes remaining to configure');
        break;
      }
    }
    if (gsiList.length > 0) {
      answers.GlobalSecondaryIndexes = gsiList;
    }
  }
  usedAttributeDefinitions = Array.from(usedAttributeDefinitions);
  /* Filter out only attribute
  * definitions which have been used - cfn errors out otherwise */
  answers.AttributeDefinitions = answers.AttributeDefinitions.filter(attributeDefinition =>
    usedAttributeDefinitions.indexOf(attributeDefinition.AttributeName) !== -1);

  Object.assign(defaultValues, answers);
  const resource = defaultValues.resourceName;
  const resourceDirPath = path.join(projectBackendDirPath, category, resource);
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

  const jsonString = JSON.stringify(parameters, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  await copyCfnTemplate(context, category, resource, defaultValues);
  return resource;
}

function copyCfnTemplate(context, categoryName, resourceName, options) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;

  const copyJobs = [
    {
      dir: pluginDir,
      template: `../cloudformation-templates/${templateFileName}`,
      target: `${targetDir}/${categoryName}/${resourceName}/${resourceName}-cloudformation-template.json`,
    },
  ];

  // copy over the files
  return amplify.copyBatch(context, copyJobs, options);
}

module.exports = { addWalkthrough, updateWalkthrough };
