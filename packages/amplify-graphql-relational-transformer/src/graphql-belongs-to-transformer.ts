import { DirectiveWrapper, InvalidDirectiveError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { DirectiveNode, FieldDefinitionNode, InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { getBaseType, isListType } from 'graphql-transformer-common';
import { makeGetItemConnectionWithKeyResolver } from './resolvers';
import { ensureHasOneConnectionField } from './schema';
import { BelongsToDirectiveConfiguration } from './types';
import {
  ensureFieldsArray,
  getConnectionAttributeName,
  getFieldsNodes,
  getRelatedType,
  getRelatedTypeIndex,
  validateModelDirective,
  validateRelatedModelDirective,
} from './utils';

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

  transformSchema = (ctx: TransformerTransformSchemaStepContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      config.relatedTypeIndex = getRelatedTypeIndex(config, context);
      ensureHasOneConnectionField(config, context);
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
      return relatedDirective.name.value === 'hasOne' || relatedDirective.name.value === 'hasMany';
    });
  });

  if (!isBidiRelation) {
    throw new InvalidDirectiveError(
      `${config.relatedType.name.value} must have a relationship with ${object.name.value} in order to use @${directiveName}.`,
    );
  }
}
