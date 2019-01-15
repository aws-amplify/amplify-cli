import TemplateContext, { RelationalDBSchemaTransformer } from './RelationalDBSchemaTransformer';
import RelationalDBTemplateGenerator from './RelationalDBTemplateGenerator';
import { print } from 'graphql'

/**
 * Short Script for Testing the Transform
 * TODO: Delete once transformer has E2E tests
 */
let testClass = new RelationalDBSchemaTransformer()
let result = testClass.processMySQLSchemaOverJDBCWithCredentials("root", "ashy", "localhost", "testdb")

result.then(function(data: TemplateContext) {
    console.log(print(data.schemaDoc))

    let templateGenerator = new RelationalDBTemplateGenerator(data)
    //console.log(templateClass.addRelationalResolvers(templateClass.createTemplate()))
    let template = templateGenerator.createTemplate()
    template = templateGenerator.addRelationalResolvers(template)
    //console.log(template)
    console.log(templateGenerator.printCloudformationTemplate(template))
})