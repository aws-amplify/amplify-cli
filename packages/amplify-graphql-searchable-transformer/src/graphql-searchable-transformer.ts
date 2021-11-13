import { TransformerPluginBase, InvalidDirectiveError, MappingTemplate, DirectiveWrapper } from '@aws-amplify/graphql-transformer-core';
import {
  DataSourceProvider,
  TransformerContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { DynamoDbDataSource } from '@aws-cdk/aws-appsync';
import { Table } from '@aws-cdk/aws-dynamodb';
import { CfnCondition, CfnParameter, Fn, IConstruct } from '@aws-cdk/core';
import { DirectiveNode, InputObjectTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { Expression, str } from 'graphql-mapping-template';
import {
  ResourceConstants,
  getBaseType,
  ModelResourceIDs,
  STANDARD_SCALARS,
  blankObject,
  blankObjectExtension,
  defineUnionType,
  extensionWithFields,
  makeField,
  makeListType,
  makeNamedType,
  makeNonNullType,
  makeInputValueDefinition,
  graphqlName,
  plurality,
  toUpper,
  ResolverResourceIDs,
  makeDirective,
} from 'graphql-transformer-common';
import { createParametersStack as createParametersInStack } from './cdk/create-cfnParameters';
import { requestTemplate, responseTemplate, sandboxMappingTemplate } from './generate-resolver-vtl';
import {
  makeSearchableScalarInputObject,
  makeSearchableSortDirectionEnumObject,
  makeSearchableXFilterInputObject,
  makeSearchableXSortableFieldsEnumObject,
  makeSearchableXAggregateFieldEnumObject,
  makeSearchableXSortInputObject,
  makeSearchableXAggregationInputObject,
  makeSearchableAggregateTypeEnumObject,
  AGGREGATE_TYPES,
  extendTypeWithDirectives,
} from './definitions';
import assert from 'assert';
import { setMappings } from './cdk/create-layer-cfnMapping';
import { createSearchableDomain, createSearchableDomainRole } from './cdk/create-searchable-domain';
import { createSearchableDataSource } from './cdk/create-searchable-datasource';
import { createEventSourceMapping, createLambda, createLambdaRole } from './cdk/create-streaming-lambda';
import { createStackOutputs } from './cdk/create-cfnOutput';

const nonKeywordTypes = ['Int', 'Float', 'Boolean', 'AWSTimestamp', 'AWSDate', 'AWSDateTime'];
const STACK_NAME = 'SearchableStack';
export class SearchableModelTransformer extends TransformerPluginBase {
  searchableObjectTypeDefinitions: { node: ObjectTypeDefinitionNode; fieldName: string }[];
  constructor() {
    super(
      'amplify-searchable-transformer',
      /* GraphQL */ `
        directive @searchable(queries: SearchableQueryMap) on OBJECT
        input SearchableQueryMap {
          search: String
        }
      `,
    );
    this.searchableObjectTypeDefinitions = [];
  }

  generateResolvers = (context: TransformerContextProvider): void => {
    const { Env } = ResourceConstants.PARAMETERS;

    const { HasEnvironmentParameter } = ResourceConstants.CONDITIONS;

    const stack = context.stackManager.createStack(STACK_NAME);

    setMappings(stack);

    const envParam = context.stackManager.getParameter(Env) as CfnParameter;

    new CfnCondition(stack, HasEnvironmentParameter, {
      expression: Fn.conditionNot(Fn.conditionEquals(envParam, ResourceConstants.NONE)),
    });

    const isProjectUsingDataStore = context.isProjectUsingDataStore();

    stack.templateOptions.description = 'An auto-generated nested stack for searchable.';
    stack.templateOptions.templateFormatVersion = '2010-09-09';

    const parameterMap = createParametersInStack(stack);

    const domain = createSearchableDomain(stack, parameterMap, context.api.apiId);

    const openSearchRole = createSearchableDomainRole(context, stack, parameterMap);

    domain.grantReadWrite(openSearchRole);

    const datasource = createSearchableDataSource(
      stack,
      context.api,
      domain.domainEndpoint,
      openSearchRole,
      stack.parseArn(domain.domainArn).region,
    );

    // streaming lambda role
    const lambdaRole = createLambdaRole(context, stack, parameterMap);
    domain.grantWrite(lambdaRole);

    // creates streaming lambda
    const lambda = createLambda(
      stack,
      context.api,
      parameterMap,
      lambdaRole,
      domain.domainEndpoint,
      isProjectUsingDataStore,
      stack.parseArn(domain.domainArn).region,
    );

    for (const def of this.searchableObjectTypeDefinitions) {
      const type = def.node.name.value;
      const fields = def.node.fields?.map(f => f.name.value) ?? [];
      const typeName = context.output.getQueryTypeName();
      const table = getTable(context, def.node);
      const ddbTable = table as Table;
      assert(ddbTable);

      ddbTable.grantStreamRead(lambdaRole);

      // creates event source mapping from ddb to lambda
      createEventSourceMapping(stack, type, lambda, parameterMap, ddbTable.tableStreamArn);

      const { attributeName } = (table as any).keySchema.find((att: any) => att.keyType === 'HASH');
      const keyFields = getKeyFields(attributeName, table);

      assert(typeName);
      const resolver = context.resolvers.generateQueryResolver(
        typeName,
        def.fieldName,
        ResolverResourceIDs.ElasticsearchSearchResolverResourceID(type),
        datasource as DataSourceProvider,
        MappingTemplate.s3MappingTemplateFromString(
          requestTemplate(attributeName, getNonKeywordFields(def.node), context.isProjectUsingDataStore(), type, keyFields),
          `${typeName}.${def.fieldName}.req.vtl`,
        ),
        MappingTemplate.s3MappingTemplateFromString(responseTemplate(false), `${typeName}.${def.fieldName}.res.vtl`),
      );
      resolver.addToSlot(
        'postAuth',
        MappingTemplate.s3MappingTemplateFromString(
          sandboxMappingTemplate(context.sandboxModeEnabled, fields),
          `${typeName}.${def.fieldName}.{slotName}.{slotIndex}.res.vtl`,
        ),
      );
      resolver.mapToStack(stack);
      context.resolvers.addResolver('Search', toUpper(type), resolver);
    }

    createStackOutputs(stack, domain.domainEndpoint, context.api.apiId, domain.domainArn);
  };

  object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider): void => {
    const modelDirective = definition?.directives?.find(dir => dir.name.value === 'model');
    const hasAuth = definition.directives?.some(dir => dir.name.value === 'auth') ?? false;
    if (!modelDirective) {
      throw new InvalidDirectiveError('Types annotated with @searchable must also be annotated with @model.');
    }

    const directiveWrapped = new DirectiveWrapper(directive);
    const directiveArguments = directiveWrapped.getArguments({}) as any;
    let shouldMakeSearch = true;
    let searchFieldNameOverride = undefined;

    if (directiveArguments.queries) {
      if (!directiveArguments.queries.search) {
        shouldMakeSearch = false;
      } else {
        searchFieldNameOverride = directiveArguments.queries.search;
      }
    }
    const fieldName = searchFieldNameOverride
      ? searchFieldNameOverride
      : graphqlName(`search${plurality(toUpper(definition.name.value), true)}`);
    this.searchableObjectTypeDefinitions.push({
      node: definition,
      fieldName,
    });

    if (shouldMakeSearch) {
      this.generateSearchableInputs(ctx, definition);
      this.generateSearchableXConnectionType(ctx, definition);
      this.generateSearchableAggregateTypes(ctx);
      const directives = [];
      if (!hasAuth && ctx.sandboxModeEnabled && ctx.authConfig.defaultAuthentication.authenticationType !== 'API_KEY') {
        directives.push(makeDirective('aws_api_key', []));
      }
      const queryField = makeField(
        fieldName,
        [
          makeInputValueDefinition('filter', makeNamedType(`Searchable${definition.name.value}FilterInput`)),
          makeInputValueDefinition('sort', makeListType(makeNamedType(`Searchable${definition.name.value}SortInput`))),
          makeInputValueDefinition('limit', makeNamedType('Int')),
          makeInputValueDefinition('nextToken', makeNamedType('String')),
          makeInputValueDefinition('from', makeNamedType('Int')),
          makeInputValueDefinition('aggregates', makeListType(makeNamedType(`Searchable${definition.name.value}AggregationInput`))),
        ],
        makeNamedType(`Searchable${definition.name.value}Connection`),
        directives,
      );
      ctx.output.addQueryFields([queryField]);
    }
  };

  transformSchema = (ctx: TransformerTransformSchemaStepContextProvider) => {
    // add api key to aggregate types if sandbox mode is enabled
    if (ctx.sandboxModeEnabled && ctx.authConfig.defaultAuthentication.authenticationType !== 'API_KEY') {
      for (let aggType of AGGREGATE_TYPES) {
        const aggObject = ctx.output.getObject(aggType)!;
        const hasApiKey = aggObject.directives?.some(dir => dir.name.value === 'aws_api_key') ?? false;
        if (!hasApiKey) {
          extendTypeWithDirectives(ctx, aggType, [makeDirective('aws_api_key', [])]);
        }
      }
    }
  };

  private generateSearchableXConnectionType(ctx: TransformerSchemaVisitStepContextProvider, definition: ObjectTypeDefinitionNode): void {
    const searchableXConnectionName = `Searchable${definition.name.value}Connection`;
    if (ctx.output.hasType(searchableXConnectionName)) {
      return;
    }

    // Create the TableXConnection
    const connectionType = blankObject(searchableXConnectionName);
    ctx.output.addObject(connectionType);

    // Create TableXConnection type with items and nextToken
    let connectionTypeExtension = blankObjectExtension(searchableXConnectionName);
    connectionTypeExtension = extensionWithFields(connectionTypeExtension, [
      makeField('items', [], makeNonNullType(makeListType(makeNonNullType(makeNamedType(definition.name.value))))),
    ]);
    connectionTypeExtension = extensionWithFields(connectionTypeExtension, [
      makeField('nextToken', [], makeNamedType('String')),
      makeField('total', [], makeNamedType('Int')),
      makeField('aggregateItems', [], makeNonNullType(makeListType(makeNonNullType(makeNamedType(`SearchableAggregateResult`))))),
    ]);
    ctx.output.addObjectExtension(connectionTypeExtension);
  }

  private generateSearchableAggregateTypes(ctx: TransformerSchemaVisitStepContextProvider): void {
    this.generateSearchableAggregateResultType(ctx);
    this.generateSearchableGenericResultType(ctx);
  }

  private generateSearchableGenericResultType(ctx: TransformerSchemaVisitStepContextProvider): void {
    const searchableAggregateGenericResult = `SearchableAggregateGenericResult`;
    if (ctx.output.hasType(searchableAggregateGenericResult)) {
      return;
    }

    let searchableAggregateGenericResultNode = defineUnionType(searchableAggregateGenericResult, [
      makeNamedType(this.generateSearchableAggregateScalarResultType(ctx)),
      makeNamedType(this.generateSearchableAggregateBucketResultType(ctx)),
    ]);

    ctx.output.addUnion(searchableAggregateGenericResultNode);
  }

  private generateSearchableAggregateScalarResultType(ctx: TransformerSchemaVisitStepContextProvider): string {
    const searchableAggregateScalarResult = `SearchableAggregateScalarResult`;
    if (ctx.output.hasType(searchableAggregateScalarResult)) {
      return searchableAggregateScalarResult;
    }

    // Create the SearchableAggregateScalarResult
    const aggregateScalarType = blankObject(searchableAggregateScalarResult);
    ctx.output.addObject(aggregateScalarType);

    // Create SearchableAggregateScalarResult type with value
    let aggregateScalarTypeExtension = blankObjectExtension(searchableAggregateScalarResult);
    aggregateScalarTypeExtension = extensionWithFields(aggregateScalarTypeExtension, [
      makeField('value', [], makeNonNullType(makeNamedType('Float'))),
    ]);
    ctx.output.addObjectExtension(aggregateScalarTypeExtension);
    return searchableAggregateScalarResult;
  }

  private generateSearchableAggregateBucketResultItemType(ctx: TransformerSchemaVisitStepContextProvider): string {
    const searchableAggregateBucketResultItem = `SearchableAggregateBucketResultItem`;
    if (ctx.output.hasType(searchableAggregateBucketResultItem)) {
      return searchableAggregateBucketResultItem;
    }

    // Create the SearchableAggregateBucketResultItem
    const aggregateBucketResultItemType = blankObject(searchableAggregateBucketResultItem);
    ctx.output.addObject(aggregateBucketResultItemType);

    // Create SearchableAggregateBucketResultItem type with key and doc_count
    let aggregateBucketResultItemTypeExtension = blankObjectExtension(searchableAggregateBucketResultItem);
    aggregateBucketResultItemTypeExtension = extensionWithFields(aggregateBucketResultItemTypeExtension, [
      makeField('key', [], makeNonNullType(makeNamedType('String'))),
      makeField('doc_count', [], makeNonNullType(makeNamedType('Int'))),
    ]);
    ctx.output.addObjectExtension(aggregateBucketResultItemTypeExtension);
    return searchableAggregateBucketResultItem;
  }

  private generateSearchableAggregateBucketResultType(ctx: TransformerSchemaVisitStepContextProvider): string {
    const searchableAggregateBucketResult = `SearchableAggregateBucketResult`;
    if (ctx.output.hasType(searchableAggregateBucketResult)) {
      return searchableAggregateBucketResult;
    }

    // Create the SearchableAggregateBucketResultItem
    const aggregateBucketResultType = blankObject(searchableAggregateBucketResult);
    ctx.output.addObject(aggregateBucketResultType);
    this.generateSearchableAggregateBucketResultItemType(ctx);

    // Create SearchableAggregateBucketResultItem type with buckets
    let aggregateBucketResultTypeExtension = blankObjectExtension(searchableAggregateBucketResult);
    aggregateBucketResultTypeExtension = extensionWithFields(aggregateBucketResultTypeExtension, [
      makeField('buckets', [], makeListType(makeNamedType('SearchableAggregateBucketResultItem'))),
    ]);
    ctx.output.addObjectExtension(aggregateBucketResultTypeExtension);
    return searchableAggregateBucketResult;
  }

  private generateSearchableAggregateResultType(ctx: TransformerSchemaVisitStepContextProvider): string {
    const searchableAggregateResult = `SearchableAggregateResult`;
    if (ctx.output.hasType(searchableAggregateResult)) {
      return searchableAggregateResult;
    }

    // Create the SearchableAggregateResult
    const aggregateResultType = blankObject(searchableAggregateResult);
    ctx.output.addObject(aggregateResultType);

    // Create SearchableAggregateResult type with name and result
    let aggregateResultTypeExtension = blankObjectExtension(searchableAggregateResult);
    aggregateResultTypeExtension = extensionWithFields(aggregateResultTypeExtension, [
      makeField('name', [], makeNonNullType(makeNamedType('String'))),
      makeField('result', [], makeNamedType('SearchableAggregateGenericResult')),
    ]);
    ctx.output.addObjectExtension(aggregateResultTypeExtension);
    return searchableAggregateResult;
  }

  private generateSearchableInputs(ctx: TransformerSchemaVisitStepContextProvider, definition: ObjectTypeDefinitionNode): void {
    const inputs: string[] = Object.keys(STANDARD_SCALARS);
    inputs
      .filter(input => !ctx.output.hasType(`Searchable${input}FilterInput`))
      .map(makeSearchableScalarInputObject)
      .forEach((node: InputObjectTypeDefinitionNode) => ctx.output.addInput(node));

    const searchableXQueryFilterInput = makeSearchableXFilterInputObject(definition, ctx.inputDocument);
    if (!ctx.output.hasType(searchableXQueryFilterInput.name.value)) {
      ctx.output.addInput(searchableXQueryFilterInput);
    }

    if (!ctx.output.hasType('SearchableSortDirection')) {
      const searchableSortDirection = makeSearchableSortDirectionEnumObject();
      ctx.output.addEnum(searchableSortDirection);
    }

    if (!ctx.output.hasType(`Searchable${definition.name.value}SortableFields`)) {
      const searchableXSortableFieldsDirection = makeSearchableXSortableFieldsEnumObject(definition);
      ctx.output.addEnum(searchableXSortableFieldsDirection);
    }

    if (!ctx.output.hasType(`Searchable${definition.name.value}SortInput`)) {
      const searchableXSortableInputDirection = makeSearchableXSortInputObject(definition);
      ctx.output.addInput(searchableXSortableInputDirection);
    }

    if (!ctx.output.hasType('SearchableAggregateType')) {
      const searchableAggregateTypeEnum = makeSearchableAggregateTypeEnumObject();
      ctx.output.addEnum(searchableAggregateTypeEnum);
    }

    if (!ctx.output.hasType(`Searchable${definition.name.value}AggregateField`)) {
      const searchableXAggregationField = makeSearchableXAggregateFieldEnumObject(definition);
      ctx.output.addEnum(searchableXAggregationField);
    }

    if (!ctx.output.hasType(`Searchable${definition.name.value}AggregationInput`)) {
      const searchableXAggregationInput = makeSearchableXAggregationInputObject(definition);
      ctx.output.addInput(searchableXAggregationInput);
    }
  }
}

function getTable(context: TransformerContextProvider, definition: ObjectTypeDefinitionNode): IConstruct {
  const ddbDataSource = context.dataSources.get(definition) as DynamoDbDataSource;
  const tableName = ModelResourceIDs.ModelTableResourceID(definition.name.value);
  const table = ddbDataSource.ds.stack.node.findChild(tableName);
  return table;
}

function getNonKeywordFields(def: ObjectTypeDefinitionNode): Expression[] {
  const nonKeywordTypeSet = new Set(nonKeywordTypes);

  return def.fields?.filter(field => nonKeywordTypeSet.has(getBaseType(field.type))).map(field => str(field.name.value)) || [];
}

/**
 * Returns all the keys fields - primaryKey and sortKeys
 * @param primaryKey
 * @param table
 * @returns Expression[] keyFields
 */
function getKeyFields(primaryKey: string, table: IConstruct): Expression[] {
  let keyFields = [];
  keyFields.push(primaryKey);
  let { attributeName } = (table as any).keySchema.find((att: any) => att.keyType === 'RANGE') || {};
  if (attributeName) {
    keyFields.push(...attributeName.split('#'));
  }
  return keyFields.map(key => str(key));
}

interface SearchableQueryMap {
  search?: string;
}

interface SearchableDirectiveArgs {
  queries?: SearchableQueryMap;
}
