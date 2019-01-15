jest.mock('mysql')

import {createConnection, Connection, MysqlError, FieldInfo} from 'mysql'
import { TableContext } from '../RelationalDBSchemaTransformer'
import { Kind} from 'graphql'
import { MySQLRelationalDBReader } from '../MySQLRelationalDBReader';

const testDBUser = 'testUsername'
const testDBPassword = 'testPassword'
const testDBHost = 'testHost'
const testDBName = 'testdb'
const tableAName = 'a'
const tableBName = 'b'
const tableCName = 'c'
const tableDName = 'd'

const MockConnection = jest.fn<Connection>(() => ({
    end: jest.fn(),
    query: jest.fn(function (sqlString: string, queryCallback: (err: MysqlError | null, results?: any, fields?: FieldInfo[]) => void) {
        let results = null
        // TODO: show tables and getting foreign keys are technically slightly inaccurate as a test. The
        // library returns 'RowDataPacket { ... }', however this will still test the parsing that we care about.
        if (sqlString == `SHOW TABLES`) {
            // For list tables, return a set of four table names
            results = [ { Tables_in_testdb: tableAName },
            { Tables_in_testdb: tableBName },
            { Tables_in_testdb: tableCName },
            { Tables_in_testdb: tableDName } ]
        } else if (sqlString == `USE ${testDBName}`) {
            // If it's the use db, we don't need a response
            results = ''
        } else if (sqlString.indexOf(`AND REFERENCED_TABLE_NAME = '${tableBName}'`) > -1) {
            // For foreign key lookup on table b, we return table a
            results = [ { TABLE_NAME: tableAName } ]
        } else if (sqlString.indexOf(`SELECT TABLE_NAME FROM information_schema.key_column_usage`) > -1) {
            // On other foreign key lookups, return an empty array
            results = []
        } else if (sqlString == `DESCRIBE ${tableBName}`) {
            results = [ {
                Field: 'id',
                Type: 'int',
                Null: 'NO',
                Key: 'PRI',
                Default: null,
                Extra: '' },
              {
                Field: 'aId',
                Type: 'int',
                Null: 'YES',
                Key: 'MUL',
                Default: null,
                Extra: '' },
              {
                Field: 'name',
                Type: 'varchar(100)',
                Null: 'YES',
                Key: '',
                Default: null,
                Extra: '' } ]
        } else if (sqlString == `DESCRIBE ${tableAName}` || `DESCRIBE ${tableCName}` || sqlString == `DESCRIBE ${tableDName}`) {
            results = [ {
                Field: 'id',
                Type: 'int',
                Null: 'NO',
                Key: 'PRI',
                Default: null,
                Extra: '' },
              {
                Field: 'name',
                Type: 'varchar(100)',
                Null: 'YES',
                Key: '',
                Default: null,
                Extra: '' } ]
        }
        queryCallback(null, results, null)
    }),
}))

const dummyReader = new MySQLRelationalDBReader(testDBUser, testDBPassword, testDBHost)

test('Test describe table', async () => {
    const mockConnection = new MockConnection()
    createConnection.mockReturnValue(mockConnection)
    dummyReader.begin(testDBName)
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
    expect(tableContext.tableTypeDefinition.fields.length).toEqual(isForeignKey ? fieldLength+1 : fieldLength)
    expect(tableContext.updateTypeDefinition.fields.length).toEqual(fieldLength)
    expect(tableContext.createTypeDefinition.fields.length).toEqual(fieldLength)
}

test('Test list tables', async () => {
    const mockConnection = new MockConnection()
    createConnection.mockReturnValue(mockConnection)
    dummyReader.begin(testDBName)
    const tableNames = await dummyReader.listTables(testDBName)
    expect(mockConnection.query).toHaveBeenCalledWith(`SHOW TABLES`, expect.any(Function))
    expect(tableNames.length).toBe(4)
    expect(tableNames.indexOf(tableAName) > -1).toBe(true)
    expect(tableNames.indexOf(tableBName) > -1).toBe(true)
    expect(tableNames.indexOf(tableCName) > -1).toBe(true)
    expect(tableNames.indexOf(tableDName) > -1).toBe(true)
})

test('Test begin', () => {
    const mockConnection = new MockConnection()
    createConnection.mockReturnValue(mockConnection)
    dummyReader.begin(testDBName)
    expect(mockConnection.query).toHaveBeenCalled()
    expect(mockConnection.query).toHaveBeenCalledWith(`USE ${testDBName}`, expect.any(Function))
})

test('Test lookup foreign key', async () => {
    const mockConnection = new MockConnection()
    createConnection.mockReturnValue(mockConnection)
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
})