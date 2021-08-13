import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { ObjectTypeDefinitionNode, FieldDefinitionNode, DirectiveNode, NamedTypeNode } from 'graphql';
import { blankObjectExtension, extendFieldWithDirectives, extensionWithDirectives } from 'graphql-transformer-common';

export const collectFieldNames = (object: ObjectTypeDefinitionNode): Array<string> => {
  return object.fields!.map((field: FieldDefinitionNode) => field.name.value);
};

export const extendTypeWithDirectives = (ctx: TransformerContextProvider, typeName: string, directives: Array<DirectiveNode>): void => {
  let objectTypeExtension = blankObjectExtension(typeName);
  objectTypeExtension = extensionWithDirectives(objectTypeExtension, directives);
  ctx.output.addObjectExtension(objectTypeExtension);
};

export const addDirectivesToField = (
  ctx: TransformerContextProvider,
  typeName: string,
  fieldName: string,
  directives: Array<DirectiveNode>,
) => {
  const type = ctx.output.getType(typeName) as ObjectTypeDefinitionNode;
  if (type) {
    const field = type.fields?.find(f => f.name.value === fieldName);
    if (field) {
      const newFields = [...type.fields!.filter(f => f.name.value !== field.name.value), extendFieldWithDirectives(field, directives)];

      const newType = {
        ...type,
        fields: newFields,
      };

      ctx.output.putType(newType);
    }
  }
};

export const addDirectivesToOperation = (
  ctx: TransformerContextProvider,
  typeName: string,
  operationName: string,
  directives: Array<DirectiveNode>,
) => {
  // add directives to the given operation
  addDirectivesToField(ctx, typeName, operationName, directives);

  // add the directives to the result type of the operation
  const type = ctx.output.getType(typeName) as ObjectTypeDefinitionNode;
  if (type) {
    const field = type.fields!.find(f => f.name.value === operationName);

    if (field) {
      const returnFieldType = field.type as NamedTypeNode;

      if (returnFieldType.name) {
        const returnTypeName = returnFieldType.name.value;

        extendTypeWithDirectives(ctx, returnTypeName, directives);
      }
    }
  }
};
