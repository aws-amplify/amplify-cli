const fs = require('fs-extra');
const inquirer = require('inquirer');
const graphql = require('graphql');
const { RelationalDBSchemaTransformer } = require('graphql-relational-schema-transformer');
const { RelationalDBTemplateGenerator, AuroraServerlessMySQLDatabaseReader } = require('graphql-relational-schema-transformer');
const { mergeTypes } = require('merge-graphql-schemas');

const subcommand = 'add-graphql-datasource';
const categories = 'categories';
const category = 'api';
const providerName = 'awscloudformation';
const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-datasources.json`));

const rdsRegion = 'rdsRegion';
const rdsIdentifier = 'rdsClusterIdentifier';
const rdsSecretStoreArn = 'rdsSecretStoreArn';
const rdsDatabaseName = 'rdsDatabaseName';
const rdsResourceName = 'rdsResourceName';
const rdsDatasource = 'rdsDatasource';
const rdsInit = 'rdsInit';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify } = context;
    let resourceName;
    let datasource;
    let databaseName;
    const AWS = await getAwsClient(context, 'list');
    return datasourceSelectionPrompt(context, servicesMetadata)
      .then((result) => {
        datasource = result.datasource; // eslint-disable-line prefer-destructuring

        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }

        return providerController.addDatasource(context, category, result.datasource);
      })
      .then((answers) => {
        resourceName = answers.resourceName; // eslint-disable-line prefer-destructuring
        databaseName = answers.databaseName; // eslint-disable-line prefer-destructuring

        /**
         * Write the new env specific datasource information into
         * the team-provider-info file
         */
        const currEnv = amplify.getEnvInfo().envName;
        const teamProviderInfoFilePath = amplify.pathManager.getProviderInfoFilePath();
        const teamProviderInfo = context.amplify.readJsonFile(teamProviderInfoFilePath);

        if (!teamProviderInfo[currEnv][categories]) {
          teamProviderInfo[currEnv][categories] = {};
        }

        if (!teamProviderInfo[currEnv][categories][category]) {
          teamProviderInfo[currEnv][categories][category] = {};
        }

        if (!teamProviderInfo[currEnv][categories][category][resourceName]) {
          teamProviderInfo[currEnv][categories][category][resourceName] = {};
        }

        teamProviderInfo[currEnv][categories][category][resourceName][rdsRegion]
         = answers.region;
        teamProviderInfo[currEnv][categories][category][resourceName][rdsIdentifier]
         = answers.dbClusterArn;
        teamProviderInfo[currEnv][categories][category][resourceName][rdsSecretStoreArn]
         = answers.secretStoreArn;
        teamProviderInfo[currEnv][categories][category][resourceName][rdsDatabaseName]
         = answers.databaseName;

        fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(teamProviderInfo, null, 4));

        const backendConfigFilePath = amplify.pathManager.getBackendConfigFilePath();
        const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);

        backendConfig[category][resourceName][rdsInit] = true;

        fs.writeFileSync(backendConfigFilePath, JSON.stringify(backendConfig, null, 4));


        /**
         * Load the MySqlRelationalDBReader
         */
        // eslint-disable-next-line max-len
        const dbReader = new AuroraServerlessMySQLDatabaseReader(answers.region, answers.secretStoreArn, answers.dbClusterArn, answers.databaseName, AWS);


        /**
         * Instantiate a new Relational Schema Transformer and perform
         * the db instrospection to get the GraphQL Schema and Template Context
         */
        const relationalSchemaTransformer =
         new RelationalDBSchemaTransformer(dbReader, answers.databaseName);
        return relationalSchemaTransformer.introspectDatabaseSchema();
      }).then((graphqlSchemaContext) => {
        const projectBackendDirPath = amplify.pathManager.getBackendDirPath();

        /**
         * Merge the GraphQL Schema with the existing schema.graphql in the projects stack
         *
         */
        const apiDirPath = `${projectBackendDirPath}/${category}/${resourceName}`;
        fs.ensureDirSync(apiDirPath);
        const graphqlSchemaFilePath = `${apiDirPath}/schema.graphql`;
        fs.ensureFileSync(graphqlSchemaFilePath);
        const graphqlSchemaRaw = fs.readFileSync(graphqlSchemaFilePath, 'utf8');
        const currGraphQLSchemaDoc = graphql.parse(graphqlSchemaRaw);

        const rdsGraphQLSchemaDoc = graphqlSchemaContext.schemaDoc;

        const concatGraphQLSchemaDoc
         = mergeTypes([currGraphQLSchemaDoc, rdsGraphQLSchemaDoc], { all: true });

        fs.writeFileSync(graphqlSchemaFilePath, concatGraphQLSchemaDoc, 'utf8');
        const resolversDir = `${projectBackendDirPath}/${category}/${resourceName}/resolvers`;

        /**
         * Instantiate a new Relational Template Generator and create
         * the template and relational resolvers
         */
        const templateGenerator = new RelationalDBTemplateGenerator(graphqlSchemaContext);
        context[rdsResourceName] = resourceName;
        context[rdsDatasource] = datasource;
        let template = templateGenerator.createTemplate(context);
        template = templateGenerator.addRelationalResolvers(template, resolversDir);
        const cfn = templateGenerator.printCloudformationTemplate(template);

        /**
         * Add the generated the CFN to the appropriate nested stacks directory
         */
        const stacksDir = `${projectBackendDirPath}/${category}/${resourceName}/stacks`;
        const writeToPath = `${stacksDir}/${resourceName}-${databaseName}-rds.json`;
        fs.writeFileSync(writeToPath, cfn, 'utf8');

        return datasource;
      })
      .then((datasourceName) => {
        context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { noConfig: true, forceCompile: true });
        return datasourceName;
      })
      .then((datasourceName) => {
        const { print } = context;
        print.success(`Successfully added the ${datasourceName} datasource locally`);
        print.info('');
        print.success('Some next steps:');
        print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        print.info('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud');
        print.info('');
      })
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the datasource');
      });
  },
};

function datasourceSelectionPrompt(context, supportedDatasources) {
  const options = [];
  Object.keys(supportedDatasources).forEach((datasource) => {
    const optionName = supportedDatasources[datasource].alias || `${supportedDatasources[datasource].providerName}:${supportedDatasources[datasource].service}`;
    options.push({
      name: optionName,
      value: {
        provider: supportedDatasources[datasource].provider,
        datasource,
        providerName: supportedDatasources[datasource].provider,
      },
    });
  });

  if (options.length === 0) {
    context.print.error(`No datasources defined by configured providers for category: ${category}`);
    process.exit(1);
  }

  if (options.length === 1) {
    // No need to ask questions
    context.print.info(`Using datasource: ${options[0].value.datasource}, provided by: ${options[0].value.providerName}`);
    return new Promise((resolve) => {
      resolve(options[0].value);
    });
  }

  const question = [{
    name: 'datasource',
    message: 'Please select from one of the below mentioned datasources',
    type: 'list',
    choices: options,
  }];

  return inquirer.prompt(question)
    .then(answer => answer.datasource);
}

async function getAwsClient(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  return await provider.getConfiguredAWSClient(context, 'aurora-serverless', action);
}
