jest.mock('mysql')

import {createConnection, Connection, MysqlError, FieldInfo} from 'mysql'
import { RelationalDBSchemaTransformer, TableContext } from '../RelationalDBSchemaTransformer';
import { Kind, DocumentNode, print } from 'graphql'
import { RelationalDBParsingException } from '../RelationalDBParsingException';


const dummyTransformer = new RelationalDBSchemaTransformer()

const testDBUser = 'testUsername'
const testDBPassword = 'testPassword'
const testDBHost = 'testHost'
const testDBName = 'testdb'
const failureTestDBName = 'failureDB'
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
        if (sqlString === `SHOW TABLES`) {
            // For list tables, return a set of four table names
            results = [ { Tables_in_testdb: tableAName },
            { Tables_in_testdb: tableBName },
            { Tables_in_testdb: tableCName },
            { Tables_in_testdb: tableDName } ]
        } else if (sqlString === `USE ${testDBName}`) {
            // If it's the use db, we don't need a response
            results = ''
        } else if (sqlString.indexOf(`AND REFERENCED_TABLE_NAME = '${tableBName}'`) > -1) {
            // For foreign key lookup on table b, we return table a
            results = [ { TABLE_NAME: tableAName } ]
        } else if (sqlString.indexOf(`SELECT TABLE_NAME FROM information_schema.key_column_usage`) > -1) {
            // On other foreign key lookups, return an empty array
            results = []
        } else if (sqlString === `DESCRIBE ${tableBName}`) {
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
        } else if (sqlString === `DESCRIBE ${tableAName}` || `DESCRIBE ${tableCName}` || sqlString === `DESCRIBE ${tableDName}`) {
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

test('Test schema generation end to end', async() => {
    const mockConnection = new MockConnection()
    createConnection.mockReturnValue(mockConnection)
    const templateContext = await dummyTransformer.processMySQLSchemaOverJDBCWithCredentials(testDBUser, testDBPassword,  testDBHost, testDBName)

    expect(mockConnection.query).toHaveBeenCalledWith(`USE ${testDBName}`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenCalledWith(`SHOW TABLES`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenCalledWith(`DESCRIBE ${tableAName}`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenCalledWith(`DESCRIBE ${tableBName}`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenCalledWith(`DESCRIBE ${tableCName}`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenCalledWith(`DESCRIBE ${tableDName}`, expect.any(Function))
    expect(templateContext.schemaDoc).toBeDefined()
    expect(templateContext.schemaDoc.kind).toBe(Kind.DOCUMENT)
    // 4 tables * (base, update input, connecton, and create input) + schema, queries, mutations, and subs
    // (4 * 4) + 4 = 20
    expect(templateContext.schemaDoc.definitions.length).toBe(20)
    let objectTypeCount = 0
    let inputTypeCount = 0
    let schemaTypeCount = 0
    for (const node of templateContext.schemaDoc.definitions) {
        if (node.kind === Kind.OBJECT_TYPE_DEFINITION) {
            objectTypeCount++
        } else if (node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
            inputTypeCount++
        } else if (node.kind === Kind.SCHEMA_DEFINITION) {
            schemaTypeCount++
        }
    }
    expect(schemaTypeCount).toEqual(1) // Singular schema node
    expect(inputTypeCount).toEqual(8) // 4 tables * (update input + create input)
    expect(objectTypeCount).toEqual(11) // 4 tables * (base shape + connection) + queries + mutations + subs
    const schemaString = print(templateContext.schemaDoc)
    expect(schemaString).toBeDefined()
    console.log(schemaString)
})

test('Test begin fails on database selection', async() => {
    const FailConditionMockConnection = jest.fn<Connection>(() => ({
        query: jest.fn(function (sqlString: string, queryCallback: (err: MysqlError | null, results?: any, fields?: FieldInfo[]) => void) {
            let results = null
            let error = null
            if (sqlString === `USE ${failureTestDBName}`) {
               error = {errno: 400, name: 'test error', message: 'database does not exist', code: 'test', fatal: true}
            }

            queryCallback(error, results, null)
        })
    })
    const mockConnection = new FailConditionMockConnection()
    createConnection.mockReturnValue(mockConnection)
    try {
        await dummyTransformer.processMySQLSchemaOverJDBCWithCredentials(testDBUser, testDBPassword,  testDBHost, failureTestDBName)
        jest.fail()
    } catch (err) {
        if (err instanceof RelationalDBParsingException) {
            // expected
        } else {
            jest.fail()
        }

    }
    expect(mockConnection.query).toHaveBeenCalledWith(`USE ${failureTestDBName}`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenLastCalledWith(`USE ${failureTestDBName}`, expect.any(Function))
    expect(mockConnection.query).not.toHaveBeenCalledWith(`SHOW TABLES`, expect.any(Function))
})

test('Test list tables fails', async() => {
    const FailConditionMockConnection = jest.fn<Connection>(() => ({
        query: jest.fn(function (sqlString: string, queryCallback: (err: MysqlError | null, results?: any, fields?: FieldInfo[]) => void) {
            let results = null
            let error = null
            if (sqlString == `SHOW TABLES`) {
                error = {errno: 400, name: 'test error', message: 'no tables exist', code: 'test', fatal: true}
            } else if (sqlString == `USE ${failureTestDBName}`) {
                // If it's the use db, we don't need a response
                results = ''
            } 

            queryCallback(error, results, null)
        })
    })
    const mockConnection = new FailConditionMockConnection()
    createConnection.mockReturnValue(mockConnection)
    try {
        await dummyTransformer.processMySQLSchemaOverJDBCWithCredentials(testDBUser, testDBPassword,  testDBHost, failureTestDBName)
        jest.fail()
    } catch (err) {
        if (err instanceof RelationalDBParsingException) {
            // expected
        } else {
            jest.fail()
        }

    }
    expect(mockConnection.query).toHaveBeenCalledWith(`USE ${failureTestDBName}`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenCalledWith(`SHOW TABLES`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenLastCalledWith(`SHOW TABLES`, expect.any(Function))
})

test('Test describe table fails', async() => {
    const FailConditionMockConnection = jest.fn<Connection>(() => ({
        query: jest.fn(function (sqlString: string, queryCallback: (err: MysqlError | null, results?: any, fields?: FieldInfo[]) => void) {
            let results = null
            let error = null
            if (sqlString == `SHOW TABLES`) {
                // For list tables, return a set of four table names
                results = [ { Tables_in_failureDB: tableAName },
                { Tables_in_failureDB: tableBName },
                { Tables_in_failureDB: tableCName },
                { Tables_in_failureDB: tableDName } ]
            } else if (sqlString == `USE ${testDBName}`) {
                // If it's the use db, we don't need a response
                results = ''
            } else if (sqlString == `DESCRIBE ${tableAName}`) {
                error = {errno: 400, name: 'test error', message: 'no tables exist', code: 'test', fatal: true}
            }

            queryCallback(error, results, null)
        })
    })
    const mockConnection = new FailConditionMockConnection()
    createConnection.mockReturnValue(mockConnection)
    try {
        await dummyTransformer.processMySQLSchemaOverJDBCWithCredentials(testDBUser, testDBPassword,  testDBHost, failureTestDBName)
        jest.fail()
    } catch (err) {
        if (err instanceof RelationalDBParsingException) {
            // expected
        } else {
            jest.fail()
        }

    }
    expect(mockConnection.query).toHaveBeenCalledWith(`USE ${failureTestDBName}`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenCalledWith(`SHOW TABLES`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenCalledWith(`DESCRIBE ${tableAName}`, expect.any(Function))
    expect(mockConnection.query).toHaveBeenLastCalledWith(`DESCRIBE ${tableAName}`, expect.any(Function))
})

test('Test connection type shape', () => {
    const testType = 'type name'
    const connectionType = dummyTransformer.getConnectionType(testType)
    expect(connectionType.fields.length).toEqual(2)
    expect(connectionType.name.value).toEqual(`${testType}Connection`)
})


test('Test schema type node creation', () => {
    const schemaNode = dummyTransformer.getSchemaType()
    expect(schemaNode.kind).toEqual(Kind.SCHEMA_DEFINITION)
    expect(schemaNode.operationTypes.length).toEqual(3)
})