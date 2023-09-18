import type {
  ModelIntrospectionSchema,
  SchemaModel as IntrospectionModel,
  Field as IntrospectionModelField,
  SchemaNonModel as IntrospectionNonModel,
} from '@aws-amplify/appsync-modelgen-plugin';
import type {
  Schema as DataStoreSchema,
  SchemaModel as DataStoreModel,
  ModelField as DataStoreModelField,
  SchemaNonModel as DataStoreNonModel,
} from '@aws-amplify/datastore';

import { GenericDataField, GenericDataRelationshipType, GenericDataSchema } from './data-types';

class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}

const isFieldModelType = (
  field: IntrospectionModelField | DataStoreModelField,
): field is (IntrospectionModelField | DataStoreModelField) & { type: { model: string } } =>
  typeof field.type === 'object' && 'model' in field.type;

const getAssociatedFieldNames = (field: IntrospectionModelField | DataStoreModelField): string[] => {
  if (!field.association || !('associatedWith' in field.association)) {
    return [];
  }

  return Array.isArray(field.association.associatedWith) ? field.association.associatedWith : [field.association.associatedWith];
};

const getTargetNames = (field: IntrospectionModelField | DataStoreModelField): string[] => {
  const { association } = field;
  if (association) {
    const targetName = 'targetName' in association && association.targetName;
    const targetNames = 'targetNames' in association && association.targetNames;
    if (typeof targetName === 'string') {
      return [targetName];
    }
    if (Array.isArray(targetNames)) {
      return targetNames;
    }
  }
  return [];
};

/**
  Disclaimer: there's no 100% sure way of telling if something's a join table.
  This is best effort.
  Feature request w/ amplify-codegen: https://github.com/aws-amplify/amplify-codegen/issues/543
  After fulfilled, this can be fallback
 */
function checkIsModelAJoinTable(modelName: string, schema: ModelIntrospectionSchema | DataStoreSchema) {
  const model = schema.models[modelName];
  if (!model) {
    return false;
  }

  let numberOfKeyTypeAttributes = 0;

  const allowedNonModelFields: string[] = ['id', 'createdAt', 'updatedAt'];

  model.attributes?.forEach((attribute) => {
    if (attribute.type === 'key') {
      numberOfKeyTypeAttributes += 1;
      if (attribute.properties && 'fields' in attribute.properties && Array.isArray(attribute.properties.fields)) {
        allowedNonModelFields.push(...attribute.properties.fields);
      }
    }
  });

  // should have 2 keys
  if (numberOfKeyTypeAttributes !== 2) {
    return false;
  }

  const modelFieldTuples: [string, IntrospectionModelField | DataStoreModelField][] = [];
  let allFieldsAllowed = true;

  Object.entries(model.fields).forEach((field: [string, IntrospectionModelField | DataStoreModelField]) => {
    const [name, value] = field;
    if (isFieldModelType(value)) {
      modelFieldTuples.push(field);
    } else if (!allowedNonModelFields.includes(name)) {
      allFieldsAllowed = false;
    }
  });

  // non-model fields should be limited
  if (!allFieldsAllowed) {
    return false;
  }

  // should have 2 model fields
  if (modelFieldTuples.length !== 2) {
    return false;
  }

  return modelFieldTuples.every(([fieldName, fieldValue]) => {
    // should be required
    if (!fieldValue.isRequired) {
      return false;
    }

    // should be BELONGS_TO
    if (fieldValue.association?.connectionType !== 'BELONGS_TO') {
      return false;
    }
    const relatedModel = isFieldModelType(fieldValue) && schema.models[fieldValue.type.model];

    if (!relatedModel) {
      return false;
    }

    // should be bidirectional with HAS_MANY
    // that has a different model type
    return Object.values(relatedModel.fields).some((field: IntrospectionModelField | DataStoreModelField) => {
      if (!isFieldModelType(field) || field.association?.connectionType !== 'HAS_MANY') {
        return false;
      }

      const associatedFieldNames = getAssociatedFieldNames(field);
      return associatedFieldNames.length === 1 && associatedFieldNames.includes(fieldName);
    });
  });
}
function getGenericDataField(field: IntrospectionModelField | DataStoreModelField): GenericDataField {
  return {
    dataType: field.type,
    required: !!field.isRequired,
    readOnly: !!field.isReadOnly,
    isArray: field.isArray,
  };
}
/* eslint-disable no-param-reassign */
function addRelationship(
  fields: {
    [modelName: string]: { [fieldName: string]: GenericDataField['relationship'] };
  },
  modelName: string,
  fieldName: string,
  relationship: GenericDataField['relationship'],
) {
  // handle prototype-pollution vulnerability
  if (modelName === '__proto__') {
    throw new InvalidInputError('Invalid model name "__proto__"');
  }
  if (!fields[modelName]) {
    fields[modelName] = {};
  }

  const existingRelationship = fields[modelName][fieldName];

  const isHasManyIndex = existingRelationship && 'isHasManyIndex' in existingRelationship && existingRelationship.isHasManyIndex;
  if (relationship?.type === 'HAS_ONE' || relationship?.type === 'BELONGS_TO') {
    // give priority to designations as isHasManyIndex and BELONGS_TO
    if (isHasManyIndex) {
      relationship.isHasManyIndex = true;
    }
    if (existingRelationship?.type === 'BELONGS_TO') {
      relationship.type = 'BELONGS_TO';
    }
  }
  fields[modelName][fieldName] = relationship;
}
/* eslint-enable no-param-reassign */

// get custom primary keys || id
// TODO: when moved over to use introspection schema, this can be vastly simplified
function getPrimaryKeys({ model }: { model: IntrospectionModel | DataStoreModel }) {
  const customPrimaryKeys = model.attributes?.find(
    (attr) =>
      attr.type === 'key' &&
      (attr.properties === undefined ||
        // presence of name indicates that it is a secondary index and not a primary key
        !Object.keys(attr.properties).includes('name')),
  )?.properties?.fields;

  return customPrimaryKeys && Array.isArray(customPrimaryKeys) && customPrimaryKeys.length ? customPrimaryKeys : ['id'];
}

export function getGenericFromDataStore(dataStoreSchema: ModelIntrospectionSchema | DataStoreSchema): GenericDataSchema {
  const genericSchema: GenericDataSchema = {
    dataSourceType: 'DataStore',
    models: {},
    enums: {},
    nonModels: {},
  };

  const fieldsWithImplicitRelationships: {
    [modelName: string]: { [fieldName: string]: GenericDataField['relationship'] };
  } = {};

  const joinTableNames: string[] = [];

  Object.values(dataStoreSchema.models).forEach((model: DataStoreModel | IntrospectionModel) => {
    const genericFields: { [fieldName: string]: GenericDataField } = {};

    Object.values(model.fields).forEach((field: DataStoreModelField | IntrospectionModelField) => {
      const genericField = getGenericDataField(field);

      // handle relationships
      if (isFieldModelType(field)) {
        if (field.association) {
          const relationshipType = field.association.connectionType;

          let relatedModelName = field.type.model;
          let relatedJoinFieldName;
          let relatedJoinTableName;
          let modelRelationship: GenericDataRelationshipType | undefined;

          if (relationshipType === 'HAS_MANY' && 'associatedWith' in field.association) {
            // for 1:m relationships, we will not attach these
            // (i.e. model-type fields) as relatedModelFields
            const modelTypeFieldsOnHasManyChild: Set<string> = new Set();

            const associatedModel = dataStoreSchema.models[relatedModelName];
            const associatedFieldNames = getAssociatedFieldNames(field);
            let canUnlinkAssociatedModel = true;

            associatedFieldNames.forEach((associatedFieldName) => {
              const associatedField = associatedModel?.fields[associatedFieldName];
              // if any of the associatedField is required, you cannot unlink from parent model
              if (associatedField?.isRequired) {
                canUnlinkAssociatedModel = false;
              }

              // if the associated model is a join table, update relatedModelName to the actual related model
              if (associatedModel && checkIsModelAJoinTable(associatedModel.name, dataStoreSchema)) {
                joinTableNames.push(associatedModel.name);

                const relatedJoinField = Object.values(associatedModel.fields).find(
                  (joinField: IntrospectionModelField | DataStoreModelField) =>
                    joinField.name !== associatedFieldName && isFieldModelType(joinField),
                );
                if (relatedJoinField && isFieldModelType(relatedJoinField)) {
                  relatedJoinTableName = relatedModelName;
                  relatedModelName = relatedJoinField.type.model;
                  relatedJoinFieldName = relatedJoinField.name;
                }
                // if the associated model is not a join table, note implicit relationship for associated field
              } else if (associatedField) {
                if (isFieldModelType(associatedField)) {
                  modelTypeFieldsOnHasManyChild.add(associatedFieldName);
                } else {
                  addRelationship(fieldsWithImplicitRelationships, relatedModelName, associatedFieldName, {
                    type: 'HAS_ONE',
                    relatedModelName: model.name,
                    // identify index on 1:m child as such
                    isHasManyIndex: true,
                  });
                }
              }
            });

            const belongsToFieldOnRelatedModelTuple = Object.entries(associatedModel?.fields ?? {}).find(
              ([, f]: [string, IntrospectionModelField | DataStoreModelField]) =>
                isFieldModelType(f) && f.type.model === model.name && f.association?.connectionType === 'BELONGS_TO',
            );

            if (belongsToFieldOnRelatedModelTuple && belongsToFieldOnRelatedModelTuple[1].isRequired) {
              canUnlinkAssociatedModel = false;
            }

            modelRelationship = {
              type: relationshipType,
              canUnlinkAssociatedModel,
              relatedModelName,
              relatedModelFields: associatedFieldNames.filter((n) => !modelTypeFieldsOnHasManyChild.has(n)),
              relatedJoinFieldName,
              relatedJoinTableName,
            };

            if (belongsToFieldOnRelatedModelTuple) {
              const [belongsToField] = belongsToFieldOnRelatedModelTuple;
              modelRelationship.belongsToFieldOnRelatedModel = belongsToField;
            }
          }

          if (relationshipType === 'HAS_ONE' || relationshipType === 'BELONGS_TO') {
            const targetNames = getTargetNames(field);
            const associatedFields: string[] = [];
            // note implicit relationship for associated field within same model
            if (targetNames) {
              targetNames.forEach((targetName) => {
                addRelationship(fieldsWithImplicitRelationships, model.name, targetName, {
                  type: relationshipType,
                  relatedModelName,
                });
                associatedFields.push(targetName);
              });
            }
            modelRelationship = {
              type: relationshipType,
              relatedModelName,
              associatedFields: associatedFields.length ? associatedFields : undefined,
            };
          }

          genericField.relationship = modelRelationship;
        }
      }

      genericFields[field.name] = genericField;
    });

    genericSchema.models[model.name] = { fields: genericFields, primaryKeys: getPrimaryKeys({ model }) };
  });

  Object.entries(fieldsWithImplicitRelationships).forEach(([modelName, fields]) => {
    Object.entries(fields).forEach(([fieldName, relationship]) => {
      const field = genericSchema.models[modelName]?.fields[fieldName];
      if (field) {
        field.relationship = relationship;
      }
    });
  });

  joinTableNames.forEach((joinTableName) => {
    const model = genericSchema.models[joinTableName];
    if (model) {
      model.isJoinTable = true;
    }
  });

  genericSchema.enums = dataStoreSchema.enums;

  if (dataStoreSchema.nonModels) {
    Object.values(dataStoreSchema.nonModels).forEach((nonModel: IntrospectionNonModel | DataStoreNonModel) => {
      const genericFields: { [fieldName: string]: GenericDataField } = {};
      Object.values(nonModel.fields).forEach((field: IntrospectionModelField | DataStoreModelField) => {
        const genericField = getGenericDataField(field);
        genericFields[field.name] = genericField;
      });
      genericSchema.nonModels[nonModel.name] = { fields: genericFields };
    });
  }

  return genericSchema;
}
