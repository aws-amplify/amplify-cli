import { DirectiveWrapper, InvalidDirectiveError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  FieldMapEntry,
  TransformerContextProvider,
  TransformerPrepareStepContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
  TransformerValidationStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { DirectiveNode, FieldDefinitionNode, InterfaceTypeDefinitionNode, Kind, ObjectTypeDefinitionNode } from 'graphql';
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
import { registerManyToManyForeignKeyMappings, validateModelDirective } from './utils';
import { makeQueryConnectionWithKeyResolver, updateTableForConnection } from './resolvers';
import { ensureHasManyConnectionField, extendTypeWithConnection, getPartitionKeyField } from './schema';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
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
  private authTransformer: AuthTransformer;

  constructor(
    modelTransformer: ModelTransformer,
    indexTransformer: IndexTransformer,
    hasOneTransformer: HasOneTransformer,
    authTransformer: AuthTransformer,
  ) {
    super('amplify-many-to-many-transformer', directiveDefinition);
    this.modelTransformer = modelTransformer;
    this.indexTransformer = indexTransformer;
    this.hasOneTransformer = hasOneTransformer;
    this.authTransformer = authTransformer;
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
    if (!ctx.metadata.has('joinTypeList')) {
      ctx.metadata.set('joinTypeList', []);
    }

    // variables with 'orig' in their name in this loop refer to their original value as specified by the @mapsTo directive
    // this code desperately needs to be refactored to reduce the duplication
    this.relationMap.forEach(relation => {
      const { directive1, directive2, name } = relation;
      ctx.metadata.get<Array<string>>('joinTypeList')!.push(name);
      const d1origTypeName = ctx.resourceHelper.getModelNameMapping(directive1.object.name.value);
      const d2origTypeName = ctx.resourceHelper.getModelNameMapping(directive2.object.name.value);
      const d1TypeName = directive1.object.name.value;
      const d2TypeName = directive2.object.name.value;
      const d1FieldName = d1TypeName.charAt(0).toLowerCase() + d1TypeName.slice(1);
      const d2FieldName = d2TypeName.charAt(0).toLowerCase() + d2TypeName.slice(1);
      const d1FieldNameOrig = d1origTypeName.charAt(0).toLowerCase() + d1origTypeName.slice(1);
      const d2FieldNameOrig = d2origTypeName.charAt(0).toLowerCase() + d2origTypeName.slice(1);
      const d1PartitionKey = getPartitionKeyField(context, directive1.object);
      const d2PartitionKey = getPartitionKeyField(context, directive2.object);
      const d1IndexName = `by${d1origTypeName}`;
      const d2IndexName = `by${d2origTypeName}`;
      const d1FieldNameId = `${d1FieldName}ID`;
      const d2FieldNameId = `${d2FieldName}ID`;
      const d1FieldNameIdOrig = `${d1FieldNameOrig}ID`;
      const d2FieldNameIdOrig = `${d2FieldNameOrig}ID`;
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
      const joinTableDirectives = [joinModelDirective];
      const joinTableAuthDirective = createJoinTableAuthDirective(directive1.object, directive2.object);

      if (joinTableAuthDirective) {
        joinTableDirectives.push(joinTableAuthDirective);
      }

      const joinType = {
        ...blankObject(name),
        fields: [makeField('id', [], wrapNonNull(makeNamedType('ID'))), d1RelatedField, d2RelatedField, d1Field, d2Field],
        directives: joinTableDirectives,
      };

      ctx.output.addObject(joinType);

      directive1.indexName = d1IndexName;
      directive2.indexName = d2IndexName;
      directive1.fields = [d1PartitionKey.name.value];
      directive2.fields = [d2PartitionKey.name.value];
      directive1.fieldNodes = [d1PartitionKey];
      directive2.fieldNodes = [d2PartitionKey];
      directive1.relatedType = joinType;
      directive2.relatedType = joinType;
      directive1.relatedTypeIndex = [d1RelatedField];
      directive2.relatedTypeIndex = [d2RelatedField];

      this.modelTransformer.object(joinType, joinModelDirective, context);
      this.hasOneTransformer.field(joinType, d1Field, d1HasOneDirective, context);
      this.hasOneTransformer.field(joinType, d2Field, d2HasOneDirective, context);

      if (joinTableAuthDirective) {
        this.authTransformer.object(joinType, joinTableAuthDirective, context);
      }

      // because of @mapsTo, we need to create a joinType object that matches the original before calling the indexTransformer.
      // this ensures that the GSIs on the existing join table stay the same
      const d1IndexDirectiveOrig = makeDirective('index', [
        makeArgument('name', makeValueNode(d1IndexName)),
        makeArgument('sortKeyFields', makeValueNode([d2FieldNameIdOrig])),
      ]);
      const d2IndexDirectiveOrig = makeDirective('index', [
        makeArgument('name', makeValueNode(d2IndexName)),
        makeArgument('sortKeyFields', makeValueNode([d1FieldNameIdOrig])),
      ]);

      const d1RelatedFieldOrig = makeField(d1FieldNameIdOrig, [], wrapNonNull(makeNamedType(getBaseType(d1PartitionKey.type))), [
        d1IndexDirectiveOrig,
      ]);
      const d2RelatedFieldOrig = makeField(d2FieldNameIdOrig, [], wrapNonNull(makeNamedType(getBaseType(d2PartitionKey.type))), [
        d2IndexDirectiveOrig,
      ]);
      const joinTypeOrig = {
        ...blankObject(name),
        fields: [makeField('id', [], wrapNonNull(makeNamedType('ID'))), d1RelatedFieldOrig, d2RelatedFieldOrig],
        directives: joinTableDirectives,
      };
      this.indexTransformer.field(joinTypeOrig, d1RelatedFieldOrig, d1IndexDirectiveOrig, context);
      this.indexTransformer.field(joinTypeOrig, d2RelatedFieldOrig, d2IndexDirectiveOrig, context);

      // if either side of the many-to-many connection is renamed, the foreign key fields of the join table need to be remapped
      const renamedFields: FieldMapEntry[] = [];
      if (ctx.resourceHelper.isModelRenamed(directive1.object.name.value)) {
        renamedFields.push({ originalFieldName: d1FieldNameIdOrig, currentFieldName: d1FieldNameId });
      }
      if (ctx.resourceHelper.isModelRenamed(directive2.object.name.value)) {
        renamedFields.push({ originalFieldName: d2FieldNameIdOrig, currentFieldName: d2FieldNameId });
      }

      if (!!renamedFields.length) {
        registerManyToManyForeignKeyMappings({
          resourceHelper: ctx.resourceHelper,
          typeName: name,
          referencedBy: [
            { typeName: directive1.object.name.value, fieldName: directive1.field.name.value, isList: true },
            { typeName: directive2.object.name.value, fieldName: directive2.field.name.value, isList: true },
          ],
          fieldMap: renamedFields,
        });
      }

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

function createJoinTableAuthDirective(table1: ObjectTypeDefinitionNode, table2: ObjectTypeDefinitionNode) {
  const t1Auth = table1.directives!.find(directive => directive.name.value === 'auth');
  const t2Auth = table2.directives!.find(directive => directive.name.value === 'auth');
  const t1Rules = ((t1Auth?.arguments ?? []).find(arg => arg.name.value === 'rules')?.value as any)?.values ?? [];
  const t2Rules = ((t2Auth?.arguments ?? []).find(arg => arg.name.value === 'rules')?.value as any)?.values ?? [];
  const rules = [...t1Rules, ...t2Rules];

  if (rules.length === 0) {
    return;
  }

  return makeDirective('auth', [makeArgument('rules', { kind: Kind.LIST, values: rules })]);
}
