const fs = require('fs');
const RelationalDBSchemaTransformer = require('graphql-relational-schema-transformer').RelationalDBSchemaTransformer
const RelationalDBTemplateGenerator = require('graphql-relational-schema-transformer').RelationalDBTemplateGenerator

const subcommand = 'add-datasource';
const category = 'api';
const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-datasources.json`));

let options;

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify } = context;
    return amplify.datasourceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        console.log(`Selected: ${result.datasource}`)
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
        let relationalSchemaTransformer = new RelationalDBSchemaTransformer()

        const secretStoreArn = 'arn:aws:secretsmanager:us-east-1:973253135933:secret:rds-db-credentials/cluster-OGACD5FH3XJHXENR6GVDJG6OVY/ashwin-9P0x04'
        const dbClusterArn = 'arn:aws:rds:us-east-1:973253135933:cluster:animals'
        const region = 'us-east-1'
        const databaseName = 'Animals'

        let results = relationalSchemaTransformer.introspectMySQLSchema(region, secretStoreArn, dbClusterArn, databaseName)

        results.then(function(data) {
          let templateGenerator = new RelationalDBTemplateGenerator(data)
          let template = templateGenerator.createTemplate()
          template = templateGenerator.addRelationalResolvers(template)
          console.log(templateGenerator.printCloudformationTemplate(template))
        })

        return answers
      })
      .then((resourceName) => {
        const { print } = context;
        print.success(`Successfully added resource ${resourceName} locally`);
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
