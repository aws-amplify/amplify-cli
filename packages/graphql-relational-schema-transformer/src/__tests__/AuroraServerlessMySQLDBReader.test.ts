import TemplateContext, { TableContext } from '../RelationalDBSchemaTransformer'
import { Kind} from 'graphql'
import { AuroraServerlessMySQLDatabaseReader } from '../AuroraServerlessMySQLDatabaseReader';
import { AuroraDataAPIClient, ColumnDescription } from '../AuroraDataAPIClient';

const dbRegion = 'us-east-1'
const secretStoreArn = 'secretStoreArn'
const clusterArn = 'clusterArn'
const testDBName = 'testdb'
const tableAName = 'a'
const tableBName = 'b'
const tableCName = 'c'
const tableDName = 'd'     
const aws = require('aws-sdk')

const dummyReader = new AuroraServerlessMySQLDatabaseReader(dbRegion, secretStoreArn, clusterArn, testDBName, aws)

test('Test describe table', async () => {
    const MockAuroraClient = jest.fn<AuroraDataAPIClient>(() => ({
        describeTable: jest.fn((tableName: string) => {
            const tableColumns = []
            const idColDescription = new ColumnDescription()
            const nameColDescription = new ColumnDescription()

            idColDescription.Field = 'id'
            idColDescription.Type = 'int'
            idColDescription.Null = 'NO'
            idColDescription.Key = 'PRI'
            idColDescription.Default = null
            idColDescription.Extra = ''

            nameColDescription.Field = 'name'
            nameColDescription.Type = 'varchar(100)'
            nameColDescription.Null = 'YES'
            nameColDescription.Key = ''
            nameColDescription.Default = null
            nameColDescription.Extra = ''

            tableColumns.push(idColDescription)
            tableColumns.push(nameColDescription)
            if (tableName == tableBName) {
                const foreignKeyId = new ColumnDescription()
                foreignKeyId.Field = 'aId'
                foreignKeyId.Type = 'int'
                foreignKeyId.Null = 'YES'
                foreignKeyId.Key = 'MUL'
                foreignKeyId.Default = null
                foreignKeyId.Extra = ''

                tableColumns.push(foreignKeyId)
            } 
            return tableColumns
        }),
        getTableForeignKeyReferences: jest.fn((tableName: string) => {
            if (tableName == tableBName) {
                return [tableAName]
            } 
            return []
        })
    }))
    const mockClient = new MockAuroraClient()
    dummyReader.setAuroraClient(mockClient)

    describeTableTestCommon(tableAName, 2, false, await dummyReader.describeTable(tableAName))    
    describeTableTestCommon(tableBName, 3, true, await dummyReader.describeTable(tableBName))    
    describeTableTestCommon(tableCName, 2, false, await dummyReader.describeTable(tableCName))    
    describeTableTestCommon(tableDName, 2, false, await dummyReader.describeTable(tableDName))    
})

function describeTableTestCommon(tableName: string, fieldLength: number, isForeignKey: boolean, tableContext: TableContext) {
    expect(tableContext.tableKeyField).toEqual('id')
    expect(tableContext.tableKeyFieldType).toEqual('Int')
    expect(tableContext.createTypeDefinition).toBeDefined()
    expect(tableContext.updateTypeDefinition).toBeDefined()
    expect(tableContext.tableTypeDefinition).toBeDefined()
    expect(tableContext.tableTypeDefinition.kind).toEqual(Kind.OBJECT_TYPE_DEFINITION)
    expect(tableContext.updateTypeDefinition.kind).toEqual(Kind.INPUT_OBJECT_TYPE_DEFINITION)
    expect(tableContext.createTypeDefinition.kind).toEqual(Kind.INPUT_OBJECT_TYPE_DEFINITION)
    expect(tableContext.tableTypeDefinition.name.value).toEqual(tableName)
    expect(tableContext.tableTypeDefinition.name.kind).toEqual(Kind.NAME)
    expect(tableContext.updateTypeDefinition.name.value).toEqual(`Update${tableName}Input`)
    expect(tableContext.updateTypeDefinition.name.kind).toEqual(Kind.NAME)
    expect(tableContext.createTypeDefinition.name.value).toEqual(`Create${tableName}Input`)
    expect(tableContext.createTypeDefinition.name.kind).toEqual(Kind.NAME)
    /**
     * If it's a table with a foreign key constraint, the base type will have one additional element
     * for the nested type. e.g. if type Posts had fields of id/int, content/string, and author/string
     * but comments had a foreign key constraint on it, then it would look like this (whereas the 
     * create and update inputs would not have the additional field):
     * type Post {
     *   id: Int!
     *   author: String!
     *   content: String!
     *   comments: CommentConnection
     * }
    */ 
    expect(tableContext.tableTypeDefinition.fields.length).toEqual(fieldLength)
    expect(tableContext.updateTypeDefinition.fields.length).toEqual(fieldLength)
    expect(tableContext.createTypeDefinition.fields.length).toEqual(fieldLength)
}

test('Test hydrate template context', async() => {
    const context = await dummyReader.hydrateTemplateContext(new TemplateContext(null, null, null, null))
    expect(context.secretStoreArn).toEqual(secretStoreArn)
    expect(context.databaseName).toEqual(testDBName)
    expect(context.rdsClusterIdentifier).toEqual(clusterArn)
    expect(context.region).toEqual(dbRegion)
    expect(context.databaseSchema).toEqual('mysql')
})

test('Test list tables', async () => {
    const MockAuroraClient = jest.fn<AuroraDataAPIClient>(() => ({
        listTables: jest.fn(() => {
            return  [ tableAName, tableBName, tableCName, tableDName]
        })
    }))
    const mockClient = new MockAuroraClient()
    dummyReader.setAuroraClient(mockClient)

    const tableNames = await dummyReader.listTables()
    expect(mockClient.listTables).toHaveBeenCalled()
    expect(tableNames.length).toBe(4)
    expect(tableNames.indexOf(tableAName) > -1).toBe(true)
    expect(tableNames.indexOf(tableBName) > -1).toBe(true)
    expect(tableNames.indexOf(tableCName) > -1).toBe(true)
    expect(tableNames.indexOf(tableDName) > -1).toBe(true)
})

test('Test lookup foreign key', async () => {
    const MockAuroraClient = jest.fn<AuroraDataAPIClient>(() => ({
        getTableForeignKeyReferences: jest.fn((tableName: string) => {
            if (tableName == tableBName) {
                return [tableAName]
            } 
            return []
        })
    }))
    const mockClient = new MockAuroraClient()
    dummyReader.setAuroraClient(mockClient)

    const aKeys = await dummyReader.getTableForeignKeyReferences(tableAName)
    const bKeys = await dummyReader.getTableForeignKeyReferences(tableBName)
    const cKeys = await dummyReader.getTableForeignKeyReferences(tableCName)
    const dKeys = await dummyReader.getTableForeignKeyReferences(tableDName)
    expect(aKeys).toBeDefined()
    expect(bKeys).toBeDefined()
    expect(cKeys).toBeDefined()
    expect(dKeys).toBeDefined()
    expect(aKeys.length).toBe(0)
    expect(bKeys.length).toBe(1)
    expect(cKeys.length).toBe(0)
    expect(dKeys.length).toBe(0)
    expect(bKeys[0]).toBe(tableAName)
    expect(mockClient.getTableForeignKeyReferences).toHaveBeenCalledWith(tableAName)
    expect(mockClient.getTableForeignKeyReferences).toHaveBeenCalledWith(tableBName)
    expect(mockClient.getTableForeignKeyReferences).toHaveBeenCalledWith(tableCName)
    expect(mockClient.getTableForeignKeyReferences).toHaveBeenCalledWith(tableDName)
})