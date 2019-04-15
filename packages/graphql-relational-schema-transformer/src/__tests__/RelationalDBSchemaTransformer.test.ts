import TemplateContext, { RelationalDBSchemaTransformer, TableContext } from '../RelationalDBSchemaTransformer';
import { Kind, print } from 'graphql'
import { RelationalDBParsingException } from '../RelationalDBParsingException';
import { IRelationalDBReader } from '../IRelationalDBReader';
import { getNamedType, getNonNullType, getInputValueDefinition, getGraphQLTypeFromMySQLType,
    getTypeDefinition, getFieldDefinition, getInputTypeDefinition } from '../RelationalDBSchemaTransformerUtils'



const testDBName = 'testdb'
const mockTableAName = 'a'
const mockTableBName = 'b'
const mockTableCName = 'c'
const mockTableDName = 'd'
const region = 'us-east-1'
const secretStoreArn = 'secretStoreArn'
const clusterArn = 'clusterArn'

function getTableContext(tableName: string): TableContext {
    const fields = new Array()
    const updateFields = new Array()
    const createFields = new Array()
    const primaryKey = 'id'
    const primaryKeyType = 'VarChar(128)'
    const stringFieldList = ['name', 'description']

    for (const fieldName of stringFieldList) {
        
        const baseType = getNamedType(getGraphQLTypeFromMySQLType(primaryKeyType))

        const type = getNonNullType(baseType)
        fields.push(getFieldDefinition(fieldName, type))

        createFields.push(getInputValueDefinition(type, fieldName))

        let updateType = null
        if (primaryKey == fieldName) {
            updateType = getNonNullType(baseType)
        } else {
            updateType = baseType
        }
        updateFields.push(getInputValueDefinition(updateType, fieldName))
    }
    return new TableContext(getTypeDefinition(fields, tableName), 
                    getInputTypeDefinition(createFields, `Create${tableName}Input`),
                    getInputTypeDefinition(updateFields, `Update${tableName}Input`), primaryKey, 
                    primaryKeyType, stringFieldList, [])
}

test('Test schema generation end to end', async() => {
    
    const MockRelationalDBReader = jest.fn<IRelationalDBReader>(() => ({
        listTables: jest.fn(() => {
            return  [ mockTableAName, mockTableBName, mockTableCName, mockTableDName]
        }),
        describeTable: jest.fn((tableName: string) => {
            return getTableContext(tableName)
        }),
        hydrateTemplateContext: jest.fn((contextShell: TemplateContext) => {      
            contextShell.secretStoreArn = this.awsSecretStoreArn
            contextShell.rdsClusterIdentifier = this.dbClusterOrInstanceArn
            contextShell.databaseSchema = 'mysql'
            contextShell.databaseName =  this.database
            contextShell.region = this.dbRegion
            return contextShell
        })
    }))
    const mockReader = new MockRelationalDBReader()
    const dummyTransformer = new RelationalDBSchemaTransformer(mockReader, testDBName)

    const templateContext = await dummyTransformer.introspectDatabaseSchema()

    expect(mockReader.listTables).toHaveBeenCalled()
    expect(mockReader.describeTable).toHaveBeenCalledWith(mockTableAName)
    expect(mockReader.describeTable).toHaveBeenCalledWith(mockTableBName)
    expect(mockReader.describeTable).toHaveBeenCalledWith(mockTableCName)
    expect(mockReader.describeTable).toHaveBeenCalledWith(mockTableDName)
    expect(templateContext.schemaDoc).toBeDefined()
    expect(templateContext.schemaDoc.kind).toBe(Kind.DOCUMENT)
    // 4 tables * (base, update input, and create input) + schema, queries, mutations, and subs
    // (4 * 3) + 4 = 16
    expect(templateContext.schemaDoc.definitions.length).toBe(16)
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
    expect(objectTypeCount).toEqual(7) // (4 tables * base shape) + queries + mutations + subs
    const schemaString = print(templateContext.schemaDoc)
    expect(schemaString).toBeDefined()
    console.log(schemaString)
})

test('Test list tables fails', async() => {
    const MockRelationalDBReader = jest.fn<IRelationalDBReader>(() => ({
        listTables: jest.fn(() => {
            throw new Error('Mocked failure on list tables.')
        }),
        describeTable: jest.fn(() => {
            throw new Error('Mocked failure on describe. THIS SHOULD NOT HAPPEN.')
        })
    }))
    const mockReader = new MockRelationalDBReader()
    const dummyTransformer = new RelationalDBSchemaTransformer(mockReader, testDBName)

    
    try {
        await dummyTransformer.introspectDatabaseSchema()
        throw new Error('Request should have failed.')
    } catch (err) {
        if (err instanceof RelationalDBParsingException) {
            // expected
        } else {
            throw new Error('Unexpected exception thrown.')
        }

    }
    expect(mockReader.listTables).toHaveBeenCalled()
    expect(mockReader.describeTable).not.toHaveBeenCalled()
})

test('Test describe table fails', async() => {
    const MockRelationalDBReader = jest.fn<IRelationalDBReader>(() => ({
        listTables: jest.fn(() => {
            return  [ mockTableAName, mockTableBName, mockTableCName, mockTableDName]
        }),
        describeTable: jest.fn(() => {
            throw new Error('Mocked failure on describe.')
        })
    }))
    const mockReader = new MockRelationalDBReader()
    const dummyTransformer = new RelationalDBSchemaTransformer(mockReader, testDBName)
    
    try {
        await dummyTransformer.introspectDatabaseSchema()
        throw new Error('Request should have failed.')
    } catch (err) {
        if (err instanceof RelationalDBParsingException) {
            // expected
        } else {
            throw new Error('Unexpected exception thrown.')
        }

    }

    expect(mockReader.listTables).toHaveBeenCalled()
    expect(mockReader.describeTable).toHaveBeenCalledWith(mockTableAName)
})

test('Test connection type shape', () => {
    const testType = 'type name'
    const MockRelationalDBReader = jest.fn<IRelationalDBReader>(() => ({
    }))
    const mockReader = new MockRelationalDBReader()
    const dummyTransformer = new RelationalDBSchemaTransformer(mockReader, testDBName)
    const connectionType = dummyTransformer.getConnectionType(testType)
    expect(connectionType.fields.length).toEqual(2)
    expect(connectionType.name.value).toEqual(`${testType}Connection`)
})


test('Test schema type node creation', () => {
    const MockRelationalDBReader = jest.fn<IRelationalDBReader>(() => ({
    }))
    const mockReader = new MockRelationalDBReader()
    const dummyTransformer = new RelationalDBSchemaTransformer(mockReader, testDBName)
    const schemaNode = dummyTransformer.getSchemaType()
    expect(schemaNode.kind).toEqual(Kind.SCHEMA_DEFINITION)
    expect(schemaNode.operationTypes.length).toEqual(3)
})