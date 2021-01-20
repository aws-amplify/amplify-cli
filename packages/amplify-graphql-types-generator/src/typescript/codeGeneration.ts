import { LegacyCompilerContext, LegacyInlineFragment, LegacyFragment, LegacyField, LegacyOperation } from '../compiler/legacyIR';
import {
  GraphQLError,
  getNamedType,
  isCompositeType,
  isAbstractType,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLType,
  isEnumType,
  isUnionType,
  isInterfaceType,
  isObjectType,
  isInputObjectType,
  isListType,
  isNonNullType,
} from 'graphql';

import { wrap } from '../utilities/printing';

import { CodeGenerator } from '../utilities/CodeGenerator';

import { interfaceDeclaration, propertyDeclaration, pickedPropertySetsDeclaration, Property } from './language';

import { typeNameFromGraphQLType } from './types';
import Maybe from 'graphql/tsutils/Maybe';

export function generateSource(context: LegacyCompilerContext) {
  const generator = new CodeGenerator<LegacyCompilerContext>(context);

  generator.printOnNewline('/* tslint:disable */');
  generator.printOnNewline('/* eslint-disable */');
  generator.printOnNewline('//  This file was automatically generated and should not be edited.');

  context.typesUsed.forEach(type => typeDeclarationForGraphQLType(generator, type));
  Object.values(context.operations).forEach(operation => {
    interfaceVariablesDeclarationForOperation(generator, operation);
    interfaceDeclarationForOperation(generator, operation);
  });
  Object.values(context.fragments).forEach(operation => interfaceDeclarationForFragment(generator, operation));

  generator.printNewline();

  return generator.output;
}

export function typeDeclarationForGraphQLType(generator: CodeGenerator, type: GraphQLType) {
  if (isEnumType(type)) {
    enumerationDeclaration(generator, type);
  } else if (isUnionType(type)) {
    unionDeclaration(generator, type);
  } else if (isInputObjectType(type)) {
    structDeclarationForInputObjectType(generator, type);
  } else if (isObjectType(type)) {
    structDeclarationForObjectType(generator, type);
  } else if (isInterfaceType(type)) {
    structDeclarationForInterfaceType(generator, type);
  }
}

function enumerationDeclaration(generator: CodeGenerator, type: GraphQLEnumType) {
  const { name, description } = type;
  const values = type.getValues();

  generator.printNewlineIfNeeded();
  if (description) {
    description.split('\n').forEach(line => {
      generator.printOnNewline(`// ${line.trim()}`);
    });
  }
  generator.printOnNewline(`export enum ${name} {`);
  values.forEach(value => {
    if (!value.description || value.description.indexOf('\n') === -1) {
      generator.printOnNewline(`  ${value.value} = "${value.value}",${wrap(' // ', value.description || '')}`);
    } else {
      if (value.description) {
        value.description.split('\n').forEach(line => {
          generator.printOnNewline(`  // ${line.trim()}`);
        });
      }
      generator.printOnNewline(`  ${value.value} = "${value.value}",`);
    }
  });
  generator.printOnNewline(`}`);
  generator.printNewline();
}

function unionDeclaration(generator: CodeGenerator, type: GraphQLUnionType) {
  const { name, description } = type;
  const value = type
    .getTypes()
    .map(type => type.name)
    .join(' | ');

  generator.printNewlineIfNeeded();
  if (description) {
    description.split('\n').forEach(line => {
      generator.printOnNewline(`// ${line.trim()}`);
    });
  }
  generator.printOnNewline(`export type ${name} = ${value}`);
  generator.printNewline();
}

function structDeclarationForInputObjectType(generator: CodeGenerator, type: GraphQLInputObjectType) {
  const interfaceName = type.name;
  interfaceDeclaration(
    generator,
    {
      interfaceName,
    },
    () => {
      const properties = propertiesFromFields(generator.context, Object.values(type.getFields()));
      properties.forEach(property => propertyDeclaration(generator, { ...property }));
    },
  );
}

function structDeclarationForObjectType(generator: CodeGenerator, type: GraphQLObjectType) {
  const interfaceName = type.name;
  interfaceDeclaration(
    generator,
    {
      interfaceName,
    },
    () => {
      const properties = propertiesFromFields(generator.context, Object.values(type.getFields()));
      propertyDeclaration(generator, { fieldName: '__typename', typeName: `"${interfaceName}"` });
      properties.forEach(property => propertyDeclaration(generator, { ...property, isOptional: true }));
    },
  );
}

function structDeclarationForInterfaceType(generator: CodeGenerator, type: GraphQLInterfaceType) {
  const interfaceName = type.name;
  interfaceDeclaration(
    generator,
    {
      interfaceName,
    },
    () => {
      const properties = propertiesFromFields(generator.context, Object.values(type.getFields()));
      propertyDeclaration(generator, { fieldName: '__typename', typeName: `"${interfaceName}"` });
      properties.forEach(property => propertyDeclaration(generator, { ...property, isOptional: true }));
    },
  );
}

export function interfaceNameFromOperation({ operationName, operationType }: { operationName: string; operationType: string }) {
  switch (operationType) {
    case 'query':
      return `${operationName}Query`;
      break;
    case 'mutation':
      return `${operationName}Mutation`;
      break;
    case 'subscription':
      return `${operationName}Subscription`;
      break;
    default:
      throw new GraphQLError(`Unsupported operation type "${operationType}"`);
  }
}

export function interfaceVariablesDeclarationForOperation(
  generator: CodeGenerator,
  { operationName, operationType, variables }: LegacyOperation,
) {
  if (!variables || variables.length < 1) {
    return;
  }
  const interfaceName = `${interfaceNameFromOperation({ operationName, operationType })}Variables`;

  interfaceDeclaration(
    generator,
    {
      interfaceName,
    },
    () => {
      const properties = propertiesFromFields(generator.context, variables);
      pickedPropertyDeclarations(generator, properties, true);
    },
  );
}

function getObjectTypeName(type: GraphQLType): string {
  if (isListType(type)) {
    return getObjectTypeName(type.ofType);
  }
  if (isNonNullType(type)) {
    return getObjectTypeName(type.ofType);
  }
  if (isObjectType(type)) {
    return `"${type.name}"`;
  }
  if (isUnionType(type)) {
    return type
      .getTypes()
      .map(type => getObjectTypeName(type))
      .join(' | ');
  }
  return `"${type.name}"`;
}

export function updateTypeNameField(rootField: LegacyField): LegacyField {
  const fields =
    rootField.fields &&
    rootField.fields.map(field => {
      if (field.fieldName === '__typename') {
        const objectTypeName = getObjectTypeName(rootField.type);
        return {
          ...field,
          typeName: objectTypeName,
          type: { name: objectTypeName },
        };
      }

      if (field.fields) {
        return updateTypeNameField(field);
      }

      return field;
    });
  return {
    ...rootField,
    fields,
  } as LegacyField;
}

export function interfaceDeclarationForOperation(generator: CodeGenerator, { operationName, operationType, fields }: LegacyOperation) {
  const interfaceName = interfaceNameFromOperation({ operationName, operationType });
  fields = fields.map(field => updateTypeNameField(field));
  const properties = propertiesFromFields(generator.context, fields);
  interfaceDeclaration(
    generator,
    {
      interfaceName,
    },
    () => {
      pickedPropertyDeclarations(generator, properties);
    },
  );
}

export function interfaceDeclarationForFragment(generator: CodeGenerator, fragment: LegacyFragment) {
  const { fragmentName, typeCondition, fields, inlineFragments } = fragment;

  const interfaceName = `${fragmentName}Fragment`;

  interfaceDeclaration(
    generator,
    {
      interfaceName,
      noBrackets: isAbstractType(typeCondition),
    },
    () => {
      if (isAbstractType(typeCondition)) {
        const propertySets = fragment.possibleTypes.map(type => {
          // NOTE: inlineFragment currently consists of the merged fields
          // from both inline fragments and fragment spreads.
          // TODO: Rename inlineFragments in the IR.
          const inlineFragment = inlineFragments.find(inlineFragment => {
            return inlineFragment.typeCondition.toString() == type.toString();
          });

          if (inlineFragment) {
            const fields = inlineFragment.fields.map(field => {
              if (field.fieldName === '__typename') {
                return {
                  ...field,
                  typeName: `"${inlineFragment.typeCondition}"`,
                  type: { name: `"${inlineFragment.typeCondition}"` } as GraphQLType,
                };
              } else {
                return field;
              }
            });

            return propertiesFromFields(generator.context, fields);
          } else {
            const fragmentFields = fields.map(field => {
              if (field.fieldName === '__typename') {
                return {
                  ...field,
                  typeName: `"${type}"`,
                  type: { name: `"${type}"` } as GraphQLType,
                };
              } else {
                return field;
              }
            });

            return propertiesFromFields(generator.context, fragmentFields);
          }
        });

        pickedPropertySetsDeclaration(generator, fragment, propertySets, true);
      } else {
        const fragmentFields = fields.map(field => {
          if (field.fieldName === '__typename') {
            return {
              ...field,
              typeName: `"${fragment.typeCondition}"`,
              type: { name: `"${fragment.typeCondition}"` } as GraphQLType,
            };
          } else {
            return field;
          }
        });

        const properties = propertiesFromFields(generator.context, fragmentFields);
        pickedPropertyDeclarations(generator, properties);
      }
    },
  );
}

export function propertiesFromFields(
  context: LegacyCompilerContext,
  fields: {
    name?: string;
    type: GraphQLType;
    responseName?: string;
    description?: Maybe<string>;
    fragmentSpreads?: any;
    inlineFragments?: LegacyInlineFragment[];
    fieldName?: string;
  }[],
) {
  return fields.map(field => propertyFromField(context, field));
}

export function propertyFromField(
  context: LegacyCompilerContext,
  field: {
    name?: string;
    type: GraphQLType;
    fields?: any[];
    responseName?: string;
    description?: Maybe<string>;
    fragmentSpreads?: any;
    inlineFragments?: LegacyInlineFragment[];
    fieldName?: string;
  },
): Property {
  let { name: fieldName, type: fieldType, description, fragmentSpreads, inlineFragments } = field;
  fieldName = fieldName || field.responseName;

  const propertyName = fieldName;

  let property = { fieldName, fieldType, propertyName, description };

  const namedType = getNamedType(fieldType);

  let isNullable = true;
  if (isNonNullType(fieldType)) {
    isNullable = false;
  }

  if (isCompositeType(namedType)) {
    const typeName = namedType.toString();
    let isArray = false;
    let isArrayElementNullable = null;
    if (isListType(fieldType)) {
      isArray = true;
      isArrayElementNullable = !isNonNullType(fieldType.ofType);
    } else if (isNonNullType(fieldType) && isListType(fieldType.ofType)) {
      isArray = true;
      isArrayElementNullable = !isNonNullType(fieldType.ofType.ofType);
    }

    return {
      ...property,
      typeName,
      fields: field.fields,
      isComposite: true,
      fragmentSpreads,
      inlineFragments,
      fieldType,
      isArray,
      isNullable,
      isArrayElementNullable,
    };
  } else {
    if (field.fieldName === '__typename') {
      const typeName = typeNameFromGraphQLType(context, fieldType, null, false);
      return { ...property, typeName, isComposite: false, fieldType, isNullable: false };
    } else {
      const typeName = typeNameFromGraphQLType(context, fieldType, null, isNullable);
      return { ...property, typeName, isComposite: false, fieldType, isNullable };
    }
  }
}

// pickedPropertyDeclarations declares specific properties selected by execution schemas or fragment schemas.
export function pickedPropertyDeclarations(generator: CodeGenerator, properties: Property[], isOptional = false) {
  if (!properties) return;
  properties.forEach(property => {
    if (isAbstractType(getNamedType(property.type || property.fieldType!))) {
      const propertySets = getPossibleTypeNames(generator, property).map(type => {
        const inlineFragment =
          property.inlineFragments &&
          property.inlineFragments.find(inlineFragment => {
            return inlineFragment.typeCondition.toString() == type;
          });

        if (inlineFragment) {
          const fields = inlineFragment.fields.map(field => {
            if (field.fieldName === '__typename') {
              return {
                ...field,
                typeName: `"${inlineFragment.typeCondition}"`,
                type: { name: `"${inlineFragment.typeCondition}"` } as GraphQLType,
              };
            } else {
              return field;
            }
          });

          return propertiesFromFields(generator.context, fields);
        } else {
          const fields = property.fields!.map(field => {
            if (field.fieldName === '__typename') {
              return {
                ...field,
                typeName: `"${type}"`,
                type: { name: `"${type}"` } as GraphQLType,
              };
            } else {
              return field;
            }
          });

          return propertiesFromFields(generator.context, fields);
        }
      });

      pickedPropertySetsDeclaration(generator, property, propertySets);
    } else {
      if (
        (property.fields && property.fields.length > 0) ||
        (property.inlineFragments && property.inlineFragments.length > 0) ||
        (property.fragmentSpreads && property.fragmentSpreads.length > 0)
      ) {
        propertyDeclaration(generator, property, () => {
          const properties = propertiesFromFields(generator.context, property.fields!);
          pickedPropertyDeclarations(generator, properties, isOptional);
        });
      } else {
        propertyDeclaration(generator, { ...property, isOptional });
      }
    }
  });
}

/**
 * This exists only to properly generate types for union/interface typed fields that
 * do not have inline fragments. This currently can happen and the IR does give us
 * a set of fields per type condition unless fragments are used within the selection set.
 */
function getPossibleTypeNames(generator: CodeGenerator<LegacyCompilerContext>, property: Property) {
  const type = getNamedType(property.fieldType || property.type!);

  if (isUnionType(type) || isInterfaceType(type)) {
    return generator.context.schema.getPossibleTypes(type).map(type => type.name);
  }

  return [];
}
