import GraphQLTransform, { Transformer, InvalidDirectiveError } from 'graphql-transformer-core'
import KeyTransformer from '../KeyTransformer'

test('KeyTransformer should fail if more than 1 @key is provided without a name.', () => {
    const validSchema = `
    type Test @key(fields: ["id"]) @key(fields: ["email"]) {
        id: ID!
        email: String
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new KeyTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError(InvalidDirectiveError);
})

test('KeyTransformer should fail if more than 1 @key is provided with the same name.', () => {
    const validSchema = `
    type Test @key(name: "Test", fields: ["id"]) @key(name: "Test", fields: ["email"]) {
        id: ID!
        email: String
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new KeyTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError(InvalidDirectiveError);
})


test('KeyTransformer should fail if referencing a field that does not exist.', () => {
    const validSchema = `
    type Test @key(fields: ["someWeirdId"]) {
        id: ID!
        email: String
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new KeyTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError(InvalidDirectiveError);
})

test('Test that a primary @key fails if pointing to nullable fields.', () => {
    const validSchema = `
    type Test @key(fields: ["email"]) {
        id: ID!
        email: String
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new KeyTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError(InvalidDirectiveError);
})

test('Test that model with an LSI but no primary sort key will fail.', () => {
    const validSchema = `
    type Test @key(fields: ["id"]) @key(name: "SomeLSI", fields: ["id", "email"]) {
        id: ID!
        email: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new KeyTransformer()
        ]
    })
    expect(() => transformer.transform(validSchema)).toThrowError(InvalidDirectiveError);
})

test('KeyTransformer should fail if a non-existing type field is defined as key field.', () => {
    const validSchema = `
    type Test @key(name: "Test", fields: ["one"]) {
        id: ID!
        email: String
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new KeyTransformer()
        ]
    })

    expect(() => transformer.transform(validSchema)).toThrowError(InvalidDirectiveError);
})
