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
    expect(call[1]).toStrictEqual(expectedTemplates[call[0]]);
    expect(call[2]).toBe('utf8');
  });
});

// Expected Templates
const createTomatoesReq = `
#set( $cols = [] )
#set( $vals = [] )
#foreach( $entry in $ctx.args.createTomatoesInput.keySet() )
  #set( $discard = $cols.add($entry) )
  #set( $discard = $vals.add("'$ctx.args.createTomatoesInput[$entry]'") )
#end
#set( $valStr = $vals.toString().replace("[","(").replace("]",")") )
#set( $colStr = $cols.toString().replace("[","(").replace("]",")") )
{
  "version": "2018-05-29",
  "statements":   ["INSERT INTO Tomatoes $colStr VALUES $valStr", "SELECT * FROM Tomatoes WHERE Id='$ctx.args.createTomatoesInput.Id'"]
}
`.trim();

const createTomatoesRes = `
$utils.toJson($utils.parseJson($utils.rds.toJsonString($ctx.result))[1][0])
`.trim();

const getTomatoesReq = `
{
  "version": "2018-05-29",
  "statements":   ["SELECT * FROM Tomatoes WHERE Id='$ctx.args.Id'"]
}
`.trim();

const getTomatoesRes = `
#set( $output = $utils.rds.toJsonObject($ctx.result) )
#if( $output.isEmpty() )
  $util.error("Invalid response from RDS DataSource. See info for the full response.", "InvalidResponse", {}, $output)
#end
#set( $output = $output[0] )
#if( $output.isEmpty() )
  #return
#end
$utils.toJson($output[0])
`.trim();

const updateTomatoesReq = `
#set( $updateList = {} )
#foreach( $entry in $ctx.args.updateTomatoesInput.keySet() )
  #set( $discard = $updateList.put($entry, "'$ctx.args.updateTomatoesInput[$entry]'") )
#end
#set( $update = $updateList.toString().replace("{","").replace("}","") )
{
  "version": "2018-05-29",
  "statements":   ["UPDATE Tomatoes SET $update WHERE Id=$ctx.args.updateTomatoesInput.Id", "SELECT * FROM Tomatoes WHERE Id='$ctx.args.updateTomatoesInput.Id'"]
}
`.trim();

const updateTomatoesRes = `
#set( $output = $utils.rds.toJsonObject($ctx.result) )
#if( $output.length() < 2 )
  $util.error("Invalid response from RDS DataSource. See info for the full response.", "InvalidResponse", {}, $output)
#end
#set( $output = $output[1] )
#if( $output.isEmpty() )
  #return
#end
$utils.toJson($output[0])
`.trim();

const deleteTomatoesReq = `
{
  "version": "2018-05-29",
  "statements":   ["SELECT * FROM Tomatoes WHERE Id='$ctx.args.Id'", "DELETE FROM Tomatoes WHERE Id=$ctx.args.Id"]
}
`.trim();

const deleteTomatoesRes = `
#set( $output = $utils.rds.toJsonObject($ctx.result) )
#if( $output.isEmpty() )
  $util.error("Invalid response from RDS DataSource. See info for the full response.", "InvalidResponse", {}, $output)
#end
#set( $output = $output[0] )
#if( $output.isEmpty() )
  #return
#end
$utils.toJson($output[0])
`.trim();

const listTomatoesReq = `
{
  "version": "2018-05-29",
  "statements":   ["SELECT * FROM Tomatoes"]
}
`.trim();

const listTomatoesRes = `
$utils.toJson($utils.rds.toJsonObject($ctx.result)[0])
`.trim();

const expectedTemplates = {
  'testFilePath/Mutation.createTomatoes.req.vtl': createTomatoesReq,
  'testFilePath/Mutation.createTomatoes.res.vtl': createTomatoesRes,
  'testFilePath/Query.getTomatoes.req.vtl': getTomatoesReq,
  'testFilePath/Query.getTomatoes.res.vtl': getTomatoesRes,
  'testFilePath/Mutation.updateTomatoes.req.vtl': updateTomatoesReq,
  'testFilePath/Mutation.updateTomatoes.res.vtl': updateTomatoesRes,
  'testFilePath/Mutation.deleteTomatoes.req.vtl': deleteTomatoesReq,
  'testFilePath/Mutation.deleteTomatoes.res.vtl': deleteTomatoesRes,
  'testFilePath/Query.listTomatoess.req.vtl': listTomatoesReq,
  'testFilePath/Query.listTomatoess.res.vtl': listTomatoesRes,
};
