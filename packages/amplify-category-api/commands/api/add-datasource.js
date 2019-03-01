const path = require('path');
const fs = require('fs-extra');
const RelationalDBSchemaTransformer = require('graphql-relational-schema-transformer').default.RelationalDBSchemaTransformer
const RelationalDBTemplateGenerator = require('graphql-relational-schema-transformer').default.RelationalDBTemplateGenerator
const MySQLRelationalDBReader = require('graphql-relational-schema-transformer').default.MySQLRelationalDBReader
const graphql = require('graphql')

const subcommand = 'add-graphql-datasource';
const category = 'api';
const serviceProvider = 'awscloudformation'
const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-datasources.json`));

let options;

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify } = context;
    let resourceName;
    return amplify.datasourceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        options = {
          datasource: result.datasource,
          providerName: result.providerName
        }

        const providerController = 
          require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category')
          return;
        }

        return providerController.addDatasource(context, category, result.datasource, options)
      })
      .then((answers) => {
        resourceName = answers.resourceName
        /**
         * Write the new env specific datasource information into 
         * the team-provider-info file
         */
        const currEnv = amplify.getEnvInfo().envName;
        const teamProviderInfoFilePath = amplify.pathManager.getProviderInfoFilePath();
        const teamProviderInfo = JSON.parse(fs.readFileSync(teamProviderInfoFilePath))

        teamProviderInfo[currEnv]['rdsRegion'] = answers.region
        teamProviderInfo[currEnv]['rdsClusterIdentifier'] = answers.dbClusterArn
        teamProviderInfo[currEnv]['rdsSecretStoreArn'] = answers.secretStoreArn
        teamProviderInfo[currEnv]['rdsDatabaseName'] = answers.databaseName

        fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(teamProviderInfo, null, 4));


        /**
         * Load the MySqlRelationalDBReader
         */
        const dbReader = new MySQLRelationalDBReader(answers.region, answers.secretStoreArn, answers.dbClusterArn, answers.databaseName)

        
        /**
         * Instantiate a new Relational Schema Transformer and perform 
         * the db instrospection to get the GraphQL Schema and Template Context
         */
        const relationalSchemaTransformer = new RelationalDBSchemaTransformer(dbReader, answers.databaseName)
        return relationalSchemaTransformer.introspectDatabaseSchema()
      }).then((graphqlSchemaContext) => {
        const projectBackendDirPath = amplify.pathManager.getBackendDirPath();

        /**
         * Merge the GraphQL Schema with the existing schema.graphql in the projects stack
         */
        const apiDirPath = `${projectBackendDirPath}/${category}/SomeAPI`
        fs.ensureDirSync(apiDirPath)
        const graphqlSchemaFilePath = `${apiDirPath}/schema.graphql`
        fs.ensureFileSync(graphqlSchemaFilePath)
        const graphqlSchemaRaw = fs.readFileSync(graphqlSchemaFilePath, 'utf8')

        /**
         * Instantiate a new Relational Template Generator and create
         * the template and relational resolvers
         */
        const templateGenerator = new RelationalDBTemplateGenerator(graphqlSchemaContext)
        let template = templateGenerator.createTemplate()
        template = templateGenerator.addRelationalResolvers(template)
        const cfn = templateGenerator.printCloudformationTemplate(template)

        /**
         * Add the generated the CFN to the appropriate nested stacks directory
         */
        const stacksDir = `${projectBackendDirPath}/${category}/${resourceName}/stacks`

        fs.ensureDirSync(stacksDir)
        const writeToPath = stacksDir + ""
        fs.writeFileSync(writeToPath, cfn, 'utf8')
      })
      .then((datasourceName) => {
        const { print } = context;
        print.success(`Successfully added datasource ${datasourceName} locally`);
        print.info('');
        print.success('Some next steps:');
        print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        print.info('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud');
        print.info('');
      })
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the API resource')
      })
  },
};
