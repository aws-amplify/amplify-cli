import { Kind } from 'graphql'
import { getNamedType, getOperationFieldDefinition, getNonNullType, getInputValueDefinition, 
    getTypeDefinition, getFieldDefinition, getDirectiveNode, getOperationTypeDefinition,
    getNameNode, getListValueNode, getStringValueNode, getInputTypeDefinition,
    getArgumentNode, getGraphQLTypeFromMySQLType } from '../RelationalDBSchemaTransformerUtils'


test('Test operation type node creation', () => {
    const operationType = 'query'
    const namedNode = getNamedType('Query')
    const operationTypeNode = getOperationTypeDefinition(operationType, namedNode)
    expect(operationTypeNode.kind).toEqual(Kind.OPERATION_TYPE_DEFINITION)
    expect(operationTypeNode.operation).toEqual(operationType)
    expect(operationTypeNode.type).toEqual(namedNode)
})

test('Test non null type node creation', () => {
    const namedTypeNode = getNamedType('test name')
    const nonNullNamedTypeNode = getNonNullType(namedTypeNode)
    expect(nonNullNamedTypeNode.kind).toEqual(Kind.NON_NULL_TYPE)
    expect(nonNullNamedTypeNode.type).toEqual(namedTypeNode)
})

test('Test named type node creation', () => {
    const name = 'test name'
    const namedTypeNode = getNamedType(name)
    expect(namedTypeNode.kind).toEqual(Kind.NAMED_TYPE)
    expect(namedTypeNode.name.value).toEqual(name)
})

test('Test input value definition node creation', () => {
    const name = 'input name'
    const nameNode = getNamedType('type name')
    const inputDefinitionNode = getInputValueDefinition(nameNode, name)
    expect(inputDefinitionNode.kind).toEqual(Kind.INPUT_VALUE_DEFINITION)
    expect(inputDefinitionNode.type).toEqual(nameNode)
    expect(inputDefinitionNode.name.value).toEqual(name)
})

test('Test operation field definition node creation', () => {
    const name = 'field name'
    const args = [
        getInputValueDefinition(null, 'test name')
    ]
    const namedNode = getNamedType('test name')
    const operationFieldDefinitionNode = getOperationFieldDefinition(name, args, namedNode, null)
    expect(operationFieldDefinitionNode.kind).toEqual(Kind.FIELD_DEFINITION)
    expect(operationFieldDefinitionNode.type).toEqual(namedNode)
    expect(operationFieldDefinitionNode.arguments).toEqual(args)

})

test('Test field definition node creation', () => {
    const fieldName = 'field name'
    const namedNode = getNamedType('type name')
    const fieldDefinitionNode = getFieldDefinition(fieldName, namedNode)
    expect(fieldDefinitionNode.kind).toEqual(Kind.FIELD_DEFINITION)
    expect(fieldDefinitionNode.type).toEqual(namedNode)
    expect(fieldDefinitionNode.name.value).toEqual(fieldName)
})

test('Test type definition node creation', () => {
    const fieldList = [
        getFieldDefinition('field name', null)
    ]
    const typeName = 'type name'
    const typeDefinitionNode = getTypeDefinition(fieldList, typeName)
    expect(typeDefinitionNode.kind).toEqual(Kind.OBJECT_TYPE_DEFINITION)
    expect(typeDefinitionNode.name.value).toEqual(typeName)
    expect(typeDefinitionNode.fields).toEqual(fieldList)
})

test('Test name node creaton', () => {
    const name = 'name string'
    const nameNode = getNameNode(name)
    expect(nameNode.kind).toEqual(Kind.NAME)
    expect(nameNode.value).toEqual(name)
})

test('Test list value node creation', () => {
    const valueList = [
        getStringValueNode('string a'),
        getStringValueNode('string b')
    ]
    const listValueNode = getListValueNode(valueList)
    expect(listValueNode.kind).toEqual(Kind.LIST)
    expect(listValueNode.values).toEqual(valueList)
})

test('Test object type node creation', () => {
    const name = 'name'
    const inputNode = getInputTypeDefinition([], name)
    expect(inputNode.kind).toEqual(Kind.INPUT_OBJECT_TYPE_DEFINITION)
    expect(inputNode.fields.length).toEqual(0)
    expect(inputNode.name.value).toEqual(name)
})

test('Test string value node creation', () => {
    const stringValue = 'string value'
    const stringValueNode = getStringValueNode(stringValue)
    expect(stringValueNode.kind).toEqual(Kind.STRING)
    expect(stringValueNode.value).toEqual(stringValue)
})

test('Test directive node creation', () => {
    const directiveNode = getDirectiveNode('directive name')
    expect(directiveNode.kind).toEqual(Kind.DIRECTIVE)
    expect(directiveNode.name).toBeDefined()
    expect(directiveNode.arguments.length).toEqual(1)

})

test('Test argument node creation', () => {
    const argumentNode = getArgumentNode('argument name')
    expect(argumentNode.kind).toEqual(Kind.ARGUMENT)
    expect(argumentNode.name).toBeDefined()
    expect(argumentNode.value).toBeDefined()
    expect(argumentNode.value.kind).toEqual(Kind.LIST)
})

test('Test type conversion to AWSDateTime', () => {
    expect(getGraphQLTypeFromMySQLType('datetime')).toEqual('AWSDateTime')
})

test('Test type conversion to AWSDate', () => {
    expect(getGraphQLTypeFromMySQLType('date')).toEqual('AWSDate')
})

test('Test type conversion to AWSTime', () => {
    expect(getGraphQLTypeFromMySQLType('time')).toEqual('AWSTime')
})

test('Test type conversion to AWSTimestamp', () => {
    expect(getGraphQLTypeFromMySQLType('timestamp')).toEqual('AWSTimestamp')
})

test('Test type conversion to AWSJSON', () => {
    expect(getGraphQLTypeFromMySQLType('jSoN')).toEqual('AWSJSON')
})

test('Test type conversion to Boolean', () => {
    expect(getGraphQLTypeFromMySQLType('BOOl')).toEqual('Boolean')
})

test('Test type conversion to Int', () => {
    expect(getGraphQLTypeFromMySQLType('Int')).toEqual('Int')
    expect(getGraphQLTypeFromMySQLType('Int(100)')).toEqual('Int')
    expect(getGraphQLTypeFromMySQLType('inteGER')).toEqual('Int')
    expect(getGraphQLTypeFromMySQLType('SmaLLInT')).toEqual('Int')
    expect(getGraphQLTypeFromMySQLType('TINYint')).toEqual('Int')
    expect(getGraphQLTypeFromMySQLType('mediumInt')).toEqual('Int')
    expect(getGraphQLTypeFromMySQLType('BIGINT')).toEqual('Int')
    expect(getGraphQLTypeFromMySQLType('BIT')).toEqual('Int')
})

test('Test type conversion to Float', () => {
    expect(getGraphQLTypeFromMySQLType('FloAT')).toEqual('Float')
    expect(getGraphQLTypeFromMySQLType('DOUBle')).toEqual('Float')
    expect(getGraphQLTypeFromMySQLType('REAL')).toEqual('Float')
    expect(getGraphQLTypeFromMySQLType('REAL_as_FLOAT')).toEqual('Float')
    expect(getGraphQLTypeFromMySQLType('DOUBLE precision')).toEqual('Float')
    expect(getGraphQLTypeFromMySQLType('DEC')).toEqual('Float')
    expect(getGraphQLTypeFromMySQLType('DeciMAL')).toEqual('Float')
    expect(getGraphQLTypeFromMySQLType('FIXED')).toEqual('Float')
    expect(getGraphQLTypeFromMySQLType('Numeric')).toEqual('Float')
})

test('Test type conversion defaults to String', () => {
    expect(getGraphQLTypeFromMySQLType('gibberish random stuff')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('timesta')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('boo')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('jso')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('tim')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('ate')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('atetime')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('Inte')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('Bigin')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('DECI')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('floatt')).toEqual('String')
    expect(getGraphQLTypeFromMySQLType('FIXE')).toEqual('String')
})