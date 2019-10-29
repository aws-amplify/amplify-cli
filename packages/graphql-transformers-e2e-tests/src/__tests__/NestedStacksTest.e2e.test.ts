import {
  ObjectTypeDefinitionNode,
  parse,
  FieldDefinitionNode,
  DocumentNode,
  DefinitionNode,
  Kind,
  InputObjectTypeDefinitionNode,
} from 'graphql';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';

import fs = require('fs');
import path = require('path');

jest.setTimeout(2000000);

test('Test custom root types with additional fields.', () => {
  const validSchema = `
    type Query {
        additionalQueryField: String
    }
    type Mutation {
        additionalMutationField: String
    }
    type Subscription {
        additionalSubscriptionField: String
    }
    type Post @model {
        id: ID!
        title: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  // GetAttGraphQLAPIId
  const out = transformer.transform(validSchema);
  // fs.writeFileSync('./out.json', JSON.stringify(out, null, 4));
  const mainStack = out.rootStack;
  const postStack = out.stacks.Post;
  expect(mainStack).toBeDefined();
  expect(postStack).toBeDefined();
  const schema = out.schema;
  expect(schema).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const queryType = getObjectType(parsed, 'Query');
  expectFields(queryType, ['getPost', 'listPosts', 'additionalQueryField']);
  const mutationType = getObjectType(parsed, 'Mutation');
  expectFields(mutationType, ['createPost', 'updatePost', 'deletePost', 'additionalMutationField']);
  const subscriptionType = getObjectType(parsed, 'Subscription');
  expectFields(subscriptionType, ['onCreatePost', 'onUpdatePost', 'onDeletePost', 'additionalSubscriptionField']);
});

function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeDefined();
  }
}

function doNotExpectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    expect(type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)).toBeUndefined();
  }
}

function getObjectType(doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;
}

function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | InputObjectTypeDefinitionNode
    | undefined;
}

function verifyInputCount(doc: DocumentNode, type: string, count: number): boolean {
  return doc.definitions.filter(def => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type).length == count;
}

function cleanUpFiles(directory: string) {
  var files = fs.readdirSync(directory);
  for (const file of files) {
    const dir = path.join(directory, file);
    if (!fs.lstatSync(dir).isDirectory()) {
      fs.unlinkSync(dir);
    } else {
      cleanUpFiles(dir);
    }
  }
  fs.rmdirSync(directory);
}

function readFile(filePath: string) {
  return fs.readFileSync(filePath, 'utf8');
}
