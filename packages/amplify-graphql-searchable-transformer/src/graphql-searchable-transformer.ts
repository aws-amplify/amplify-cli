import { TransformerPluginBase, InvalidDirectiveError, MappingTemplate, DirectiveWrapper } from '@aws-amplify/graphql-transformer-core';
import {
  DataSourceProvider,
  TransformerContextProvider,
  TransformerSchemaVisitStepContextProvider,
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
  extensionWithFields,
  makeField,
  makeListType,
  makeNamedType,
  makeInputValueDefinition,
  graphqlName,
  plurality,
  toUpper,
} from 'graphql-transformer-common';
import { createParametersStack as createParametersInStack } from './cdk/create-cfnParameters';
import { requestTemplate, responseTemplate } from './generate-resolver-vtl';
import {
  makeSearchableScalarInputObject,
  makeSearchableSortDirectionEnumObject,
  makeSearchableXFilterInputObject,
  makeSearchableXSortableFieldsEnumObject,
  makeSearchableXSortInputObject,
} from './definitions';
import assert from 'assert';
import { setMappings } from './cdk/create-layer-cfnMapping';
import { createEsDomain, createEsDomainRole } from './cdk/create-es-domain';
import { createEsDataSource } from './cdk/create-es-datasource';
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

    const isProjectUsingDataStore = false;

    stack.templateOptions.description = 'An auto-generated nested stack for searchable.';
    stack.templateOptions.templateFormatVersion = '2010-09-09';

    const parameterMap = createParametersInStack(stack);

    const domain = createEsDomain(stack, parameterMap, context.api.apiId);

    const elasticsearchRole = createEsDomainRole(stack, parameterMap, context.api.apiId, envParam);

    domain.grantReadWrite(elasticsearchRole);

    const datasource = createEsDataSource(
      stack,
      context.api,
      domain.domainEndpoint,
      elasticsearchRole,
      stack.parseArn(domain.domainArn).region,
    );

    // streaming lambda role
    const lambdaRole = createLambdaRole(stack, parameterMap);
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
      const typeName = context.output.getQueryTypeName();
      const table = getTable(context, def.node);
      const ddbTable = table as Table;
      assert(ddbTable);

      ddbTable.grantStreamRead(lambdaRole);

      // creates event source mapping from ddb to lambda
      createEventSourceMapping(stack, type, lambda, ddbTable.tableStreamArn);

      const { attributeName } = (table as any).keySchema.find((att: any) => att.keyType === 'HASH');
      assert(typeName);
      const resolver = context.resolvers.generateQueryResolver(
        typeName,
        def.fieldName,
        datasource as DataSourceProvider,
        MappingTemplate.s3MappingTemplateFromString(
          requestTemplate(attributeName, getNonKeywordFields(def.node), false, type),
          `${typeName}.${def.fieldName}.req.vtl`,
        ),
        MappingTemplate.s3MappingTemplateFromString(responseTemplate(false), `${typeName}.${def.fieldName}.res.vtl`),
      );
      resolver.mapToStack(stack);
      context.resolvers.addResolver(type, def.fieldName, resolver);
    }

    createStackOutputs(stack, domain.domainEndpoint, context.api.apiId, domain.domainArn);
  };

  object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider): void => {
    const modelDirective = definition?.directives?.find(dir => dir.name.value === 'model');
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
    const fieldName = searchFieldNameOverride ? searchFieldNameOverride : graphqlName(`search${plurality(toUpper(definition.name.value))}`);
    this.searchableObjectTypeDefinitions.push({
      node: definition,
      fieldName,
    });

    if (shouldMakeSearch) {
      this.generateSearchableInputs(ctx, definition);
      this.generateSearchableXConnectionType(ctx, definition);
      const queryField = makeField(
        fieldName,
        [
          makeInputValueDefinition('filter', makeNamedType(`Searchable${definition.name.value}FilterInput`)),
          makeInputValueDefinition('sort', makeNamedType(`Searchable${definition.name.value}SortInput`)),
          makeInputValueDefinition('limit', makeNamedType('Int')),
          makeInputValueDefinition('nextToken', makeNamedType('String')),
          makeInputValueDefinition('from', makeNamedType('Int')),
        ],
        makeNamedType(`Searchable${definition.name.value}Connection`),
      );

      ctx.output.addQueryFields([queryField]);
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
      makeField('items', [], makeListType(makeNamedType(definition.name.value))),
    ]);
    connectionTypeExtension = extensionWithFields(connectionTypeExtension, [
      makeField('nextToken', [], makeNamedType('String')),
      makeField('total', [], makeNamedType('Int')),
    ]);
    ctx.output.addObjectExtension(connectionTypeExtension);
  }

  private generateSearchableInputs(ctx: TransformerSchemaVisitStepContextProvider, definition: ObjectTypeDefinitionNode): void {
    const inputs: string[] = Object.keys(STANDARD_SCALARS);
    inputs
      .filter(input => !ctx.output.hasType(`Searchable${input}FilterInput`))
      .map(makeSearchableScalarInputObject)
      .forEach((node: InputObjectTypeDefinitionNode) => ctx.output.addInput(node));

    const searchableXQueryFilterInput = makeSearchableXFilterInputObject(definition);
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

interface SearchableQueryMap {
  search?: string;
}

interface SearchableDirectiveArgs {
  queries?: SearchableQueryMap;
}
