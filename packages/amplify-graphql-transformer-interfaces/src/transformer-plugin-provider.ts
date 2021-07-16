import {
  DirectiveNode,
  ObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  FieldDefinitionNode,
  UnionTypeDefinitionNode,
  EnumTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  EnumValueDefinitionNode,
  DirectiveDefinitionNode,
  TypeDefinitionNode,
} from 'graphql';
import {
  TransformerBeforeStepContextProvider,
  TransformerContextProvider,
  TransformerPrepareStepContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerValidationStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from './transformer-context/transformer-context-provider';

export enum TransformerPluginType {
  DATA_SOURCE_PROVIDER = 'DATA_SOURCE_PROVIDER',
  DATA_SOURCE_ENHANCER = 'DATA_SOURCE_ENHANCER',
  GENERIC = 'GENERIC',
}
export interface TransformerPluginProvider {
  pluginType: TransformerPluginType;

  name: string;

  readonly directive: DirectiveDefinitionNode;

  typeDefinitions: TypeDefinitionNode[];

  /**
   * An initializer that is called once at the beginning of a transformation.
   * Initializers are called in the order they are declared.
   */
  before?: (context: TransformerBeforeStepContextProvider) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on objects type definitions. This includes type
   * extensions.
   */
  object?: (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerSchemaVisitStepContextProvider) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on objects type definitions. This includes type
   * extensions.
   */
  interface?: (definition: InterfaceTypeDefinitionNode, directive: DirectiveNode, acc: TransformerSchemaVisitStepContextProvider) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on object for field definitions.
   */
  field?: (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    acc: TransformerSchemaVisitStepContextProvider,
  ) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on object or input argument definitions.
   */
  argument?: (definition: InputValueDefinitionNode, directive: DirectiveNode, context: TransformerSchemaVisitStepContextProvider) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on union definitions.
   */
  union?: (definition: UnionTypeDefinitionNode, directive: DirectiveNode, context: TransformerSchemaVisitStepContextProvider) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on enum definitions.
   */
  enum?: (definition: EnumTypeDefinitionNode, directive: DirectiveNode, context: TransformerSchemaVisitStepContextProvider) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on enum value definitions.
   */
  enumValue?: (definition: EnumValueDefinitionNode, directive: DirectiveNode, context: TransformerSchemaVisitStepContextProvider) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on scalar definitions.
   */
  scalar?: (definition: ScalarTypeDefinitionNode, directive: DirectiveNode, context: TransformerSchemaVisitStepContextProvider) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on input definitions.
   */
  input?: (definition: InputObjectTypeDefinitionNode, directive: DirectiveNode, context: TransformerSchemaVisitStepContextProvider) => void;

  /**
   * A transformer implements a single function per location that its directive can be applied.
   * This method handles transforming directives on input value definitions.
   */
  inputValue?: (definition: InputValueDefinitionNode, directive: DirectiveNode, context: TransformerSchemaVisitStepContextProvider) => void;

  /**
   *  Validate the schema after individual transformers finishes parsing the AST
   */
  validate?: (context: TransformerValidationStepContextProvider) => void;

  /**
   * Create additional  resources after validation before updating schema or generating resolvers
   */
  prepare?: (context: TransformerPrepareStepContextProvider) => void;

  /**
   * Update the schema with additional queries and input types
   */
  transformSchema?: (context: TransformerTransformSchemaStepContextProvider) => void;

  /**
   * generate resolvers
   */
  generateResolvers?: (context: TransformerContextProvider) => void;

  /**
   * A finalizer that is called once after a transformation.
   * Finalizers are called in reverse order as they are declared.
   */
  after?: (context: TransformerContextProvider) => void;
}
