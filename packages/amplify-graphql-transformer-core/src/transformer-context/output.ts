import {
  DocumentNode,
  EnumTypeDefinitionNode,
  EnumTypeExtensionNode,
  EnumValueDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputObjectTypeExtensionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  InterfaceTypeExtensionNode,
  Kind,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  OperationTypeDefinitionNode,
  OperationTypeNode,
  print,
  SchemaDefinitionNode,
  TypeDefinitionNode,
  TypeSystemDefinitionNode,
  UnionTypeDefinitionNode,
  UnionTypeExtensionNode,
} from 'graphql';
import { stripDirectives } from '../utils/strip-directives';
import { DEFAULT_SCHEMA_DEFINITION } from '../utils/defaultSchema';
import { TransformerContextOutputProvider } from '@aws-amplify/graphql-transformer-interfaces';
import assert from 'assert';

export function blankObject(name: string): ObjectTypeDefinitionNode {
  return {
    kind: 'ObjectTypeDefinition',
    name: {
      kind: 'Name',
      value: name,
    },
    fields: [],
    directives: [],
    interfaces: [],
  };
}

export function objectExtension(name: string, fields: FieldDefinitionNode[] = []): ObjectTypeExtensionNode {
  return {
    kind: Kind.OBJECT_TYPE_EXTENSION,
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
    interfaces: [],
  };
}

export class TransformerOutput implements TransformerContextOutputProvider {
  public nodeMap: { [name: string]: TypeSystemDefinitionNode } = {};

  /**
   * Scans through the context nodeMap and returns all type definition nodes
   * that are of the given kind.
   * @param kind Kind value of type definition nodes expected.
   */

  constructor(inputDocument: DocumentNode) {
    const extensionNodes = [];
    for (const inputDef of inputDocument.definitions) {
      switch (inputDef.kind) {
        case Kind.OBJECT_TYPE_DEFINITION:
        case Kind.SCALAR_TYPE_DEFINITION:
        case Kind.INTERFACE_TYPE_DEFINITION:
        case Kind.INPUT_OBJECT_TYPE_DEFINITION:
        case Kind.ENUM_TYPE_DEFINITION:
        case Kind.UNION_TYPE_DEFINITION:
          const typeDef = inputDef as TypeDefinitionNode;
          if (!this.getType(typeDef.name.value)) {
            this.addType(typeDef);
          }
          break;
        case Kind.SCHEMA_DEFINITION:
          if (!this.getSchema()) {
            const typeDef = inputDef as SchemaDefinitionNode;
            this.putSchema(typeDef);
          }
          break;
        case Kind.OBJECT_TYPE_EXTENSION:
        case Kind.ENUM_TYPE_EXTENSION:
        case Kind.UNION_TYPE_EXTENSION:
        case Kind.INTERFACE_TYPE_EXTENSION:
        case Kind.INPUT_OBJECT_TYPE_EXTENSION:
          extensionNodes.push(inputDef);
          break;
        // case Kind.SCALAR_TYPE_EXTENSION:
        default:
        /* pass any others */
      }

      // We add the extension nodes last so that the order of input documents does not matter.
      // At this point, all input documents have been processed so the base types will be present.
      for (const ext of extensionNodes) {
        switch (ext.kind) {
          case Kind.OBJECT_TYPE_EXTENSION:
            this.addObjectExtension(ext);
            break;
          case Kind.INTERFACE_TYPE_EXTENSION:
            this.addInterfaceExtension(ext);
            break;
          case Kind.UNION_TYPE_EXTENSION:
            this.addUnionExtension(ext);
            break;
          case Kind.ENUM_TYPE_EXTENSION:
            this.addEnumExtension(ext);
            break;
          case Kind.INPUT_OBJECT_TYPE_EXTENSION:
            this.addInputExtension(ext);
            break;
          // case Kind.SCALAR_TYPE_EXTENSION:
          default:
            continue;
        }
      }
      // If no schema definition is provided then fill with the default one.
      if (!this.getSchema()) {
        this.putSchema(DEFAULT_SCHEMA_DEFINITION);
      }
    }
  }
  public getTypeDefinitionsOfKind(kind: string) {
    const typeDefs: TypeDefinitionNode[] = [];
    for (const key of Object.keys(this.nodeMap)) {
      const definition = this.nodeMap[key];
      if (definition.kind === kind) {
        typeDefs.push(definition as TypeDefinitionNode);
      }
    }
    return typeDefs;
  }

  public putSchema(obj: SchemaDefinitionNode) {
    this.nodeMap.__schema = obj;
  }
  public getSchema(): SchemaDefinitionNode {
    return this.nodeMap.__schema as SchemaDefinitionNode;
  }
  public getQueryTypeName(): string | undefined {
    const schemaNode = this.getSchema();
    const queryTypeName = schemaNode.operationTypes.find((op: OperationTypeDefinitionNode) => op.operation === 'query');
    if (queryTypeName && queryTypeName.type && queryTypeName.type.name) {
      return queryTypeName.type.name.value;
    }
  }
  public getQuery(): ObjectTypeDefinitionNode | undefined {
    const queryTypeName = this.getQueryTypeName();
    if (queryTypeName) {
      return this.nodeMap[queryTypeName] as ObjectTypeDefinitionNode | undefined;
    }
  }

  public getMutationTypeName(): string | undefined {
    const schemaNode = this.getSchema();
    const mutationTypeName = schemaNode.operationTypes.find((op: OperationTypeDefinitionNode) => op.operation === 'mutation');
    if (mutationTypeName && mutationTypeName.type && mutationTypeName.type.name) {
      return mutationTypeName.type.name.value;
    }
  }

  public getMutation(): ObjectTypeDefinitionNode | undefined {
    const mutationTypeName = this.getMutationTypeName();
    if (mutationTypeName) {
      return this.nodeMap[mutationTypeName] as ObjectTypeDefinitionNode | undefined;
    }
  }

  public getSubscriptionTypeName(): string | undefined {
    const schemaNode = this.getSchema();
    const subscriptionTypeName = schemaNode.operationTypes.find((op: OperationTypeDefinitionNode) => op.operation === 'subscription');
    if (subscriptionTypeName && subscriptionTypeName.type && subscriptionTypeName.type.name) {
      return subscriptionTypeName.type.name.value;
    }
  }

  public getSubscription(): ObjectTypeDefinitionNode | undefined {
    const subscriptionTypeName = this.getSubscriptionTypeName();
    if (subscriptionTypeName) {
      return this.nodeMap[subscriptionTypeName] as ObjectTypeDefinitionNode | undefined;
    }
  }

  /**
   * Add a generic type.
   * @param obj The type to add
   */
  public addType(obj: TypeDefinitionNode) {
    if (this.nodeMap[obj.name.value]) {
      throw new Error(`Conflicting type '${obj.name.value}' found.`);
    }
    this.nodeMap[obj.name.value] = obj;
  }
  public putType(obj: TypeDefinitionNode) {
    this.nodeMap[obj.name.value] = obj;
  }

  public getType(name: string): TypeSystemDefinitionNode | undefined {
    return this.nodeMap[name];
  }

  public hasType(name: string): boolean {
    return name in this.nodeMap;
  }

  /**
   * Add an object type definition node to the context. If the type already
   * exists an error will be thrown.
   * @param obj The object type definition node to add.
   */
  public addObject(obj: ObjectTypeDefinitionNode) {
    if (this.nodeMap[obj.name.value]) {
      throw new Error(`Conflicting type '${obj.name.value}' found.`);
    }
    this.nodeMap[obj.name.value] = obj;
  }

  public updateObject(obj: ObjectTypeDefinitionNode) {
    if (!this.nodeMap[obj.name.value]) {
      throw new Error(`Type ${obj.name.value} does not exist.`);
    }
    this.nodeMap[obj.name.value] = obj;
  }

  public getObject(name: string): ObjectTypeDefinitionNode | undefined {
    if (this.nodeMap[name]) {
      const node = this.nodeMap[name];
      if (node.kind === Kind.OBJECT_TYPE_DEFINITION) {
        return node as ObjectTypeDefinitionNode;
      }
    }
  }

  /**
   * Extends the context query object with additional fields.
   * If the customer uses a name other than 'Query' this will proxy to the
   * correct type.
   * @param fields The fields to add the query type.
   */
  public addQueryFields(fields: FieldDefinitionNode[]) {
    const queryTypeName = this.getQueryTypeName();
    if (queryTypeName) {
      if (!this.getType(queryTypeName)) {
        this.addType(blankObject(queryTypeName));
      }
      let queryType = objectExtension(queryTypeName, fields);
      this.addObjectExtension(queryType);
    }
  }

  /**
   * Extends the context mutation object with additional fields.
   * If the customer uses a name other than 'Mutation' this will proxy to the
   * correct type.
   * @param fields The fields to add the mutation type.
   */
  public addMutationFields(fields: FieldDefinitionNode[]) {
    const mutationTypeName = this.getMutationTypeName();
    if (mutationTypeName) {
      if (!this.getType(mutationTypeName)) {
        this.addType(blankObject(mutationTypeName));
      }
      let mutationType = objectExtension(mutationTypeName, fields);
      this.addObjectExtension(mutationType);
    }
  }

  /**
   * Extends the context subscription object with additional fields.
   * If the customer uses a name other than 'Subscription' this will proxy to the
   * correct type.
   * @param fields The fields to add the subscription type.
   */
  public addSubscriptionFields(fields: FieldDefinitionNode[]) {
    const subscriptionTypeName = this.getSubscriptionTypeName();
    if (subscriptionTypeName) {
      if (!this.getType(subscriptionTypeName)) {
        this.addType(blankObject(subscriptionTypeName));
      }
      let subscriptionType = objectExtension(subscriptionTypeName, fields);
      this.addObjectExtension(subscriptionType);
    }
  }

  /**
   * Add an object type extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The object type definition node to add.
   */
  public addObjectExtension(obj: ObjectTypeExtensionNode) {
    if (!this.nodeMap[obj.name.value]) {
      throw new Error(`Cannot extend nonexistent type '${obj.name.value}'.`);
    }
    // AppSync does not yet understand type extensions so fold the types in.
    const oldNode = this.getObject(obj.name.value);
    assert(oldNode);
    const newDirs = [];
    const oldDirs = oldNode?.directives || [];

    // Filter out duplicate directives, do not add them
    if (obj.directives) {
      for (const newDir of obj.directives) {
        if (Boolean(oldDirs.find(d => d.name.value === newDir.name.value)) === false) {
          newDirs.push(newDir);
        }
      }
    }

    const mergedDirs = [...oldDirs, ...newDirs];

    // An extension cannot redeclare fields.
    const oldFields = oldNode?.fields || [];
    const oldFieldMap = oldFields.reduce(
      (acc: any, field: FieldDefinitionNode) => ({
        ...acc,
        [field.name.value]: field,
      }),
      {},
    );
    const newFields = obj.fields || [];
    const mergedFields = [...oldFields];
    for (const newField of newFields) {
      if (oldFieldMap[newField.name.value]) {
        throw new Error(`Object type extension '${obj.name.value}' cannot redeclare field ${newField.name.value}`);
      }
      mergedFields.push(newField);
    }

    // An extension cannot redeclare interfaces
    const oldInterfaces = oldNode?.interfaces || [];
    const oldInterfaceMap = oldInterfaces.reduce(
      (acc: any, field: NamedTypeNode) => ({
        ...acc,
        [field.name.value]: field,
      }),
      {},
    );
    const newInterfaces = obj.interfaces || [];
    const mergedInterfaces = [...oldInterfaces];
    for (const newInterface of newInterfaces) {
      if (oldInterfaceMap[newInterface.name.value]) {
        throw new Error(`Object type extension '${obj.name.value}' cannot redeclare interface ${newInterface.name.value}`);
      }
      mergedInterfaces.push(newInterface);
    }
    this.nodeMap[oldNode.name.value] = {
      ...oldNode,
      interfaces: mergedInterfaces,
      directives: mergedDirs,
      fields: mergedFields,
    };
  }

  /**
   * Add an input object type extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The input object type definition node to add.
   */
  public addInputExtension(obj: InputObjectTypeExtensionNode) {
    if (!this.nodeMap[obj.name.value]) {
      throw new Error(`Cannot extend nonexistent input '${obj.name.value}'.`);
    }
    // AppSync does not yet understand type extensions so fold the types in.
    const oldNode = this.getType(obj.name.value) as InputObjectTypeDefinitionNode;
    const newDirs = obj.directives || [];
    const oldDirs = oldNode.directives || [];
    const mergedDirs = [...oldDirs, ...newDirs];

    // An extension cannot redeclare fields.
    const oldFields = oldNode.fields || [];
    const oldFieldMap = oldFields.reduce(
      (acc: any, field: InputValueDefinitionNode) => ({
        ...acc,
        [field.name.value]: field,
      }),
      {},
    );
    const newFields = obj.fields || [];
    const mergedFields = [...oldFields];
    for (const newField of newFields) {
      if (oldFieldMap[newField.name.value]) {
        throw new Error(`Input object type extension '${obj.name.value}' cannot redeclare field ${newField.name.value}`);
      }
      mergedFields.push(newField);
    }

    this.nodeMap[oldNode.name.value] = {
      ...oldNode,
      directives: mergedDirs,
      fields: mergedFields,
    };
  }

  /**
   * Add an interface extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The interface type definition node to add.
   */
  public addInterfaceExtension(obj: InterfaceTypeExtensionNode) {
    if (!this.nodeMap[obj.name.value]) {
      throw new Error(`Cannot extend nonexistent interface '${obj.name.value}'.`);
    }
    // AppSync does not yet understand type extensions so fold the types in.
    const oldNode = this.getType(obj.name.value) as InterfaceTypeDefinitionNode;
    const newDirs = obj.directives || [];
    const oldDirs = oldNode.directives || [];
    const mergedDirs = [...oldDirs, ...newDirs];

    // An extension cannot redeclare fields.
    const oldFields = oldNode.fields || [];
    const oldFieldMap = oldFields.reduce(
      (acc: any, field: FieldDefinitionNode) => ({
        ...acc,
        [field.name.value]: field,
      }),
      {},
    );
    const newFields = obj.fields || [];
    const mergedFields = [...oldFields];
    for (const newField of newFields) {
      if (oldFieldMap[newField.name.value]) {
        throw new Error(`Interface type extension '${obj.name.value}' cannot redeclare field ${newField.name.value}`);
      }
      mergedFields.push(newField);
    }

    this.nodeMap[oldNode.name.value] = {
      ...oldNode,
      directives: mergedDirs,
      fields: mergedFields,
    };
  }

  /**
   * Add an union extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The union type definition node to add.
   */
  public addUnionExtension(obj: UnionTypeExtensionNode) {
    if (!this.nodeMap[obj.name.value]) {
      throw new Error(`Cannot extend nonexistent union '${obj.name.value}'.`);
    }
    // AppSync does not yet understand type extensions so fold the types in.
    const oldNode = this.getType(obj.name.value) as UnionTypeDefinitionNode;
    const newDirs = obj.directives || [];
    const oldDirs = oldNode.directives || [];
    const mergedDirs = [...oldDirs, ...newDirs];

    // An extension cannot redeclare possible values
    const oldTypes = oldNode.types || [];
    const oldTypeMap = oldTypes.reduce(
      (acc: any, type: NamedTypeNode) => ({
        ...acc,
        [type.name.value]: true,
      }),
      {},
    );
    const newTypes = obj.types || [];
    const mergedFields = [...oldTypes];
    for (const newType of newTypes) {
      if (oldTypeMap[newType.name.value]) {
        throw new Error(`Union type extension '${obj.name.value}' cannot redeclare type ${newType.name.value}`);
      }
      mergedFields.push(newType);
    }

    this.nodeMap[oldNode.name.value] = {
      ...oldNode,
      directives: mergedDirs,
      types: mergedFields,
    };
  }

  /**
   * Add an enum extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The enum type definition node to add.
   */
  public addEnumExtension(obj: EnumTypeExtensionNode) {
    if (!this.nodeMap[obj.name.value]) {
      throw new Error(`Cannot extend nonexistent enum '${obj.name.value}'.`);
    }
    // AppSync does not yet understand type extensions so fold the types in.
    const oldNode = this.getType(obj.name.value) as EnumTypeDefinitionNode;
    const newDirs = obj.directives || [];
    const oldDirs = oldNode.directives || [];
    const mergedDirs = [...oldDirs, ...newDirs];

    // An extension cannot redeclare possible values
    const oldValues = oldNode.values || [];
    const oldValuesMap = oldValues.reduce(
      (acc: any, type: EnumValueDefinitionNode) => ({
        ...acc,
        [type.name.value]: true,
      }),
      {},
    );
    const newValues = obj.values || [];
    const mergedValues = [...oldValues];
    for (const newValue of newValues) {
      if (oldValuesMap[newValue.name.value]) {
        throw new Error(`Enum type extension '${obj.name.value}' cannot redeclare value ${newValue.name.value}`);
      }
      mergedValues.push(newValue);
    }

    this.nodeMap[oldNode.name.value] = {
      ...oldNode,
      directives: mergedDirs,
      values: mergedValues,
    };
  }

  /**
   * Add an input type definition node to the context.
   * @param inp The input type definition node to add.
   */
  public addInput(inp: InputObjectTypeDefinitionNode) {
    if (this.nodeMap[inp.name.value]) {
      throw new Error(`Conflicting input type '${inp.name.value}' found.`);
    }
    this.nodeMap[inp.name.value] = inp;
  }

  /**
   * Add an enum type definition node to the context.
   * @param en The enum type definition node to add.
   */
  public addEnum(en: EnumTypeDefinitionNode) {
    if (this.nodeMap[en.name.value]) {
      throw new Error(`Conflicting enum type '${en.name.value}' found.`);
    }
    this.nodeMap[en.name.value] = en;
  }

  public buildSchema(): string {
    const mutationNode: ObjectTypeDefinitionNode | undefined = this.getMutation();
    const queryNode: ObjectTypeDefinitionNode | undefined = this.getQuery();
    const subscriptionNode: ObjectTypeDefinitionNode | undefined = this.getSubscription();
    let includeMutation = true;
    let includeQuery = true;
    let includeSubscription = true;
    if (!mutationNode || mutationNode?.fields?.length === 0) {
      delete this.nodeMap.Mutation;
      includeMutation = false;
    }
    if (!queryNode || queryNode?.fields?.length === 0) {
      delete this.nodeMap.Query;
      includeQuery = false;
    }
    if (!subscriptionNode || subscriptionNode?.fields?.length === 0) {
      delete this.nodeMap.Subscription;
      includeSubscription = false;
    }
    const ops = [];
    if (includeQuery) {
      ops.push(TransformerOutput.makeOperationType('query', queryNode!.name.value));
    }
    if (includeMutation) {
      ops.push(TransformerOutput.makeOperationType('mutation', mutationNode!.name.value));
    }
    if (includeSubscription) {
      ops.push(TransformerOutput.makeOperationType('subscription', subscriptionNode!.name.value));
    }
    const schema = TransformerOutput.makeSchema(ops);
    this.putSchema(schema);
    const astSansDirectives = stripDirectives(
      {
        kind: 'Document',
        definitions: Object.values(this.nodeMap),
      },
      ['aws_subscribe', 'aws_auth', 'aws_api_key', 'aws_iam', 'aws_oidc', 'aws_cognito_user_pools', 'deprecated'],
    );
    const SDL = print(astSansDirectives);
    return SDL;
  }

  private static makeOperationType(operation: OperationTypeNode, type: string): OperationTypeDefinitionNode {
    return {
      kind: 'OperationTypeDefinition',
      operation,
      type: {
        kind: 'NamedType',
        name: {
          kind: 'Name',
          value: type,
        },
      },
    };
  }
  private static makeSchema(operationTypes: OperationTypeDefinitionNode[]): SchemaDefinitionNode {
    return {
      kind: Kind.SCHEMA_DEFINITION,
      operationTypes,
      directives: [],
    };
  }
}
