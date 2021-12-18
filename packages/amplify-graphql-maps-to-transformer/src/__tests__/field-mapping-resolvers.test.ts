import { TransformerResolverProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { attachInputMappingSlot, attachResponseMappingSlot } from '../field-mapping-resolvers';

const addToSlot_mock = jest.fn();

const resolver_stub = {
  addToSlot: addToSlot_mock,
};

const resolver_typed = resolver_stub as unknown as TransformerResolverProvider;

const singleTestFieldMap = new Map([['newFieldName', 'origFieldName']]);
const multiTestFieldMap = new Map([
  ['newFieldName', 'origFieldName'],
  ['anotherOne', 'theOG'],
]);

beforeEach(jest.clearAllMocks);

describe('attachInputMappingSlot', () => {
  it('uses the init slot', () => {
    attachInputMappingSlot({
      resolver: resolver_typed,
      resolverTypeName: 'Mutation',
      resolverFieldName: 'createTestType',
      fieldMap: singleTestFieldMap,
    });
    expect(addToSlot_mock.mock.calls[0][0]).toBe('init');
  });

  it('maps a single field correctly', () => {
    attachInputMappingSlot({
      resolver: resolver_typed,
      resolverTypeName: 'Mutation',
      resolverFieldName: 'createTestType',
      fieldMap: singleTestFieldMap,
    });
    expect(addToSlot_mock.mock.calls[0][1]).toMatchInlineSnapshot(`
      S3MappingTemplate {
        "content": "$util.qr($ctx.args.input.put(\\"origFieldName\\", $ctx.args.input.newFieldName))
      $util.qr($ctx.args.input.remove(\\"newFieldName\\"))
      $util.toJson({})",
        "name": "resolvers/Mutation.createTestType.{slotName}.{slotIndex}.req.vtl",
        "type": "S3_LOCATION",
      }
    `);
  });

  it('maps multiple fields correctly', () => {
    attachInputMappingSlot({
      resolver: resolver_typed,
      resolverTypeName: 'Mutation',
      resolverFieldName: 'createTestType',
      fieldMap: multiTestFieldMap,
    });
    expect(addToSlot_mock.mock.calls[0][1]).toMatchInlineSnapshot(`
      S3MappingTemplate {
        "content": "$util.qr($ctx.args.input.put(\\"origFieldName\\", $ctx.args.input.newFieldName))
      $util.qr($ctx.args.input.remove(\\"newFieldName\\"))
      $util.qr($ctx.args.input.put(\\"theOG\\", $ctx.args.input.anotherOne))
      $util.qr($ctx.args.input.remove(\\"anotherOne\\"))
      $util.toJson({})",
        "name": "resolvers/Mutation.createTestType.{slotName}.{slotIndex}.req.vtl",
        "type": "S3_LOCATION",
      }
    `);
  });
});

describe('attachResponseMappingSlot', () => {
  it('uses specified slot', () => {
    attachResponseMappingSlot({
      slotName: 'postUpdate',
      resolver: resolver_typed,
      resolverTypeName: 'Mutation',
      resolverFieldName: 'createTestType',
      fieldMap: singleTestFieldMap,
      isList: false,
    });
    expect(addToSlot_mock.mock.calls[0][0]).toBe('postUpdate');
  });

  it('maps a single field correctly', () => {
    attachResponseMappingSlot({
      slotName: 'postUpdate',
      resolver: resolver_typed,
      resolverTypeName: 'Mutation',
      resolverFieldName: 'createTestType',
      fieldMap: singleTestFieldMap,
      isList: false,
    });
    expect(addToSlot_mock.mock.calls[0][1]).toBeUndefined();
    expect(addToSlot_mock.mock.calls[0][2]).toMatchInlineSnapshot(`
      S3MappingTemplate {
        "content": "$util.qr($ctx.prev.result.put(\\"newFieldName\\", $ctx.prev.result.origFieldName))
      $util.qr($ctx.prev.result.remove(\\"origFieldName\\"))
      $util.toJson($ctx.prev.result)",
        "name": "resolvers/Mutation.createTestType.{slotName}.{slotIndex}.res.vtl",
        "type": "S3_LOCATION",
      }
    `);
  });

  it('maps multiple fields correctly', () => {
    attachResponseMappingSlot({
      slotName: 'postUpdate',
      resolver: resolver_typed,
      resolverTypeName: 'Mutation',
      resolverFieldName: 'createTestType',
      fieldMap: multiTestFieldMap,
      isList: false,
    });
    expect(addToSlot_mock.mock.calls[0][1]).toBeUndefined();
    expect(addToSlot_mock.mock.calls[0][2]).toMatchInlineSnapshot(`
      S3MappingTemplate {
        "content": "$util.qr($ctx.prev.result.put(\\"newFieldName\\", $ctx.prev.result.origFieldName))
      $util.qr($ctx.prev.result.remove(\\"origFieldName\\"))
      $util.qr($ctx.prev.result.put(\\"anotherOne\\", $ctx.prev.result.theOG))
      $util.qr($ctx.prev.result.remove(\\"theOG\\"))
      $util.toJson($ctx.prev.result)",
        "name": "resolvers/Mutation.createTestType.{slotName}.{slotIndex}.res.vtl",
        "type": "S3_LOCATION",
      }
    `);
  });

  it('maps a single field in a list correctly', () => {
    attachResponseMappingSlot({
      slotName: 'postUpdate',
      resolver: resolver_typed,
      resolverTypeName: 'Mutation',
      resolverFieldName: 'createTestType',
      fieldMap: singleTestFieldMap,
      isList: true,
    });
    expect(addToSlot_mock.mock.calls[0][1]).toBeUndefined();
    expect(addToSlot_mock.mock.calls[0][2]).toMatchInlineSnapshot(`
      S3MappingTemplate {
        "content": "#foreach( $item in $ctx.prev.result.items )
        $util.qr($item.put(\\"newFieldName\\", $item.origFieldName))
        $util.qr($item.remove(\\"origFieldName\\"))
      #end
      $util.toJson($ctx.prev.result)",
        "name": "resolvers/Mutation.createTestType.{slotName}.{slotIndex}.res.vtl",
        "type": "S3_LOCATION",
      }
    `);
  });

  it('maps multiple fields in a list correctly', () => {
    attachResponseMappingSlot({
      slotName: 'postUpdate',
      resolver: resolver_typed,
      resolverTypeName: 'Mutation',
      resolverFieldName: 'createTestType',
      fieldMap: multiTestFieldMap,
      isList: true,
    });
    expect(addToSlot_mock.mock.calls[0][1]).toBeUndefined();
    expect(addToSlot_mock.mock.calls[0][2]).toMatchInlineSnapshot(`
      S3MappingTemplate {
        "content": "#foreach( $item in $ctx.prev.result.items )
        $util.qr($item.put(\\"newFieldName\\", $item.origFieldName))
        $util.qr($item.remove(\\"origFieldName\\"))
        $util.qr($item.put(\\"anotherOne\\", $item.theOG))
        $util.qr($item.remove(\\"theOG\\"))
      #end
      $util.toJson($ctx.prev.result)",
        "name": "resolvers/Mutation.createTestType.{slotName}.{slotIndex}.res.vtl",
        "type": "S3_LOCATION",
      }
    `);
  });
});
