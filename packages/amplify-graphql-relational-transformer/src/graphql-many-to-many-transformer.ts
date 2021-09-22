import { DirectiveWrapper, InvalidDirectiveError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerPrepareStepContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
  TransformerValidationStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { DirectiveNode, FieldDefinitionNode, InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import {
  blankObject,
  getBaseType,
  graphqlName,
  isListType,
  makeArgument,
  makeDirective,
  makeField,
  makeNamedType,
  makeValueNode,
  toUpper,
  wrapNonNull,
} from 'graphql-transformer-common';
import { ManyToManyDirectiveConfiguration, ManyToManyRelation } from './types';
import { validateModelDirective } from './utils';
import { makeQueryConnectionWithKeyResolver, updateTableForConnection } from './resolvers';
import { ensureHasManyConnectionField, extendTypeWithConnection, getPartitionKeyField } from './schema';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { IndexTransformer } from '@aws-amplify/graphql-index-transformer';
import { HasOneTransformer } from './graphql-has-one-transformer';

const directiveName = 'manyToMany';
const defaultLimit = 100;
const directiveDefinition = `
  directive @${directiveName}(relationName: String!, limit: Int = ${defaultLimit}) on FIELD_DEFINITION
`;

export class ManyToManyTransformer extends TransformerPluginBase {
  private relationMap = new Map<string, ManyToManyRelation>();
  private directiveList: ManyToManyDirectiveConfiguration[] = [];
  private modelTransformer: ModelTransformer;
  private indexTransformer: IndexTransformer;
  private hasOneTransformer: HasOneTransformer;

  constructor(modelTransformer: ModelTransformer, indexTransformer: IndexTransformer, hasOneTransformer: HasOneTransformer) {
    super('amplify-many-to-many-transformer', directiveDefinition);
    this.modelTransformer = modelTransformer;
    this.indexTransformer = indexTransformer;
    this.hasOneTransformer = hasOneTransformer;
  }

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    context: TransformerSchemaVisitStepContextProvider,
  ): void => {
    const directiveWrapped = new DirectiveWrapper(directive);
    const args = directiveWrapped.getArguments({
      directiveName,
      object: parent as ObjectTypeDefinitionNode,
      field: definition,
      directive,
      limit: defaultLimit,
    } as ManyToManyDirectiveConfiguration);

    validateModelDirective(args);
    args.connectionFields = [];

    if (!isListType(definition.type)) {
      throw new InvalidDirectiveError(`@${directiveName} must be used with a list.`);
    }

    addDirectiveToRelationMap(this.relationMap, args);
    this.directiveList.push(args);
  };

  validate = (ctx: TransformerValidationStepContextProvider): void => {
    this.relationMap.forEach(relation => {
      const { directive1, directive2, name } = relation;

      if (!directive2) {
        throw new InvalidDirectiveError(`@${directiveName} relation '${name}' must be used in exactly two locations.`);
      }

      const d1ExpectedType = getBaseType(directive1.field.type);
      const d2ExpectedType = getBaseType(directive2.field.type);

      if (d1ExpectedType !== directive2.object.name.value) {
        throw new InvalidDirectiveError(
          `@${directiveName} relation '${name}' expects '${d1ExpectedType}' but got '${directive2.object.name.value}'.`,
        );
      }

      if (d2ExpectedType !== directive1.object.name.value) {
        throw new InvalidDirectiveError(
          `@${directiveName} relation '${name}' expects '${d2ExpectedType}' but got '${directive1.object.name.value}'.`,
        );
      }

      if (ctx.output.hasType(name)) {
        throw new InvalidDirectiveError(
          `@${directiveName} relation name '${name}' (derived from '${directive1.relationName}') already exists as a type in the schema.`,
        );
      }
    });
  };

  prepare = (ctx: TransformerPrepareStepContextProvider): void => {
    // The @manyToMany directive creates a join table, injects it into the existing transformer, and then functions like one to many.
    const context = ctx as TransformerContextProvider;

    this.relationMap.forEach(relation => {
      const { directive1, directive2, name } = relation;
      const d1TypeName = directive1.object.name.value;
      const d2TypeName = directive2.object.name.value;
      const d1FieldName = d1TypeName.charAt(0).toLowerCase() + d1TypeName.slice(1);
      const d2FieldName = d2TypeName.charAt(0).toLowerCase() + d2TypeName.slice(1);
      const d1PartitionKey = getPartitionKeyField(directive1.object);
      const d2PartitionKey = getPartitionKeyField(directive2.object);
      const d1IndexName = `by${d1TypeName}`;
      const d2IndexName = `by${d2TypeName}`;
      const d1FieldNameId = `${d1FieldName}ID`;
      const d2FieldNameId = `${d2FieldName}ID`;
      const joinModelDirective = makeDirective('model', []);
      const d1IndexDirective = makeDirective('index', [
        makeArgument('name', makeValueNode(d1IndexName)),
        makeArgument('sortKeyFields', makeValueNode([d2FieldNameId])),
      ]);
      const d2IndexDirective = makeDirective('index', [
        makeArgument('name', makeValueNode(d2IndexName)),
        makeArgument('sortKeyFields', makeValueNode([d1FieldNameId])),
      ]);
      const d1HasOneDirective = makeDirective('hasOne', [makeArgument('fields', makeValueNode([d1FieldNameId]))]);
      const d2HasOneDirective = makeDirective('hasOne', [makeArgument('fields', makeValueNode([d2FieldNameId]))]);
      const d1RelatedField = makeField(d1FieldNameId, [], wrapNonNull(makeNamedType(getBaseType(d1PartitionKey.type))), [d1IndexDirective]);
      const d2RelatedField = makeField(d2FieldNameId, [], wrapNonNull(makeNamedType(getBaseType(d2PartitionKey.type))), [d2IndexDirective]);
      const d1Field = makeField(d1FieldName, [], wrapNonNull(makeNamedType(d1TypeName)), [d1HasOneDirective]);
      const d2Field = makeField(d2FieldName, [], wrapNonNull(makeNamedType(d2TypeName)), [d2HasOneDirective]);
      const joinType = {
        ...blankObject(name),
        fields: [makeField('id', [], wrapNonNull(makeNamedType('ID'))), d1RelatedField, d2RelatedField, d1Field, d2Field],
        directives: [joinModelDirective],
      };

      ctx.output.addObject(joinType);

      directive1.indexName = d1IndexName;
      directive2.indexName = d2IndexName;
      directive1.fields = [d1PartitionKey.name.value];
      directive2.fields = [d1PartitionKey.name.value];
      directive1.fieldNodes = [d1PartitionKey];
      directive2.fieldNodes = [d2PartitionKey];
      directive1.relatedType = joinType;
      directive2.relatedType = joinType;
      directive1.relatedTypeIndex = [d1RelatedField];
      directive2.relatedTypeIndex = [d2RelatedField];

      this.modelTransformer.object(joinType, joinModelDirective, context);
      this.indexTransformer.field(joinType, d1RelatedField, d1IndexDirective, context);
      this.indexTransformer.field(joinType, d2RelatedField, d2IndexDirective, context);
      this.hasOneTransformer.field(joinType, d1Field, d1HasOneDirective, context);
      this.hasOneTransformer.field(joinType, d2Field, d2HasOneDirective, context);
      context.providerRegistry.registerDataSourceProvider(joinType, this.modelTransformer);
    });
  };

  transformSchema = (ctx: TransformerTransformSchemaStepContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      ensureHasManyConnectionField(config, context);
      extendTypeWithConnection(config, context);
    }
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      updateTableForConnection(config, context);
      makeQueryConnectionWithKeyResolver(config, context);
    }
  };
}

function addDirectiveToRelationMap(map: Map<string, ManyToManyRelation>, directive: ManyToManyDirectiveConfiguration): void {
  const { relationName } = directive;
  const gqlName = getGraphqlRelationName(relationName);
  let relation;

  relation = map.get(gqlName);

  if (relation === undefined) {
    relation = { name: gqlName, directive1: directive };
    map.set(gqlName, relation as ManyToManyRelation);
    return;
  }

  if (relation.directive2) {
    throw new InvalidDirectiveError(`@${directiveName} relation '${relationName}' must be used in exactly two locations.`);
  }

  relation.directive2 = directive;
}

function getGraphqlRelationName(name: string): string {
  return graphqlName(toUpper(name));
}
