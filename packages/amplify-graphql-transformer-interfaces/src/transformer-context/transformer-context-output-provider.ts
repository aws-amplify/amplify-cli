import {
  TypeDefinitionNode,
  SchemaDefinitionNode,
  ObjectTypeDefinitionNode,
  TypeSystemDefinitionNode,
  FieldDefinitionNode,
  ObjectTypeExtensionNode,
  InputObjectTypeExtensionNode,
  InterfaceTypeExtensionNode,
  UnionTypeExtensionNode,
  EnumTypeExtensionNode,
  InputObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  UnionTypeDefinitionNode,
} from 'graphql';

export interface TransformerContextOutputProvider {
  /**
   * Scans through the context nodeMap and returns all type definition nodes
   * that are of the given kind.
   * @param kind Kind value of type definition nodes expected.
   */
  getTypeDefinitionsOfKind: (kind: string) => TypeDefinitionNode[];

  /**
   * Add an object type definition node to the context. If the type already
   * exists an error will be thrown.
   * @param obj The object type definition node to add.
   */
  putSchema: (obj: SchemaDefinitionNode) => void;

  /**
   * Returns the schema definition record. If the user provides a schema
   * definition as part of the input document, that node is returned.
   * Otherwise a blank schema definition with default operation types
   * is returned.
   */
  getSchema: () => SchemaDefinitionNode;

  getQueryTypeName: () => string | undefined;

  getQuery(): ObjectTypeDefinitionNode | undefined;

  getMutationTypeName(): string | undefined;

  getMutation(): ObjectTypeDefinitionNode | undefined;

  getSubscriptionTypeName(): string | undefined;

  getSubscription(): ObjectTypeDefinitionNode | undefined;

  /**
   * Add a generic type.
   * @param obj The type to add
   */
  addType(obj: TypeDefinitionNode): void;

  putType(obj: TypeDefinitionNode): void;

  getType(name: string): TypeSystemDefinitionNode | undefined;

  hasType(name: string): boolean;

  /**
   * Add an object type definition node to the context. If the type already
   * exists an error will be thrown.
   * @param obj The object type definition node to add.
   */
  addObject(obj: ObjectTypeDefinitionNode): void;

  updateObject(obj: ObjectTypeDefinitionNode): void;

  getObject(name: string): ObjectTypeDefinitionNode | undefined;

  /**
   * Add an union type definition node to the context. If the type already
   * exists an error will be thrown.
   * @param obj The union type definition node to add.
   */
  addUnion(obj: UnionTypeDefinitionNode): void;

  /**
   * Extends the context query object with additional fields.
   * If the customer uses a name other than 'Query' this will proxy to the
   * correct type.
   * @param fields The fields to add the query type.
   */
  addQueryFields(fields: FieldDefinitionNode[]): void;

  /**
   * Extends the context mutation object with additional fields.
   * If the customer uses a name other than 'Mutation' this will proxy to the
   * correct type.
   * @param fields The fields to add the mutation type.
   */
  addMutationFields(fields: FieldDefinitionNode[]): void;

  /**
   * Extends the context subscription object with additional fields.
   * If the customer uses a name other than 'Subscription' this will proxy to the
   * correct type.
   * @param fields The fields to add the subscription type.
   */
  addSubscriptionFields(fields: FieldDefinitionNode[]): void;

  /**
   * Add an object type extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The object type definition node to add.
   */
  addObjectExtension(obj: ObjectTypeExtensionNode): void;

  /**
   * Add an input object type extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The input object type definition node to add.
   */
  addInputExtension(obj: InputObjectTypeExtensionNode): void;

  /**
   * Add an interface extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The interface type definition node to add.
   */
  addInterfaceExtension(obj: InterfaceTypeExtensionNode): void;

  /**
   * Add an union extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The union type definition node to add.
   */
  addUnionExtension(obj: UnionTypeExtensionNode): void;

  /**
   * Add an enum extension definition node to the context. If a type with this
   * name does not already exist, an exception is thrown.
   * @param obj The enum type definition node to add.
   */
  addEnumExtension(obj: EnumTypeExtensionNode): void;

  /**
   * Add an input type definition node to the context.
   * @param inp The input type definition node to add.
   */
  addInput(inp: InputObjectTypeDefinitionNode): void;

  /**
   * Add an enum type definition node to the context.
   * @param en The enum type definition node to add.
   */
  addEnum(en: EnumTypeDefinitionNode): void;
}
