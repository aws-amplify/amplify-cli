import { DirectiveWrapper, InvalidDirectiveError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerPrepareStepContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import {
  DirectiveNode,
  DocumentNode,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
} from 'graphql';
import { getBaseType, isListType } from 'graphql-transformer-common';
import { makeGetItemConnectionWithKeyResolver } from './resolvers';
import { ensureBelongsToConnectionField } from './schema';
import { BelongsToDirectiveConfiguration } from './types';
import {
  ensureFieldsArray,
  getFieldsNodes,
  getRelatedType,
  getRelatedTypeIndex,
  registerHasOneForeignKeyMappings,
  validateModelDirective,
  validateRelatedModelDirective,
} from './utils';
import { TransformerPreProcessContextProvider } from '@aws-amplify/graphql-transformer-interfaces/lib/transformer-context/transformer-context-provider';
import produce from 'immer';
import { WritableDraft } from 'immer/dist/types/types-external';

const directiveName = 'belongsTo';
const directiveDefinition = `
  directive @${directiveName}(fields: [String!]) on FIELD_DEFINITION
`;

export class BelongsToTransformer extends TransformerPluginBase {
  private directiveList: BelongsToDirectiveConfiguration[] = [];

  constructor() {
    super('amplify-belongs-to-transformer', directiveDefinition);
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
    } as BelongsToDirectiveConfiguration);

    validate(args, context as TransformerContextProvider);
    this.directiveList.push(args);
  };

  /** During the preProcess step, modify the document node and return it
   * so that it represents any schema modifications the plugin needs
   */
  preProcess = (context: TransformerPreProcessContextProvider): DocumentNode => {
    const resultDoc: DocumentNode = produce(context.inputDocument, draftDoc => {
      const objectTypeMap = new Map<string, WritableDraft<ObjectTypeDefinitionNode | ObjectTypeExtensionNode>>(); // key: type name | value: object type node
      // First iteration builds a map of the object types to reference for relation types
      draftDoc?.definitions?.forEach(def => {
        if (def.kind === 'ObjectTypeExtension' || def.kind === 'ObjectTypeDefinition') {
          objectTypeMap.set(def.name.value, def);
        }
      });

      draftDoc?.definitions?.forEach(def => {
        if (def.kind === 'ObjectTypeExtension' || def.kind === 'ObjectTypeDefinition') {
          def?.fields?.forEach(field => {
            field?.directives?.forEach(dir => {
              if (dir.name.value === directiveName) {
                const relatedType = objectTypeMap.get(getBaseType(field.type));
                if (relatedType) { // Validation is done in a different segment of the life cycle
                  const relationTypeField = relatedType?.fields?.find(relatedField => {
                    if (getBaseType(field.type) === def.name.value && relatedField?.directives?.some(
                      relatedDir => relatedDir.name.value === 'hasOne' || relatedDir.name.value === 'hasMany',
                    )) {
                      return true;
                    }
                    return false;
                  });
                  const typeOfRelation = relationTypeField // WIP
                }
              }
            });
          });
        }
      });
    });
    return resultDoc;
  }

  /**
   * During the prepare step, register any foreign keys that are renamed due to a model rename
   */
  prepare = (context: TransformerPrepareStepContextProvider) => {
    this.directiveList
      .filter(config => config.relationType === 'hasOne')
      .forEach(config => {
        // a belongsTo with hasOne behaves the same as hasOne
        registerHasOneForeignKeyMappings({
          resourceHelper: context.resourceHelper,
          thisTypeName: config.object.name.value,
          thisFieldName: config.field.name.value,
          relatedTypeName: config.relatedType.name.value,
        });
      });
  };

  transformSchema = (ctx: TransformerTransformSchemaStepContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      config.relatedTypeIndex = getRelatedTypeIndex(config, context);
      ensureBelongsToConnectionField(config, context);
    }
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      makeGetItemConnectionWithKeyResolver(config, context);
    }
  };
}

function validate(config: BelongsToDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { field, object } = config;

  ensureFieldsArray(config);
  validateModelDirective(config);

  if (isListType(field.type)) {
    throw new InvalidDirectiveError(`@${directiveName} cannot be used with lists.`);
  }

  config.fieldNodes = getFieldsNodes(config, ctx);
  config.relatedType = getRelatedType(config, ctx);
  config.connectionFields = [];
  validateRelatedModelDirective(config);

  const isBidiRelation = config.relatedType.fields!.some(relatedField => {
    if (getBaseType(relatedField.type) !== object.name.value) {
      return false;
    }

    return relatedField.directives!.some(relatedDirective => {
      if (relatedDirective.name.value === 'hasOne' || relatedDirective.name.value === 'hasMany') {
        config.relatedField = relatedField;
        config.relationType = relatedDirective.name.value;
        return true;
      }
      return false;
    });
  });

  if (!isBidiRelation) {
    throw new InvalidDirectiveError(
      `${config.relatedType.name.value} must have a relationship with ${object.name.value} in order to use @${directiveName}.`,
    );
  }
}
