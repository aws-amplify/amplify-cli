import {
  ObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InputObjectTypeDefinitionNode,
  FieldDefinitionNode,
  Kind,
  TypeNode,
  DocumentNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  DirectiveNode,
  NamedTypeNode,
} from 'graphql';
import {
  graphqlName,
  makeNamedType,
  isScalar,
  isEnum,
  makeListType,
  makeNonNullType,
  getBaseType,
  SearchableResourceIDs,
  blankObjectExtension,
  extensionWithDirectives,
  extendFieldWithDirectives,
} from 'graphql-transformer-common';
import assert from 'assert';
import { TransformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
const ID_CONDITIONS = [
  'ne',
  'gt',
  'lt',
  'gte',
  'lte',
  'eq',
  'match',
  'matchPhrase',
  'matchPhrasePrefix',
  'multiMatch',
  'exists',
  'wildcard',
  'regexp',
  'range',
];
const STRING_CONDITIONS = ID_CONDITIONS;
const INT_CONDITIONS = ['ne', 'gt', 'lt', 'gte', 'lte', 'eq', 'range'];
const FLOAT_CONDITIONS = ['ne', 'gt', 'lt', 'gte', 'lte', 'eq', 'range'];
const BOOLEAN_CONDITIONS = ['eq', 'ne'];

export const AGGREGATE_TYPES = [
  'SearchableAggregateResult',
  'SearchableAggregateScalarResult',
  'SearchableAggregateBucketResult',
  'SearchableAggregateBucketResultItem',
];
export function makeSearchableScalarInputObject(type: string): InputObjectTypeDefinitionNode {
  const name = SearchableResourceIDs.SearchableFilterInputTypeName(type);
  const conditions = getScalarConditions(type);
  const fields: InputValueDefinitionNode[] = conditions.map((condition: string) => ({
    kind: Kind.INPUT_VALUE_DEFINITION,
    name: { kind: 'Name' as const, value: condition },
    type: getScalarFilterInputType(condition, type, name),
    // TODO: Service does not support new style descriptions so wait.
    // description: field.description,
    directives: [],
  }));
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeSearchableXFilterInputObject(obj: ObjectTypeDefinitionNode, document: DocumentNode): InputObjectTypeDefinitionNode {
  const name = SearchableResourceIDs.SearchableFilterInputTypeName(obj.name.value);
  assert(obj.fields);
  const fields: InputValueDefinitionNode[] = obj.fields
    .filter((field: FieldDefinitionNode) => isScalar(field.type))
    .map(
      (field: FieldDefinitionNode) =>
        ({
          kind: Kind.INPUT_VALUE_DEFINITION,
          name: field.name,
          type: makeNamedType(SearchableResourceIDs.SearchableFilterInputTypeName(getBaseType(field.type))),
          // TODO: Service does not support new style descriptions so wait.
          // description: field.description,
          directives: [],
        } as InputValueDefinitionNode),
    );

  fields.push(
    ...obj.fields
      .filter((field: FieldDefinitionNode) => isEnum(field.type, document))
      .map(
        (field: FieldDefinitionNode) =>
          ({
            kind: Kind.INPUT_VALUE_DEFINITION,
            name: field.name,
            type: makeNamedType(SearchableResourceIDs.SearchableFilterInputTypeName('String')),
            // TODO: Service does not support new style descriptions so wait.
            // description: field.description,
            directives: [],
          } as InputValueDefinitionNode),
      ),
  );

  fields.push(
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'and',
      },
      type: makeListType(makeNamedType(name)),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'or',
      },
      type: makeListType(makeNamedType(name)),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'not',
      },
      type: makeNamedType(name),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    },
  );
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeSearchableSortDirectionEnumObject(): EnumTypeDefinitionNode {
  const name = graphqlName(`SearchableSortDirection`);
  return {
    kind: Kind.ENUM_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    values: [
      {
        kind: Kind.ENUM_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'asc' },
        directives: [],
      },
      {
        kind: Kind.ENUM_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'desc' },
        directives: [],
      },
    ],
    directives: [],
  };
}

export function makeSearchableXSortableFieldsEnumObject(obj: ObjectTypeDefinitionNode): EnumTypeDefinitionNode {
  const name = graphqlName(`Searchable${obj.name.value}SortableFields`);
  assert(obj.fields);
  const values: EnumValueDefinitionNode[] = obj.fields
    .filter((field: FieldDefinitionNode) => isScalar(field.type))
    .map((field: FieldDefinitionNode) => ({
      kind: Kind.ENUM_VALUE_DEFINITION,
      name: field.name,
      directives: [],
    }));

  return {
    kind: Kind.ENUM_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    values,
    directives: [],
  };
}

export function makeSearchableXAggregateFieldEnumObject(obj: ObjectTypeDefinitionNode): EnumTypeDefinitionNode {
  const name = graphqlName(`Searchable${obj.name.value}AggregateField`);
  assert(obj.fields);
  const values: EnumValueDefinitionNode[] = obj.fields
    .filter((field: FieldDefinitionNode) => isScalar(field.type))
    .map((field: FieldDefinitionNode) => ({
      kind: Kind.ENUM_VALUE_DEFINITION,
      name: field.name,
      directives: [],
    }));

  return {
    kind: Kind.ENUM_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    values,
    directives: [],
  };
}

export function makeSearchableXSortInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
  const name = graphqlName(`Searchable${obj.name.value}SortInput`);
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} delete mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields: [
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'field' },
        type: makeNamedType(`Searchable${obj.name.value}SortableFields`),
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `The id of the ${obj.name.value} to delete.`
        // },
        directives: [],
      },
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'direction' },
        type: makeNamedType('SearchableSortDirection'),
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `The id of the ${obj.name.value} to delete.`
        // },
        directives: [],
      },
    ],
    directives: [],
  };
}

export function makeSearchableAggregateTypeEnumObject(): EnumTypeDefinitionNode {
  const name = graphqlName('SearchableAggregateType');
  const values: EnumValueDefinitionNode[] = ['terms', 'avg', 'min', 'max', 'sum'].map((type: string) => ({
    kind: Kind.ENUM_VALUE_DEFINITION,
    name: { kind: 'Name', value: type },
    directives: [],
  }));

  return {
    kind: Kind.ENUM_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    values,
    directives: [],
  };
}

export function makeSearchableXAggregationInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
  const name = graphqlName(`Searchable${obj.name.value}AggregationInput`);
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    fields: [
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'name' },
        type: makeNonNullType(makeNamedType('String')),
        directives: [],
      },
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'type' },
        type: makeNonNullType(makeNamedType('SearchableAggregateType')),
        directives: [],
      },
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'field' },
        type: makeNonNullType(makeNamedType(`Searchable${obj.name.value}AggregateField`)),
        directives: [],
      },
    ],
    directives: [],
  };
}

function getScalarFilterInputType(condition: string, type: string, filterInputName: string): TypeNode {
  switch (condition) {
    case 'range':
      return makeListType(makeNamedType(type));
    case 'exists':
      return makeNamedType('Boolean');
    default:
      return makeNamedType(type);
  }
}

function getScalarConditions(type: string): string[] {
  switch (type) {
    case 'String':
      return STRING_CONDITIONS;
    case 'ID':
      return ID_CONDITIONS;
    case 'Int':
      return INT_CONDITIONS;
    case 'Float':
      return FLOAT_CONDITIONS;
    case 'Boolean':
      return BOOLEAN_CONDITIONS;
    default:
      throw 'Valid types are String, ID, Int, Float, Boolean';
  }
}
export const extendTypeWithDirectives = (
  ctx: TransformerTransformSchemaStepContextProvider,
  typeName: string,
  directives: Array<DirectiveNode>,
): void => {
  let objectTypeExtension = blankObjectExtension(typeName);
  objectTypeExtension = extensionWithDirectives(objectTypeExtension, directives);
  ctx.output.addObjectExtension(objectTypeExtension);
};

export const addDirectivesToField = (
  ctx: TransformerTransformSchemaStepContextProvider,
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
  ctx: TransformerTransformSchemaStepContextProvider,
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
