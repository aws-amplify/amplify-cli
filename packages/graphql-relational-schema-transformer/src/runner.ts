import TemplateContext, { RelationalDBSchemaTransformer } from './RelationalDBSchemaTransformer';
import RelationalDBTemplateGenerator from './RelationalDBTemplateGenerator';
import { print } from 'graphql'
import { AuroraServerlessMySQLDatabaseReader} from './AuroraServerlessMySQLDatabaseReader'

// Inputs Needed 
// const secretStoreArn = 'arn:aws:secretsmanager:us-east-1:973253135933:secret:rds-db-credentials/cluster-VG3LSXHGQMQZONK2AZV52IRKLE/ashwin-aJcCFy'
// const dbClusterArn = 'arn:aws:rds:us-east-1:973253135933:cluster:pets'
// const region = 'us-east-1'
// const databaseName = 'pets'

// Second Cluster
const secretStoreArn = 'arn:aws:secretsmanager:us-east-1:973253135933:secret:rds-db-credentials/cluster-OGACD5FH3XJHXENR6GVDJG6OVY/ashwin-9P0x04'
const dbClusterArn = 'arn:aws:rds:us-east-1:973253135933:cluster:animals'
const region = 'us-east-1'
const databaseName = 'Animals'

/**
 * Short Script for Testing the Transform for Aurora Serverless MySQL
 */
const mySqlReader = new AuroraServerlessMySQLDatabaseReader(region, secretStoreArn, dbClusterArn, databaseName)
let testClass = new RelationalDBSchemaTransformer(mySqlReader, databaseName)

let result = testClass.introspectDatabaseSchema()

result.then(function(data: TemplateContext) {
    console.log(print(data.schemaDoc))

    //let templateGenerator = new RelationalDBTemplateGenerator(data)
    //let template = templateGenerator.createTemplate()
    //template = templateGenerator.addRelationalResolvers(template)
    //console.log(templateGenerator.printCloudformationTemplate(template))
})