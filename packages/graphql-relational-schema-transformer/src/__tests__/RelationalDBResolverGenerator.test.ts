import { RelationalDBResolverGenerator } from '../RelationalDBResolverGenerator';
import { TemplateContext } from '../RelationalDBSchemaTransformer';
import { parse } from 'graphql';
import { JSONMappingParameters } from 'cloudform-types/types/kinesisAnalyticsV2/applicationReferenceDataSource';
import * as fs from 'fs-extra';

jest.mock('fs-extra', () => ({
  writeFileSync: jest.fn(),
}));

afterEach(() => jest.clearAllMocks());

/**
 * Test for verifying that provided a template context, the resolver generator
 * creates the CRUDL AppSync Resolver resources.
 */
test('Test Basic CRUDL Resolver Generation', () => {
  // SETUP
  const schema = parse(`
      type Pet {
        id: String
        name: String
      }

      type Owner {
        id: String
        name: String
      }
    `);
  let simpleStringFieldMap = new Map<string, string[]>();
  let simpleIntFieldMap = new Map<string, string[]>();
  let simplePrimaryKeyMap = new Map<string, string>();
  let simplePrimaryKeyTypeMap = new Map<string, string>();

  simplePrimaryKeyMap.set('Pet', 'Id');
  simplePrimaryKeyMap.set('Owner', 'Id');
  simplePrimaryKeyTypeMap.set('Pet', 'String');
  simplePrimaryKeyTypeMap.set('Owner', 'Int');
  const context = new TemplateContext(schema, simplePrimaryKeyMap, simpleStringFieldMap, simpleIntFieldMap, simplePrimaryKeyTypeMap);
  const generator = new RelationalDBResolverGenerator(context);

  // TEST
  const resources: { [key: string]: any } = generator.createRelationalResolvers('someFilePath');

  // VERIFY
  expect(resources).toBeDefined();

  // Verify all CRUDL resolvers were created for the Pet Type
  expect(resources).toHaveProperty('PetCreateResolver');
  expect(resources).toHaveProperty('PetGetResolver');
  expect(resources).toHaveProperty('PetUpdateResolver');
  expect(resources).toHaveProperty('PetDeleteResolver');
  expect(resources).toHaveProperty('PetListResolver');

  // Verify for the GetResolver the elements are present
  let resolverMap = Object.keys(resources).map(key => resources[key]);
  expect(resolverMap[1]).toHaveProperty('Type');
  expect(resolverMap[1]).toHaveProperty('Properties');

  // Verify a resolver was created for the owner type as well
  expect(resources).toHaveProperty('OwnerCreateResolver');
});

test('verify generated templates', () => {
  // SETUP
  const schema = parse(`
      type Tomatoes {
        id: String
        name: String
      }
    `);
  let simpleStringFieldMap = new Map<string, string[]>();
  let simpleIntFieldMap = new Map<string, string[]>();
  let simplePrimaryKeyMap = new Map<string, string>();
  let simplePrimaryKeyTypeMap = new Map<string, string>();

  simplePrimaryKeyMap.set('Tomatoes', 'Id');
  simplePrimaryKeyTypeMap.set('Tomatoes', 'String');
  const context = new TemplateContext(schema, simplePrimaryKeyMap, simpleStringFieldMap, simpleIntFieldMap, simplePrimaryKeyTypeMap);
  const generator = new RelationalDBResolverGenerator(context);
  generator.createRelationalResolvers('testFilePath');
  expect(fs.writeFileSync.mock.calls.length).toBe(10);
  fs.writeFileSync.mock.calls.forEach(call => {
    expect(call.length).toBe(3);
    expect(call[0]).toMatchSnapshot();
    expect(call[1]).toMatchSnapshot();
    expect(call[2]).toBe('utf8');
  });
});
