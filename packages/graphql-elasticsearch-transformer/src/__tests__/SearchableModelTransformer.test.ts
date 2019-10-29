// import {
//     ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
//     DefinitionNode, Kind, InputObjectTypeDefinitionNode
// } from 'graphql'
// import { GraphQLTransform } from 'graphql-transformer-core';
// import { ResourceConstants } from 'graphql-transformer-common'
// import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer'
// import { SearchableModelTransformer } from '../SearchableModelTransformer'
// import AppSyncTransformer from 'graphql-appsync-transformer'

// test('Test SearchableModelTransformer validation happy case', () => {
//     const validSchema = `
//     type Post @model @searchable {
//         id: ID!
//         title: String!
//         createdAt: String
//         updatedAt: String
//     }
//     `
//     const transformer = new GraphQLTransform({
//         transformers: [
//             new AppSyncTransformer(),
//             new DynamoDBModelTransformer(),
//             new SearchableModelTransformer()
//         ]
//     })
//     const out = transformer.transform(validSchema);
//     expect(out).toBeDefined()
// });

// test('Test SearchableModelTransformer with query overrides', () => {
//     const validSchema = `type Post @model @searchable(queries: { search: "customSearchPost" }) {
//         id: ID!
//         title: String!
//         createdAt: String
//         updatedAt: String
//     }
//     `
//     const transformer = new GraphQLTransform({
//         transformers: [
//             new AppSyncTransformer(),
//             new DynamoDBModelTransformer(),
//             new SearchableModelTransformer()
//         ]
//     })
//     const out = transformer.transform(validSchema)
//     expect(out).toBeDefined()
//     const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
//     expect(schema).toBeDefined()
//     const definition = schema.Properties.Definition
//     expect(definition).toBeDefined()
//     const parsed = parse(definition);
//     const queryType = getObjectType(parsed, 'Query')
//     expect(queryType).toBeDefined()
//     expectFields(queryType, ['customSearchPost'])
// });

// test('Test SearchableModelTransformer with only create mutations', () => {
//     const validSchema = `type Post @model(mutations: { create: "customCreatePost" }) @searchable {
//         id: ID!
//         title: String!
//         createdAt: String
//         updatedAt: String
//     }
//     `
//     const transformer = new GraphQLTransform({
//         transformers: [
//             new AppSyncTransformer(),
//             new DynamoDBModelTransformer(),
//             new SearchableModelTransformer()
//         ]
//     })
//     const out = transformer.transform(validSchema);
//     expect(out).toBeDefined()
//     const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
//     expect(schema).toBeDefined()
//     const definition = schema.Properties.Definition
//     expect(definition).toBeDefined()
//     const parsed = parse(definition);
//     const mutationType = getObjectType(parsed, 'Mutation')
//     expect(mutationType).toBeDefined()
//     expectFields(mutationType, ['customCreatePost'])
//     doNotExpectFields(mutationType, ['updatePost'])
// });

// test('Test SearchableModelTransformer with multiple model searchable directives', () => {
//     const validSchema = `
//     type Post @model @searchable {
//         id: ID!
//         title: String!
//         createdAt: String
//         updatedAt: String
//     }

//     type User @model @searchable {
//         id: ID!
//         name: String!
//     }
//     `
//     const transformer = new GraphQLTransform({
//         transformers: [
//             new AppSyncTransformer(),
//             new DynamoDBModelTransformer(),
//             new SearchableModelTransformer()
//         ]
//     })
//     const out = transformer.transform(validSchema);
//     expect(out).toBeDefined()

//     const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
//     expect(schema).toBeDefined()
//     const definition = schema.Properties.Definition
//     expect(definition).toBeDefined()
//     const parsed = parse(definition);
//     const queryType = getObjectType(parsed, 'Query')
//     expect(queryType).toBeDefined()
//     expectFields(queryType, ['searchPosts'])
//     expectFields(queryType, ['searchUsers'])

//     const stringInputType = getInputType(parsed, 'SearchableStringFilterInput')
//     expect(stringInputType).toBeDefined()
//     const booleanInputType = getInputType(parsed, 'SearchableBooleanFilterInput')
//     expect(booleanInputType).toBeDefined()
//     const intInputType = getInputType(parsed, 'SearchableIntFilterInput')
//     expect(intInputType).toBeDefined()
//     const floatInputType = getInputType(parsed, 'SearchableFloatFilterInput')
//     expect(floatInputType).toBeDefined()
//     const idInputType = getInputType(parsed, 'SearchableIDFilterInput')
//     expect(idInputType).toBeDefined()
//     const postInputType = getInputType(parsed, 'SearchablePostFilterInput')
//     expect(postInputType).toBeDefined()
//     const userInputType = getInputType(parsed, 'SearchableUserFilterInput')
//     expect(userInputType).toBeDefined()

//     expect(verifyInputCount(parsed, 'ModelStringFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelBooleanFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelIntFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelFloatFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelIDFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelPostFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelUserFilterInput', 1)).toBeTruthy;

//     expect(verifyInputCount(parsed, 'SearchableStringFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchableBooleanFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchableIntFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchableFloatFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelIDFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchablePostFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchableUserFilterInput', 1)).toBeTruthy;
// });

// test('Test SearchableModelTransformer with sort fields', () => {
//     const validSchema = `
//     type Post @model @searchable {
//         id: ID!
//         title: String!
//         createdAt: String
//         updatedAt: String
//     }
//     `
//     const transformer = new GraphQLTransform({
//         transformers: [
//             new AppSyncTransformer(),
//             new DynamoDBModelTransformer(),
//             new SearchableModelTransformer()
//         ]
//     })
//     const out = transformer.transform(validSchema);
//     expect(out).toBeDefined()

//     const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
//     expect(schema).toBeDefined()
//     const definition = schema.Properties.Definition
//     expect(definition).toBeDefined()
//     const parsed = parse(definition);
//     const queryType = getObjectType(parsed, 'Query')
//     expect(queryType).toBeDefined()
//     expectFields(queryType, ['searchPosts'])

//     const stringInputType = getInputType(parsed, 'SearchableStringFilterInput')
//     expect(stringInputType).toBeDefined()
//     const booleanInputType = getInputType(parsed, 'SearchableBooleanFilterInput')
//     expect(booleanInputType).toBeDefined()
//     const intInputType = getInputType(parsed, 'SearchableIntFilterInput')
//     expect(intInputType).toBeDefined()
//     const floatInputType = getInputType(parsed, 'SearchableFloatFilterInput')
//     expect(floatInputType).toBeDefined()
//     const idInputType = getInputType(parsed, 'SearchableIDFilterInput')
//     expect(idInputType).toBeDefined()
//     const postInputType = getInputType(parsed, 'SearchablePostFilterInput')
//     expect(postInputType).toBeDefined()
//     const sortInputType = getInputType(parsed, 'SearchablePostSortInput')
//     expect(sortInputType).toBeDefined()

//     expect(verifyInputCount(parsed, 'ModelStringFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelBooleanFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelIntFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelFloatFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelIDFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'ModelPostFilterInput', 1)).toBeTruthy;

//     expect(verifyInputCount(parsed, 'SearchableStringFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchableBooleanFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchableIntFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchableFloatFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchablePostFilterInput', 1)).toBeTruthy;
//     expect(verifyInputCount(parsed, 'SearchablePostSortInput', 1)).toBeTruthy;
// });

// function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
//     for (const fieldName of fields) {
//         const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
//         expect(foundField).toBeDefined()
//     }
// }

// function doNotExpectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
//     for (const fieldName of fields) {
//         expect(
//             type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
//         ).toBeUndefined()
//     }
// }

// function getObjectType(doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined {
//     return doc.definitions.find(
//         (def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type
//     ) as ObjectTypeDefinitionNode | undefined
// }

// function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
//     return doc.definitions.find(
//         (def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type
//     ) as InputObjectTypeDefinitionNode | undefined
// }

// function verifyInputCount(doc: DocumentNode, type: string, count: number): boolean {
//     return doc.definitions.filter(def => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type).length == count;
// }
