const fs = require('fs-extra');
const graphql = require('graphql');
const { RelationalDBSchemaTransformer } = require('graphql-relational-schema-transformer');
const { RelationalDBTemplateGenerator, AuroraServerlessMySQLDatabaseReader } = require('graphql-relational-schema-transformer');

const subcommand = 'add-graphql-datasource';
const categories = 'categories';
const category = 'api';
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
    return amplify.datasourceSelectionPrompt(context, category, servicesMetadata)
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
        const teamProviderInfo = JSON.parse(fs.readFileSync(teamProviderInfoFilePath));

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
        const backendConfig = JSON.parse(fs.readFileSync(backendConfigFilePath));

        backendConfig[category][resourceName][rdsInit] = true;

        fs.writeFileSync(backendConfigFilePath, JSON.stringify(backendConfig, null, 4));

        /**
         * Load the MySqlRelationalDBReader
         */
        // eslint-disable-next-line max-len
        const dbReader = new AuroraServerlessMySQLDatabaseReader(answers.region, answers.secretStoreArn, answers.dbClusterArn, answers.databaseName);


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
         * TODO: Does a dummy concat currently, next step is to do a deeper concatenation
         */
        const apiDirPath = `${projectBackendDirPath}/${category}/${resourceName}`;
        fs.ensureDirSync(apiDirPath);
        const graphqlSchemaFilePath = `${apiDirPath}/schema.graphql`;
        fs.ensureFileSync(graphqlSchemaFilePath);
        const graphqlSchemaRaw = fs.readFileSync(graphqlSchemaFilePath, 'utf8');
        const currGraphQLSchemaDoc = graphql.parse(graphqlSchemaRaw);
        const rdsGraphQLSchemaDoc = graphqlSchemaContext.schemaDoc;
        const concatGraphQLSchemaDoc
         = graphql.concatAST([currGraphQLSchemaDoc, rdsGraphQLSchemaDoc]);

        // Validate there are no conflicting types
        const typeSeen = [];
        const definitions = Object.keys(concatGraphQLSchemaDoc.definitions);
        for (let i = 0; i < definitions.length; i += 1) {
          if (definitions[i].kind === 'ObjectTypeDefinition') {
            if (typeSeen[definitions[i].name.value]) {
              context.print.error(`Failed to add generated schema to schema.graphql, there is a schema conflict on type ${definitions[i].name.value}.`);
              context.print.error('Fix the conflict and run the \'add-graphql-datasource\' command again.');
              process.exit(0);
            } else {
              typeSeen[definitions[i].name.value] = true;
            }
          }
        }

        const newGraphQLSchema = graphql.print(concatGraphQLSchemaDoc);

        fs.writeFileSync(graphqlSchemaFilePath, newGraphQLSchema, 'utf8');

        /**
         * Instantiate a new Relational Template Generator and create
         * the template and relational resolvers
         */
        const templateGenerator = new RelationalDBTemplateGenerator(graphqlSchemaContext);
        context[rdsResourceName] = resourceName;
        context[rdsDatasource] = datasource;
        let template = templateGenerator.createTemplate(context);
        template = templateGenerator.addRelationalResolvers(template);
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
