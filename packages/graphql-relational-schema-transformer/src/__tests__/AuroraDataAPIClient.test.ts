import { DataApiParams, AuroraDataAPIClient } from "../AuroraDataAPIClient";

const region = 'us-east-1'
const secretStoreArn = 'secretStoreArn'
const clusterArn = 'clusterArn'
const databaseName = 'Animals'
const tableAName = 'Dog'
const tableBName = 'Owners'

test('Test list tables', async () => {
   const rdsPromise = {
      promise: jest.fn().mockImplementation(() => {
         return new Promise((resolve, reject) => {
            const response = {
               "numberOfRecordsUpdated": -1,
               "records": [
                  [
                        {
                           "bigIntValue": null,
                           "bitValue": null,
                           "blobValue": null,
                           "doubleValue": null,
                           "intValue": null,
                           "isNull": null,
                           "realValue": null,
                           "stringValue": `${tableAName}`
                        }
                  ]
               ],
               "columnMetadata": [
                  {
                     "arrayBaseColumnType": 0,
                     "isAutoIncrement": false,
                     "isCaseSensitive": false,
                     "isCurrency": false,
                     "isSigned": false,
                     "label": `Tables_in_${databaseName}`,
                     "name": "TABLE_NAME",
                     "nullable": 0,
                     "precision": 64,
                     "scale": 0,
                     "schemaName": "",
                     "tableName": "TABLE_NAMES",
                     "type": 12,
                     "typeName": "VARCHAR"
                  }
               ]
            }
            resolve(response)
         })
      })
   }
   const MockRDSClient = jest.fn<any>(() => ({
      executeStatement: jest.fn((params: DataApiParams) => {
         if (params.sql == 'SHOW TABLES') {
            return rdsPromise
         }
         throw new Error('Incorrect SQL given.')
      })
   }))

   const aws = require('aws-sdk')

   const testClient = new AuroraDataAPIClient(region, secretStoreArn, clusterArn, databaseName, aws)
   const mockRDS = new MockRDSClient()
   testClient.setRDSClient(mockRDS)

   const tables = await testClient.listTables()
   const Params = new DataApiParams()
   Params.secretArn = secretStoreArn
   Params.resourceArn = clusterArn
   Params.database = databaseName
   Params.sql = 'SHOW TABLES'
   expect(mockRDS.executeStatement).toHaveBeenCalledWith(Params)
   expect(tables.length).toEqual(1)
   expect(tables[0]).toEqual(tableAName)
})

test('Test foreign key lookup', async() => {
   const rdsPromise = {
      promise: jest.fn().mockImplementation(() => {
         return new Promise((resolve, reject) => {
            const response = {
               "numberOfRecordsUpdated": -1,
               "records": [
                  [
                     {
                        "bigIntValue": null,
                        "bitValue": null,
                        "blobValue": null,
                        "doubleValue": null,
                        "intValue": null,
                        "isNull": null,
                        "realValue": null,
                        "stringValue": `${tableAName}`
                     }
                  ]
               ],
               "columnMetadata": [
                  {
                     "arrayBaseColumnType": 0,
                     "isAutoIncrement": false,
                     "isCaseSensitive": false,
                     "isCurrency": false,
                     "isSigned": false,
                     "label": `Tables_in_${databaseName}`,
                     "name": "TABLE_NAME",
                     "nullable": 0,
                     "precision": 64,
                     "scale": 0,
                     "schemaName": "",
                     "tableName": "TABLE_NAMES",
                     "type": 12,
                     "typeName": "VARCHAR"
                  }
               ]
            }
            resolve(response)
         })
      })
   }
   
   const MockRDSClient = jest.fn<any>(() => ({
      executeStatement: jest.fn((params: DataApiParams) => {
         if (params.sql.indexOf(`AND REFERENCED_TABLE_NAME = '${tableBName}'`) > -1) {
            return rdsPromise
         }
         throw new Error('Incorrect SQL given.')
      })
   }))

   const aws = require('aws-sdk')
   const testClient = new AuroraDataAPIClient(region, secretStoreArn, clusterArn, databaseName, aws)
   const mockRDS = new MockRDSClient()
   testClient.setRDSClient(mockRDS)

   const tables = await testClient.getTableForeignKeyReferences(tableBName)
   expect(tables.length).toEqual(1)
   expect(tables[0]).toEqual(tableAName)
})

test('Test describe table', async() => {
   const rdsPromise = {
      promise: jest.fn().mockImplementation(() => {
         return new Promise((resolve, reject) => {
            const response = {
               "numberOfRecordsUpdated":-1,
                  "records":[  
                     [  
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"id"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"int(11)"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"NO"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"PRI"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":true,
                           "realValue":null,
                           "stringValue":null
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":""
                        }
                     ],
                     [  
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"name"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"varchar(255)"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"NO"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":""
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":true,
                           "realValue":null,
                           "stringValue":null
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":""
                        }
                     ],
                     [  
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"age"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"int(11)"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":"NO"
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":""
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":true,
                           "realValue":null,
                           "stringValue":null
                        },
                        {  
                           "bigIntValue":null,
                           "bitValue":null,
                           "blobValue":null,
                           "doubleValue":null,
                           "intValue":null,
                           "isNull":null,
                           "realValue":null,
                           "stringValue":""
                        }
                     ]
                  ],
                     
                  "columnMetadata":[  
                     {  
                        "arrayBaseColumnType":0,
                        "isAutoIncrement":false,
                        "isCaseSensitive":false,
                        "isCurrency":false,
                        "isSigned":false,
                        "label":"Field",
                        "name":"COLUMN_NAME",
                        "nullable":0,
                        "precision":64,
                        "scale":0,
                        "schemaName":"",
                        "tableName":"COLUMNS",
                        "type":12,
                        "typeName":"VARCHAR"
                     },
                     {  
                        "arrayBaseColumnType":0,
                        "isAutoIncrement":false,
                        "isCaseSensitive":false,
                        "isCurrency":false,
                        "isSigned":false,
                        "label":"Type",
                        "name":"COLUMN_TYPE",
                        "nullable":0,
                        "precision":65535,
                        "scale":0,
                        "schemaName":"",
                        "tableName":"COLUMNS",
                        "type":-1,
                        "typeName":"MEDIUMTEXT"
                     },
                     {  
                        "arrayBaseColumnType":0,
                        "isAutoIncrement":false,
                        "isCaseSensitive":false,
                        "isCurrency":false,
                        "isSigned":false,
                        "label":"Null",
                        "name":"IS_NULLABLE",
                        "nullable":0,
                        "precision":3,
                        "scale":0,
                        "schemaName":"",
                        "tableName":"COLUMNS",
                        "type":12,
                        "typeName":"VARCHAR"
                     },
                     {  
                        "arrayBaseColumnType":0,
                        "isAutoIncrement":false,
                        "isCaseSensitive":false,
                        "isCurrency":false,
                        "isSigned":false,
                        "label":"Key",
                        "name":"COLUMN_KEY",
                        "nullable":0,
                        "precision":3,
                        "scale":0,
                        "schemaName":"",
                        "tableName":"COLUMNS",
                        "type":12,
                        "typeName":"VARCHAR"
                     },
                     {  
                        "arrayBaseColumnType":0,
                        "isAutoIncrement":false,
                        "isCaseSensitive":false,
                        "isCurrency":false,
                        "isSigned":false,
                        "label":"Default",
                        "name":"COLUMN_DEFAULT",
                        "nullable":1,
                        "precision":65535,
                        "scale":0,
                        "schemaName":"",
                        "tableName":"COLUMNS",
                        "type":-1,
                        "typeName":"MEDIUMTEXT"
                     },
                     {  
                        "arrayBaseColumnType":0,
                        "isAutoIncrement":false,
                        "isCaseSensitive":false,
                        "isCurrency":false,
                        "isSigned":false,
                        "label":"Extra",
                        "name":"EXTRA",
                        "nullable":0,
                        "precision":30,
                        "scale":0,
                        "schemaName":"",
                        "tableName":"COLUMNS",
                        "type":12,
                        "typeName":"VARCHAR"
                     }
                  ]
            }
            resolve(response)
         })
      })
   }

   const MockRDSClient = jest.fn<any>(() => ({
      executeStatement: jest.fn((params: DataApiParams) => {
         if (params.sql == `DESCRIBE ${tableAName}`) {
            return rdsPromise
         }
         throw new Error('Incorrect SQL given.')
      })
   }))

   const aws = require('aws-sdk')
   const testClient = new AuroraDataAPIClient(region, secretStoreArn, clusterArn, databaseName, aws)
   const mockRDS = new MockRDSClient()
   testClient.setRDSClient(mockRDS)

   const columnDescriptions = await testClient.describeTable(tableAName)
   const Params = new DataApiParams()
   Params.secretArn = secretStoreArn
   Params.resourceArn = clusterArn
   Params.database = databaseName
   Params.sql = `DESCRIBE ${tableAName}`
   expect(mockRDS.executeStatement).toHaveBeenCalledWith(Params)
   expect(columnDescriptions.length).toEqual(3)
   // TODO: the rest of these tests
})