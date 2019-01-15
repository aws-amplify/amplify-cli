jest.mock('../RelationalDBResolverGenerator')

import RelationalDBTemplateGenerator from '../RelationalDBTemplateGenerator'
import TemplateContext from '../RelationalDBSchemaTransformer';
import { parse } from 'graphql';


const schema = parse(`
  type User {
    id: String
    name: String
  }

  type Query {
    user(id: String): User
  }
`);

let simplePrimaryKeyMap = {}
let simpleStringFieldMap = new Map<string, string[]>()
let simpleIntFieldMap = new Map<string, string[]>()
let context = new TemplateContext(schema, simplePrimaryKeyMap, simpleStringFieldMap, simpleIntFieldMap)
context.secretStoreArn =
    'arn:aws:secretsmanager:us-east-1:123456789012:secret:rds-db-credentials/cluster-ABCDEFXHGNMSRTNK2A75532FKL/ashwin-aqwery'
context.rdsClusterIdentifier = 'arn:aws:rds:us-east-1:123456789012:cluster:pets'
context.databaseSchema = 'mysql'
context.databaseName = 'pets'
context.region = 'us-east-1'

const templateGenerator = new RelationalDBTemplateGenerator(context)

/**
 * Test for verifying that provided a valid TemplateContext, we are
 * generating the base cloudform template (the cfn specs sans resolvers)
 */
test('Test Base CloudForm Template Generation', () => {
    const template = templateGenerator.createTemplate()

    expect(template).toBeDefined()
    expect(template.AWSTemplateFormatVersion).toBeDefined()
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09')
    expect(template.Parameters).toBeDefined()
    expect(template.Parameters).toHaveProperty('AppSyncApiName')

    // Verify Resources were created as expected
    expect(template.Resources).toBeDefined()
    expect(template.Resources).toHaveProperty('GraphQLAPIKey')
    expect(template.Resources).toHaveProperty('GraphQLAPI')
    expect(template.Resources).toHaveProperty('AuthCognitoUserPoolJSClient')
    expect(template.Resources).toHaveProperty('RelationalDatabaseAccessRole')
    expect(template.Resources).toHaveProperty('RelationalDatabaseDataSource')

    // Verify Outputs were created as expected
    expect(template.Outputs).toBeDefined()
    expect(template.Outputs).toHaveProperty('GraphQLAPIKeyOutput')
    expect(template.Outputs).toHaveProperty('GraphQLAPIEndpointOutput')
    expect(template.Outputs).toHaveProperty('GraphQLAPIIdOutput')
})

/**
 * Test for verifying that provided a base template, we are generating
 * a template with the Relational Resolvers attached.
 */
test('Test Adding Resolvers to CloudForm Template', () => {
    const baseTemplate = templateGenerator.createTemplate()
    expect(baseTemplate).toBeDefined()
    expect(baseTemplate.Resources).toBeDefined()
    expect(baseTemplate.Resources).not.toHaveProperty('')

    const finalTemplate = templateGenerator.addRelationalResolvers(baseTemplate)
    expect(finalTemplate).toBeDefined()
})

/**
 * Test for verifying that provided a base template, we are generating the
 * cfn template as a JSON string.
 */
test('Test Printing the cloudform template as a JSON', () => {
    const baseTemplate = templateGenerator.createTemplate()
    expect(baseTemplate).toBeDefined()

    const templateJSON = templateGenerator.printCloudformationTemplate(baseTemplate)
    expect(templateJSON).toBeDefined()
})