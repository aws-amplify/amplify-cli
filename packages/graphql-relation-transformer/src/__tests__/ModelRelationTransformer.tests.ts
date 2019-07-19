import GraphQLTransform, { Transformer, InvalidDirectiveError } from 'graphql-transformer-core'
import RelationTransformer from '../ModelRelationTransformer'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import KeyTransformer from 'graphql-key-transformer'

test('RelationTransformer should fail if relation was called on an object that is not a Model type.', () => {
    const validSchema = `
    type Test {
        id: ID!
        email: String
        testObj: Test1 @relation(fields: ["email"])
    }

    type Test1 @model {
        id: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new RelationTransformer(),
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError(`Object type Test must be annotated with @model.`);
})

test('RelationTransformer should fail if relation was with an object that is not a Model type.', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: Test1 @relation(fields: ["email"])
    }

    type Test1 {
        id: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError(`Object type Test1 must be annotated with @model.`);
})

test('RelationTransformer should fail if the field type where the directive is called is incorrect.', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: Test2 @relation(fields: ["email"])
    }

    type Test1 @model {
        id: iD!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError('Type "Test2" not found in document.');
})

test('RelationTransformer should fail if an empty list of fields is passed in.', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: Test1 @relation(fields: [])
    }

    type Test1 @model {
        id: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError('No fields passed in to @relation directive.');
})

test('RelationTransformer should fail if any of the fields passed in are not in the Parent model.', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: [Test1] @relation(fields: ["id", "name"])
    }

    type Test1
        @model
        @key(fields: ["id", "name"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new KeyTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError('name is not a field in Test');
})

test('RelationTransformer should fail if the query is not run on the default table when relation is trying to connect a single object.', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: Test1 @relation(index: "notDefault", fields: ["id"])
    }

    type Test1
        @model
        @key(name: "notDefault", fields: ["friendID"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new KeyTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() =>
        transformer.transform(validSchema)).toThrowError('Relation is to a single object but the query index is not the default.')
})

test('RelationTransformer should fail if index provided does not exist.', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: [Test1] @relation(index: "notDefault", fields: ["id"])
    }

    type Test1 @model {
        id: ID!
        friendID: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() =>
        transformer.transform(validSchema)).toThrowError('Index notDefault does not exist for model Test1')
})

test('RelationTransformer should fail if first field does not match PK of table. (When using default table)', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: Test1 @relation(fields: ["email"])
    }

    type Test1 @model {
        id: ID!
        friendID: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() =>
        transformer.transform(validSchema)).toThrowError('email field is not of type ID')
})

test('RelationTransformer should fail if sort key type passed in does not match default table sort key type.', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: [Test1] @relation(fields: ["id", "email"])
    }

    type Test1
        @model
        @key(fields: ["id", "friendID"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new KeyTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError('email field is not of type ID');
})

test('RelationTransformer should fail if sort key type passed in does not match custom index sort key type.', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: [Test1] @relation(index: "testIndex", fields: ["id", "email"])
    }

    type Test1
        @model
        @key(name: "testIndex", fields: ["id", "friendID"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new KeyTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError('email field is not of type ID');
})

test('RelationTransformer should fail if partition key type passed in does not match custom index partition key type.', () => {
    const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: [Test1] @relation(index: "testIndex", fields: ["email", "id"])
    }

    type Test1
        @model
        @key(name: "testIndex", fields: ["id", "friendID"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new KeyTransformer(),
            new RelationTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError('email field is not of type ID');
})
/* Notes

            let hashAttributeName = tableResource.Properties.KeySchema[0].AttributeName;

            if (relatedType.fields.find(f => f.name.value === hashAttributeName).type !==
                parent.fields.find(f => f.name.value === args.fields[0]).type) {
                throw new InvalidDirectiveError(args.fields[0] + ' field is not of type ID.')
            }

            !(isNonNullType(queryPKType) &&
                !isListType(wrapNonNull(queryPKType).type) &&
                (<NamedTypeNode>wrapNonNull(queryPKType).type).name.value === 'ID')

*/