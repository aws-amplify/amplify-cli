const fs = require('fs');

const subcommand = 'add-datasource';
const category = 'api';
const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services.json`));

let options;

module.exports = {
  name: subcommand,
  run: async (context) => {
    console.log('entered');
    const { amplify } = context;
    return amplify.serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
        };
        const providerController =
                require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }

        return providerController.addResource(context, category, result.service, options);
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
        context.print.error('There was an error adding the API resource');
      });
  },
};

// function runRDSTransform() {
//     console.log('Starting Run')

//     let testClass = new RelationalDBSchemaTransformer()
//     let result = testClass.processMySQLSchemaOverJDBCWithCredentials("root", "ashy", "localhost", "testdb")

//     result.then(function(data: TemplateContext) {
//         console.log(print(data.schemaDoc))

//         let templateGenerator = new RelationalDBTemplateGenerator(data)
//         //console.log(templateClass.addRelationalResolvers(templateClass.createTemplate()))
//         let template = templateGenerator.createTemplate()
//         template = templateGenerator.addRelationalResolvers(template)
//         //console.log(template)
//         console.log(templateGenerator.printCloudformationTemplate(template))
//     })
// }
