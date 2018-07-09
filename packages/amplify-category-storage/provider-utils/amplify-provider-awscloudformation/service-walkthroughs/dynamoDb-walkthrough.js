const inquirer = require('inquirer');

async function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

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

  // Ask resource and table name question

  const answers = await inquirer.prompt(resourceQuestions);

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
  const indexableAttributeList = [];

  while (continueAttributeQuestion) {
    const attributeAnswer = await inquirer.prompt([attributeQuestion, attributeTypeQuestion]);

    if (attributeAnswers.findIndex(attribute => attribute.AttributeName
      === attributeAnswer[inputs[2].key]) !== -1) {
      continueAttributeQuestion = await context.prompt.confirm('Attribute already added before. Do you want to add another attribute?');
      continue;
    }

    attributeAnswers.push({
      AttributeName: attributeAnswer[inputs[2].key],
      AttributeType: attributeTypes[attributeAnswer[inputs[3].key]].code,
    });

    if (attributeTypes[attributeAnswer[inputs[3].key]].indexable) {
      indexableAttributeList.push(attributeAnswer[inputs[2].key]);
    }
    continueAttributeQuestion = await context.prompt.confirm('Do you want to add another attribute?');
  }
  answers.AttributeDefinitions = attributeAnswers;

  // Ask for primary key

  answers.KeySchema = [];

  const primaryKeyQuestion = {
    type: inputs[4].type,
    name: inputs[4].key,
    message: inputs[4].question,
    validate: amplify.inputValidation(inputs[3]),
    choices: indexableAttributeList,
  };

  const partitionKeyAnswer = await inquirer.prompt([primaryKeyQuestion]);
  answers.KeySchema.push({
    AttributeName: partitionKeyAnswer[inputs[4].key],
    KeyType: 'HASH',
  });

  const primaryKeyAttrIndex = indexableAttributeList.indexOf(partitionKeyAnswer[inputs[4].key]);

  if (primaryKeyAttrIndex > -1) {
    indexableAttributeList.splice(primaryKeyAttrIndex, 1);
  }
  usedAttributeDefinitions.add(partitionKeyAnswer[inputs[4].key]);

  if (await context.prompt.confirm('Do you want to add a sort key to your table?')) {
    // Ask for sort key
    if (answers.AttributeDefinitions.length > 1) {
      const sortKeyQuestion = {
        type: inputs[5].type,
        name: inputs[5].key,
        message: inputs[5].question,
        choices: indexableAttributeList,
      };
      const sortKeyAnswer = await inquirer.prompt([sortKeyQuestion]);
      answers.KeySchema.push({
        AttributeName: sortKeyAnswer[inputs[5].key],
        KeyType: 'RANGE',
      });
      usedAttributeDefinitions.add(sortKeyAnswer[inputs[5].key]);
    } else {
      context.print.error('You must add additional keys in order to select a sort key.');
    }
  }

  answers.KeySchema = answers.KeySchema;

  // Ask for GSI's

  if (await context.prompt.confirm('Do you want to add GSIs to your table?')) {
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
          if (await context.prompt.confirm('Do you want to add a sort key to your GSI?')) {
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
        continuewithGSIQuestions = await context.prompt.confirm('Do you want to add more GSIs to your table?');
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

  return answers;
}

module.exports = { serviceWalkthrough };
