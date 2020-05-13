import { buildASTSchema, concatAST, DirectiveNode, parse } from 'graphql';
import { directiveDefinition } from '../DynamoDBModelTransformer';
import { getCreatedAtFieldName, getUpdatedAtFieldName } from '../ModelDirectiveArgs';

function getDirective(doc: string, typeName: string): DirectiveNode {
  const schema = buildASTSchema(concatAST([directiveDefinition, parse(doc)]));
  const selectedType = schema.getTypeMap()[typeName];
  return selectedType.astNode.directives.find(d => d.name.value === 'model');
}
describe('getCreatedAtField', () => {
  it('should return createdAt when there is no timestamps configuration', () => {
    const doc = /* GraphQL */ `
      type Post @model {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getCreatedAtFieldName(modelDirective)).toEqual('createdAt');
  });

  it('should return null when timestamps are set to null', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: null) {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getCreatedAtFieldName(modelDirective)).toBeNull();
  });

  it('should return null when createdAt is set to null', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { createdAt: null }) {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getCreatedAtFieldName(modelDirective)).toBeNull();
  });

  it('should return createdOn when createdAt is set to createdOn', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { createdAt: "createdOn" }) {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getCreatedAtFieldName(modelDirective)).toEqual('createdOn');
  });

  it('should return createdAt when createdAt is not set in timestamps', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { updatedAt: "updatedOn" }) {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getCreatedAtFieldName(modelDirective)).toEqual('createdAt');
  });
});

describe('getUpdatedAtField', () => {
  it('should return updatedAt when there is no timestamps configuration', () => {
    const doc = /* GraphQL */ `
      type Post @model {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getUpdatedAtFieldName(modelDirective)).toEqual('updatedAt');
  });

  it('should return null for updatedAt when timestamps are set to null', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: null) {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getUpdatedAtFieldName(modelDirective)).toBeNull();
  });

  it('should return null when updatedAt is set to null', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { updatedAt: null }) {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getUpdatedAtFieldName(modelDirective)).toBeNull();
  });

  it('should return updatedOn when updatedAt is set to updatedOn', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { updatedAt: "updatedOn" }) {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getUpdatedAtFieldName(modelDirective)).toEqual('updatedOn');
  });

  it('should return updatedAt when updatedAt is not set in timestamps', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { createdAt: "createdOnOn" }) {
        id: ID!
        title: String
      }
    `;
    const modelDirective = getDirective(doc, 'Post');
    expect(modelDirective).toBeDefined();
    expect(getUpdatedAtFieldName(modelDirective)).toEqual('updatedAt');
  });
});
