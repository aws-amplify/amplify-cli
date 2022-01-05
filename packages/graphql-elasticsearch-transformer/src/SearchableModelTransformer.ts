import { Transformer, TransformerContext, getDirectiveArguments, gql, InvalidDirectiveError } from 'graphql-transformer-core';
import { DirectiveNode, ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode } from 'graphql';
import { ResourceFactory } from './resources';
import {
  makeSearchableScalarInputObject,
  makeSearchableXFilterInputObject,
  makeSearchableSortDirectionEnumObject,
  makeSearchableXSortableFieldsEnumObject,
  makeSearchableXSortInputObject,
} from './definitions';
import {
  makeNamedType,
  blankObjectExtension,
  makeField,
  extensionWithFields,
  blankObject,
  makeListType,
  makeInputValueDefinition,
  STANDARD_SCALARS,
  makeNonNullType,
} from 'graphql-transformer-common';
import { Expression, str } from 'graphql-mapping-template';
import { ResolverResourceIDs, SearchableResourceIDs, ModelResourceIDs, getBaseType, ResourceConstants } from 'graphql-transformer-common';
import path = require('path');

const STACK_NAME = 'SearchableStack';
const nonKeywordTypes = ['Int', 'Float', 'Boolean', 'AWSTimestamp', 'AWSDate', 'AWSDateTime'];

interface SearchableQueryMap {
  search?: string;
}

interface SearchableDirectiveArgs {
  queries?: SearchableQueryMap;
}

/**
 * Handles the @searchable directive on OBJECT types.
 */
export class SearchableModelTransformer extends Transformer {
  resources: ResourceFactory;

  constructor() {
    super(
      `SearchableModelTransformer`,
      gql`
        directive @searchable(queries: SearchableQueryMap) on OBJECT
        input SearchableQueryMap {
          search: String
        }
      `,
    );
    this.resources = new ResourceFactory();
  }

  public before = (ctx: TransformerContext): void => {
    const template = this.resources.initTemplate(ctx.isProjectUsingDataStore());
    ctx.mergeResources(template.Resources);
    ctx.mergeParameters(template.Parameters);
    ctx.mergeOutputs(template.Outputs);
    ctx.mergeMappings(template.Mappings);
    ctx.metadata.set(
      ResourceConstants.RESOURCES.ElasticsearchStreamingLambdaFunctionLogicalID,
      path.resolve(`${__dirname}/../lib/streaming-lambda.zip`),
    );
    for (const resourceId of Object.keys(template.Resources)) {
      ctx.mapResourceToStack(STACK_NAME, resourceId);
    }
    for (const outputId of Object.keys(template.Outputs)) {
      ctx.mapResourceToStack(STACK_NAME, outputId);
    }
    for (const mappingId of Object.keys(template.Mappings)) {
      ctx.mapResourceToStack(STACK_NAME, mappingId);
    }
  };

  /**
   * Given the initial input and context manipulate the context to handle this object directive.
   * @param initial The input passed to the transform.
   * @param ctx The accumulated context for the transform.
   */
  public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {
    const modelDirective = def.directives.find(dir => dir.name.value === 'model');
    if (!modelDirective) {
      throw new InvalidDirectiveError('Types annotated with @searchable must also be annotated with @model.');
    }
    const directiveArguments: SearchableDirectiveArgs = getDirectiveArguments(directive);
    let shouldMakeSearch = true;
    let searchFieldNameOverride = undefined;

    // Figure out which queries to make and if they have name overrides.
    if (directiveArguments.queries) {
      if (!directiveArguments.queries.search) {
        shouldMakeSearch = false;
      } else {
        searchFieldNameOverride = directiveArguments.queries.search;
      }
    }

    const typeName = def.name.value;
    ctx.setResource(
      SearchableResourceIDs.SearchableEventSourceMappingID(typeName),
      this.resources.makeDynamoDBStreamEventSourceMapping(typeName),
    );
    ctx.mapResourceToStack(STACK_NAME, SearchableResourceIDs.SearchableEventSourceMappingID(typeName));

    // SearchablePostSortableFields
    const queryFields = [];
    const nonKeywordFields: Expression[] = [];
    def.fields.forEach(field => {
      if (nonKeywordTypes.includes(getBaseType(field.type))) {
        nonKeywordFields.push(str(field.name.value));
      }
    });

    // Get primary key to use as the default sort field
    const primaryKey = this.getPrimaryKey(ctx, typeName);

    // Create list
    if (shouldMakeSearch) {
      this.generateSearchableInputs(ctx, def);
      this.generateSearchableXConnectionType(ctx, def);

      const searchResolver = this.resources.makeSearchResolver(
        def.name.value,
        nonKeywordFields,
        primaryKey,
        ctx.getQueryTypeName(),
        ctx.featureFlags.getBoolean('improvePluralization'),
        searchFieldNameOverride,
        ctx.isProjectUsingDataStore(),
      );
      ctx.setResource(ResolverResourceIDs.ElasticsearchSearchResolverResourceID(def.name.value), searchResolver);
      ctx.mapResourceToStack(STACK_NAME, ResolverResourceIDs.ElasticsearchSearchResolverResourceID(def.name.value));
      queryFields.push(
        makeField(
          searchResolver.Properties.FieldName.toString(),
          [
            makeInputValueDefinition('filter', makeNamedType(`Searchable${def.name.value}FilterInput`)),
            makeInputValueDefinition('sort', makeNamedType(`Searchable${def.name.value}SortInput`)),
            makeInputValueDefinition('limit', makeNamedType('Int')),
            makeInputValueDefinition('nextToken', makeNamedType('String')),
            makeInputValueDefinition('from', makeNamedType('Int')),
          ],
          makeNamedType(`Searchable${def.name.value}Connection`),
        ),
      );
    }

    ctx.addQueryFields(queryFields);
  };

  private generateSearchableXConnectionType(ctx: TransformerContext, def: ObjectTypeDefinitionNode): void {
    const searchableXConnectionName = `Searchable${def.name.value}Connection`;
    if (this.typeExist(searchableXConnectionName, ctx)) {
      return;
    }

    // Create the TableXConnection
    const connectionType = blankObject(searchableXConnectionName);
    ctx.addObject(connectionType);

    // Create TableXConnection type with items and nextToken
    let connectionTypeExtension = blankObjectExtension(searchableXConnectionName);
    connectionTypeExtension = extensionWithFields(connectionTypeExtension, [
      makeField('items', [], makeNonNullType(makeListType(makeNamedType(def.name.value)))),
    ]);
    connectionTypeExtension = extensionWithFields(connectionTypeExtension, [
      makeField('nextToken', [], makeNamedType('String')),
      makeField('total', [], makeNamedType('Int')),
    ]);
    ctx.addObjectExtension(connectionTypeExtension);
  }

  private typeExist(type: string, ctx: TransformerContext): boolean {
    return Boolean(type in ctx.nodeMap);
  }

  private generateSearchableInputs(ctx: TransformerContext, def: ObjectTypeDefinitionNode): void {
    // Create the Scalar filter inputs
    const inputs: string[] = Object.keys(STANDARD_SCALARS);
    inputs
      .filter((input: string) => !this.typeExist(`Searchable${input}FilterInput`, ctx))
      .map((input: string) => makeSearchableScalarInputObject(input))
      .forEach((node: InputObjectTypeDefinitionNode) => ctx.addInput(node));

    const searchableXQueryFilterInput = makeSearchableXFilterInputObject(def);
    if (!this.typeExist(searchableXQueryFilterInput.name.value, ctx)) {
      ctx.addInput(searchableXQueryFilterInput);
    }

    if (!this.typeExist('SearchableSortDirection', ctx)) {
      const searchableSortDirection = makeSearchableSortDirectionEnumObject();
      ctx.addEnum(searchableSortDirection);
    }

    if (!this.typeExist(`Searchable${def.name.value}SortableFields`, ctx)) {
      const searchableXSortableFieldsDirection = makeSearchableXSortableFieldsEnumObject(def);
      ctx.addEnum(searchableXSortableFieldsDirection);
    }

    if (!this.typeExist(`Searchable${def.name.value}SortInput`, ctx)) {
      const searchableXSortableInputDirection = makeSearchableXSortInputObject(def);
      ctx.addInput(searchableXSortableInputDirection);
    }
  }

  private getPrimaryKey(ctx: TransformerContext, typeName: string): string {
    const tableResourceID = ModelResourceIDs.ModelTableResourceID(typeName);
    const tableResource = ctx.getResource(tableResourceID);
    const primaryKeySchemaElement = tableResource.Properties.KeySchema.find((keyElement: any) => keyElement.KeyType === 'HASH');
    return primaryKeySchemaElement.AttributeName;
  }
}
