import assert from 'assert';
import { TransformerContextProvider, TransformerResolverProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { DynamoDbDataSource } from '@aws-cdk/aws-appsync';
import { CfnTable } from '@aws-cdk/aws-dynamodb';
import { Kind, ObjectTypeDefinitionNode, TypeNode } from 'graphql';
import {
  and,
  block,
  compoundExpression,
  Expression,
  ifElse,
  iff,
  obj,
  print,
  printBlock,
  qref,
  raw,
  ref,
  set,
  str,
} from 'graphql-mapping-template';
import {
  applyKeyExpressionForCompositeKey,
  attributeTypeFromScalar,
  getBaseType,
  graphqlName,
  ModelResourceIDs,
  ResourceConstants,
  toCamelCase,
} from 'graphql-transformer-common';
import { PrimaryKeyDirectiveConfiguration } from './types';
import { lookupResolverName } from './utils';

export function replaceDdbPrimaryKey(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  // Replace the table's primary key with the value from @primaryKey.
  const { object } = config;
  const table = getTable(ctx, object);
  const tableAttrDefs = table.attributeDefinitions as any[];
  const tableKeySchema = table.keySchema as any[];
  const keySchema = getDdbKeySchema(config);
  const attrDefs = attributeDefinitions(config, ctx);
  const existingAttrDefSet = new Set(tableAttrDefs.map(ad => ad.attributeName));

  // First, remove any attribute definitions in the current primary key.
  for (const existingKey of tableKeySchema) {
    if (existingAttrDefSet.has(existingKey.attributeName)) {
      table.attributeDefinitions = tableAttrDefs.filter(ad => {
        return ad.attributeName !== existingKey.attributeName;
      });
      existingAttrDefSet.delete(existingKey.attributeName);
    }
  }

  // Next, replace the key schema and add any new attribute definitions back.
  table.keySchema = keySchema;

  for (const attr of attrDefs) {
    if (!existingAttrDefSet.has(attr.attributeName)) {
      (table.attributeDefinitions as any[]).push(attr);
    }
  }
}

export function updateResolvers(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const getResolver = getResolverObject(config, ctx, 'get');
  const listResolver = getResolverObject(config, ctx, 'list');
  const createResolver = getResolverObject(config, ctx, 'create');
  const updateResolver = getResolverObject(config, ctx, 'update');
  const deleteResolver = getResolverObject(config, ctx, 'delete');
  // TODO(cjihrig): Sync queries need to be supported here as well.

  if (getResolver) {
    updateRequestMappingTemplate(getResolver, [setKeySnippet(config, false), (getResolver as any).requestMappingTemplate.content]);
  }

  if (listResolver) {
    updateRequestMappingTemplate(listResolver, [
      print(setQuerySnippet(config, ctx, true)),
      (listResolver as any).requestMappingTemplate.content,
    ]);
  }

  if (createResolver) {
    updateRequestMappingTemplate(createResolver, [
      setKeySnippet(config, true),
      ensureCompositeKeySnippet(config, false),
      (createResolver as any).requestMappingTemplate.content,
    ]);
  }

  if (updateResolver) {
    updateRequestMappingTemplate(updateResolver, [
      setKeySnippet(config, true),
      ensureCompositeKeySnippet(config, false),
      (updateResolver as any).requestMappingTemplate.content,
    ]);
  }

  if (deleteResolver) {
    updateRequestMappingTemplate(deleteResolver, [setKeySnippet(config, true), (deleteResolver as any).requestMappingTemplate.content]);
  }
}

function getTable(context: TransformerContextProvider, object: ObjectTypeDefinitionNode): CfnTable {
  const ddbDataSource = context.dataSources.get(object) as DynamoDbDataSource;
  const tableName = ModelResourceIDs.ModelTableResourceID(object.name.value);
  const table = ddbDataSource.ds.stack.node.findChild(tableName) as any;

  assert(table);
  return table.table;
}

function getDdbKeySchema(config: PrimaryKeyDirectiveConfiguration) {
  const schema = [{ attributeName: config.field.name.value, keyType: 'HASH' }];

  if (config.sortKey.length > 0) {
    schema.push({ attributeName: getSortKeyName(config), keyType: 'RANGE' });
  }

  return schema;
}

function attributeTypeFromType(type: TypeNode, ctx: TransformerContextProvider) {
  const baseTypeName = getBaseType(type);
  const ofType = ctx.output.getType(baseTypeName);
  if (ofType && ofType.kind === Kind.ENUM_TYPE_DEFINITION) {
    return 'S';
  }
  return attributeTypeFromScalar(type);
}

function attributeDefinitions(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider) {
  const { field, sortKey, sortKeyFields } = config;
  const definitions = [{ attributeName: field.name.value, attributeType: attributeTypeFromType(field.type, ctx) }];

  if (sortKeyFields.length === 1) {
    definitions.push({
      attributeName: sortKeyFields[0],
      attributeType: attributeTypeFromType(sortKey[0].type, ctx),
    });
  } else if (sortKeyFields.length > 1) {
    definitions.push({
      attributeName: getSortKeyName(config),
      attributeType: 'S',
    });
  }

  return definitions;
}

function getSortKeyName(config: PrimaryKeyDirectiveConfiguration): string {
  return config.sortKeyFields.join(ModelResourceIDs.ModelCompositeKeySeparator());
}

function getResolverObject(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider, op: string) {
  // TODO(cjihrig): Need to handle sync queries once they are supported.
  const resolverName = lookupResolverName(config, ctx, op);

  if (!resolverName) {
    return null;
  }

  const objectName = op === 'get' || op === 'list' ? ctx.output.getQueryTypeName() : ctx.output.getMutationTypeName();

  if (!objectName) {
    return null;
  }

  return ctx.resolvers.getResolver(objectName, resolverName) ?? null;
}

function updateRequestMappingTemplate(resolver: TransformerResolverProvider, lines: string[]): void {
  (resolver as any).requestMappingTemplate.content = lines.join('\n');
}

function setKeySnippet(config: PrimaryKeyDirectiveConfiguration, isMutation: boolean): string {
  const cmds: Expression[] = [set(ref(ResourceConstants.SNIPPETS.ModelObjectKey), modelObjectKeySnippet(config, isMutation))];
  return printBlock('Set the primary key')(compoundExpression(cmds));
}

function modelObjectKeySnippet(config: PrimaryKeyDirectiveConfiguration, isMutation: boolean) {
  const { field, sortKeyFields } = config;
  const argsPrefix = isMutation ? 'ctx.args.input' : 'ctx.args';
  const modelObject = {
    [field.name.value]: ref(`util.dynamodb.toDynamoDB($${argsPrefix}.${field.name.value})`),
  };

  if (sortKeyFields.length > 1) {
    const compositeSortKey = getSortKeyName(config);
    const compositeSortKeyValue = sortKeyFields
      .map(keyField => {
        return `\${${argsPrefix}.${keyField}}`;
      })
      .join(ModelResourceIDs.ModelCompositeKeySeparator());

    modelObject[compositeSortKey] = ref(`util.dynamodb.toDynamoDB("${compositeSortKeyValue}")`);
  } else if (sortKeyFields.length === 1) {
    modelObject[sortKeyFields[0]] = ref(`util.dynamodb.toDynamoDB($${argsPrefix}.${sortKeyFields[0]})`);
  }

  return obj(modelObject);
}

function ensureCompositeKeySnippet(config: PrimaryKeyDirectiveConfiguration, conditionallySetSortKey: boolean): string {
  const { sortKeyFields } = config;

  if (sortKeyFields.length < 2) {
    return '';
  }

  const argsPrefix = 'ctx.args.input';
  const condensedSortKey = getSortKeyName(config);
  const dynamoDBFriendlySortKeyName = toCamelCase(sortKeyFields.map(f => graphqlName(f)));
  const condensedSortKeyValue = sortKeyFields
    .map(keyField => {
      return `\${${argsPrefix}.${keyField}}`;
    })
    .join(ModelResourceIDs.ModelCompositeKeySeparator());

  return print(
    compoundExpression([
      ifElse(
        raw(`$util.isNull($${ResourceConstants.SNIPPETS.DynamoDBNameOverrideMap})`),
        set(
          ref(ResourceConstants.SNIPPETS.DynamoDBNameOverrideMap),
          obj({
            [condensedSortKey]: str(dynamoDBFriendlySortKeyName),
          }),
        ),
        qref(`$${ResourceConstants.SNIPPETS.DynamoDBNameOverrideMap}.put("${condensedSortKey}", "${dynamoDBFriendlySortKeyName}")`),
      ),
      conditionallySetSortKey
        ? iff(
            ref(ResourceConstants.SNIPPETS.HasSeenSomeKeyArg),
            qref(`$ctx.args.input.put("${condensedSortKey}","${condensedSortKeyValue}")`),
          )
        : qref(`$ctx.args.input.put("${condensedSortKey}","${condensedSortKeyValue}")`),
    ]),
  );
}

function setQuerySnippet(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider, isListResolver: boolean) {
  const { field, sortKey, sortKeyFields } = config;
  const keyFields = [field, ...sortKey];
  const keyNames = [field.name.value, ...sortKeyFields];
  const keyTypes = keyFields.map(k => attributeTypeFromType(k.type, ctx));
  const expressions: Expression[] = [];

  if (keyNames.length === 1) {
    const sortDirectionValidation = iff(
      raw(`!$util.isNull($ctx.args.sortDirection)`),
      raw(`$util.error("sortDirection is not supported for List operations without a Sort key defined.", "InvalidArgumentsError")`),
    );

    expressions.push(sortDirectionValidation);
  } else if (isListResolver === true && keyNames.length >= 1) {
    // This check is only needed for List queries.
    const sortDirectionValidation = iff(
      and([raw(`$util.isNull($ctx.args.${keyNames[0]})`), raw(`!$util.isNull($ctx.args.sortDirection)`)]),
      raw(
        `$util.error("When providing argument 'sortDirection' you must also provide argument '${keyNames[0]}'.", "InvalidArgumentsError")`,
      ),
    );

    expressions.push(sortDirectionValidation);
  }

  expressions.push(
    set(ref(ResourceConstants.SNIPPETS.ModelQueryExpression), obj({})),
    applyKeyExpressionForCompositeKey(keyNames, keyTypes, ResourceConstants.SNIPPETS.ModelQueryExpression),
  );

  return block(`Set query expression for key`, expressions);
}
