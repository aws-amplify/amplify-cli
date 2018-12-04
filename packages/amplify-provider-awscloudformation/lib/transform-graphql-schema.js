// const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');

const TransformPackage = require('graphql-transformer-core');

const GraphQLTransform = TransformPackage.default;
const { collectDirectiveNames } = TransformPackage;
const DynamoDBModelTransformer = require('graphql-dynamodb-transformer').default;
const ModelAuthTransformer = require('graphql-auth-transformer').default;
const AppSyncTransformer = require('graphql-appsync-transformer').default;
const ModelConnectionTransformer = require('graphql-connection-transformer').default;
const SearchableModelTransformer = require('graphql-elasticsearch-transformer').default;
const VersionedModelTransformer = require('graphql-versioned-transformer').default;
const providerName = require('./constants').ProviderName;

const category = 'api';
const parametersFileName = 'parameters.json';
const templateFileName = 'cloudformation-template.json';
const schemaFileName = 'schema.graphql';

function checkForCommonIssues(usedDirectives, opts) {
  if (usedDirectives.includes('auth') && !opts.isUserPoolEnabled) {
    throw new Error(`You are trying to use the @auth directive without enabling Amazon Cognito user pools for your API. 
Run \`amplify update api\` and choose "Amazon Cognito User Pool" as the authorization type for the API.`);
  }
}

async function transformGraphQLSchema(context, options) {
  const flags = context.parameters.options;
  if ('gql-override' in flags && !flags['gql-override']) {
    return;
  }

  let { resourceDir, parameters } = options;
  // const { noConfig } = options;

  // Compilation during the push step
  if (!resourceDir) {
    const {
      resourcesToBeCreated,
      resourcesToBeUpdated,
    } = await context.amplify.getResourceStatus(category);
    let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
    resources = resources.filter(resource => resource.service === 'AppSync');
    // There can only be one appsync resource
    if (resources.length > 0) {
      const resource = resources[0];
      if (resource.providerPlugin !== providerName) {
        return;
      }
      const { category, resourceName } = resource;
      const backEndDir = context.amplify.pathManager.getBackendDirPath();
      resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    } else {
      // No appsync resource to update/add
      return;
    }
  }

  const parametersFilePath = path.join(resourceDir, parametersFileName);

  if (!parameters && fs.existsSync(parametersFilePath)) {
    try {
      parameters = JSON.parse(fs.readFileSync(parametersFilePath));
    } catch (e) {
      parameters = {};
    }
  }

  const buildDir = `${resourceDir}/build`;
  const schemaFilePath = `${resourceDir}/${schemaFileName}`;

  fs.ensureDirSync(buildDir);
  // Transformer compiler code
  const schemaText = fs.readFileSync(schemaFilePath, 'utf8');

  // Check for common errors
  const usedDirectives = collectDirectiveNames(schemaText);
  checkForCommonIssues(
    usedDirectives,
    { isUserPoolEnabled: Boolean(parameters.AuthCognitoUserPoolId) },
  );

  const transformerList = [
    new AppSyncTransformer(buildDir),
    new DynamoDBModelTransformer(),
    new ModelConnectionTransformer(),
    new VersionedModelTransformer(),
  ];

  if (usedDirectives.includes('searchable')) {
    transformerList.push(new SearchableModelTransformer());
  }

  if (parameters.AuthCognitoUserPoolId) {
    transformerList.push(new ModelAuthTransformer());
  }

  const transformer = new GraphQLTransform({
    transformers: transformerList,
  });

  let cfdoc;
  try {
    cfdoc = transformer.transform(schemaText);
  } catch (e) {
    throw e;
  }

  context.print.success(`\nGraphQL schema compiled successfully. Edit your schema at ${schemaFilePath}`);

  fs.writeFileSync(`${resourceDir}/${templateFileName}`, JSON.stringify(cfdoc, null, 4), 'utf8');

  // Comment this piece for now until transformer lib supports custom DDB ARns
  /* Look for data sources in the cfdoc

  const dynamoResources = [];
  const cfResources = cfdoc.Resources;
  Object.keys(cfResources).forEach((logicalId) => {
    if (cfResources[logicalId].Type === 'AWS::DynamoDB::Table') {
      dynamoResources.push(logicalId);
    }
  });

  if (dynamoResources.length > 0 && !noConfig) {
    context.print.info(`We've detected
    ${dynamoResources.length} DynamoDB
    resources which would be created for you as a
     part of the AppSync service.`);

    if (await context.amplify.confirmPrompt.run('Do you want to use your own
      tables instead?')) {
      let continueConfiguringDyanmoTables = true;

      while (continueConfiguringDyanmoTables) {
        const cfTableConfigureQuestion = {
          type: 'list',
          name: 'cfDynamoTable',
          message: 'Choose a table to configure:',
          choices: dynamoResources,
        };

        const { cfDynamoTable } = await inquirer.prompt(cfTableConfigureQuestion);
        const dynamoAnswers = await askDynamoDBQuestions(context);

        // Would be used in the future to fill into the parameters.json file
        console.log(cfDynamoTable);
        console.log(dynamoAnswers);

        const confirmQuestion = {
          type: 'confirm',
          name: 'continueConfiguringDyanmoTables',
          message: 'Do you want to configure more tables?',
        };

        ({ continueConfiguringDyanmoTables } = await inquirer.prompt(confirmQuestion));
      }
    }
  } */

  const jsonString = JSON.stringify(parameters, null, 4);

  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
}

// Comment this piece for now until transform lib supports custom DDB ARns

/* async function askDynamoDBQuestions(context) {
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
      {
        name: 'Use a DynamoDB table already deployed on AWS',
        value: 'cloudResource',
      },
    ],
  };
  while (true) { // eslint-disable-line
    const dynamoDbTypeAnswer = await inquirer.prompt([dynamoDbTypeQuestion]);
    switch (dynamoDbTypeAnswer.dynamoDbType) {
      case 'currentProject': {
        const storageResources = context.amplify.getProjectDetails().amplifyMeta.storage || {};
        const dynamoDbProjectResources = [];
        Object.keys(storageResources).forEach((resourceName) => {
          if (storageResources[resourceName].service === 'DynamoDB') {
            dynamoDbProjectResources.push(resourceName);
          }
        });
        if (dynamoDbProjectResources.length === 0) {
          context.print.error('There are no DynamoDB
            resources configured in your project currently');
          break;
        }
        const dynamoResourceQuestion = {
          type: 'list',
          name: 'dynamoDbResources',
          message: 'Choose one of the DynamoDB tables that is already configured',
          choices: dynamoDbProjectResources,
        };

        const dynamoResourceAnswer = await inquirer.prompt([dynamoResourceQuestion]);

        // return { resourceName: dynamoResourceAnswer["dynamoDbResources"] };
        return {
          'Fn::GetAtt': [
            `storage${dynamoResourceAnswer.dynamoDbResources}`,
            'Arn',
          ],
        };
      }
      case 'newResource': {
        let add;
        try {
          ({ add } = require('amplify-category-storage'));
        } catch (e) {
          context.print.error('Storage plugin not installed in the CLI.
           You need to install it to use this feature.');
          break;
        }
        return add(context, 'awscloudformation', 'DynamoDB')
          .then((resourceName) => {
            context.print.success('Succesfully added DynamoDB table locally');
            return {
              'Fn::GetAtt': [
                `storage${resourceName}`,
                'Arn',
              ],
            };
          });
      }
      case 'cloudResource': {
        const regions = await context.amplify.executeProviderUtils(context,
          'awscloudformation', 'getRegions');

        const regionQuestion = {
          type: 'list',
          name: 'region',
          message: 'Specify a Region:',
          choices: regions,
        };

        const regionAnswer = await inquirer.prompt([regionQuestion]);

        const dynamodbTables = await context.amplify.executeProviderUtils(context,
        'awscloudformation', 'getDynamoDBTables', { region: regionAnswer.region });

        const dynamodbOptions = dynamodbTables.map(dynamodbTable => ({
          value: {
            resourceName: dynamodbTable.Name.replace(/[^0-9a-zA-Z]/gi, ''),
            region: dynamodbTable.Region,
            Arn: dynamodbTable.Arn,
            TableName: dynamodbTable.Name,
          },
          name: `${dynamodbTable.Name} (${dynamodbTable.Arn})`,
        }));

        if (dynamodbOptions.length === 0) {
          context.print.error('You do not have any DynamoDB tables
           configured for the selected Region');
          break;
        }

        const dynamoCloudOptionQuestion = {
          type: 'list',
          name: 'dynamodbTableChoice',
          message: 'Specify a DynamoDB table:',
          choices: dynamodbOptions,
        };

        const dynamoCloudOptionAnswer = await inquirer.prompt([dynamoCloudOptionQuestion]);
        return dynamoCloudOptionAnswer.dynamodbTableChoice.Arn;
      }
      default: context.print.error('Invalid option selected');
    }
  }
} */

module.exports = {
  transformGraphQLSchema,
};
