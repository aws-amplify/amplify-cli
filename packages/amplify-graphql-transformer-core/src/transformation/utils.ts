import {
  DirectiveNode,
  TypeDefinitionNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  EnumValueDefinitionNode,
  DirectiveDefinitionNode,
  TypeSystemDefinitionNode,
  Kind,
} from 'graphql';
import { TransformerPluginProvider, TransformerPluginType } from '@aws-amplify/graphql-transformer-interfaces';

export function makeSeenTransformationKey(
  directive: DirectiveNode,
  type: TypeDefinitionNode,
  field?: FieldDefinitionNode | InputValueDefinitionNode | EnumValueDefinitionNode,
  arg?: InputValueDefinitionNode,
  index?: number,
): string {
  let key = '';
  if (directive && type && field && arg) {
    key = `${type.name.value}.${field.name.value}.${arg.name.value}@${directive.name.value}`;
  }
  if (directive && type && field) {
    key = `${type.name.value}.${field.name.value}@${directive.name.value}`;
  } else {
    key = `${type.name.value}@${directive.name.value}`;
  }
  if (index !== undefined) {
    key += `[${index}]`;
  }
  return key;
}

/**
 * If this instance of the directive validates against its definition return true.
 * If the definition does not apply to the instance return false.
 * @param directive The directive definition to validate against.
 * @param nodeKind The kind of the current node where the directive was found.
 */
export function matchDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: TypeSystemDefinitionNode) {
  if (!directive) {
    return false;
  }
  if (definition.name.value !== directive.name.value) {
    // The definition is for the wrong directive. Do not match.
    return false;
  }
  let isValidLocation = false;
  for (const location of definition.locations) {
    // tslint:disable-next-line: switch-default
    switch (location.value) {
      case `SCHEMA`:
        isValidLocation = node.kind === Kind.SCHEMA_DEFINITION || isValidLocation;
        break;
      case `SCALAR`:
        isValidLocation = node.kind === Kind.SCALAR_TYPE_DEFINITION || isValidLocation;
        break;
      case `OBJECT`:
        isValidLocation = node.kind === Kind.OBJECT_TYPE_DEFINITION || isValidLocation;
        break;
      case `FIELD_DEFINITION`:
        isValidLocation = (node.kind as string) === Kind.FIELD_DEFINITION || isValidLocation;
        break;
      case `ARGUMENT_DEFINITION`:
        isValidLocation = (node.kind as string) === Kind.INPUT_VALUE_DEFINITION || isValidLocation;
        break;
      case `INTERFACE`:
        isValidLocation = node.kind === Kind.INTERFACE_TYPE_DEFINITION || isValidLocation;
        break;
      case `UNION`:
        isValidLocation = node.kind === Kind.UNION_TYPE_DEFINITION || isValidLocation;
        break;
      case `ENUM`:
        isValidLocation = node.kind === Kind.ENUM_TYPE_DEFINITION || isValidLocation;
        break;
      case `ENUM_VALUE`:
        isValidLocation = (node.kind as string) === Kind.ENUM_VALUE_DEFINITION || isValidLocation;
        break;
      case `INPUT_OBJECT`:
        isValidLocation = node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION || isValidLocation;
        break;
      case `INPUT_FIELD_DEFINITION`:
        isValidLocation = (node.kind as string) === Kind.INPUT_VALUE_DEFINITION || isValidLocation;
        break;
      default:
        break;
    }
  }
  return isValidLocation;
}

export function matchFieldDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: FieldDefinitionNode) {
  if (definition.name.value !== directive.name.value) {
    // The definition is for the wrong directive. Do not match.
    return false;
  }
  let isValidLocation = false;
  for (const location of definition.locations) {
    switch (location.value) {
      case `FIELD_DEFINITION`:
        isValidLocation = node.kind === Kind.FIELD_DEFINITION || isValidLocation;
        break;
      default:
        break;
    }
  }
  return isValidLocation;
}

export function matchInputFieldDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: InputValueDefinitionNode) {
  if (definition.name.value !== directive.name.value) {
    // The definition is for the wrong directive. Do not match.
    return false;
  }
  let isValidLocation = false;
  for (const location of definition.locations) {
    switch (location.value) {
      case `INPUT_FIELD_DEFINITION`:
        isValidLocation = node.kind === Kind.INPUT_VALUE_DEFINITION || isValidLocation;
        break;
      default:
        break;
    }
  }
  return isValidLocation;
}

export function matchArgumentDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: InputValueDefinitionNode) {
  if (definition.name.value !== directive.name.value) {
    // The definition is for the wrong directive. Do not match.
    return false;
  }
  let isValidLocation = false;
  for (const location of definition.locations) {
    switch (location.value) {
      case `ARGUMENT_DEFINITION`:
        isValidLocation = node.kind === Kind.INPUT_VALUE_DEFINITION || isValidLocation;
        break;
      default:
        break;
    }
  }
  return isValidLocation;
}

export function matchEnumValueDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: EnumValueDefinitionNode) {
  if (definition.name.value !== directive.name.value) {
    // The definition is for the wrong directive. Do not match.
    return false;
  }
  let isValidLocation = false;
  for (const location of definition.locations) {
    switch (location.value) {
      case `ENUM_VALUE`:
        isValidLocation = node.kind === Kind.ENUM_VALUE_DEFINITION || isValidLocation;
        break;
      default:
        break;
    }
  }
  return isValidLocation;
}

/**
 * Sort the plugin such that the DataSourceProviders are executed before dataSourceEnhancement plugins are executed
 * @param plugins plugin instances passed to the transformer
 */
export function sortTransformerPlugins(plugins: TransformerPluginProvider[]): TransformerPluginProvider[] {
  const SORT_ORDER: TransformerPluginType[] = [
    TransformerPluginType.DATA_SOURCE_PROVIDER,
    TransformerPluginType.DATA_SOURCE_ENHANCER,
    TransformerPluginType.GENERIC,
    TransformerPluginType.AUTH,
  ];
  return plugins.sort((a, b) => {
    const aIdx = SORT_ORDER.indexOf(a.pluginType);
    const bIdx = SORT_ORDER.indexOf(b.pluginType);
    return aIdx - bIdx;
  });
}
