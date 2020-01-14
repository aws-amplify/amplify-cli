import { Transformer, TransformerContext, InvalidDirectiveError, gql, getDirectiveArguments } from 'graphql-transformer-core';
import {
  DirectiveNode,
  ObjectTypeDefinitionNode,
  Kind,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
} from 'graphql';
import { ResourceFactory } from './resources';
import {
  makeModelConnectionType,
  makeModelConnectionField,
  makeScalarFilterInputs,
  makeModelXFilterInputObject,
  makeModelSortDirectionEnumObject,
  SortKeyFieldInfoTypeName,
  CONDITIONS_MINIMUM_VERSION,
} from 'graphql-dynamodb-transformer';
import {
  getBaseType,
  isListType,
  getDirectiveArgument,
  blankObject,
  isScalar,
  isScalarOrEnum,
  STANDARD_SCALARS,
  toCamelCase,
  isNonNullType,
  attributeTypeFromScalar,
  makeScalarKeyConditionForType,
  makeNamedType,
} from 'graphql-transformer-common';
import { ResolverResourceIDs, ModelResourceIDs } from 'graphql-transformer-common';
import { updateCreateInputWithConnectionField, updateUpdateInputWithConnectionField } from './definitions';
import Table, { KeySchema, GlobalSecondaryIndex, LocalSecondaryIndex } from 'cloudform-types/types/dynamoDb/table';

const CONNECTION_STACK_NAME = 'ConnectionStack';

interface RelationArguments {
  keyName?: string;
  fields: string[];
}

function makeConnectionAttributeName(type: string, field?: string) {
  // The same logic is used in amplify-codegen-appsync-model-plugin package to generate association field
  // Make sure the logic gets update in that package
  return field ? toCamelCase([type, field, 'id']) : toCamelCase([type, 'id']);
}

function validateKeyField(field: FieldDefinitionNode): void {
  if (!field) {
    return;
  }
  const baseType = getBaseType(field.type);
  const isAList = isListType(field.type);
  // The only valid key fields are single String and ID fields.
  if ((baseType === 'ID' || baseType === 'String') && !isAList) {
    return;
  }
  throw new InvalidDirectiveError(`If you define a field and specify it as a 'keyField', it must be of type 'ID' or 'String'.`);
}

/**
 * Ensure that the field passed in is compatible to be a key field
 * (Not a list and of type ID or String)
 * @param field: the field to be checked.
 */
function validateKeyFieldConnectionWithKey(field: FieldDefinitionNode, ctx: TransformerContext): void {
  const isNonNull = isNonNullType(field.type);
  const isAList = isListType(field.type);
  const isAScalarOrEnum = isScalarOrEnum(field.type, ctx.getTypeDefinitionsOfKind(Kind.ENUM_TYPE_DEFINITION) as EnumTypeDefinitionNode[]);

  // The only valid key fields are single non-null fields.
  if (!isAList && isNonNull && isAScalarOrEnum) {
    return;
  }
  throw new InvalidDirectiveError(`All fields provided to an @connection must be non-null scalar or enum fields.`);
}

/**
 * Returns the type of the field with the field name specified by finding it from the array of fields
 * and returning its type.
 * @param fields Array of FieldDefinitionNodes to search within.
 * @param fieldName Name of the field whose type is to be fetched.
 */
function getFieldType(fields: ReadonlyArray<FieldDefinitionNode>, fieldName: string) {
  return fields.find(f => f.name.value === fieldName).type;
}

/**
 * Checks that the fields being used to query match the expected key types for the index being used.
 * @param parentFields: All fields of the parent object.
 * @param relatedTypeFields: All fields of the related object.
 * @param inputFieldNames: The fields passed in to the @connection directive.
 * @param keySchema: The key schema for the index being used.
 */
function checkFieldsAgainstIndex(
  parentFields: ReadonlyArray<FieldDefinitionNode>,
  relatedTypeFields: ReadonlyArray<FieldDefinitionNode>,
  inputFieldNames: string[],
  keySchema: KeySchema[]
): void {
  const hashAttributeName = keySchema[0].AttributeName;
  const tablePKType = getFieldType(relatedTypeFields, String(hashAttributeName));
  const queryPKType = getFieldType(parentFields, inputFieldNames[0]);
  const numFields = inputFieldNames.length;

  if (getBaseType(tablePKType) !== getBaseType(queryPKType)) {
    throw new InvalidDirectiveError(`${inputFieldNames[0]} field is not of type ${getBaseType(tablePKType)}`);
  }
  if (numFields > keySchema.length && keySchema.length !== 2) {
    throw new InvalidDirectiveError('Too many fields passed in to @connection directive.');
  }
  if (numFields === 2) {
    const sortAttributeName = keySchema[1].AttributeName;
    const tableSKType = getFieldType(relatedTypeFields, String(sortAttributeName));
    const querySKType = getFieldType(parentFields, inputFieldNames[1]);

    if (getBaseType(tableSKType) !== getBaseType(querySKType)) {
      throw new InvalidDirectiveError(`${inputFieldNames[1]} field is not of type ${getBaseType(tableSKType)}`);
    }
  } else if (numFields > 2) {
    const tableSortFields = String(keySchema[1].AttributeName).split(ModelResourceIDs.ModelCompositeKeySeparator());
    const tableSortKeyTypes = tableSortFields.map(name => getFieldType(relatedTypeFields, name));
    const querySortFields = inputFieldNames.slice(1);
    const querySortKeyTypes = querySortFields.map(name => getFieldType(parentFields, name));

    // Check that types of each attribute match types of the fields that make up the composite sort key for the
    // table or index being queried.
    querySortKeyTypes.forEach((fieldType, index) => {
      if (getBaseType(fieldType) !== getBaseType(tableSortKeyTypes[index])) {
        throw new InvalidDirectiveError(`${querySortFields[index]} field is not of type ${getBaseType(tableSortKeyTypes[index])}`);
      }
    });
  }
}

/**
 * The @connection transform.
 *
 * This transform configures the GSIs and resolvers needed to implement
 * relationships at the GraphQL level.
 */
export class ModelConnectionTransformer extends Transformer {
  resources: ResourceFactory;

  constructor() {
    super(
      'ModelConnectionTransformer',
      gql`
        directive @connection(
          name: String
          keyField: String
          sortField: String
          keyName: String
          limit: Int
          fields: [String!]
        ) on FIELD_DEFINITION
      `
    );
    this.resources = new ResourceFactory();
  }

  public before = (ctx: TransformerContext): void => {
    const template = this.resources.initTemplate();
    ctx.mergeResources(template.Resources);
    ctx.mergeParameters(template.Parameters);
    ctx.mergeOutputs(template.Outputs);
  };

  /**
   * Create a 1-1, 1-M, or M-1 connection between two model types.
   * Throws an error if the related type is not an object type annotated with @model.
   */
  public field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    field: FieldDefinitionNode,
    directive: DirectiveNode,
    ctx: TransformerContext
  ): void => {
    const parentTypeName = parent.name.value;
    const fieldName = field.name.value;

    ctx.mapResourceToStack(CONNECTION_STACK_NAME, ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName));

    const parentModelDirective = parent.directives.find((dir: DirectiveNode) => dir.name.value === 'model');
    if (!parentModelDirective) {
      throw new InvalidDirectiveError(`@connection must be on an @model object type field.`);
    }

    const relatedTypeName = getBaseType(field.type);
    const relatedType = ctx.inputDocument.definitions.find(
      d => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === relatedTypeName
    ) as ObjectTypeDefinitionNode | undefined;
    if (!relatedType) {
      throw new InvalidDirectiveError(`Could not find an object type named ${relatedTypeName}.`);
    }
    const modelDirective = relatedType.directives.find((dir: DirectiveNode) => dir.name.value === 'model');
    if (!modelDirective) {
      throw new InvalidDirectiveError(`Object type ${relatedTypeName} must be annotated with @model.`);
    }

    // Checks if "fields" argument is provided which indicates use of the new parameterization
    // hence dive straight to new logic and return.
    if (getDirectiveArgument(directive, 'fields')) {
      this.connectionWithKey(parent, field, directive, ctx);
      return;
    }

    let connectionName = getDirectiveArgument(directive, 'name');
    let associatedSortFieldName = null;
    let sortType = null;
    // Find the associated connection field if one exists.
    const associatedConnectionField = relatedType.fields.find((f: FieldDefinitionNode) => {
      // Make sure we don't associate with the same field in a self connection
      if (f === field) {
        return false;
      }
      const relatedDirective = f.directives.find((dir: DirectiveNode) => dir.name.value === 'connection');
      if (relatedDirective) {
        const relatedDirectiveName = getDirectiveArgument(relatedDirective, 'name');
        if (connectionName && relatedDirectiveName && relatedDirectiveName === connectionName) {
          associatedSortFieldName = getDirectiveArgument(relatedDirective, 'sortField');
          return true;
        }
      }
      return false;
    });

    if (connectionName && !associatedConnectionField) {
      throw new InvalidDirectiveError(
        `Found one half of connection "${connectionName}" at ${parentTypeName}.${fieldName} but no related field on type ${relatedTypeName}`
      );
    }

    connectionName = connectionName || `${parentTypeName}.${fieldName}`;
    const leftConnectionIsList = isListType(field.type);
    const leftConnectionIsNonNull = isNonNullType(field.type);
    const rightConnectionIsList = associatedConnectionField ? isListType(associatedConnectionField.type) : undefined;
    const rightConnectionIsNonNull = associatedConnectionField ? isNonNullType(associatedConnectionField.type) : undefined;
    const limit = getDirectiveArgument(directive, 'limit');

    let connectionAttributeName = getDirectiveArgument(directive, 'keyField');
    const associatedSortField =
      associatedSortFieldName && parent.fields.find((f: FieldDefinitionNode) => f.name.value === associatedSortFieldName);

    if (associatedSortField) {
      if (isListType(associatedSortField.type)) {
        throw new InvalidDirectiveError(`sortField "${associatedSortFieldName}" is a list. It should be a scalar.`);
      }
      sortType = getBaseType(associatedSortField.type);
      if (!isScalar(associatedSortField.type) || sortType === STANDARD_SCALARS.Boolean) {
        throw new InvalidDirectiveError(
          `sortField "${associatedSortFieldName}" is of type "${sortType}". ` +
            `It should be a scalar that maps to a DynamoDB "String", "Number", or "Binary"`
        );
      }
    }

    // This grabs the definition of the sort field when it lives on the foreign model.
    // We use this to configure key condition arguments for the resolver on the many side of the @connection.
    const foreignAssociatedSortField =
      associatedSortFieldName && relatedType.fields.find((f: FieldDefinitionNode) => f.name.value === associatedSortFieldName);
    const sortKeyInfo = foreignAssociatedSortField
      ? {
          fieldName: foreignAssociatedSortField.name.value,
          attributeType: attributeTypeFromScalar(foreignAssociatedSortField.type),
          typeName: getBaseType(foreignAssociatedSortField.type),
        }
      : undefined;

    // Relationship Cardinalities:
    // 1. [] to []
    // 2. [] to {}
    // 3. {} to []
    // 4. [] to ?
    // 5. {} to ?
    if (leftConnectionIsList && rightConnectionIsList) {
      // 1. TODO.
      // Use an intermediary table or other strategy like embedded string sets for many to many.
      throw new InvalidDirectiveError(`Invalid Connection (${connectionName}): Many to Many connections are not yet supported.`);
    } else if (leftConnectionIsList && rightConnectionIsList === false) {
      // 2. [] to {} when the association exists. Note: false and undefined are not equal.
      // Store a foreign key on the related table and wire up a Query resolver.
      // This is the inverse of 3.
      const primaryKeyField = this.getPrimaryKeyField(ctx, parent);
      const idFieldName = primaryKeyField ? primaryKeyField.name.value : 'id';

      if (!connectionAttributeName) {
        connectionAttributeName = makeConnectionAttributeName(relatedTypeName, associatedConnectionField.name.value);
      }
      // Validate the provided key field is legit.
      const existingKeyField = relatedType.fields.find(f => f.name.value === connectionAttributeName);
      validateKeyField(existingKeyField);

      const queryResolver = this.resources.makeQueryConnectionResolver(
        parentTypeName,
        fieldName,
        relatedTypeName,
        connectionAttributeName,
        connectionName,
        idFieldName,
        // If there is a sort field for this connection query then use
        sortKeyInfo,
        limit
      );
      ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), queryResolver);

      this.extendTypeWithConnection(ctx, parent, field, relatedType, sortKeyInfo);
    } else if (!leftConnectionIsList && rightConnectionIsList) {
      // 3. {} to [] when the association exists.
      // Store foreign key on this table and wire up a GetItem resolver.
      // This is the inverse of 2.

      // if the sortField is not defined as a field, throw an error
      // Cannot assume the required type of the field
      if (associatedSortFieldName && !associatedSortField) {
        throw new InvalidDirectiveError(
          `sortField "${associatedSortFieldName}" not found on type "${parent.name.value}", other half of connection "${connectionName}".`
        );
      }

      const primaryKeyField = this.getPrimaryKeyField(ctx, relatedType);
      const idFieldName = primaryKeyField ? primaryKeyField.name.value : 'id';

      if (!connectionAttributeName) {
        connectionAttributeName = makeConnectionAttributeName(parentTypeName, fieldName);
      }
      // Validate the provided key field is legit.
      const existingKeyField = parent.fields.find(f => f.name.value === connectionAttributeName);
      validateKeyField(existingKeyField);

      const tableLogicalId = ModelResourceIDs.ModelTableResourceID(parentTypeName);
      const table = ctx.getResource(tableLogicalId) as Table;
      const sortField = associatedSortField ? { name: associatedSortFieldName, type: sortType } : null;
      const updated = this.resources.updateTableForConnection(table, connectionName, connectionAttributeName, sortField);
      ctx.setResource(tableLogicalId, updated);

      const getResolver = this.resources.makeGetItemConnectionResolver(
        parentTypeName,
        fieldName,
        relatedTypeName,
        connectionAttributeName,
        idFieldName
      );
      ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), getResolver);

      // Update the create & update input objects for this
      const createInputName = ModelResourceIDs.ModelCreateInputObjectName(parentTypeName);
      const createInput = ctx.getType(createInputName) as InputObjectTypeDefinitionNode;
      if (createInput) {
        const updated = updateCreateInputWithConnectionField(createInput, connectionAttributeName, leftConnectionIsNonNull);
        ctx.putType(updated);
      }
      const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(parentTypeName);
      const updateInput = ctx.getType(updateInputName) as InputObjectTypeDefinitionNode;
      if (updateInput) {
        const updated = updateUpdateInputWithConnectionField(updateInput, connectionAttributeName);
        ctx.putType(updated);
      }
    } else if (leftConnectionIsList) {
      // 4. [] to ?
      // Store foreign key on the related table and wire up a Query resolver.
      // This has no inverse and has limited knowlege of the connection.
      const primaryKeyField = this.getPrimaryKeyField(ctx, parent);
      const idFieldName = primaryKeyField ? primaryKeyField.name.value : 'id';

      if (!connectionAttributeName) {
        connectionAttributeName = makeConnectionAttributeName(parentTypeName, fieldName);
      }

      // Validate the provided key field is legit.
      const existingKeyField = relatedType.fields.find(f => f.name.value === connectionAttributeName);
      validateKeyField(existingKeyField);

      const tableLogicalId = ModelResourceIDs.ModelTableResourceID(relatedTypeName);
      const table = ctx.getResource(tableLogicalId) as Table;
      const updated = this.resources.updateTableForConnection(table, connectionName, connectionAttributeName);
      ctx.setResource(tableLogicalId, updated);

      const queryResolver = this.resources.makeQueryConnectionResolver(
        parentTypeName,
        fieldName,
        relatedTypeName,
        connectionAttributeName,
        connectionName,
        idFieldName,
        sortKeyInfo,
        limit
      );
      ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), queryResolver);

      this.extendTypeWithConnection(ctx, parent, field, relatedType, sortKeyInfo);

      // Update the create & update input objects for the related type
      const createInputName = ModelResourceIDs.ModelCreateInputObjectName(relatedTypeName);
      const createInput = ctx.getType(createInputName) as InputObjectTypeDefinitionNode;
      if (createInput) {
        const updated = updateCreateInputWithConnectionField(createInput, connectionAttributeName);
        ctx.putType(updated);
      }
      const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(relatedTypeName);
      const updateInput = ctx.getType(updateInputName) as InputObjectTypeDefinitionNode;
      if (updateInput) {
        const updated = updateUpdateInputWithConnectionField(updateInput, connectionAttributeName);
        ctx.putType(updated);
      }
    } else {
      // 5. {} to ?
      // Store foreign key on this table and wire up a GetItem resolver.
      // This has no inverse and has limited knowlege of the connection.
      const primaryKeyField = this.getPrimaryKeyField(ctx, relatedType);
      const idFieldName = primaryKeyField ? primaryKeyField.name.value : 'id';

      if (!connectionAttributeName) {
        connectionAttributeName = makeConnectionAttributeName(parentTypeName, fieldName);
      }

      // Issue #2100 - in a 1:1 mapping that's based on sortField, we need to validate both sides
      // and getItemResolver has to be aware of the soft field.
      let sortFieldInfo;
      const sortFieldName = getDirectiveArgument(directive, 'sortField');
      if (sortFieldName) {
        // Related type has to have a primary key directive and has to have a soft key
        // defined
        const relatedSortField = this.getSortField(relatedType);

        if (!relatedSortField) {
          throw new InvalidDirectiveError(
            `sortField "${sortFieldName}" requires a primary @key on type "${relatedTypeName}" with a sort key that was not found.`
          );
        }

        const sortField = parent.fields.find(f => f.name.value === sortFieldName);

        if (!sortField) {
          throw new InvalidDirectiveError(`sortField with name "${sortFieldName} cannot be found on tyoe: ${parent.name.value}`);
        }

        const relatedSortFieldType = getBaseType(relatedSortField.type);
        const sortFieldType = getBaseType(sortField.type);

        if (relatedSortFieldType !== sortFieldType) {
          throw new InvalidDirectiveError(
            `sortField "${relatedSortField.name.value}" on type "${relatedTypeName}" is not matching the ` +
              `type of field "${sortFieldName}" on type "${parentTypeName}"`
          );
        }

        let sortFieldIsStringLike = true;

        // We cannot use $util.defaultIfNullOrBlank on non-string types
        if (
          sortFieldType === STANDARD_SCALARS.Int ||
          sortFieldType === STANDARD_SCALARS.Float ||
          sortFieldType === STANDARD_SCALARS.Bolean
        ) {
          sortFieldIsStringLike = false;
        }

        sortFieldInfo = {
          primarySortFieldName: relatedSortField.name.value,
          sortFieldName,
          sortFieldIsStringLike,
        };
      }

      // Validate the provided key field is legit.
      const existingKeyField = parent.fields.find(f => f.name.value === connectionAttributeName);
      validateKeyField(existingKeyField);

      const getResolver = this.resources.makeGetItemConnectionResolver(
        parentTypeName,
        fieldName,
        relatedTypeName,
        connectionAttributeName,
        idFieldName,
        sortFieldInfo
      );
      ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), getResolver);

      // Update the create & update input objects for this type
      const createInputName = ModelResourceIDs.ModelCreateInputObjectName(parentTypeName);
      const createInput = ctx.getType(createInputName) as InputObjectTypeDefinitionNode;
      if (createInput) {
        const updated = updateCreateInputWithConnectionField(createInput, connectionAttributeName, leftConnectionIsNonNull);
        ctx.putType(updated);
      }
      const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(parentTypeName);
      const updateInput = ctx.getType(updateInputName) as InputObjectTypeDefinitionNode;
      if (updateInput) {
        const updated = updateUpdateInputWithConnectionField(updateInput, connectionAttributeName);
        ctx.putType(updated);
      }
    }
  };

  /**
   * The @connection parameterization with "fields" can be used to connect objects by running a query on a table.
   * The directive is given an index to query and a list of fields to query by such that it
   * returns a list objects (or in certain cases a single object) that are connected to the
   * object it is called on.
   * This directive is designed to leverage indices configured using @key to create relationships.
   *
   * Directive Definition:
   * @connection(keyName: String, fields: [String!]!) on FIELD_DEFINITION
   * param @keyName The name of the index configured using @key that should be queried to get
   *      connected objects
   * param @fields The names of the fields on the current object to query by.
   */
  public connectionWithKey = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    field: FieldDefinitionNode,
    directive: DirectiveNode,
    ctx: TransformerContext
  ): void => {
    const parentTypeName = parent.name.value;
    const fieldName = field.name.value;
    const args: RelationArguments = getDirectiveArguments(directive);

    // Ensure that there is at least one field provided.
    if (args.fields.length === 0) {
      throw new InvalidDirectiveError('No fields passed in to @connection directive.');
    }

    // Check that related type exists and that the connected object is annotated with @model.
    const relatedTypeName = getBaseType(field.type);
    const relatedType = ctx.inputDocument.definitions.find(
      d => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === relatedTypeName
    ) as ObjectTypeDefinitionNode | undefined;

    // Get Child object's table.
    const tableLogicalID = ModelResourceIDs.ModelTableResourceID(relatedType.name.value);
    const tableResource = ctx.getResource(tableLogicalID) as Table;

    // Check that each field provided exists in the parent model and that it is a valid key type (single non-null).
    let inputFields: FieldDefinitionNode[] = [];
    args.fields.forEach(item => {
      const fieldsArrayLength = inputFields.length;
      inputFields.push(parent.fields.find(f => f.name.value === item));
      if (!inputFields[fieldsArrayLength]) {
        throw new InvalidDirectiveError(`${item} is not a field in ${parentTypeName}`);
      }

      validateKeyFieldConnectionWithKey(inputFields[fieldsArrayLength], ctx);
    });

    let index: GlobalSecondaryIndex = undefined;
    // If no index is provided use the default index for the related model type and
    // check that the query fields match the PK/SK of the table. Else confirm that index exists.
    if (!args.keyName) {
      checkFieldsAgainstIndex(parent.fields, relatedType.fields, args.fields, <KeySchema[]>tableResource.Properties.KeySchema);
    } else {
      index =
        (tableResource.Properties.GlobalSecondaryIndexes
          ? (<GlobalSecondaryIndex[]>tableResource.Properties.GlobalSecondaryIndexes).find(GSI => GSI.IndexName === args.keyName)
          : null) ||
        (tableResource.Properties.LocalSecondaryIndexes
          ? (<LocalSecondaryIndex[]>tableResource.Properties.LocalSecondaryIndexes).find(LSI => LSI.IndexName === args.keyName)
          : null);
      if (!index) {
        throw new InvalidDirectiveError(`Key ${args.keyName} does not exist for model ${relatedTypeName}`);
      }

      // Confirm that types of query fields match types of PK/SK of the index being queried.
      checkFieldsAgainstIndex(parent.fields, relatedType.fields, args.fields, <KeySchema[]>index.KeySchema);
    }

    // If the related type is not a list, the index has to be the default index and the fields provided must match the PK/SK of the index.
    if (!isListType(field.type)) {
      if (args.keyName) {
        // tslint:disable-next-line: max-line-length
        throw new InvalidDirectiveError(
          `Connection is to a single object but the keyName ${args.keyName} was provided which does not reference the default table.`
        );
      }

      // Start with GetItem resolver for case where the connection is to a single object.
      const getResolver = this.resources.makeGetItemConnectionWithKeyResolver(
        parentTypeName,
        fieldName,
        relatedTypeName,
        args.fields,
        <KeySchema[]>tableResource.Properties.KeySchema
      );

      ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), getResolver);
    } else {
      const keySchema: KeySchema[] = index ? <KeySchema[]>index.KeySchema : <KeySchema[]>tableResource.Properties.KeySchema;

      const queryResolver = this.resources.makeQueryConnectionWithKeyResolver(
        parentTypeName,
        fieldName,
        relatedType,
        args.fields,
        keySchema,
        index ? String(index.IndexName) : undefined
      );

      ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), queryResolver);

      let sortKeyInfo: { fieldName: string; typeName: SortKeyFieldInfoTypeName; model: string; keyName: string } = undefined;
      if (args.fields.length > 1) {
        sortKeyInfo = undefined;
      } else {
        const compositeSortKeyType: SortKeyFieldInfoTypeName = 'Composite';
        const compositeSortKeyName = keySchema[1] ? this.resources.makeCompositeSortKeyName(String(keySchema[1].AttributeName)) : undefined;
        const sortKeyField = keySchema[1] ? relatedType.fields.find(f => f.name.value === keySchema[1].AttributeName) : undefined;

        // If a sort key field is found then add a simple sort key, else add a composite sort key.
        if (sortKeyField) {
          sortKeyInfo = keySchema[1]
            ? {
                fieldName: String(keySchema[1].AttributeName),
                typeName: getBaseType(sortKeyField.type),
                model: relatedTypeName,
                keyName: index ? String(index.IndexName) : 'Primary',
              }
            : undefined;
        } else {
          sortKeyInfo = keySchema[1]
            ? {
                fieldName: compositeSortKeyName,
                typeName: compositeSortKeyType,
                model: relatedTypeName,
                keyName: index ? String(index.IndexName) : 'Primary',
              }
            : undefined;
        }
      }

      this.extendTypeWithConnection(ctx, parent, field, relatedType, sortKeyInfo);
    }
  };

  private typeExist(type: string, ctx: TransformerContext): boolean {
    return Boolean(type in ctx.nodeMap);
  }

  private generateModelXConnectionType(ctx: TransformerContext, typeDef: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): void {
    const tableXConnectionName = ModelResourceIDs.ModelConnectionTypeName(typeDef.name.value);
    if (this.typeExist(tableXConnectionName, ctx)) {
      return;
    }

    // Create the ModelXConnection
    const connectionType = blankObject(tableXConnectionName);
    ctx.addObject(connectionType);

    ctx.addObjectExtension(makeModelConnectionType(typeDef.name.value));
  }

  private generateFilterAndKeyConditionInputs(
    ctx: TransformerContext,
    field: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    sortKeyInfo?: { fieldName: string; typeName: SortKeyFieldInfoTypeName }
  ): void {
    const scalarFilters = makeScalarFilterInputs(this.supportsConditions(ctx));
    for (const filter of scalarFilters) {
      if (!this.typeExist(filter.name.value, ctx)) {
        ctx.addInput(filter);
      }
    }

    // Create the ModelXFilterInput
    const tableXQueryFilterInput = makeModelXFilterInputObject(field, ctx, this.supportsConditions(ctx));
    if (!this.typeExist(tableXQueryFilterInput.name.value, ctx)) {
      ctx.addInput(tableXQueryFilterInput);
    }

    // Create sort key condition inputs for valid sort key types
    // We only create the KeyConditionInput if it is being used.
    // Don't create a key condition input for composite sort keys since it already done by @key.
    if (sortKeyInfo && sortKeyInfo.typeName !== 'Composite') {
      const sortKeyConditionInput = makeScalarKeyConditionForType(makeNamedType(sortKeyInfo.typeName));
      if (!this.typeExist(sortKeyConditionInput.name.value, ctx)) {
        ctx.addInput(sortKeyConditionInput);
      }
    }
  }

  private supportsConditions(context: TransformerContext) {
    return context.getTransformerVersion() >= CONDITIONS_MINIMUM_VERSION;
  }

  private extendTypeWithConnection(
    ctx: TransformerContext,
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    field: FieldDefinitionNode,
    returnType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    sortKeyInfo?: { fieldName: string; typeName: SortKeyFieldInfoTypeName; model?: string; keyName?: string }
  ) {
    this.generateModelXConnectionType(ctx, returnType);

    // Extensions are not allowed to redeclare fields so we must replace
    // it in place.
    const type = ctx.getType(parent.name.value) as ObjectTypeDefinitionNode;
    if (type && (type.kind === Kind.OBJECT_TYPE_DEFINITION || type.kind === Kind.INTERFACE_TYPE_DEFINITION)) {
      // Find the field and replace it in place.
      const newFields = type.fields.map((f: FieldDefinitionNode) => {
        if (f.name.value === field.name.value) {
          const updated = makeModelConnectionField(field.name.value, returnType.name.value, sortKeyInfo, [...f.directives]);
          return updated;
        }
        return f;
      });
      const updatedType = {
        ...type,
        fields: newFields,
      };
      ctx.putType(updatedType);

      if (!this.typeExist('ModelSortDirection', ctx)) {
        const modelSortDirection = makeModelSortDirectionEnumObject();
        ctx.addEnum(modelSortDirection);
      }

      this.generateFilterAndKeyConditionInputs(ctx, returnType, sortKeyInfo);
    } else {
      throw new InvalidDirectiveError(`Could not find a object or interface type named ${parent.name.value}.`);
    }
  }

  private getPrimaryKeyField(ctx: TransformerContext, type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): FieldDefinitionNode {
    let field: FieldDefinitionNode;

    for (const keyDirective of type.directives.filter(d => d.name.value === 'key')) {
      if (getDirectiveArgument(keyDirective, 'name') === undefined) {
        const fieldsArg = getDirectiveArgument(keyDirective, 'fields');

        if (fieldsArg && fieldsArg.length && fieldsArg.length >= 1 && fieldsArg.length <= 2) {
          field = type.fields.find(f => f.name.value === fieldsArg[0]);
        }

        // Exit the loop even if field was not set above, @key will throw validation
        // error anyway
        break;
      }
    }

    return field;
  }

  private getSortField(type: ObjectTypeDefinitionNode) {
    let field: FieldDefinitionNode;

    for (const keyDirective of type.directives.filter(d => d.name.value === 'key')) {
      if (getDirectiveArgument(keyDirective, 'name') === undefined) {
        const fieldsArg = getDirectiveArgument(keyDirective, 'fields');

        if (fieldsArg && fieldsArg.length && fieldsArg.length === 2) {
          field = type.fields.find(f => f.name.value === fieldsArg[1]);
        }

        // Exit the loop even if field was not set above, @key will throw validation
        // error anyway
        break;
      }
    }

    return field;
  }
}
