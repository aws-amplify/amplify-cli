import assert from 'assert';
import { getFieldNameFor, InvalidDirectiveError } from '@aws-amplify/graphql-transformer-core';
import { TransformerContextProvider, TransformerResourceHelperProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { DirectiveNode, EnumTypeDefinitionNode, FieldDefinitionNode, Kind, ObjectTypeDefinitionNode, StringValueNode } from 'graphql';
import { getBaseType, isScalarOrEnum, toCamelCase } from 'graphql-transformer-common';
import {
  BelongsToDirectiveConfiguration,
  HasManyDirectiveConfiguration,
  HasOneDirectiveConfiguration,
  ManyToManyDirectiveConfiguration,
} from './types';

export function getRelatedTypeIndex(
  config: HasOneDirectiveConfiguration,
  ctx: TransformerContextProvider,
  indexName?: string,
): FieldDefinitionNode[] {
  const { directiveName, field, fieldNodes } = config;
  const relatedType = ctx.output.getType(config.relatedType.name.value) as any;
  const fieldMap = new Map<string, FieldDefinitionNode>();
  let partitionFieldName;
  let partitionField;
  const sortFieldNames = [];
  const sortFields = [];

  for (const field of relatedType.fields!) {
    fieldMap.set(field.name.value, field);

    for (const directive of field.directives!) {
      const directiveName = directive.name.value;
      const name = getIndexName(directive);

      if ((!indexName && directiveName === 'primaryKey') || (indexName === name && directiveName === 'index')) {
        partitionFieldName = field.name.value;

        for (const argument of directive.arguments!) {
          if (argument.name.value === 'sortKeyFields') {
            if (argument.value.kind === Kind.STRING) {
              sortFieldNames.push(argument.value.value);
            } else if (argument.value.kind === Kind.LIST) {
              for (const keyField of argument.value.values) {
                sortFieldNames.push((keyField as any).value);
              }
            }
          }
        }

        break;
      }
    }
  }

  if (partitionFieldName === undefined) {
    if (indexName) {
      throw new InvalidDirectiveError(`Index ${indexName} does not exist for model ${relatedType.name.value}`);
    }

    partitionFieldName = 'id';
  }

  partitionField = fieldMap.get(partitionFieldName);
  assert(partitionField);

  for (const sortFieldName of sortFieldNames) {
    const sortField = fieldMap.get(sortFieldName);

    assert(sortField);
    sortFields.push(sortField);
  }

  if (fieldNodes.length > 0) {
    if (getBaseType(fieldNodes[0].type) !== getBaseType(partitionField.type)) {
      throw new InvalidDirectiveError(`${fieldNodes[0].name.value} field is not of type ${getBaseType(partitionField.type)}`);
    }

    if (fieldNodes.length > 1) {
      if (sortFields.length !== fieldNodes.length - 1) {
        throw new InvalidDirectiveError(`Invalid @${directiveName} directive on ${field.name.value}. Partial sort keys are not accepted.`);
      }

      for (let i = 0; i < sortFields.length; i++) {
        const sortField = sortFields[i];
        const fieldNode = fieldNodes[i + 1];

        if (getBaseType(fieldNode.type) !== getBaseType(sortField.type)) {
          throw new InvalidDirectiveError(`${fieldNode.name.value} field is not of type ${getBaseType(sortField.type)}`);
        }
      }
    }
  }

  return [partitionField, ...sortFields];
}

export function ensureFieldsArray(config: HasManyDirectiveConfiguration | HasOneDirectiveConfiguration | BelongsToDirectiveConfiguration) {
  if (!config.fields) {
    config.fields = [];
  } else if (!Array.isArray(config.fields)) {
    config.fields = [config.fields];
  } else if (config.fields.length === 0) {
    throw new InvalidDirectiveError(`No fields passed to @${config.directiveName} directive.`);
  }
}

export function getModelDirective(objectType: ObjectTypeDefinitionNode) {
  return objectType.directives!.find(directive => {
    return directive.name.value === 'model';
  });
}

export function validateModelDirective(
  config: HasManyDirectiveConfiguration | HasOneDirectiveConfiguration | BelongsToDirectiveConfiguration | ManyToManyDirectiveConfiguration,
) {
  if (!getModelDirective(config.object)) {
    throw new InvalidDirectiveError(`@${config.directiveName} must be on an @model object type field.`);
  }
}

export function getRelatedType(
  config: HasManyDirectiveConfiguration | HasOneDirectiveConfiguration | BelongsToDirectiveConfiguration,
  ctx: TransformerContextProvider,
) {
  const { field } = config;
  const relatedTypeName = getBaseType(field.type);
  const relatedType = ctx.inputDocument.definitions.find(
    (d: any) => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === relatedTypeName,
  ) as ObjectTypeDefinitionNode | undefined;

  assert(relatedType);
  return relatedType;
}

export function getFieldsNodes(
  config: HasManyDirectiveConfiguration | HasOneDirectiveConfiguration | BelongsToDirectiveConfiguration,
  ctx: TransformerContextProvider,
) {
  const { directiveName, fields, object } = config;
  const enums = ctx.output.getTypeDefinitionsOfKind(Kind.ENUM_TYPE_DEFINITION) as EnumTypeDefinitionNode[];

  return fields.map(fieldName => {
    const fieldNode = object.fields!.find(field => field.name.value === fieldName);

    if (!fieldNode) {
      throw new InvalidDirectiveError(`${fieldName} is not a field in ${object.name.value}`);
    }

    if (!isScalarOrEnum(fieldNode.type, enums)) {
      throw new InvalidDirectiveError(`All fields provided to @${directiveName} must be scalar or enum fields.`);
    }

    return fieldNode;
  });
}

export function validateRelatedModelDirective(
  config: HasManyDirectiveConfiguration | HasOneDirectiveConfiguration | BelongsToDirectiveConfiguration,
) {
  if (!getModelDirective(config.relatedType)) {
    throw new InvalidDirectiveError(`Object type ${config.relatedType.name.value} must be annotated with @model.`);
  }
}

function getIndexName(directive: DirectiveNode): string | undefined {
  for (const argument of directive.arguments!) {
    if (argument.name.value === 'name') {
      return (argument.value as StringValueNode).value;
    }
  }
}

export function getConnectionAttributeName(type: string, field: string) {
  return toCamelCase([type, field, 'id']);
}

export function getBackendConnectionAttributeName(resourceHelper: TransformerResourceHelperProvider, type: string, field: string) {
  return getConnectionAttributeName(resourceHelper.getModelNameMapping(type), field);
}

export function validateDisallowedDataStoreRelationships(
  config: HasManyDirectiveConfiguration | HasOneDirectiveConfiguration,
  ctx: TransformerContextProvider,
) {
  // If DataStore is enabled, the following scenario is not supported:
  // Model A includes a @hasOne or @hasMany relationship with Model B, while
  // Model B includes a @hasOne or @hasMany relationship back to Model A.

  if (!ctx.isProjectUsingDataStore()) {
    return;
  }

  const modelType = config.object.name.value;
  const relatedType = ctx.output.getType(config.relatedType.name.value) as ObjectTypeDefinitionNode;
  assert(relatedType);

  // Recursive relationships on the same type are allowed.
  if (modelType === relatedType.name.value) {
    return;
  }

  const hasUnsupportedConnectionFields = relatedType.fields!.some(field => {
    // If the related field has the same data type as this model, and @hasOne or @hasMany
    // is present, then the connection is unsupported.
    return (
      getBaseType(field.type) === modelType &&
      field.directives!.some(directive => {
        return directive.name.value === 'hasOne' || directive.name.value === 'hasMany';
      })
    );
  });

  if (hasUnsupportedConnectionFields) {
    throw new InvalidDirectiveError(
      `${modelType} and ${relatedType.name.value} cannot refer to each other via @hasOne or @hasMany when DataStore is in use. Use @belongsTo instead. See https://docs.amplify.aws/cli/graphql/data-modeling/#belongs-to-relationship`,
    );
  }
}

type RegisterForeignKeyMappingParams = {
  resourceHelper: TransformerResourceHelperProvider; // resourceHelper from the transformer context object
  thisTypeName: string; // the "source type" of the relation
  thisFieldName: string; // the field with the relational directive
  relatedTypeName: string; // the related type
};

/**
 * If thisTypeName maps to a different value, it registers the auto-generated foreign key fields to map to their original name
 */
export function registerHasOneForeignKeyMappings({
  resourceHelper,
  thisTypeName,
  thisFieldName,
  relatedTypeName,
}: RegisterForeignKeyMappingParams) {
  if (resourceHelper.isModelRenamed(thisTypeName)) {
    const currAttrName = getConnectionAttributeName(thisTypeName, thisFieldName);
    const origAttrName = getBackendConnectionAttributeName(resourceHelper, thisTypeName, thisFieldName);

    const modelFieldMap = resourceHelper.getModelFieldMap(thisTypeName);
    modelFieldMap.addMappedField({ currentFieldName: currAttrName, originalFieldName: origAttrName });

    (['create', 'update', 'get', 'list', 'sync'] as const).forEach(op => {
      const opFieldName = getFieldNameFor(op, thisTypeName);
      const opTypeName = op === 'create' || op === 'update' ? 'Mutation' : 'Query';
      const opIsList = op === 'list' || op === 'sync';
      modelFieldMap.addResolverReference({ typeName: opTypeName, fieldName: opFieldName, isList: opIsList });
    });
  }

  // register that the related type is referenced by this hasOne field
  // this is necessary because even if this model is not renamed, the related one could be and the field mappings would need to be applied
  // on this resolver
  resourceHelper
    .getModelFieldMap(relatedTypeName)
    .addResolverReference({ typeName: thisTypeName, fieldName: thisFieldName, isList: false });
}

/**
 * This function is similar to registerHasOneForeignKeyMappings but subtly different
 * Because hasMany creates a foreign key field on the related type, this function registers the mapping on the related type.
 * It attaches a resolver reference to the hasMany field so the renamed foreign key is mapped when fetching the related object through the hasMany field
 */
export function registerHasManyForeignKeyMappings({
  resourceHelper,
  thisTypeName,
  thisFieldName,
  relatedTypeName,
}: RegisterForeignKeyMappingParams) {
  if (!resourceHelper.isModelRenamed(thisTypeName)) {
    return;
  }

  const currAttrName = getConnectionAttributeName(thisTypeName, thisFieldName);
  const origAttrName = getBackendConnectionAttributeName(resourceHelper, thisTypeName, thisFieldName);

  const modelFieldMap = resourceHelper.getModelFieldMap(relatedTypeName);
  modelFieldMap
    .addMappedField({ currentFieldName: currAttrName, originalFieldName: origAttrName })
    .addResolverReference({ typeName: thisTypeName, fieldName: thisFieldName, isList: true });

  (['create', 'update', 'get', 'list', 'sync'] as const).forEach(op => {
    const opFieldName = getFieldNameFor(op, relatedTypeName);
    const opTypeName = op === 'create' || op === 'update' ? 'Mutation' : 'Query';
    const opIsList = op === 'list' || op === 'sync';

    // registers field mappings for CRUD resolvers on related type
    modelFieldMap.addResolverReference({ typeName: opTypeName, fieldName: opFieldName, isList: opIsList });
  });
}
